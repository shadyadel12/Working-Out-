import { supabase } from '../lib/supabase';

export interface WorkoutTemplate { id: string; coach_id: string; name: string; created_at: string }

export async function listWorkoutTemplates(coachId: string): Promise<WorkoutTemplate[]> {
  const { data, error } = await supabase.from('workout_templates').select('*').eq('coach_id', coachId).order('name');
  if (error) throw error;
  return data ?? [];
}

export async function saveWorkoutAsTemplate(workoutId: string): Promise<string> {
  const { data, error } = await supabase.rpc('save_workout_as_template', { p_workout_id: workoutId });
  if (error) throw error;
  return data;
}

export async function assignWorkoutTemplate(programDayId: string, templateId: string, position: number): Promise<string> {
  const { data, error } = await supabase.rpc('assign_workout_template', { p_program_day_id: programDayId, p_template_id: templateId, p_position: position });
  if (error) throw error;
  return data;
}
