import { supabase } from '../lib/supabase';
import type { CoachPlayerLink } from '../types/database.types';

export interface SubscriptionInfo {
  link: CoachPlayerLink | null;
  active: boolean; // status='active' AND end_date >= today
}

/** Sign in with email + password. Throws on failure. */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

/** Create an auth account (defaults to role 'player' via DB trigger). */
export async function signUp(email: string, password: string, name: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  if (error) throw error;
  return data;
}

/**
 * Create an account and guarantee that the caller is authenticated before it
 * attempts an invitation/key claim. Hosted Auth projects may require email
 * confirmation, in which case signUp intentionally returns no session.
 */
export async function signUpAndEnsureSession(email: string, password: string, name: string) {
  const signUpData = await signUp(email, password, name);
  if (signUpData.session) return signUpData;

  // Do not hide this error: it explains an email-confirmation/configuration
  // problem and prevents the following key claim from running anonymously.
  return signIn(email, password);
}

/** Supabase PostgREST failures are plain objects rather than Error instances. */
export function getErrorMessage(error: unknown, fallback = 'Signup failed.'): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallback;
}

/** Promote the current user to coach by consuming a single-use coach key (RPC). */
export async function claimCoachKey(coachKey: string) {
  const { error } = await supabase.rpc('claim_coach_key', { p_key: coachKey });
  if (error) throw error;
}

/** Pre-check (callable before signup): is this coach key valid & unclaimed? */
export async function checkCoachKey(coachKey: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('check_coach_key', { p_key: coachKey });
  if (error) throw error;
  return data === true;
}

/** Pre-check (callable before signup): is this subscription key valid & unclaimed? */
export async function checkSubscriptionKey(key: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('check_subscription_key', { p_key: key });
  if (error) throw error;
  return data === true;
}

/** Claim a pre-issued subscription key for the current player (RPC). */
export async function claimSubscriptionKey(key: string): Promise<CoachPlayerLink> {
  const { data, error } = await supabase.rpc('claim_subscription_key', { p_key: key });
  if (error) throw error;
  return data as CoachPlayerLink;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/** Current session (fast, local). */
export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/**
 * Validate a player's subscription key against coach_player_links.
 * Returns the link + whether it's currently active. A missing key => throws.
 * Note: after login the player can read only their own link rows (RLS), so this
 * query is scoped to the authenticated player automatically.
 */
export async function validateSubscriptionKey(
  playerId: string,
  subscriptionKey: string
): Promise<SubscriptionInfo> {
  const { data, error } = await supabase
    .from('coach_player_links')
    .select('*')
    .eq('player_id', playerId)
    .eq('subscription_key', subscriptionKey.trim())
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error('Invalid subscription key for this account.');
  }

  return { link: data, active: isSubscriptionActive(data) };
}

/** Load a player's subscription without requiring the key (used after login). */
export async function getMySubscription(playerId: string): Promise<SubscriptionInfo> {
  const { data, error } = await supabase
    .from('coach_player_links')
    .select('*')
    .eq('player_id', playerId)
    .order('subscription_end_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return { link: data ?? null, active: data ? isSubscriptionActive(data) : false };
}

export function isSubscriptionActive(link: CoachPlayerLink): boolean {
  if (link.status !== 'active') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(link.subscription_end_date + 'T00:00:00');
  return end >= today;
}
