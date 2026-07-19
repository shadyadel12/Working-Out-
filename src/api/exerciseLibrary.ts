import { supabase } from '../lib/supabase';

export interface LibraryExercise {
  id: string; coach_id: string; name: string; equipment: string | null; category: string;
  instructions: string | null; target_muscle_groups: string[]; default_note: string | null;
  movement_patterns: string[]; tracking_fields: string[]; video_url: string | null;
  created_at: string; updated_at: string;
}
export type LibraryExerciseInput = Omit<LibraryExercise, 'id' | 'coach_id' | 'created_at' | 'updated_at'>;
const table = () => supabase.from('exercise_library' as never) as any;
export async function listLibraryExercises(coachId: string): Promise<LibraryExercise[]> { const { data, error } = await table().select('*').eq('coach_id', coachId).is('deleted_at', null).order('name'); if (error) throw error; return data ?? []; }
export async function createLibraryExercise(coachId: string, input: LibraryExerciseInput): Promise<LibraryExercise> { const { data, error } = await table().insert({ coach_id: coachId, ...input }).select().single(); if (error) throw error; return data; }
export async function updateLibraryExercise(id: string, input: LibraryExerciseInput): Promise<LibraryExercise> { const { data, error } = await table().update({ ...input, updated_at: new Date().toISOString() }).eq('id', id).select().single(); if (error) throw error; return data; }
export async function deleteLibraryExercise(id: string): Promise<void> { const { error } = await (supabase.rpc as any)('soft_delete_library_item', { p_table: 'exercise_library', p_id: id }); if (error) throw error; }
