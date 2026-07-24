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
import * as FileSystem from "expo-file-system/legacy";
import * as Crypto from "expo-crypto";
import { AudioModule, RecordingPresets, useAudioRecorder } from "expo-audio";
import { Card, Screen, textStyles } from "../components/Screen";
import { Button, Input } from "../components/Controls";
import { useAuth } from "../auth/AuthProvider";
import { supabase } from "../lib/supabase";
import { colors } from "../theme";
import { validateMedia } from "../lib/mediaSecurity";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getPrivateFileUrl, isPrivateFileRef, uploadPrivateUri } from "../api/privateFiles";
import AccountPrivacyScreen from './legal/AccountPrivacyScreen';

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
  const { session, profile, effectiveCoachId } = useAuth();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [chatBlocked, setChatBlocked] = useState(false);
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
            "player_id,is_vip,profiles!coach_player_links_player_id_fkey(name,email)",
          )
          .eq("coach_id", effectiveCoachId!)
          .eq("status", "active")
          .not("player_id", "is", null);
        const { data: recent } = await (supabase.rpc as any)(
          "get_coach_chat_threads",
          { p_coach_id: effectiveCoachId! },
        );
        const latest = new Map<string, any>(
          (recent ?? []).map((row: any) => [row.player_id, row]),
        );
        const mapped = await Promise.all(
          (data ?? []).map(async (x: any) => {
            const last = latest.get(x.player_id),
              read = await AsyncStorage.getItem(
                `lastRead_${session!.user.id}_${x.player_id}`,
              );
            return {
              coachId: effectiveCoachId!,
              playerId: x.player_id,
              name: x.profiles?.name || x.profiles?.email || "Player",
              vip: x.is_vip === true,
              latest: last?.body || "No messages yet",
              latestAt: last?.created_at || "",
              unread:
                !!last &&
                last.sender_id !== session!.user.id &&
                last.created_at > (read || new Date(0).toISOString()),
            };
          }),
        );
        mapped.sort(
          (a, b) =>
            Number(b.vip && b.unread) - Number(a.vip && a.unread) ||
            Number(b.unread) - Number(a.unread) ||
            b.latestAt.localeCompare(a.latestAt),
        );
        setThreads(mapped);
      }
    }
    void load();
  }, [profile, session, effectiveCoachId]);
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
    const { error } = await supabase.from("chat_messages").insert({
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
  async function openThread(thread: any) {
    await AsyncStorage.setItem(
      `lastRead_${session!.user.id}_${thread.playerId}`,
      new Date().toISOString(),
    );
    setThreads((current) =>
      current.map((x) =>
        x.playerId === thread.playerId ? { ...x, unread: false } : x,
      ),
    );
    setSelected(thread);
  }
  async function upload(
    uri: string,
    mime: string,
    size: number | undefined,
    type: "image" | "video" | "audio",
  ) {
    if (!selected) return;
    const info = size ? null : await FileSystem.getInfoAsync(uri);
    const actualSize = size ?? (info?.exists ? info.size : undefined);
    const max = type === "image" ? 10 : type === "video" ? 500 : 25;
    if (!actualSize || actualSize > max * 1024 * 1024) {
      Alert.alert(
        "File not allowed",
        `${type} must be no larger than ${max} MB.`,
      );
      return;
    }
    setUploading(true);
    try {
      const encodedHeader = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
        position: 0,
        length: 16,
      });
      const header = Uint8Array.from(globalThis.atob(encodedHeader), (character) => character.charCodeAt(0)).buffer;
      validateMedia(header, mime, actualSize, type, max);
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
      const path = await uploadPrivateUri(uri, actualSize, `${Date.now()}-${Crypto.randomUUID()}.${ext}`, mime, {
        purpose: type === "audio" ? "chat-voice" : "chat-attachment",
        coachId: selected.coachId,
        playerId: selected.playerId,
      });
      const sent = await supabase.from("chat_messages").insert({
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
    if (isPrivateFileRef(path)) {
      try {
        await Linking.openURL(await getPrivateFileUrl(path));
      } catch (error) {
        Alert.alert("Could not open", (error as Error).message);
      }
      return;
    }
    const { data, error } = await supabase.storage
      .from("chat-attachments")
      .createSignedUrl(path, 3600);
    if (error) Alert.alert("Could not open", error.message);
    else await Linking.openURL(data.signedUrl);
  }
  function messageSafety(message: any) {
    if (message.sender_id === session!.user.id || !selected) return;
    Alert.alert('Message safety', 'Report this message or block new messages from this user. Existing coaching records stay available.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Report abuse', onPress: async () => { const { error } = await (supabase.rpc as any)('report_ugc',{p_type:'chat_message',p_id:message.id,p_reason:'abuse',p_details:null}); Alert.alert(error ? 'Could not report' : 'Report received', error?.message ?? 'Thank you. Our safety team can review it.'); } },
      { text: 'Block', style: 'destructive', onPress: async () => { const otherId=session!.user.id===selected.coachId?selected.playerId:selected.coachId; const { error }=await (supabase.rpc as any)('block_user',{p_user:otherId,p_scope:'chat',p_reason:'Blocked from mobile chat'}); if(error) Alert.alert('Could not block',error.message); else setChatBlocked(true); } },
    ]);
  }
  return (
    <Screen title="Chat">
      {!selected && profile?.role === "coach" ? (
        threads.map((thread) => (
          <Pressable key={thread.playerId} onPress={() => openThread(thread)}>
            <Card>
              <Text style={textStyles.heading}>
                {thread.name} {thread.vip ? "· VIP" : ""}{" "}
                {thread.unread ? "●" : ""}
              </Text>
              <Text style={textStyles.muted}>{thread.latest}</Text>
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
                onLongPress={() => messageSafety(message)}
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
            editable={!chatBlocked}
          />
          {chatBlocked ? <Text style={textStyles.muted}>This chat is blocked. Existing records remain available.</Text> : null}
          <Button onPress={send} disabled={chatBlocked || !body.trim() || uploading}>
            SEND
          </Button>
          <Button secondary onPress={pickMedia} disabled={chatBlocked || uploading}>
            PHOTO / VIDEO (VIDEO MAX 500 MB)
          </Button>
          <Button onPress={toggleRecord} disabled={chatBlocked || uploading}>
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
  async function createPlayerKey(coachId: string, duration: "15d" | "1m") {
    const key = await randomKey("KEY-", 16);
    const end = new Date();
    if (duration === "15d") end.setDate(end.getDate() + 15);
    else end.setMonth(end.getMonth() + 1);
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
            <Button secondary onPress={() => createPlayerKey(coach.id, "15d")}>
              CREATE 15-DAY PLAYER KEY
            </Button>
            <Button secondary onPress={() => createPlayerKey(coach.id, "1m")}>
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
  return <AccountPrivacyScreen />;
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
  mine: { alignSelf: "flex-end", backgroundColor: colors.accentSoft },
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
