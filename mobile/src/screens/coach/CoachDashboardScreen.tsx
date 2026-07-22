import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Card, Screen, textStyles } from "../../components/Screen";
import { useAuth } from "../../auth/AuthProvider";
import { supabase } from "../../lib/supabase";
import { colors, radius } from "../../theme";

const DAY = 86_400_000;

type PriorityPlayer = {
  id: string;
  name: string;
  vip: boolean;
  unread: boolean;
  checkupDue: boolean;
  needsProgram: boolean;
  inactiveDays: number | null;
};

type DashboardData = {
  active: number;
  unread: number;
  checkupsDue: number;
  inactive: number;
  priority: PriorityPlayer[];
};

export default function CoachDashboardScreen() {
  const { effectiveCoachId, profile, session } = useAuth();
  const navigation = useNavigation<any>();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    if (!effectiveCoachId || !session) return;
    setRefreshing(true);
    setError("");
    const today = new Date().toISOString().slice(0, 10);
    const weekday = new Date().getDay();
    const [linksResult, chatsResult, checksResult] = await Promise.all([
      supabase.from("coach_player_links").select("id,status,subscription_end_date,is_vip,checkup_weekdays,player_id,profiles!coach_player_links_player_id_fkey(name,email)").eq("coach_id", effectiveCoachId),
      (supabase.rpc as any)("get_coach_chat_threads", { p_coach_id: effectiveCoachId }),
      supabase.from("checkups").select("player_id,is_checked").eq("coach_id", effectiveCoachId).eq("check_date", today),
    ]);
    const queryError = linksResult.error || chatsResult.error || checksResult.error;
    if (queryError) {
      setError(queryError.message);
      setRefreshing(false);
      return;
    }
    const rows = (linksResult.data ?? []).filter((row: any) => row.player_id);
    const ids = rows.map((row: any) => row.player_id as string);
    const [activityResult, programsResult] = ids.length ? await Promise.all([
      supabase.from("exercise_logs").select("player_id,log_date").in("player_id", ids).order("log_date", { ascending: false }),
      supabase.from("program_days").select("player_id").in("player_id", ids).eq("day_type", "training"),
    ]) : [{ data: [], error: null }, { data: [], error: null }];
    if (activityResult.error || programsResult.error) {
      setError((activityResult.error || programsResult.error)!.message);
      setRefreshing(false);
      return;
    }
    const latestActivity = new Map<string, string>();
    for (const row of activityResult.data ?? []) if (!latestActivity.has(row.player_id)) latestActivity.set(row.player_id, row.log_date);
    const programmed = new Set((programsResult.data ?? []).map((row) => row.player_id));
    const checked = new Map((checksResult.data ?? []).map((row) => [row.player_id, row.is_checked]));
    const latestMessage = new Map<string, any>();
    for (const row of chatsResult.data ?? []) if (!latestMessage.has(row.player_id)) latestMessage.set(row.player_id, row);
    const priority = await Promise.all(rows.map(async (row: any): Promise<PriorityPlayer> => {
      const activity = latestActivity.get(row.player_id);
      const inactiveDays = activity ? Math.max(0, Math.floor((Date.now() - new Date(`${activity}T12:00:00`).getTime()) / DAY)) : null;
      const lastMessage = latestMessage.get(row.player_id);
      const lastRead = await AsyncStorage.getItem(`lastRead_${session.user.id}_${row.player_id}`);
      return {
        id: row.player_id,
        name: row.profiles?.name || row.profiles?.email || "Player",
        vip: row.is_vip === true,
        unread: !!lastMessage && lastMessage.sender_id !== session.user.id && lastMessage.created_at > (lastRead || new Date(0).toISOString()),
        checkupDue: (row.is_vip || (row.checkup_weekdays ?? []).includes(weekday)) && !(checked.get(row.player_id) ?? false),
        needsProgram: !programmed.has(row.player_id),
        inactiveDays,
      };
    }));
    const needsAttention = priority.filter((row) => row.unread || row.checkupDue || row.needsProgram || row.inactiveDays === null || row.inactiveDays >= 7);
    needsAttention.sort((a, b) => priorityScore(b) - priorityScore(a));
    setData({
      active: rows.filter((row: any) => row.status === "active" && row.subscription_end_date >= today).length,
      unread: priority.filter((row) => row.unread).length,
      checkupsDue: priority.filter((row) => row.checkupDue).length,
      inactive: priority.filter((row) => row.inactiveDays === null || row.inactiveDays >= 7).length,
      priority: needsAttention,
    });
    setRefreshing(false);
  }

  useEffect(() => { void load(); }, [effectiveCoachId, session]);

  return <Screen title={`Good day, ${profile?.name?.split(" ")[0] || "Coach"}`} subtitle="Your priority coaching queue" refreshing={refreshing} onRefresh={load}>
    <View style={styles.hero}>
      <Text style={textStyles.eyebrow}>Coach command center</Text>
      <Text style={styles.heroTitle}>Focus where it matters.</Text>
      <Text style={styles.heroCopy}>Messages, check-ups, programming gaps, and low activity in one clear view.</Text>
      <View style={styles.heroActions}>
        <ActionButton label="Open analysis" icon="analytics-outline" onPress={() => navigation.getParent()?.getParent()?.navigate("People")} primary />
        <ActionButton label="Inbox" icon="chatbubbles-outline" onPress={() => navigation.getParent()?.getParent()?.navigate("Messages")} />
      </View>
    </View>
    {!data && !error ? <ActivityIndicator color={colors.accent} /> : null}
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    {data ? <>
      <View style={styles.grid}>
        <Metric value={data.priority.length} label="Need attention" color={colors.accent2} />
        <Metric value={data.unread} label="Unread" color="#9b7cff" />
        <Metric value={data.checkupsDue} label="Check-ups due" color={colors.warning} />
        <Metric value={data.inactive} label="Inactive 7+ days" color={colors.success} />
      </View>
      <Card>
        <View style={styles.sectionHeading}><View><Text style={textStyles.eyebrow}>Priority queue</Text><Text style={textStyles.heading}>Players needing attention</Text></View><Text style={styles.activeCount}>{data.active} active</Text></View>
        {data.priority.length === 0 ? <View style={styles.empty}><Ionicons name="checkmark-circle" size={34} color={colors.success} /><Text style={textStyles.heading}>You’re caught up</Text><Text style={textStyles.muted}>No urgent coaching signals right now.</Text></View> : data.priority.slice(0, 5).map((player) => <Pressable accessibilityRole="button" accessibilityLabel={`Open ${player.name} in analysis`} onPress={() => navigation.getParent()?.getParent()?.navigate("People")} key={player.id} style={({ pressed }) => [styles.playerRow, pressed && styles.pressed]}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{initials(player.name)}</Text></View>
          <View style={styles.playerBody}><Text numberOfLines={1} style={styles.playerName}>{player.name}{player.vip ? "  ★" : ""}</Text><Text style={textStyles.muted}>{activityLabel(player.inactiveDays)}</Text><View style={styles.signals}>{player.unread && <Signal label="Unread" color="#9b7cff" />}{player.checkupDue && <Signal label="Check-up" color={colors.warning} />}{player.needsProgram && <Signal label="Program" color={colors.success} />}{(player.inactiveDays === null || player.inactiveDays >= 7) && <Signal label="Low activity" color={colors.danger} />}</View></View>
          <Ionicons name="chevron-forward" color={colors.muted} size={20} />
        </Pressable>)}
      </Card>
      <Card>
        <Text style={textStyles.eyebrow}>Quick actions</Text>
        <QuickAction icon="clipboard-outline" title="Build a program" subtitle="Use your programming library" onPress={() => navigation.getParent()?.getParent()?.navigate("Build")} />
        <QuickAction icon="people-outline" title="Review the roster" subtitle="Open player profiles and progress" onPress={() => navigation.getParent()?.getParent()?.navigate("People")} />
        <QuickAction icon="grid-outline" title="Check-ups and settings" subtitle="Continue your daily workflow" onPress={() => navigation.navigate("CoachTools")} />
      </Card>
    </> : null}
  </Screen>;
}

