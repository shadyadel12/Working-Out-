import { supabase } from '../lib/supabase';
import type { CoachFood, DietDay, DietMeal } from '../types/database.types';

// ---- Coach food library ----

export async function listCoachFoods(coachId: string): Promise<CoachFood[]> {
  const { data, error } = await supabase
    .from('coach_foods')
    .select('*')
    .eq('coach_id', coachId)
    .order('name');
  if (error) throw error;
  return (data ?? []) as CoachFood[];
}

/** Insert a food if it doesn't exist yet (case-insensitive match kept simple via unique constraint). */
export async function addCoachFood(coachId: string, name: string): Promise<CoachFood> {
  const trimmed = name.trim();
  const { data, error } = await supabase
    .from('coach_foods')
    .upsert({ coach_id: coachId, name: trimmed }, { onConflict: 'coach_id,name' })
    .select()
    .single();
  if (error) throw error;
  return data as CoachFood;
}

export async function listDietDays(playerId: string): Promise<DietDay[]> {
  const { data, error } = await supabase
    .from('diet_days')
    .select('*')
    .eq('player_id', playerId)
    .order('week_number')
    .order('day_of_week');
  if (error) throw error;
  return (data ?? []) as DietDay[];
}

export async function upsertDietDay(day: {
  player_id: string;
  coach_id: string;
  week_number: number;
  day_of_week: number;
  meals: DietMeal[];
  comment?: string | null;
}): Promise<DietDay> {
  const { data, error } = await supabase
    .from('diet_days')
    .upsert(
      { ...day, updated_at: new Date().toISOString() },
      { onConflict: 'player_id,week_number,day_of_week' }
    )
    .select()
    .single();
  if (error) throw error;
  return data as DietDay;
}

export async function deleteDietDay(id: string): Promise<void> {
  const { error } = await supabase.from('diet_days').delete().eq('id', id);
  if (error) throw error;
}

/** Copy one diet day to the same weekday of the given target weeks (overwrites). */
export async function duplicateDietDayToWeeks(
  playerId: string,
  coachId: string,
  sourceWeek: number,
  dayOfWeek: number,
  targetWeeks: number[]
): Promise<number> {
  const { data, error } = await supabase
    .from('diet_days')
    .select('*')
    .eq('player_id', playerId)
    .eq('week_number', sourceWeek)
    .eq('day_of_week', dayOfWeek)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Nothing to duplicate — save this day first.');

  const source = data as DietDay;
  const rows = targetWeeks.map((w) => ({
    player_id: playerId,
    coach_id: coachId,
    week_number: w,
    day_of_week: dayOfWeek,
    meals: source.meals,
    updated_at: new Date().toISOString(),
  }));
  const { error: upErr } = await supabase
    .from('diet_days')
    .upsert(rows, { onConflict: 'player_id,week_number,day_of_week' });
  if (upErr) throw upErr;
  return targetWeeks.length;
}

/** Copy an entire diet week to the given target weeks (overwrites matching days). */
export async function duplicateDietWeek(
  playerId: string,
  coachId: string,
  sourceWeek: number,
  targetWeeks: number[]
): Promise<number> {
  const { data, error } = await supabase
    .from('diet_days')
    .select('*')
    .eq('player_id', playerId)
    .eq('week_number', sourceWeek);
  if (error) throw error;
  const sourceDays = (data ?? []) as DietDay[];
  if (sourceDays.length === 0) throw new Error('Week has no diet days to duplicate.');

  const rows = targetWeeks.flatMap((w) =>
    sourceDays.map((d) => ({
      player_id: playerId,
      coach_id: coachId,
      week_number: w,
      day_of_week: d.day_of_week,
      meals: d.meals,
      updated_at: new Date().toISOString(),
    }))
  );
  const { error: upErr } = await supabase
    .from('diet_days')
    .upsert(rows, { onConflict: 'player_id,week_number,day_of_week' });
  if (upErr) throw upErr;
  return targetWeeks.length;
}
