import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Card, Screen, textStyles } from "../../components/Screen";
import { Button, Input } from "../../components/Controls";
import { useAuth } from "../../auth/AuthProvider";
import { supabase } from "../../lib/supabase";
import { todayISO } from "../../lib/dates";
import { colors, radius } from "../../theme";

type PlayerItem = { link: any; profile: any };
type Section = "summary" | "details" | "workout" | "diet" | "context";
export default function PlayersScreen() {
  const { effectiveCoachId, teamMembership } = useAuth();
  const [players, setPlayers] = useState<PlayerItem[] | null>(null);
  const [selected, setSelected] = useState<PlayerItem | null>(null);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  async function load() {
    setRefreshing(true);
    const { data: links, error } = await supabase
      .from("coach_player_links")
      .select("*")
      .eq("coach_id", effectiveCoachId!)
      .eq("status", "active")
      .gte("subscription_end_date", new Date().toISOString().slice(0, 10))
      .not("player_id", "is", null)
      .order("created_at", { ascending: false });
    if (error) {
      Alert.alert("Could not load players", error.message);
      setPlayers([]);
      setRefreshing(false);
      return;
    }
    const ids = (links ?? [])
      .map((x) => x.player_id)
      .filter(Boolean) as string[];
    const { data: profiles } = ids.length
      ? await supabase.from("profiles").select("*").in("id", ids)
      : { data: [] };
    const map = new Map((profiles ?? []).map((p) => [p.id, p]));
    setPlayers(
      (links ?? [])
        .map((link) => ({
          link,
          profile: link.player_id ? map.get(link.player_id) : null,
        }))
        .sort((a, b) => Number(b.link.is_vip) - Number(a.link.is_vip)),
    );
    setRefreshing(false);
  }
  useEffect(() => {
    void load();
  }, [effectiveCoachId]);
  const visible = useMemo(
    () =>
      (players ?? []).filter((x) =>
        `${x.profile?.name ?? ""} ${x.profile?.email ?? ""} ${x.link.subscription_key}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [players, search],
  );
  if (selected)
    return (
      <PlayerWorkspace
        item={selected}
        coachId={effectiveCoachId!}
        teamRole={teamMembership?.role}
        onBack={() => {
          setSelected(null);
          void load();
        }}
      />
    );
  return (
    <Screen
      title="Analysis"
      subtitle="Profiles, plans, progress, and communication"
      refreshing={refreshing}
      onRefresh={load}
    >
      <Input
        value={search}
        onChangeText={setSearch}
        placeholder="Search players or keys"
      />
      {!players ? (
        <ActivityIndicator color={colors.accent} />
      ) : visible.length === 0 ? (
        <Text style={textStyles.muted}>No players match this search.</Text>
      ) : (
        visible.map((item) => (
          <Pressable
            key={item.link.id}
            disabled={!item.profile}
            onPress={() => setSelected(item)}
          >
            <Card>
              <View style={styles.titleRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(item.profile?.name || item.profile?.email || "K")
                      .slice(0, 2)
                      .toUpperCase()}
                  </Text>
                </View>
                <View style={styles.grow}>
                  <Text style={textStyles.heading}>
                    {item.profile?.name ||
                      item.profile?.email ||
                      "Unclaimed key"}
                  </Text>
                  <Text style={textStyles.muted}>
                    {item.profile?.email || "Waiting for player signup"}
                  </Text>
                </View>
                {item.link.is_vip ? <Text style={styles.vip}>VIP</Text> : null}
              </View>
              <Text style={textStyles.muted}>
                {item.link.status} · ends {item.link.subscription_end_date} ·{" "}
                {item.link.is_vip
                  ? "daily check-up"
                  : `${item.link.checkup_days_per_week} days/week`}
              </Text>
              {!item.profile ? (
                <Text selectable style={styles.key}>
                  {item.link.subscription_key}
                </Text>
              ) : null}
            </Card>
          </Pressable>
        ))
      )}
    </Screen>
  );
}

function PlayerWorkspace({
  item,
  coachId,
  teamRole,
  onBack,
}: {
  item: PlayerItem;
  coachId: string;
  teamRole?: "viewer" | "chat" | "head_coach" | "sales";
  onBack: () => void;
}) {
  const [section, setSection] = useState<Section>("summary");
  const [details, setDetails] = useState<any>(null);
  const [coaching, setCoaching] = useState({
    coach_notes: "",
    client_goals: "",
    limitations_injuries: "",
    available_equipment: "",
  });
  const [progress, setProgress] = useState<any>(null);
  const [diet, setDiet] = useState<any[]>([]);
  const [check, setCheck] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const id = item.profile.id;
  async function load() {
    const [d, c, p, dl, ch] = await Promise.all([
      supabase
        .from("player_details")
        .select("*")
        .eq("player_id", id)
        .maybeSingle(),
      supabase
        .from("player_coaching_profiles")
        .select(
          "coach_notes,client_goals,limitations_injuries,available_equipment",
        )
        .eq("coach_id", coachId)
        .eq("player_id", id)
        .maybeSingle(),
      supabase.rpc("get_progress_page", {
        p_player_id: id,
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
        .eq("player_id", id)
        .order("log_date", { ascending: false })
        .limit(30),
      supabase
        .from("checkups")
        .select("is_checked")
        .eq("coach_id", coachId)
        .eq("player_id", id)
        .eq("check_date", todayISO())
        .maybeSingle(),
    ]);
    setDetails(d.data);
    if (c.data) setCoaching(c.data);
    setProgress(p.data);
    setDiet(dl.data ?? []);
    setCheck(ch.data?.is_checked ?? false);
  }
  useEffect(() => {
    void load();
  }, [id]);
  async function saveContext() {
    setBusy(true);
    const { error } = await supabase
      .from("player_coaching_profiles" as never)
      .upsert(
        {
          coach_id: coachId,
          player_id: id,
          ...Object.fromEntries(
            Object.entries(coaching).map(([k, v]) => [k, v.trim()]),
          ),
          updated_at: new Date().toISOString(),
        } as never,
        { onConflict: "coach_id,player_id" },
      );
    setBusy(false);
    if (error) Alert.alert("Could not save", error.message);
    else Alert.alert("Saved", "Coaching context updated.");
  }
  async function toggle() {
    const next = !check;
    const { error } = await supabase.from("checkups").upsert(
      {
        coach_id: coachId,
        player_id: id,
        check_date: todayISO(),
        is_checked: next,
      },
      { onConflict: "coach_id,player_id,check_date" },
    );
    if (error) Alert.alert("Could not save", error.message);
    else setCheck(next);
  }
  async function send() {
    if (!message.trim()) return;
    setBusy(true);
    const text = message.trim();
    const { error } = await supabase.from("messages").insert({
      coach_id: coachId,
      player_id: id,
      exercise_id: null,
      body: text,
    });
    setBusy(false);
    if (error) Alert.alert("Could not send", error.message);
    else {
      setMessage("");
      Alert.alert("Sent", "Guidance sent to the player.");
    }
  }
  // Subscription renewal is managed from More > Subscriptions.
  const canRenew = false;
  async function renew() {}
  const done = progress?.total_completed ?? progress?.totalCompleted ?? 0,
    total = progress?.total_logged ?? progress?.totalLogged ?? 0;
  const meals = diet.reduce((n, x) => n + x.completed_meals, 0),
    planned = diet.reduce((n, x) => n + x.total_meals, 0);
  const canManage = !teamRole || teamRole === "head_coach";
  const canChat = !teamRole || teamRole === "head_coach" || teamRole === "chat";
  const sections: Section[] = canManage
    ? ["summary", "details", "workout", "diet", "context"]
    : ["summary", "details", "workout", "diet"];
  return (
    <Screen
      title={item.profile.name || item.profile.email}
      subtitle={`${item.link.status} · access through ${item.link.subscription_end_date}`}
    >
      <Button secondary onPress={onBack}>
        ← ALL PLAYERS
      </Button>
      <View style={styles.tabs}>
        {sections.map((x) => (
          <Pressable
            key={x}
            onPress={() => setSection(x)}
            style={[styles.tab, section === x && styles.tabActive]}
          >
            <Text style={styles.tabText}>{x.toUpperCase()}</Text>
          </Pressable>
        ))}
      </View>
      {section === "summary" ? (
        <>
          <View style={styles.stats}>
            <Stat
              value={`${total ? Math.round((done / total) * 100) : 0}%`}
              label="Workout"
            />
            <Stat
              value={`${planned ? Math.round((meals / planned) * 100) : 0}%`}
              label="Diet"
            />
            <Stat
              value={String(
                progress?.total_exercises ?? progress?.totalExercises ?? 0,
              )}
              label="Exercises"
            />
          </View>
          {canManage ? (
            <Card>
              <Text style={textStyles.heading}>Today’s check-up</Text>
              <Button secondary={!check} onPress={toggle}>
                {check ? "CHECKED ✓" : "MARK CHECKED"}
              </Button>
            </Card>
          ) : null}
          {canRenew ? (
            <Card>
              <Text style={textStyles.heading}>Subscription</Text>
              <Text style={textStyles.muted}>
                {item.link.is_vip
                  ? "VIP · daily priority"
                  : `${item.link.checkup_days_per_week} scheduled check-ups/week`}
              </Text>
              <Button secondary onPress={renew} disabled={busy}>
                RENEW 1 MONTH
              </Button>
            </Card>
          ) : null}
          {canChat ? (
            <Card>
              <Text style={textStyles.heading}>Send guidance</Text>
              <Input
                value={message}
                onChangeText={setMessage}
                multiline
                maxLength={5000}
                placeholder="Message for this player"
              />
              <Button onPress={send} disabled={busy || !message.trim()}>
                SEND MESSAGE
              </Button>
            </Card>
          ) : null}
        </>
      ) : section === "details" ? (
        <Details data={details} />
      ) : section === "workout" ? (
        <WorkoutProgress data={progress} />
      ) : section === "diet" ? (
        <DietProgress logs={diet} />
      ) : canManage ? (
        <Context
          value={coaching}
          setValue={setCoaching}
          save={saveContext}
          busy={busy}
        />
      ) : (
        <Text style={textStyles.muted}>
          This section is available to head coaches only.
        </Text>
      )}
    </Screen>
  );
}

function Details({ data }: { data: any }) {
  if (!data)
    return (
      <Card>
        <Text style={textStyles.muted}>
          The player has not completed their profile yet.
        </Text>
      </Card>
    );
  const fields = [
    ["Gender", data.gender],
    ["Date of birth", data.date_of_birth],
    ["Height", data.height],
    ["Country", data.country],
    ["Mobile", data.mobile_number],
    ["Sport", data.sport],
    ["Position", data.position],
    ["Sport level", data.sport_level],
    ["Experience", data.experience_level],
  ];
  return (
    <Card>
      {fields.map(([label, value]) => (
        <View key={label} style={styles.detail}>
          <Text style={textStyles.muted}>{label}</Text>
          <Text style={textStyles.body}>{value || "—"}</Text>
        </View>
      ))}
    </Card>
  );
}
function WorkoutProgress({ data }: { data: any }) {
  const rows = data?.rows ?? [];
  return (
    <>
      <View style={styles.stats}>
        <Stat
          value={String(data?.total_completed ?? data?.totalCompleted ?? 0)}
          label="Completed"
        />
        <Stat
          value={String(data?.total_logged ?? data?.totalLogged ?? 0)}
          label="Logged"
        />
        <Stat
          value={String(data?.total_exercises ?? data?.totalExercises ?? 0)}
          label="Exercises"
        />
      </View>
      {rows.length === 0 ? (
        <Card>
          <Text style={textStyles.muted}>No logged sessions yet.</Text>
        </Card>
      ) : (
        rows.map((x: any) => (
          <Card key={x.id}>
            <Text style={textStyles.heading}>{x.exercise_name}</Text>
            <Text style={textStyles.muted}>
              {x.workout_name} · {x.log_date}
            </Text>
            <Text style={textStyles.body}>
              {x.actual_sets ?? "—"} sets · {x.actual_reps ?? "—"} reps ·{" "}
              {x.actual_weight ?? "—"}
            </Text>
            {x.player_comment ? (
              <Text style={textStyles.muted}>{x.player_comment}</Text>
            ) : null}
          </Card>
        ))
      )}
    </>
  );
}
function DietProgress({ logs }: { logs: any[] }) {
  const done = logs.reduce((n, x) => n + x.completed_meals, 0),
    total = logs.reduce((n, x) => n + x.total_meals, 0);
  return (
    <>
      <View style={styles.stats}>
        <Stat
          value={`${total ? Math.round((done / total) * 100) : 0}%`}
          label="Adherence"
        />
        <Stat value={`${done}/${total}`} label="Meals" />
        <Stat value={String(logs.length)} label="Days" />
      </View>
      {logs.length === 0 ? (
        <Card>
          <Text style={textStyles.muted}>No diet check-ins yet.</Text>
        </Card>
      ) : (
        logs.map((x) => (
          <Card key={x.id}>
            <Text style={textStyles.heading}>{x.log_date}</Text>
            <Text style={textStyles.body}>
              {x.completed_meals}/{x.total_meals} meals ·{" "}
              {x.total_meals
                ? Math.round((x.completed_meals / x.total_meals) * 100)
                : 0}
              %
            </Text>
            {x.player_comment ? (
              <Text style={textStyles.muted}>{x.player_comment}</Text>
            ) : null}
          </Card>
        ))
      )}
    </>
  );
}
function Context({
  value,
  setValue,
  save,
  busy,
}: {
  value: any;
  setValue: (x: any) => void;
  save: () => void;
  busy: boolean;
}) {
  const field = (key: string, text: string) =>
    setValue({ ...value, [key]: text });
  return (
    <Card>
      <Text style={textStyles.heading}>Private coaching context</Text>
      <Input
        multiline
        maxLength={10000}
        value={value.coach_notes}
        onChangeText={(x) => field("coach_notes", x)}
        placeholder="Coach notes"
      />
      <Input
        multiline
        maxLength={10000}
        value={value.client_goals}
        onChangeText={(x) => field("client_goals", x)}
        placeholder="Client goals"
      />
      <Input
        multiline
        maxLength={10000}
        value={value.limitations_injuries}
        onChangeText={(x) => field("limitations_injuries", x)}
        placeholder="Limitations and injuries"
      />
      <Input
        multiline
        maxLength={10000}
        value={value.available_equipment}
        onChangeText={(x) => field("available_equipment", x)}
        placeholder="Available equipment"
      />
      <Button onPress={save} disabled={busy}>
        {busy ? "SAVING…" : "SAVE CONTEXT"}
      </Button>
    </Card>
  );
}
function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.value}>{value}</Text>
      <Text style={textStyles.muted}>{label}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  grow: { flex: 1 },
  key: { color: colors.accent, fontWeight: "800" },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.accent, fontWeight: "900" },
  vip: {
    color: colors.vip,
    fontSize: 11,
    fontWeight: "900",
    backgroundColor: "#443013",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
  },
  tabs: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  tabActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  tabText: { color: colors.text, fontSize: 10, fontWeight: "900" },
  stats: { flexDirection: "row", gap: 8 },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    alignItems: "center",
  },
  value: { color: colors.accent, fontSize: 20, fontWeight: "900" },
  detail: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
});