function Metric({ value, label, color }: { value: number; label: string; color: string }) { return <View style={[styles.metric, { borderLeftColor: color }]}><Text style={styles.number}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>; }
function Signal({ label, color }: { label: string; color: string }) { return <View style={[styles.signal, { backgroundColor: `${color}22` }]}><View style={[styles.dot, { backgroundColor: color }]} /><Text style={[styles.signalText, { color }]}>{label}</Text></View>; }
function ActionButton({ label, icon, onPress, primary = false }: { label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void; primary?: boolean }) { return <Pressable accessibilityRole="button" onPress={onPress} style={[styles.actionButton, primary && styles.actionPrimary]}><Ionicons name={icon} size={17} color={colors.text} /><Text style={styles.actionText}>{label}</Text></Pressable>; }
function QuickAction({ icon, title, subtitle, onPress }: { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string; onPress: () => void }) { return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}><View style={styles.quickIcon}><Ionicons name={icon} size={20} color={colors.accent2} /></View><View style={styles.playerBody}><Text style={styles.playerName}>{title}</Text><Text style={textStyles.muted}>{subtitle}</Text></View><Ionicons name="chevron-forward" size={19} color={colors.muted} /></Pressable>; }
function priorityScore(player: PriorityPlayer) { return Number(player.unread) * 5 + Number(player.checkupDue) * 4 + Number(player.needsProgram) * 3 + Number(player.inactiveDays === null || player.inactiveDays >= 7) * 2; }
function initials(name: string) { return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase(); }
function activityLabel(days: number | null) { if (days === null) return "No training activity yet"; if (days === 0) return "Trained today"; if (days === 1) return "Last trained yesterday"; return `Last trained ${days} days ago`; }

