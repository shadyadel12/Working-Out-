import { supabase } from '../lib/supabase';
import type { Profile, CoachPlayerLink } from '../types/database.types';

export interface PlayerWithLink {
  profile: Profile | null; // null when the key is issued but not yet claimed
  link: CoachPlayerLink;
  needsProgramming: boolean;
}

export interface PlayerActivitySummary {
  playerId: string;
  lastActivity: string | null;
}

/** Latest training activity for every claimed player in a coach roster. */
export async function listPlayerActivitySummaries(playerIds: string[]): Promise<PlayerActivitySummary[]> {
  if (playerIds.length === 0) return [];
  const { data, error } = await supabase
    .from('exercise_logs')
    .select('player_id,log_date')
    .in('player_id', playerIds)
    .order('log_date', { ascending: false });
  if (error) throw error;
  const latest = new Map<string, string>();
  for (const row of data ?? []) {
    if (!latest.has(row.player_id)) latest.set(row.player_id, row.log_date);
  }
  return playerIds.map((playerId) => ({ playerId, lastActivity: latest.get(playerId) ?? null }));
}

/**
 * All players linked to the given coach, with their subscription link.
 * Includes unclaimed keys (profile === null). RLS scopes this to the coach.
 */
export async function listPlayersForCoach(coachId: string): Promise<PlayerWithLink[]> {
  const { data: links, error } = await supabase
    .from('coach_player_links')
    .select('*')
    .eq('coach_id', coachId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  if (!links || links.length === 0) return [];

  const playerIds = links
    .map((l) => l.player_id)
    .filter((id): id is string => id !== null);

  let byId = new Map<string, Profile>();
  let programmedPlayerIds = new Set<string>();
  if (playerIds.length > 0) {
    const [{ data: profiles, error: pErr }, { data: programDays, error: programError }] = await Promise.all([
      supabase.from('profiles').select('*').in('id', playerIds),
      supabase.from('program_days').select('player_id').in('player_id', playerIds).eq('day_type', 'training'),
    ]);
    if (pErr) throw pErr;
    if (programError) throw programError;
    byId = new Map((profiles ?? []).map((p) => [p.id, p]));
    programmedPlayerIds = new Set((programDays ?? []).map((day) => day.player_id));
  }

  return links.map((link) => ({
    profile: link.player_id ? byId.get(link.player_id) ?? null : null,
    link,
    needsProgramming: link.player_id ? !programmedPlayerIds.has(link.player_id) : true,
  }));
}

/** A single player's profile + their link to this coach. */
export async function getPlayerForCoach(
  coachId: string,
  playerId: string
): Promise<PlayerWithLink | null> {
  const { data: link, error } = await supabase
    .from('coach_player_links')
    .select('*')
    .eq('coach_id', coachId)
    .eq('player_id', playerId)
    .maybeSingle();
  if (error) throw error;
  if (!link) return null;

  const { data: profile, error: pErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', playerId)
    .maybeSingle();
  if (pErr) throw pErr;
  return profile ? { profile, link, needsProgramming: false } : null;
}

/** Most recent exercise-log date for a player (for "last activity"). */
export async function getLastActivity(playerId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('exercise_logs')
    .select('log_date')
    .eq('player_id', playerId)
    .order('log_date', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.log_date ?? null;
}

/** The player's active subscription link, used to open plans on the current week. */
export async function getActivePlayerLink(playerId: string): Promise<CoachPlayerLink | null> {
  const { data, error } = await supabase
    .from('coach_player_links')
    .select('*')
    .eq('player_id', playerId)
    .eq('status', 'active')
    .gte('subscription_end_date', new Date().toISOString().slice(0, 10))
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

/**
 * Coach generates or renews a subscription key for one of their players.
 * Creates the coach_player_link if it doesn't exist; renews it if it does.
 * Returns the updated link row including the newly generated key.
 */
export async function coachCreatePlayerKey(
  playerId: string,
  endDate: string,
  isVip = false,
  checkupDays = 3
): Promise<CoachPlayerLink> {
  const { data, error } = await supabase.rpc('coach_create_player_key', {
    p_player_id: playerId,
    p_end_date: endDate,
    p_is_vip: isVip,
    p_checkup_days: checkupDays,
  });
  if (error) throw error;
  return data as CoachPlayerLink;
}

/**
 * Coach generates a fresh unclaimed key (no player attached).
 * A new player claims it at login with claim_subscription_key(key).
 */
export async function coachCreateUnclaimedKey(
  endDate: string,
  isVip = false,
  checkupDays = 3
): Promise<CoachPlayerLink> {
  const { data, error } = await supabase.rpc('coach_create_unclaimed_key', {
    p_end_date: endDate,
    p_is_vip: isVip,
    p_checkup_days: checkupDays,
  });
  if (error) throw error;
  return data as CoachPlayerLink;
}
