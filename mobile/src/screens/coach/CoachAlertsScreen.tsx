import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { AlertCircle, Bell } from 'lucide-react-native';
import { useAuth } from '../../auth/AuthProvider';
import { AppText, StatePanel } from '../../components/core/Primitives';
import { supabase } from '../../lib/supabase';
import { useMobileTheme } from '../../theme/MobileTheme';

type CoachAlert = { id: string; text: string; createdAt: string };

export default function CoachAlertsScreen() {
  const { effectiveCoachId } = useAuth();
  const theme = useMobileTheme();
  const [alerts, setAlerts] = useState<CoachAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (refresh = false) => {
    if (!effectiveCoachId) { setLoading(false); return; }
    refresh ? setRefreshing(true) : setLoading(true);
    setError('');
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const recent = new Date(now.getTime() - 7 * 86_400_000).toISOString();
    const weekday = now.getDay();
    const [linksResult, messagesResult, logsResult, checkupsResult] = await Promise.all([
      supabase.from('coach_player_links').select('player_id,is_vip,checkup_weekdays,profiles!coach_player_links_player_id_fkey(name,email)').eq('coach_id', effectiveCoachId).eq('status', 'active').not('player_id', 'is', null),
      supabase.from('chat_messages').select('id,player_id,sender_id,created_at').eq('coach_id', effectiveCoachId).gte('created_at', recent).order('created_at', { ascending: false }).limit(100),
      supabase.from('exercise_logs').select('player_id,log_date,is_completed,updated_at,created_at').eq('log_date', today).eq('is_completed', true),
      supabase.from('checkups').select('player_id,is_checked').eq('coach_id', effectiveCoachId).eq('check_date', today),
    ]);
    const queryError = linksResult.error || messagesResult.error || logsResult.error || checkupsResult.error;
    if (queryError) {
      setError(queryError.message);
    } else {
      const links = (linksResult.data ?? []) as any[];
      const players = new Map(links.map((link) => {
        const profile = Array.isArray(link.profiles) ? link.profiles[0] : link.profiles;
        return [link.player_id, { name: profile?.name || profile?.email || 'Player', vip: link.is_vip === true, weekdays: link.checkup_weekdays ?? [] }];
      }));
      const checked = new Set(((checkupsResult.data ?? []) as any[]).filter((row) => row.is_checked).map((row) => row.player_id));
      const next: CoachAlert[] = [];
      for (const message of (messagesResult.data ?? []) as any[]) {
        const player = players.get(message.player_id);
        if (player?.vip && message.sender_id === message.player_id) next.push({ id: `message-${message.id}`, text: `VIP message: ${player.name} sent you a message.`, createdAt: message.created_at });
      }
      const completed = new Map<string, string>();
      for (const log of (logsResult.data ?? []) as any[]) if (players.has(log.player_id)) completed.set(log.player_id, log.updated_at || log.created_at || `${today}T12:00:00Z`);
      for (const [playerId, createdAt] of completed) next.push({ id: `workout-${playerId}-${today}`, text: `Workout completed: ${players.get(playerId)!.name} finished today's training.`, createdAt });
      for (const link of links) {
        const player = players.get(link.player_id)!;
        if ((player.vip || player.weekdays.includes(weekday)) && !checked.has(link.player_id)) next.push({ id: `attention-${link.player_id}-${today}`, text: `Needs attention today: ${player.name} is due for a check-up.`, createdAt: `${today}T23:59:59Z` });
      }
      next.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setAlerts(next);
    }
    setLoading(false);
    setRefreshing(false);
  }, [effectiveCoachId]);

  useEffect(() => { void load(); }, [load]);

  return <View style={[styles.screen, { backgroundColor: theme.colors.surfaceSubtle }]}>
    <ScrollView contentContainerStyle={[styles.content, { padding: theme.spacing.xl }]} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={theme.colors.brand500} />}>
      <AppText variant="screenTitle">Alerts</AppText>
      <AppText color={theme.colors.ink500}>The player updates that need your attention.</AppText>
      {loading ? <ActivityIndicator accessibilityLabel="Loading alerts" color={theme.colors.brand500} style={styles.loader} /> : null}
      {!loading && error ? <StatePanel icon={AlertCircle} title="Alerts couldn't load" description={error} /> : null}
      {!loading && !error && alerts.length === 0 ? <StatePanel icon={Bell} title="You're all caught up" description="There are no player alerts right now." /> : null}
      {!loading && !error && alerts.length > 0 ? <View accessibilityRole="list" style={[styles.list, { borderColor: theme.colors.line, backgroundColor: theme.colors.surface }]}>{alerts.map((alert, index) => <View accessibilityRole="text" key={alert.id} style={[styles.row, { borderTopColor: theme.colors.line }, index === 0 && styles.firstRow]}><AppText>{alert.text}</AppText></View>)}</View> : null}
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({ screen: { flex: 1 }, content: { width: '100%', maxWidth: 720, alignSelf: 'center', gap: 12 }, loader: { marginTop: 40 }, list: { marginTop: 8, borderWidth: StyleSheet.hairlineWidth, borderRadius: 16, overflow: 'hidden' }, row: { minHeight: 60, justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: StyleSheet.hairlineWidth }, firstRow: { borderTopWidth: 0 } });
