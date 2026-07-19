import { useEffect, useState } from "react";
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
import { colors } from "../../theme";
import CoachSupportScreen from "./CoachSupportScreen";
import { DietLibrary, ExerciseLibrary, WorkoutLibrary } from "./CoachLibraries";
import { ProgramLibrary } from "./ProgramLibrary";
import CoachTeam from "./CoachTeam";
import { TermsScreen, UpdatesScreen } from "../LegalUpdatesScreen";
import {
  importDietWorkbook,
  importProgramWorkbook,
  shareDietTemplate,
  shareProgramTemplate,
} from "../../lib/workbookImport";

type Page =
  | "menu"
  | "subs"
  | "team"
  | "exercise"
  | "workout"
  | "diet"
  | "program"
  | "support"
  | "account"
  | "terms"
  | "updates"
  | "imports";
const pages: [Page, string, string][] = [
  ["subs", "Subscriptions", "VIP, renewals and player keys"],
  ["team", "Team", "Invite staff and manage roles"],
  ["exercise", "Exercise Library", "Reusable exercises"],
  ["workout", "Workout Library", "Reusable workouts"],
  ["diet", "Diet Library", "Reusable diet days"],
  ["program", "Program Library", "Reusable programs"],
  [
    "imports",
    "Excel Import & Export",
    "Share templates and replace player plans",
  ],
  ["support", "Admin Support", "Message the admin team"],
  ["updates", "Features & Updates", "See what the app can do"],
  ["terms", "Terms of Use", "Accounts, data, ownership, and safety"],
  ["account", "Account", "Profile and sign out"],
];
export default function CoachMoreScreen() {
  const { teamMembership } = useAuth();
  const [page, setPage] = useState<Page>("menu");
  const visiblePages =
    teamMembership?.role === "sales"
      ? pages.filter(([key]) =>
          ["subs", "updates", "terms", "account"].includes(key),
        )
      : pages;
  if (page === "support")
    return (
      <View style={{ flex: 1 }}>
        <Back onPress={() => setPage("menu")} />
        <CoachSupportScreen />
      </View>
    );
  if (page === "terms") return <TermsScreen back={() => setPage("menu")} />;
  if (page === "updates") return <UpdatesScreen back={() => setPage("menu")} />;
  return (
    <Screen
      title={
        page === "menu"
          ? "More"
          : (visiblePages.find((x) => x[0] === page)?.[1] ?? "More")
      }
    >
      {page !== "menu" ? (
        <Back onPress={() => setPage("menu")} />
      ) : (
        visiblePages.map(([key, title, desc]) => (
          <Pressable key={key} onPress={() => setPage(key)}>
            <Card>
              <Text style={textStyles.heading}>{title} ›</Text>
              <Text style={textStyles.muted}>{desc}</Text>
            </Card>
          </Pressable>
        ))
      )}
      {page === "subs" ? (
        <Subscriptions />
      ) : page === "team" ? (
        <CoachTeam />
      ) : page === "exercise" ? (
        <ExerciseLibrary />
      ) : page === "workout" ? (
        <WorkoutLibrary />
      ) : page === "diet" ? (
        <DietLibrary />
      ) : page === "program" ? (
        <ProgramLibrary />
      ) : page === "imports" ? (
        <WorkbookTools />
      ) : page === "account" ? (
        <Account />
      ) : null}
    </Screen>
  );
}
function Back({ onPress }: { onPress: () => void }) {
  return (
    <Button secondary onPress={onPress}>
      ← BACK
    </Button>
  );
}
function WorkbookTools() {
  const { session } = useAuth();
  const [players, setPlayers] = useState<any[]>([]);
  const [player, setPlayer] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    supabase
      .from("coach_player_links")
      .select(
        "player_id,profiles!coach_player_links_player_id_fkey(name,email)",
      )
      .eq("coach_id", session!.user.id)
      .not("player_id", "is", null)
      .then(({ data }) => {
        const x = (data ?? []).map((r: any) => ({
          id: r.player_id,
          name: r.profiles?.name || r.profiles?.email,
        }));
        setPlayers(x);
        if (x[0]) setPlayer(x[0].id);
      });
  }, []);
  async function run(kind: "program" | "diet") {
    if (!player) return Alert.alert("Choose player", "Select a player first.");
    setBusy(true);
    try {
      const result =
        kind === "program"
          ? await importProgramWorkbook(player)
          : await importDietWorkbook(player);
      if (result)
        Alert.alert(
          "Import complete",
          kind === "program"
            ? "The player program was replaced."
            : "The player diet was replaced.",
        );
    } catch (e) {
      Alert.alert("Import failed", (e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Card>
        <Text style={textStyles.heading}>Blank templates</Text>
        <Text style={textStyles.muted}>
          Share a blank Excel workbook to email, Drive, or another phone app.
        </Text>
        <Button secondary onPress={shareProgramTemplate}>
          SHARE PROGRAM TEMPLATE
        </Button>
        <Button secondary onPress={shareDietTemplate}>
          SHARE DIET TEMPLATE
        </Button>
      </Card>
      <Card>
        <Text style={textStyles.heading}>Import for player</Text>
        <View style={styles.wrap}>
          {players.map((p) => (
            <Pressable
              key={p.id}
              onPress={() => setPlayer(p.id)}
              style={[styles.choice, player === p.id && styles.active]}
            >
              <Text style={textStyles.body}>{p.name}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={textStyles.muted}>
          Importing replaces the selected player’s complete existing plan only
          after the workbook is validated.
        </Text>
        <Button disabled={busy || !player} onPress={() => run("program")}>
          IMPORT PROGRAM EXCEL
        </Button>
        <Button disabled={busy || !player} onPress={() => run("diet")}>
          IMPORT DIET EXCEL
        </Button>
      </Card>
    </>
  );
}
function Subscriptions() {
  const { effectiveCoachId } = useAuth();
  const [rows, setRows] = useState<any[] | null>(null);
  const [end, setEnd] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [vip, setVip] = useState(false);
  const [days, setDays] = useState(3);
  const [key, setKey] = useState("");
  async function load() {
    const { data } = await supabase
      .from("coach_player_links")
      .select("*,profiles!coach_player_links_player_id_fkey(name,email)")
      .eq("coach_id", effectiveCoachId!)
      .order("created_at", { ascending: false });
    setRows(data ?? []);
  }
  useEffect(() => {
    void load();
  }, []);
  async function generate() {
    const { data, error } = await supabase.rpc("coach_create_unclaimed_key", {
      p_end_date: end,
      p_is_vip: vip,
      p_checkup_days: days,
    });
    if (error) Alert.alert("Could not create", error.message);
    else {
      setKey((data as any).subscription_key);
      void load();
    }
  }
  return (
    <>
      <Card>
        <Text style={textStyles.heading}>Generate player key</Text>
        <Input
          value={end}
          onChangeText={setEnd}
          placeholder="Expiry YYYY-MM-DD"
        />
        <Button secondary={!vip} onPress={() => setVip((x) => !x)}>
          {vip ? "VIP PLAYER ✓" : "STANDARD PLAYER"}
        </Button>
        {!vip ? (
          <View style={styles.row}>
            {[1, 2, 3].map((n) => (
              <Pressable
                key={n}
                onPress={() => setDays(n)}
                style={[styles.choice, days === n && styles.active]}
              >
                <Text style={textStyles.body}>
                  {n} day{n > 1 ? "s" : ""}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        <Button onPress={generate}>GENERATE KEY</Button>
        {key ? (
          <Text selectable style={styles.key}>
            {key}
          </Text>
        ) : null}
      </Card>
      {!rows ? (
        <ActivityIndicator />
      ) : (
        rows.map((row) => (
          <Card key={row.id}>
            <Text style={textStyles.heading}>
              {row.profiles?.name || row.profiles?.email || "Unclaimed key"}{" "}
              {row.is_vip ? "· VIP" : ""}
            </Text>
            <Text style={textStyles.muted}>
              {row.status} · ends {row.subscription_end_date} ·{" "}
              {row.is_vip ? "daily" : `${row.checkup_days_per_week} days/week`}
            </Text>
            {!row.player_id ? (
              <Text selectable style={styles.key}>
                {row.subscription_key}
              </Text>
            ) : null}
          </Card>
        ))
      )}
    </>
  );
}
function Team() {
  const [role, setRole] = useState<"viewer" | "chat" | "head_coach" | "sales">(
    "viewer",
  );
  const [invites, setInvites] = useState<any[] | null>(null);
  const [members, setMembers] = useState<any[] | null>(null);
  async function load() {
    const [i, m] = await Promise.all([
      supabase
        .from("coach_team_invites" as never)
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("coach_team_members" as never)
        .select("*")
        .order("created_at", { ascending: false }),
    ]);
    setInvites((i.data as any[]) ?? []);
    setMembers((m.data as any[]) ?? []);
  }
  useEffect(() => {
    void load();
  }, []);
  async function create() {
    const { data, error } = await (supabase.rpc as any)("create_team_invite", {
      p_role: role,
    });
    if (error) Alert.alert("Could not invite", error.message);
    else {
      Alert.alert("Team key", (data as any).invite_key);
      void load();
    }
  }
  async function revoke(id: string) {
    const { error } = await (
      supabase.from("coach_team_members" as never) as any
    )
      .update({ status: "revoked" })
      .eq("id", id);
    if (error) Alert.alert("Could not revoke", error.message);
    else void load();
  }
  return (
    <>
      <Card>
        <Text style={textStyles.heading}>Generate team key</Text>
        <View style={styles.wrap}>
          {(["viewer", "chat", "head_coach", "sales"] as const).map((x) => (
            <Pressable
              key={x}
              onPress={() => setRole(x)}
              style={[styles.choice, role === x && styles.active]}
            >
              <Text style={textStyles.body}>{x.replace("_", " ")}</Text>
            </Pressable>
          ))}
        </View>
        <Button onPress={create}>GENERATE TEAM KEY</Button>
      </Card>
      <Text style={textStyles.heading}>Members</Text>
      {members?.map((x: any) => (
        <Card key={x.id}>
          <Text style={textStyles.body}>
            {x.role} · {x.status}
          </Text>
          {x.status === "active" ? (
            <Button secondary onPress={() => revoke(x.id)}>
              REVOKE
            </Button>
          ) : null}
        </Card>
      ))}
      <Text style={textStyles.heading}>Invitation keys</Text>
      {invites?.map((x: any) => (
        <Card key={x.id}>
          <Text selectable style={styles.key}>
            {x.invite_key}
          </Text>
          <Text style={textStyles.muted}>
            {x.role} · {x.status}
          </Text>
        </Card>
      ))}
    </>
  );
}
function Library({
  table,
}: {
  table:
    | "exercise_library"
    | "workout_templates"
    | "diet_templates"
    | "program_templates";
}) {
  const { session } = useAuth();
  const [rows, setRows] = useState<any[] | null>(null);
  const [name, setName] = useState("");
  async function load() {
    const { data, error } = await supabase
      .from(table as any)
      .select("*")
      .order("name");
    if (error) Alert.alert("Could not load", error.message);
    setRows(data ?? []);
  }
  useEffect(() => {
    void load();
  }, [table]);
  async function add() {
    if (!name.trim()) return;
    const base: any = { coach_id: session!.user.id, name: name.trim() };
    if (table === "exercise_library")
      Object.assign(base, {
        category: "General",
        target_muscle_groups: [],
        movement_patterns: [],
        tracking_fields: [],
      });
    if (table === "diet_templates")
      Object.assign(base, { meals: [], comment: null });
    if (table === "program_templates")
      Object.assign(base, { difficulty: "Beginner", duration_weeks: 4 });
    const { error } = await supabase.from(table as any).insert(base);
    if (error) Alert.alert("Could not add", error.message);
    else {
      setName("");
      void load();
    }
  }
  async function remove(id: string) {
    const { error } = await supabase
      .from(table as any)
      .delete()
      .eq("id", id);
    if (error) Alert.alert("Could not delete", error.message);
    else void load();
  }
  return (
    <>
      <Card>
        <Text style={textStyles.heading}>Add new</Text>
        <Input value={name} onChangeText={setName} placeholder="Name" />
        <Button onPress={add}>ADD TO LIBRARY</Button>
      </Card>
      {!rows ? (
        <ActivityIndicator />
      ) : (
        rows.map((row) => (
          <Card key={row.id}>
            <Text style={textStyles.heading}>{row.name}</Text>
            <Text style={textStyles.muted}>
              {row.category ||
                row.difficulty ||
                row.description ||
                "Saved for later use"}
            </Text>
            <Button secondary onPress={() => remove(row.id)}>
              DELETE
            </Button>
          </Card>
        ))
      )}
    </>
  );
}
function Account() {
  const { profile, signOut } = useAuth();
  return (
    <Card>
      <Text style={textStyles.heading}>{profile?.name || profile?.email}</Text>
      <Text style={textStyles.muted}>{profile?.email}</Text>
      <Button onPress={signOut}>SIGN OUT</Button>
    </Card>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  choice: {
    borderWidth: 1,
    borderColor: colors.border,
    padding: 9,
    borderRadius: 9,
  },
  active: { backgroundColor: colors.accent },
  key: { color: colors.accent, fontWeight: "800", fontSize: 16 },
});
