import { supabase } from '../lib/supabase';
import type { DietMeal } from '../types/database.types';

export interface DietTemplate { id: string; coach_id: string; name: string; meals: DietMeal[]; comment: string | null; created_at: string }
export async function listDietTemplates(coachId: string): Promise<DietTemplate[]> {
  const { data, error } = await supabase.from('diet_templates').select('*').eq('coach_id', coachId).order('name');
  if (error) throw error;
  return data ?? [];
}
export async function saveDietAsTemplate(dayId: string, name: string): Promise<string> {
  const { data, error } = await supabase.rpc('save_diet_as_template', { p_diet_day_id: dayId, p_name: name });
  if (error) throw error;
  return data;
}
export async function assignDietTemplate(playerId: string, week: number, dayOfWeek: number, templateId: string): Promise<string> {
  const { data, error } = await supabase.rpc('assign_diet_template', { p_player_id: playerId, p_week: week, p_day_of_week: dayOfWeek, p_template_id: templateId });
  if (error) throw error;
  return data;
}
export async function deleteDietTemplate(templateId: string): Promise<void> {
  const { error } = await supabase.from('diet_templates').delete().eq('id', templateId);
  if (error) throw error;
}
