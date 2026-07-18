import { supabase } from '../lib/supabase';

export interface LibraryExercise { id: string; coach_id: string; name: string; category: string; target_muscle_groups: string[]; movement_patterns: string[]; created_at: string; updated_at: string }
export interface LibraryExerciseInput { name: string; category: string; target_muscle_groups: string[]; movement_patterns: string[] }

const table = () => supabase.from('exercise_library' as never) as any;
export async function listLibraryExercises(coachId: string): Promise<LibraryExercise[]> { const { data, error } = await table().select('*').eq('coach_id', coachId).order('name'); if (error) throw error; return data ?? []; }
export async function createLibraryExercise(coachId: string, input: LibraryExerciseInput): Promise<LibraryExercise> { const { data, error } = await table().insert({ coach_id: coachId, ...input }).select().single(); if (error) throw error; return data; }
export async function updateLibraryExercise(id: string, input: LibraryExerciseInput): Promise<LibraryExercise> { const { data, error } = await table().update({ ...input, updated_at: new Date().toISOString() }).eq('id', id).select().single(); if (error) throw error; return data; }
export async function deleteLibraryExercise(id: string): Promise<void> { const { error } = await table().delete().eq('id', id); if (error) throw error; }
