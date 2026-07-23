import { supabase } from '../lib/supabase';
import { listCoachLibraryItems, type CoachLibraryItem, type LibraryKind } from './coachLibrary';

export type AssignmentType = 'task' | 'form' | 'metric_group' | 'meal_plan' | 'recipe_book';

export interface PlayerAssignment {
  id: string;
  coach_id: string;
  player_id: string;
  item_type: AssignmentType;
  item_id: string;
  scheduled_for: string;
  status: 'scheduled' | 'active' | 'complete' | 'cancelled';
  completed_at: string | null;
  snapshot: { title?: string; summary?: string | null; task_type?: string; add_uploads_to_progress_photos?: boolean };
  created_at: string;
}

const kindByType: Record<AssignmentType, LibraryKind> = {
  task: 'tasks', form: 'forms', metric_group: 'metric-groups', meal_plan: 'meal-plans', recipe_book: 'recipe-books',
};

const table = () => supabase.from('scheduled_coaching_items' as never) as any;

export async function listAssignableItems(type: AssignmentType, coachId: string): Promise<CoachLibraryItem[]> {
  return (await listCoachLibraryItems(kindByType[type], coachId)).filter((item) => item.lifecycle === 'published');
}

export async function listPlayerAssignments(playerId: string): Promise<PlayerAssignment[]> {
  const { data, error } = await table().select('*').eq('player_id', playerId).neq('status', 'cancelled').order('scheduled_for');
  if (error) throw error;
  return data ?? [];
}

export async function assignLibraryItem(coachId: string, playerId: string, type: AssignmentType, item: CoachLibraryItem, scheduledFor: string): Promise<string> {
  const { data, error } = await table().insert({
    coach_id: coachId, player_id: playerId, item_type: type, item_id: item.id,
    scheduled_for: new Date(`${scheduledFor}T12:00:00`).toISOString(),
    status: 'scheduled', snapshot: { title: item.title, summary: item.summary, task_type: item.meta.task_type, add_uploads_to_progress_photos: Boolean(item.meta.add_uploads_to_progress_photos) },
  }).select('id').single();
  if (error) throw error;
  return data.id;
}

export async function cancelPlayerAssignment(id: string): Promise<void> {
  const { error } = await table().update({ status: 'cancelled' }).eq('id', id);
  if (error) throw error;
}

export async function completePlayerAssignment(id: string): Promise<void> {
  const { error } = await (supabase.rpc as any)('complete_coaching_assignment', { p_assignment_id: id });
  if (error) throw error;
}
