import { supabase } from '../lib/supabase';
import type { ExerciseLog } from '../types/database.types';

/** Logs for a player, optionally filtered to a set of exercises. */
export async function listLogsForPlayer(
  playerId: string,
  exerciseIds?: string[]
): Promise<ExerciseLog[]> {
  let q = supabase.from('exercise_logs').select('*').eq('player_id', playerId);
  if (exerciseIds && exerciseIds.length > 0) {
    q = q.in('exercise_id', exerciseIds);
  }
  const { data, error } = await q.order('log_date', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** The log for a specific exercise on a specific date, if any. */
export async function getLog(
  exerciseId: string,
  playerId: string,
  logDate: string
): Promise<ExerciseLog | null> {
  const { data, error } = await supabase
    .from('exercise_logs')
    .select('*')
    .eq('exercise_id', exerciseId)
    .eq('player_id', playerId)
    .eq('log_date', logDate)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

export interface UpsertLogInput {
  exercise_id: string;
  player_id: string;
  log_date: string;
  actual_sets: number | null;
  actual_reps: string | null;
  actual_weight: string | null;
  player_video_url: string | null;
  player_video_is_external: boolean;
  player_comment: string | null;
  is_completed: boolean;
}

/** Create/update a player's log for an exercise+date. */
export async function upsertLog(input: UpsertLogInput): Promise<ExerciseLog> {
  const { data, error } = await supabase
    .from('exercise_logs')
    .upsert(input, { onConflict: 'exercise_id,player_id,log_date' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function markPlayerVideoViewed(logId: string): Promise<string> {
  const { data, error } = await supabase.rpc('mark_player_video_viewed', { p_log_id: logId });
  if (error) throw error;
  return data as string;
}

export interface WorkoutCompletion {
  completed: boolean;
  completedExercises: number;
  totalExercises: number;
  logDate: string | null;
}

/** Completion is permanent for this scheduled workout once every exercise has a completed log. */
export async function getWorkoutCompletion(workoutId: string, playerId: string): Promise<WorkoutCompletion> {
  const { data: exercises, error: exerciseError } = await supabase
    .from('exercises')
    .select('id')
    .eq('workout_id', workoutId);
  if (exerciseError) throw exerciseError;
  const ids = (exercises ?? []).map((exercise) => exercise.id);
  if (ids.length === 0) return { completed: false, completedExercises: 0, totalExercises: 0, logDate: null };
  const { data: logs, error: logError } = await supabase
    .from('exercise_logs')
    .select('exercise_id,log_date')
    .eq('player_id', playerId)
    .eq('is_completed', true)
    .in('exercise_id', ids);
  if (logError) throw logError;
  const byDate = new Map<string, Set<string>>();
  for (const log of logs ?? []) {
    const set = byDate.get(log.log_date) ?? new Set<string>();
    set.add(log.exercise_id);
    byDate.set(log.log_date, set);
  }
  const completedDate = [...byDate.entries()]
    .filter(([, set]) => set.size === ids.length)
    .map(([date]) => date)
    .sort()
    .at(-1) ?? null;
  const latestCount = Math.max(0, ...[...byDate.values()].map((set) => set.size));
  return { completed: completedDate !== null, completedExercises: completedDate ? ids.length : latestCount, totalExercises: ids.length, logDate: completedDate };
}

/** Confirm every exercise in a scheduled workout without overwriting entered sets or notes. */
export async function confirmWorkout(workoutId: string, playerId: string, logDate: string): Promise<void> {
  const { data: exercises, error: exerciseError } = await supabase
    .from('exercises')
    .select('id')
    .eq('workout_id', workoutId);
  if (exerciseError) throw exerciseError;
  if (!exercises?.length) throw new Error('This workout has no exercises to complete.');
  const { error } = await supabase.from('exercise_logs').upsert(
    exercises.map((exercise) => ({
      exercise_id: exercise.id,
      player_id: playerId,
      log_date: logDate,
      is_completed: true,
    })),
    { onConflict: 'exercise_id,player_id,log_date' },
  );
  if (error) throw error;
}
