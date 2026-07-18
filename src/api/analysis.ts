import { supabase } from '../lib/supabase';
import type { ExerciseLog } from '../types/database.types';

export type ProgressRange = 'all' | 'today' | 'week' | 'month';

export interface ProgressRow extends ExerciseLog {
  exercise_name: string;
  workout_name: string;
}

export interface ProgressPage {
  rows: ProgressRow[];
  totalLogged: number;
  totalCompleted: number;
  totalExercises: number;
}

export interface ProgressOptions { workouts: string[]; exercises: string[] }

export async function getProgressOptions(playerId: string): Promise<ProgressOptions> {
  const { data, error } = await supabase.rpc('get_progress_options', { p_player_id: playerId });
  if (error) throw error;
  return data as unknown as ProgressOptions;
}

export async function getProgressPage(opts: {
  playerId: string;
  workout?: string;
  exercise?: string;
  range: ProgressRange;
  page: number;
  pageSize?: number;
}): Promise<ProgressPage> {
  const { start, end } = dateBounds(opts.range);
  const pageSize = opts.pageSize ?? 20;
  const { data, error } = await supabase.rpc('get_progress_page', {
    p_player_id: opts.playerId,
    p_workout: opts.workout || null,
    p_exercise: opts.exercise || null,
    p_start: start,
    p_end: end,
    p_limit: pageSize,
    p_offset: opts.page * pageSize,
  });
  if (error) throw error;
  const result = data as unknown as { rows?: ProgressRow[]; total_logged?: number; total_completed?: number; total_exercises?: number };
  return {
    rows: result.rows ?? [],
    totalLogged: result.total_logged ?? 0,
    totalCompleted: result.total_completed ?? 0,
    totalExercises: result.total_exercises ?? 0,
  };
}

function dateBounds(range: ProgressRange): { start: string | null; end: string | null } {
  if (range === 'all') return { start: null, end: null };
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth(), d = now.getDate();
  let start = new Date(y, m, d);
  if (range === 'week') start = new Date(y, m, d - ((now.getDay() + 1) % 7));
  if (range === 'month') start = new Date(y, m, 1);
  const iso = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return { start: iso(start), end: iso(now) };
}