const styles = StyleSheet.create({
  hero: { overflow: "hidden", gap: 8, padding: 20, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, backgroundColor: colors.surfaceRaised },
  heroTitle: { color: colors.text, fontSize: 27, lineHeight: 31, fontWeight: "900", letterSpacing: -0.7 },
  heroCopy: { maxWidth: 470, color: colors.muted, fontSize: 14, lineHeight: 20 },
  heroActions: { flexDirection: "row", gap: 9, marginTop: 8 },
  actionButton: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surfaceSoft },
  actionPrimary: { borderColor: colors.accent2, backgroundColor: colors.accent2 },
  actionText: { color: colors.text, fontSize: 12, fontWeight: "800" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  metric: { width: "48%", minHeight: 100, justifyContent: "center", gap: 4, padding: 14, borderWidth: 1, borderLeftWidth: 3, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface },
  number: { color: colors.text, fontSize: 31, lineHeight: 35, fontWeight: "900" },
  metricLabel: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  sectionHeading: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12, paddingBottom: 4 },
  activeCount: { color: colors.success, fontSize: 11, fontWeight: "800" },
  playerRow: { minHeight: 82, flexDirection: "row", alignItems: "center", gap: 11, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.border },
  avatar: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 13, backgroundColor: colors.accentSoft },
  avatarText: { color: colors.accent, fontSize: 12, fontWeight: "900" },
  playerBody: { flex: 1, minWidth: 0 },
  playerName: { color: colors.text, fontSize: 14, fontWeight: "800" },
  signals: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 6 },
  signal: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: radius.pill },
  dot: { width: 5, height: 5, borderRadius: 3 },
  signalText: { fontSize: 9, fontWeight: "800" },
  quickAction: { minHeight: 64, flexDirection: "row", alignItems: "center", gap: 11, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border },
  quickIcon: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 11, backgroundColor: colors.surfaceSoft },
  empty: { alignItems: "center", gap: 5, paddingVertical: 28 },
  pressed: { opacity: 0.68 },
  error: { color: colors.danger, fontSize: 13 },
});
