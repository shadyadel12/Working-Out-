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
export async function saveDietTemplate(input: { id?: string; coachId: string; name: string; meals: DietMeal[]; comment: string | null }): Promise<DietTemplate> {
  const payload = { coach_id: input.coachId, name: input.name.trim(), meals: input.meals, comment: input.comment?.trim() || null };
  const query = input.id ? supabase.from('diet_templates').update(payload).eq('id', input.id).eq('coach_id', input.coachId) : supabase.from('diet_templates').insert(payload);
  const { data, error } = await query.select().single();
  if (error) throw error;
  return data as DietTemplate;
}
export async function duplicateDietTemplate(template: DietTemplate): Promise<DietTemplate> {
  let name = `${template.name} copy`;
  const existing = await listDietTemplates(template.coach_id);
  let number = 2;
  while (existing.some((item) => item.name.toLowerCase() === name.toLowerCase())) name = `${template.name} copy ${number++}`;
  return saveDietTemplate({ coachId: template.coach_id, name, meals: template.meals, comment: template.comment });
}
