import { supabase } from '../lib/supabase';

export type CatalogLifecycle = 'draft' | 'published' | 'archived';
export type CatalogShareMode = 'private' | 'workspace';
export type LibraryKind = 'sections' | 'tasks' | 'forms' | 'meal-plans' | 'ingredients' | 'recipes' | 'recipe-books' | 'metric-groups';

export interface CoachLibraryItem {
  id: string;
  coach_id: string;
  title: string;
  summary: string | null;
  lifecycle: CatalogLifecycle;
  share_mode: CatalogShareMode;
  revision: number;
  updated_at: string;
  meta: Record<string, unknown>;
}

export interface CoachLibraryInput {
  title: string;
  summary: string;
  lifecycle: CatalogLifecycle;
  shareMode: CatalogShareMode;
  subtype?: string;
  numberValue?: number;
  unit?: string;
}

type KindConfig = { table: string; title: string; summary?: string; subtype?: string; numberValue?: string; unit?: string; hasLifecycle: boolean };
export const libraryKindConfig: Record<LibraryKind, KindConfig> = {
  sections: { table: 'workout_sections', title: 'name', summary: 'description', subtype: 'format', numberValue: 'rounds', hasLifecycle: true },
  tasks: { table: 'coaching_tasks', title: 'title', summary: 'instructions', subtype: 'task_type', hasLifecycle: true },
  forms: { table: 'coach_forms', title: 'title', summary: 'description', hasLifecycle: true },
  'meal-plans': { table: 'menu_templates', title: 'title', summary: 'description', numberValue: 'week_count', hasLifecycle: true },
  ingredients: { table: 'food_items', title: 'name', subtype: 'category', unit: 'default_unit', hasLifecycle: false },
  recipes: { table: 'dishes', title: 'title', summary: 'summary', subtype: 'category', numberValue: 'servings', hasLifecycle: true },
  'recipe-books': { table: 'dish_collections', title: 'title', summary: 'description', hasLifecycle: true },
  'metric-groups': { table: 'measurement_groups', title: 'title', summary: 'description', hasLifecycle: true },
};

const from = (table: string) => supabase.from(table as never) as any;

export async function listCoachLibraryItems(kind: LibraryKind, coachId: string, includeArchived = false): Promise<CoachLibraryItem[]> {
  const config = libraryKindConfig[kind];
  let query = from(config.table).select('*').eq('coach_id', coachId).is('deleted_at', null).order('updated_at', { ascending: false });
  if (config.hasLifecycle && !includeArchived) query = query.neq('lifecycle', 'archived');
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row: Record<string, any>) => ({
    id: row.id,
    coach_id: row.coach_id,
    title: String(row[config.title] ?? ''),
    summary: config.summary ? row[config.summary] ?? null : null,
    lifecycle: config.hasLifecycle ? row.lifecycle : 'published',
    share_mode: config.hasLifecycle ? row.share_mode : 'private',
    revision: config.hasLifecycle ? row.revision : 1,
    updated_at: row.updated_at ?? row.created_at,
    meta: row,
  }));
}

export async function saveCoachLibraryItem(kind: LibraryKind, coachId: string, id: string | null, input: CoachLibraryInput): Promise<string> {
  const config = libraryKindConfig[kind];
  const payload: Record<string, unknown> = { coach_id: coachId, [config.title]: input.title.trim(), updated_at: new Date().toISOString() };
  if (config.summary) payload[config.summary] = input.summary.trim() || null;
  if (config.subtype) payload[config.subtype] = input.subtype || null;
  if (config.numberValue) payload[config.numberValue] = input.numberValue || 1;
  if (config.unit) payload[config.unit] = input.unit || 'g';
  if (config.hasLifecycle) { payload.lifecycle = input.lifecycle; payload.share_mode = input.shareMode; }
  if (kind === 'sections') payload.format = input.subtype || 'standard';
  if (kind === 'tasks') payload.task_type = input.subtype || 'general';
  const query = id ? from(config.table).update(payload).eq('id', id) : from(config.table).insert(payload);
  const { data, error } = await query.select('id').single();
  if (error) throw error;
  return data.id;
}

export async function archiveCoachLibraryItem(kind: LibraryKind, id: string): Promise<void> {
  const { error } = await (supabase.rpc as any)('soft_delete_library_item', { p_table: libraryKindConfig[kind].table, p_id: id });
  if (error) throw error;
}

export async function publishCoachLibraryItem(kind: LibraryKind, id: string): Promise<number> {
  const config = libraryKindConfig[kind];
  if (!config.hasLifecycle) return 1;
  const { data, error } = await (supabase.rpc as any)('publish_library_item', { p_table: config.table, p_id: id });
  if (error) throw error;
  return data;
}

export async function duplicateCoachLibraryItem(kind: LibraryKind, coachId: string, item: CoachLibraryItem): Promise<string> {
  const config = libraryKindConfig[kind];
  const source = item.meta;
  const payload = { ...source, id: undefined, [config.title]: `${item.title} Copy`, coach_id: coachId, lifecycle: config.hasLifecycle ? 'draft' : undefined, revision: 1, created_at: undefined, updated_at: new Date().toISOString(), deleted_at: null };
  const { data, error } = await from(config.table).insert(payload).select('id').single();
  if (error) throw error;
  return data.id;
}

