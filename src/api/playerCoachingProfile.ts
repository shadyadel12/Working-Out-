import { supabase } from '../lib/supabase';

export interface PlayerCoachingProfile {
  coach_notes: string;
  client_goals: string;
}

export async function getPlayerCoachingProfile(coachId: string, playerId: string): Promise<PlayerCoachingProfile> {
  const { data, error } = await (supabase.from('player_coaching_profiles' as never) as any)
    .select('coach_notes,client_goals').eq('coach_id', coachId).eq('player_id', playerId).maybeSingle();
  if (error) throw error;
  return data ?? { coach_notes: '', client_goals: '' };
}

export async function savePlayerCoachingProfile(coachId: string, playerId: string, values: PlayerCoachingProfile): Promise<PlayerCoachingProfile> {
  const { data, error } = await (supabase.from('player_coaching_profiles' as never) as any).upsert({
    coach_id: coachId,
    player_id: playerId,
    coach_notes: values.coach_notes.trim(),
    client_goals: values.client_goals.trim(),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'coach_id,player_id' }).select('coach_notes,client_goals').single();
  if (error) throw error;
  return data;
}
