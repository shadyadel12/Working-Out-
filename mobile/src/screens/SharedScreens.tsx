import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as Crypto from "expo-crypto";
import { AudioModule, RecordingPresets, useAudioRecorder } from "expo-audio";
import { Card, Screen, textStyles } from "../components/Screen";
import { Button, Input } from "../components/Controls";
import { useAuth } from "../auth/AuthProvider";
import { supabase } from "../lib/supabase";
import { colors } from "../theme";
import { validateMedia } from "../lib/mediaSecurity";

export function ProgressScreen() {
  const { session, profile } = useAuth();
  const [rows, setRows] = useState<any[] | null>(null);
  const [diet, setDiet] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    logged: 0,
    completed: 0,
    exercises: 0,
  });
  useEffect(() => {
    if (profile?.role !== "player") {
      setRows([]);
      return;
    }
    Promise.all([
      supabase.rpc("get_progress_page", {
        p_player_id: session!.user.id,
        p_workout: null,
        p_exercise: null,
        p_start: null,
        p_end: null,
        p_limit: 20,
        p_offset: 0,
      }),
      supabase
        .from("diet_logs")
        .select("*")
        .eq("player_id", session!.user.id)
        .order("log_date", { ascending: false })
        .limit(30),
    ]).then(([workout, dietLogs]) => {
      if (workout.error)
        Alert.alert("Could not load progress", workout.error.message);
      const result = workout.data as any;
      setRows(result?.rows ?? []);
      setDiet(dietLogs.data ?? []);
      setSummary({
        logged: result?.total_logged ?? 0,
        completed: result?.total_completed ?? 0,
        exercises: result?.total_exercises ?? 0,
      });
    });
  }, [profile, session]);
  const dietDone = diet.reduce((n, x) => n + x.completed_meals, 0),
    dietTotal = diet.reduce((n, x) => n + x.total_meals, 0);
  return (
    <Screen title="Progress">
      {!rows ? (
        <ActivityIndicator />
      ) : (
        <>
          {profile?.role !== "player" ? (
            <Text style={textStyles.muted}>
              Open a player from My Players to review individual progress.
            </Text>
          ) : (
            <>
              <View style={styles.stats}>
                <Stat value={summary.completed} label="Completed" />
                <Stat value={summary.logged} label="Sessions" />
                <Stat value={summary.exercises} label="Exercises" />
              </View>
              <Card>
                <Text style={textStyles.heading}>Diet progress</Text>
                <Text style={textStyles.body}>
                  {dietTotal ? Math.round((dietDone / dietTotal) * 100) : 0}%
                  adherence · {diet.length} days logged
                </Text>
                {diet.slice(0, 5).map((x) => (
                  <Text key={x.id} style={textStyles.muted}>
                    {x.log_date}: {x.completed_meals}/{x.total_meals} meals
                  </Text>
                ))}
              </Card>
              {rows.map((row) => (
                <Card key={row.id}>
                  <Text style={textStyles.heading}>{row.exercise_name}</Text>
                  <Text style={textStyles.muted}>
                    {row.workout_name} · {row.log_date}
                  </Text>
                  <Text style={textStyles.body}>
                    {row.actual_sets ?? "—"} sets · {row.actual_reps ?? "—"}{" "}
                    reps · {row.actual_weight ?? "—"}
                  </Text>
                  {row.player_comment ? (
                    <Text style={textStyles.muted}>{row.player_comment}</Text>
                  ) : null}
                </Card>
              ))}
            </>
          )}
        </>
      )}
    </Screen>
  );
}
function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.value}>{value}</Text>
      <Text style={textStyles.muted}>{label}</Text>
    </View>
  );
}
export function ChatScreen() {
  const { session, profile } = useAuth();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [threads, setThreads] = useState<any[]>([]);
  const [selected, setSelected] = useState<{
    coachId: string;
    playerId: string;
    name: string;
  } | null>(null);
  const [messages, setMessages] = useState<any[] | null>(null);
  const [body, setBody] = useState("");
  useEffect(() => {
    async function load() {
      if (profile?.role === "player") {
        const { data } = await supabase
          .from("coach_player_links")
          .select(
            "coach_id,profiles!coach_player_links_coach_id_fkey(name,email)",
          )
          .eq("player_id", session!.user.id)
          .eq("status", "active")
          .limit(1)
          .maybeSingle();
        if (data)
          setSelected({
            coachId: data.coach_id,
            playerId: session!.user.id,
            name:
              (data as any).profiles?.name ||
              (data as any).profiles?.email ||
              "Coach",
          });
      } else if (profile?.role === "coach") {
        const { data } = await supabase
          .from("coach_player_links")
          .select(
            "player_id,profiles!coach_player_links_player_id_fkey(name,email)",
          )
          .eq("coach_id", session!.user.id)
          .eq("status", "active")
          .not("player_id", "is", null);
        setThreads(
          (data ?? []).map((x: any) => ({
            coachId: session!.user.id,
            playerId: x.player_id,
            name: x.profiles?.name || x.profiles?.email || "Player",
          })),
        );
      }
    }
    void load();
  }, [profile, session]);
  useEffect(() => {
    if (!selected) return;
    let active = true;
    const load = () =>
      supabase
        .from("chat_messages")
        .select("*")
        .eq("coach_id", selected.coachId)
        .eq("player_id", selected.playerId)
        .order("created_at")
        .limit(100)
        .then(({ data }) => {
          if (active) setMessages(data ?? []);
        });
    void load();
    const channel = supabase
      .channel(`mobile-${selected.coachId}-${selected.playerId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `coach_id=eq.${selected.coachId}`,
        },
        (payload) => {
          const next = payload.new as any;
          if (next.player_id === selected.playerId)
            setMessages((current) =>
              current?.some((x) => x.id === next.id)
                ? current
                : [...(current ?? []), next],
            );
        },
      )
      .subscribe();
    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [selected]);
  async function send() {
    if (!body.trim() || !selected) return;
    const text = body.trim();
    setBody("");
    const { error } = await supabase
      .from("chat_messages")
      .insert({
        coach_id: selected.coachId,
        player_id: selected.playerId,
        sender_id: session!.user.id,
        body: text,
      });
    if (error) {
      setBody(text);
      Alert.alert("Could not send", error.message);
    }
  }
  async function upload(
    uri: string,
    mime: string,
    size: number | undefined,
    type: "image" | "video" | "audio",
  ) {
    if (!selected) return;
    const max = type === "image" ? 10 : type === "video" ? 50 : 25;
    if (!size || size > max * 1024 * 1024) {
      Alert.alert(
        "File not allowed",
        `${type} must be smaller than ${max} MB.`,
      );
      return;
    }
    setUploading(true);
    try {
      const bytes = await fetch(uri).then((r) => r.arrayBuffer());
      validateMedia(bytes, mime, size, type);
      const ext =
        mime === "image/jpeg"
          ? "jpg"
          : mime === "video/quicktime"
            ? "mov"
            : mime === "audio/mpeg"
              ? "mp3"
              : mime === "audio/mp4"
                ? "m4a"
                : mime.split("/")[1]?.split(";")[0] || "bin";
      const path = `${selected.coachId}/${selected.playerId}/${session!.user.id}/${Date.now()}-${Crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("chat-attachments")
        .upload(path, bytes, { contentType: mime, upsert: false });
      if (error) throw error;
      const sent = await supabase
        .from("chat_messages")
        .insert({
          coach_id: selected.coachId,
          player_id: selected.playerId,
          sender_id: session!.user.id,
          body: "",
          attachment_path: path,
          attachment_type: type,
        });
      if (sent.error) throw sent.error;
    } catch (e) {
      Alert.alert("Upload failed", (e as Error).message);
    } finally {
      setUploading(false);
    }
  }
  async function pickMedia() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      quality: 1,
    });
    if (!result.canceled) {
      const a = result.assets[0];
      await upload(
        a.uri,
        a.mimeType || (a.type === "video" ? "video/mp4" : "image/jpeg"),
        a.fileSize,
        a.type === "video" ? "video" : "image",
      );
    }
  }
  async function pickAudio() {
    const result = await DocumentPicker.getDocumentAsync({
      type: "audio/*",
      copyToCacheDirectory: true,
    });
    if (!result.canceled) {
      const a = result.assets[0];
      await upload(a.uri, a.mimeType || "audio/mpeg", a.size, "audio");
    }
  }
  async function toggleRecord() {
    if (recording) {
      await recorder.stop();
      setRecording(false);
      if (recorder.uri) {
        const size = await fetch(recorder.uri)
          .then((r) => r.blob())
          .then((b) => b.size);
        await upload(recorder.uri, "audio/mp4", size, "audio");
      }
      return;
    }
    const permission = await AudioModule.requestRecordingPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Microphone required",
        "Allow microphone access to record a voice message.",
      );
      return;
    }
    await recorder.prepareToRecordAsync();
    recorder.record();
    setRecording(true);
  }
  async function openAttachment(path: string) {
    const { data, error } = await supabase.storage
      .from("chat-attachments")
      .createSignedUrl(path, 3600);
    if (error) Alert.alert("Could not open", error.message);
    else await Linking.openURL(data.signedUrl);
  }
  return (
    <Screen title="Chat">
      {!selected && profile?.role === "coach" ? (
        threads.map((thread) => (
          <Pressable key={thread.playerId} onPress={() => setSelected(thread)}>
            <Card>
              <Text style={textStyles.heading}>{thread.name}</Text>
              <Text style={textStyles.muted}>Open conversation</Text>
            </Card>
          </Pressable>
        ))
      ) : selected ? (
        <>
          <Text style={textStyles.heading}>{selected.name}</Text>
          {messages === null ? (
            <ActivityIndicator />
          ) : (
            messages.map((message) => (
              <Pressable
                key={message.id}
                disabled={!message.attachment_path}
                onPress={() =>
                  message.attachment_path &&
                  openAttachment(message.attachment_path)
                }
              >
                <View
                  style={[
                    styles.bubble,
                    message.sender_id === session!.user.id && styles.mine,
                  ]}
                >
                  <Text style={textStyles.body}>
                    {message.body ||
                      `Open ${message.attachment_type} attachment`}
                  </Text>
                  <Text style={styles.time}>
                    {new Date(message.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
              </Pressable>
            ))
          )}
          <Input
            value={body}
            onChangeText={setBody}
            placeholder="Type a message"
            multiline
          />
          <Button onPress={send} disabled={!body.trim() || uploading}>
            SEND
          </Button>
          <View style={styles.actionRow}>
            <View style={styles.action}>
              <Button secondary onPress={pickMedia} disabled={uploading}>
                PHOTO / VIDEO
              </Button>
            </View>
            <View style={styles.action}>
              <Button secondary onPress={pickAudio} disabled={uploading}>
                AUDIO FILE
              </Button>
            </View>
          </View>
          <Button onPress={toggleRecord} disabled={uploading}>
            {recording ? "STOP & SEND" : "RECORD VOICE"}
          </Button>
          {profile?.role === "coach" ? (
            <Button
              secondary
              onPress={() => {
                setSelected(null);
                setMessages(null);
              }}
            >
              BACK TO PLAYERS
            </Button>
          ) : null}
        </>
      ) : (
        <Text style={textStyles.muted}>No active conversation.</Text>
      )}
    </Screen>
  );
}
export function AdminScreen() {
  const [coaches, setCoaches] = useState<any[] | null>(null);
  const [keys, setKeys] = useState<any[]>([]);
  const [links, setLinks] = useState<any[]>([]);
  async function load() {
    const [c, k, l] = await Promise.all([
      supabase
        .from("profiles")
        .select("*")
        .eq("role", "coach")
        .order("created_at", { ascending: false }),
      supabase
        .from("coach_keys")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("coach_player_links")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30),
    ]);
    if (c.error) Alert.alert("Could not load users", c.error.message);
    setCoaches(c.data ?? []);
    setKeys(k.data ?? []);
    setLinks(l.data ?? []);
  }
  useEffect(() => {
    void load();
  }, []);
  async function randomKey(prefix: string, length: number) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const bytes = await Crypto.getRandomBytesAsync(length);
    return `${prefix}${Array.from(bytes, (b) => chars[b % chars.length]).join("")}`;
  }
  async function createCoachKey() {
    const key = await randomKey("KEY-COACH-", 20);
    const { error } = await supabase.rpc("admin_create_coach_key", {
      p_key: key,
    });
    if (error) Alert.alert("Could not create key", error.message);
    else {
      Alert.alert("Coach key created", key);
      void load();
    }
  }
  async function createPlayerKey(coachId: string) {
    const key = await randomKey("KEY-", 16);
    const end = new Date();
    end.setMonth(end.getMonth() + 1);
    const endDate = end.toISOString().slice(0, 10);
    const { error } = await supabase.rpc("admin_create_key", {
      p_coach_id: coachId,
      p_key: key,
      p_end_date: endDate,
    });
    if (error) Alert.alert("Could not create key", error.message);
    else {
      Alert.alert("Player key created", `${key}\nExpires ${endDate}`);
      void load();
    }
  }
  async function revokeCoachKey(id: string) {
    const { error } = await supabase.rpc("admin_revoke_coach_key", {
      p_key_id: id,
    });
    if (error) Alert.alert("Could not revoke", error.message);
    else void load();
  }
  async function revokeLink(link: any) {
    const { error } = await supabase.rpc("admin_update_key", {
      p_key_id: link.id,
      p_end_date: link.subscription_end_date,
      p_status: "revoked",
    });
    if (error) Alert.alert("Could not revoke", error.message);
    else void load();
  }
  return (
    <Screen title="Users & Keys">
      <Card>
        <Text style={textStyles.heading}>Coach invitation keys</Text>
        <Button onPress={createCoachKey}>CREATE COACH KEY</Button>
        {keys.map((key) => (
          <View key={key.id} style={styles.adminRow}>
            <View style={{ flex: 1 }}>
              <Text selectable style={textStyles.body}>
                {key.key}
              </Text>
              <Text style={textStyles.muted}>{key.status}</Text>
            </View>
            {key.status === "active" ? (
              <Button secondary onPress={() => revokeCoachKey(key.id)}>
                REVOKE
              </Button>
            ) : null}
          </View>
        ))}
      </Card>
      <Text style={textStyles.heading}>Coaches</Text>
      {!coaches ? (
        <ActivityIndicator />
      ) : (
        coaches.map((coach) => (
          <Card key={coach.id}>
            <Text style={textStyles.heading}>{coach.name || coach.email}</Text>
            <Text style={textStyles.muted}>{coach.email}</Text>
            <Button secondary onPress={() => createPlayerKey(coach.id)}>
              CREATE 1-MONTH PLAYER KEY
            </Button>
          </Card>
        ))
      )}
      <Text style={textStyles.heading}>Recent player keys</Text>
      {links.map((link) => (
        <Card key={link.id}>
          <Text selectable style={textStyles.body}>
            {link.subscription_key}
          </Text>
          <Text style={textStyles.muted}>
            {link.status} · ends {link.subscription_end_date}
          </Text>
          {link.status !== "revoked" ? (
            <Button secondary onPress={() => revokeLink(link)}>
              REVOKE ACCESS
            </Button>
          ) : null}
        </Card>
      ))}
    </Screen>
  );
}
export function AccountScreen() {
  const { profile, signOut } = useAuth();
  return (
    <Screen title="Account">
      <Card>
        <Text style={textStyles.heading}>
          {profile?.name || profile?.email}
        </Text>
        <Text style={textStyles.muted}>{profile?.role}</Text>
        <Button onPress={signOut}>SIGN OUT</Button>
      </Card>
    </Screen>
  );
}
const styles = StyleSheet.create({
  stats: { flexDirection: "row", gap: 8 },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
  },
  value: { color: colors.text, fontSize: 22, fontWeight: "800" },
  bubble: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    maxWidth: "85%",
    gap: 4,
  },
  mine: { alignSelf: "flex-end", backgroundColor: "#512715" },
  time: { color: colors.muted, fontSize: 11, alignSelf: "flex-end" },
  actionRow: { flexDirection: "row", gap: 8 },
  action: { flex: 1 },
  adminRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
});
