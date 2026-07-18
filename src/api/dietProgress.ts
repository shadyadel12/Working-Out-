import { supabase } from '../lib/supabase';
import type { DietDay, DietLog } from '../types/database.types';

export async function listDietLogs(playerId: string): Promise<DietLog[]> {
  const { data, error } = await supabase.from('diet_logs').select('*').eq('player_id', playerId).order('log_date', { ascending: true });
  if (error) throw error;
  return (data ?? []) as DietLog[];
}

export async function saveDietLog(day: DietDay, completedMeals: number, comment: string): Promise<DietLog> {
  const { data, error } = await supabase.from('diet_logs').upsert({
    diet_day_id: day.id,
    player_id: day.player_id,
    coach_id: day.coach_id,
    log_date: new Date().toISOString().slice(0, 10),
    completed_meals: completedMeals,
    total_meals: day.meals.length,
    player_comment: comment.trim() || null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'player_id,log_date' }).select().single();
  if (error) throw error;
  return data as DietLog;
}