type RelationConfig = { table: string; parent: string; choiceTable?: string; choiceTitle?: string; choiceParent?: string };
const relations: Partial<Record<LibraryKind, RelationConfig>> = {
  sections: { table: 'workout_section_exercises', parent: 'section_id', choiceTable: 'exercise_library', choiceTitle: 'name', choiceParent: 'exercise_library_id' },
  forms: { table: 'form_questions', parent: 'form_id' },
  'meal-plans': { table: 'menu_entries', parent: 'menu_template_id', choiceTable: 'dishes', choiceTitle: 'title', choiceParent: 'dish_id' },
  recipes: { table: 'dish_components', parent: 'dish_id', choiceTable: 'food_items', choiceTitle: 'name', choiceParent: 'food_item_id' },
  'recipe-books': { table: 'collection_dishes', parent: 'collection_id', choiceTable: 'dishes', choiceTitle: 'title', choiceParent: 'dish_id' },
  'metric-groups': { table: 'measurement_group_items', parent: 'group_id', choiceTable: 'measurements', choiceTitle: 'name', choiceParent: 'measurement_id' },
};

export interface LibraryRelationRow { id: string; title: string; detail: string; raw: Record<string, any> }
export interface LibraryChoice { id: string; title: string }

export async function listLibraryRelations(kind: LibraryKind, parentId: string, coachId: string): Promise<{ rows: LibraryRelationRow[]; choices: LibraryChoice[] }> {
  const config = relations[kind]; if (!config) return { rows: [], choices: [] };
  const [{ data: children, error }, choicesResult] = await Promise.all([
    from(config.table).select('*').eq(config.parent, parentId).order('position'),
    config.choiceTable ? from(config.choiceTable).select(`id,${config.choiceTitle}`).eq('coach_id', coachId).is('deleted_at', null).order(config.choiceTitle!) : Promise.resolve({ data: [], error: null }),
  ]);
  if (error) throw error; if (choicesResult.error) throw choicesResult.error;
  const choices = (choicesResult.data ?? []).map((choice: Record<string, any>) => ({ id: choice.id, title: String(choice[config.choiceTitle!] ?? '') }));
  const names = new Map(choices.map((choice: LibraryChoice) => [choice.id, choice.title]));
  const rows = (children ?? []).map((row: Record<string, any>) => ({
    id: row.id ?? `${row[config.parent]}-${row[config.choiceParent ?? 'id']}`,
    title: kind === 'forms' ? row.prompt : names.get(row[config.choiceParent!]) ?? row.meal_name ?? 'Library item',
    detail: relationDetail(kind, row), raw: row,
  }));
  return { rows, choices };
}

function relationDetail(kind: LibraryKind, row: Record<string, any>) {
  if (kind === 'sections') return `${row.sets ?? '—'} sets · ${row.reps ?? (row.seconds ? `${row.seconds}s` : 'open target')} · ${row.rest_seconds ?? 0}s rest`;
  if (kind === 'forms') return `${String(row.question_type).replaceAll('_', ' ')}${row.required ? ' · required' : ''}`;
  if (kind === 'meal-plans') return `Week ${row.week_number}, day ${row.day_number} · ${row.meal_name}`;
  if (kind === 'recipes') return `${row.quantity} ${row.unit}`;
  return `Position ${Number(row.position) + 1}`;
}

export async function addLibraryRelation(kind: LibraryKind, parentId: string, input: { choiceId?: string; label?: string; subtype?: string; amount?: number; secondaryAmount?: number; unit?: string; required?: boolean }): Promise<void> {
  const config = relations[kind]; if (!config) return;
  const position = Math.floor(Date.now() / 10) % 2_000_000_000; const payload: Record<string, unknown> = { [config.parent]: parentId, position };
  if (config.choiceParent) payload[config.choiceParent] = input.choiceId;
  if (kind === 'sections') Object.assign(payload, { sets: input.amount || null, reps: input.label || null, rest_seconds: input.secondaryAmount ?? 0 });
  if (kind === 'forms') Object.assign(payload, { prompt: input.label, question_type: input.subtype || 'short_text', required: input.required ?? false, options: [] });
  if (kind === 'meal-plans') Object.assign(payload, { week_number: input.amount || 1, day_number: input.secondaryAmount || 1, meal_name: input.label || 'Meal' });
  if (kind === 'recipes') Object.assign(payload, { quantity: input.amount || 1, unit: input.unit || 'g' });
  const { error } = await from(config.table).insert(payload); if (error) throw error;
}

export async function removeLibraryRelation(kind: LibraryKind, row: LibraryRelationRow): Promise<void> {
  const config = relations[kind]; if (!config) return;
  let query = from(config.table).delete();
  if (row.raw.id) query = query.eq('id', row.raw.id);
  else { query = query.eq(config.parent, row.raw[config.parent]); if (config.choiceParent) query = query.eq(config.choiceParent, row.raw[config.choiceParent]); }
  const { error } = await query; if (error) throw error;
}

export async function createMeasurementForGroup(coachId: string, groupId: string, name: string, unit: string): Promise<void> {
  const { data, error } = await from('measurements').insert({ coach_id: coachId, name: name.trim(), unit: unit.trim(), value_type: 'number' }).select('id').single();
  if (error) throw error;
  const position = Math.floor(Date.now() / 10) % 2_000_000_000;
  const { error: linkError } = await from('measurement_group_items').insert({ group_id: groupId, measurement_id: data.id, position });
  if (linkError) throw linkError;
}
