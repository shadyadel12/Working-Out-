import { supabase } from '../lib/supabase';
import type { Exercise } from '../types/database.types';

/** Exercises for a workout, ordered by position. */
export async function listExercises(workoutId: string): Promise<Exercise[]> {
  const { data, error } = await (supabase
    .from('exercises') as any)
    .select('*, workout_template_exercises(*)')
    .eq('workout_id', workoutId)
    .order('position', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row: any) => {
    const template = row.workout_template_exercises;
    return {
      ...row,
      name: row.is_template_override ? row.name : (row.name ?? template?.name ?? 'Exercise'),
      target_sets: row.is_template_override ? row.target_sets : (row.target_sets ?? template?.target_sets ?? null),
      target_reps: row.is_template_override ? row.target_reps : (row.target_reps ?? template?.target_reps ?? null),
      target_weight: row.is_template_override ? row.target_weight : (row.target_weight ?? template?.target_weight ?? null),
      coach_video_url: row.is_template_override ? row.coach_video_url : (row.coach_video_url ?? template?.coach_video_url ?? null),
      coach_video_is_external: row.is_template_override ? row.coach_video_is_external : (template?.coach_video_is_external ?? false),
      coach_comment: row.is_template_override ? row.coach_comment : (row.coach_comment ?? template?.coach_comment ?? null),
    };
  }) as Exercise[];
}

export interface ExerciseInput {
  workout_id: string;
  position?: number;
  name: string;
  target_sets: number | null;
  target_reps: string | null;
  target_weight: string | null;
  coach_video_url: string | null;
  coach_video_is_external: boolean;
  coach_comment: string | null;
}

export async function createExercise(input: ExerciseInput): Promise<Exercise> {
  const { data, error } = await supabase.from('exercises').insert(input).select().single();
  if (error) throw error;
  return data;
}

/** Insert several exercises at once (used when saving a brand-new workout). */
export async function createExercises(inputs: ExerciseInput[]): Promise<Exercise[]> {
  if (inputs.length === 0) return [];
  const { data, error } = await supabase.from('exercises').insert(inputs).select();
  if (error) throw error;
  return data ?? [];
}

export async function updateExercise(
  id: string,
  patch: Partial<ExerciseInput>
): Promise<Exercise> {
  const { data, error } = await supabase
    .from('exercises')
    .update({ ...patch, is_template_override: true })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteExercise(id: string): Promise<void> {
  const { error } = await supabase.from('exercises').delete().eq('id', id);
  if (error) throw error;
}
