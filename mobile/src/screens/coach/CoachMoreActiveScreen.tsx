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
import CoachTeam from "./CoachTeam";
import CoachSupportScreen from "./CoachSupportScreen";
import { TermsScreen, UpdatesScreen } from "../LegalUpdatesScreen";
import * as Clipboard from "expo-clipboard";

type Page =
  "menu" | "subs" | "team" | "support" | "account" | "terms" | "updates";
const pages: [Page, string, string][] = [
  ["subs", "Subscriptions", "VIP, renewals and player keys"],
  ["team", "Team", "Invite staff and manage roles"],
  ["support", "Admin Support", "Message the admin team"],
  ["updates", "Features & Updates", "See what the app can do"],
  ["terms", "Terms of Use", "Accounts, data, ownership, and safety"],
  ["account", "Account", "Profile and sign out"],
];

export default function CoachMoreActiveScreen() {
  const { teamMembership } = useAuth();
  const [page, setPage] = useState<Page>("menu");
  const visible =
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
          : (visible.find((x) => x[0] === page)?.[1] ?? "More")
      }
    >
      {page !== "menu" ? (
        <Back onPress={() => setPage("menu")} />
      ) : (
        visible.map(([key, title, description]) => (
          <Pressable key={key} onPress={() => setPage(key)}>
            <Card>
              <Text style={textStyles.heading}>{title} ›</Text>
              <Text style={textStyles.muted}>{description}</Text>
            </Card>
          </Pressable>
        ))
      )}
      {page === "subs" ? (
        <Subscriptions />
      ) : page === "team" ? (
        <CoachTeam />
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
  const [renewing, setRenewing] = useState("");
  const [renewMonths, setRenewMonths] = useState<Record<string, number>>({});
  const [copied, setCopied] = useState("");
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
  }, [effectiveCoachId]);
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
  async function renew(row: any) {
    if (!row.player_id) return;
    setRenewing(row.id);
    const months = renewMonths[row.id] ?? 1;
    const today = new Date();
    const currentEnd = new Date(`${row.subscription_end_date}T12:00:00`);
    const endDate = currentEnd > today ? currentEnd : today;
    endDate.setMonth(endDate.getMonth() + months);
    const { error } = await supabase.rpc("coach_create_player_key", {
      p_player_id: row.player_id,
      p_end_date: endDate.toISOString().slice(0, 10),
      p_is_vip: row.is_vip === true,
      p_checkup_days: Math.min(3, Math.max(1, row.checkup_days_per_week ?? 3)),
    });
    setRenewing("");
    if (error) Alert.alert("Could not renew", error.message);
    else {
      Alert.alert(
        "Renewed",
        `Player access was extended by ${months} month${months > 1 ? "s" : ""}.`,
      );
      void load();
    }
  }
  async function copyKey(value: string) {
    await Clipboard.setStringAsync(value);
    setCopied(value);
    setTimeout(
      () => setCopied((current) => (current === value ? "" : current)),
      1400,
    );
  }
  function KeyRow({ value }: { value: string }) {
    return (
      <View style={styles.keyRow}>
        <Text selectable numberOfLines={1} style={styles.key}>
          {value}
        </Text>
        <Pressable
          accessibilityLabel="Copy key"
          onPress={() => copyKey(value)}
          style={styles.copyIcon}
        >
          <Text style={styles.copyGlyph}>{copied === value ? "✓" : "⧉"}</Text>
        </Pressable>
      </View>
    );
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
        {key ? <KeyRow value={key} /> : null}
      </Card>
      {!rows ? (
        <ActivityIndicator color={colors.accent} />
      ) : (
        rows.map((row) => (
          <Card key={row.id}>
            <Text style={textStyles.heading}>
              {row.profiles?.name || row.profiles?.email || "Unclaimed key"}
              {row.is_vip ? " · VIP" : ""}
            </Text>
            <Text style={textStyles.muted}>
              {row.status} · ends {row.subscription_end_date} ·{" "}
              {row.is_vip ? "daily" : `${row.checkup_days_per_week} days/week`}
            </Text>
            {!row.player_id ? (
              <KeyRow value={row.subscription_key} />
            ) : (
              <View style={styles.renewBox}>
                <Text style={styles.monthLabel}>RENEW FOR</Text>
                <View style={styles.monthRow}>
                  {[1, 2, 3, 6, 12].map((month) => (
                    <Pressable
                      key={month}
                      onPress={() =>
                        setRenewMonths((current) => ({
                          ...current,
                          [row.id]: month,
                        }))
                      }
                      style={[
                        styles.monthChip,
                        (renewMonths[row.id] ?? 1) === month &&
                          styles.monthChipActive,
                      ]}
                    >
                      <Text style={styles.monthText}>
                        {month}
                        {month === 1 ? " mo" : " mos"}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Button
                  secondary
                  disabled={renewing === row.id}
                  onPress={() => renew(row)}
                >
                  RENEW PLAYER
                </Button>
              </View>
            )}
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
      <Button danger onPress={signOut}>
        SIGN OUT
      </Button>
    </Card>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8 },
  choice: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  active: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  key: { color: colors.accent, fontWeight: "900" },
  keyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingLeft: 12,
    paddingRight: 6,
    minHeight: 48,
  },
  copyIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  copyGlyph: { color: colors.accent, fontSize: 22, fontWeight: "900" },
  renewBox: { gap: 8 },
  monthLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  monthRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  monthChip: {
    paddingHorizontal: 10,
    minHeight: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  monthChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  monthText: { color: colors.text, fontSize: 11, fontWeight: "800" },
});
