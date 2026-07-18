import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';
import { sanitizeSpreadsheetCell, validateSpreadsheetArchive } from '../lib/security';
import type { CoachFood, DietDay, DietMeal } from '../types/database.types';

const DAY_TO_DOW: Record<string, number> = {
  sun: 0, sunday: 0,
  mon: 1, monday: 1,
  tue: 2, tuesday: 2,
  wed: 3, wednesday: 3,
  thu: 4, thursday: 4,
  fri: 5, friday: 5,
  sat: 6, saturday: 6,
};

// ---- Coach food library ----

export async function listCoachFoods(coachId: string): Promise<CoachFood[]> {
  const { data, error } = await supabase
    .from('coach_foods')
    .select('*')
    .eq('coach_id', coachId)
    .order('name');
  if (error) throw error;
  return (data ?? []) as CoachFood[];
}

/** Insert a food if it doesn't exist yet (case-insensitive match kept simple via unique constraint). */
export async function addCoachFood(coachId: string, name: string): Promise<CoachFood> {
  const trimmed = name.trim();
  const { data, error } = await supabase
    .from('coach_foods')
    .upsert({ coach_id: coachId, name: trimmed }, { onConflict: 'coach_id,name' })
    .select()
    .single();
  if (error) throw error;
  return data as CoachFood;
}

export async function listDietDays(playerId: string): Promise<DietDay[]> {
  const { data, error } = await supabase
    .from('diet_days')
    .select('*')
    .eq('player_id', playerId)
    .order('week_number')
    .order('day_of_week');
  if (error) throw error;
  return (data ?? []) as DietDay[];
}

export async function upsertDietDay(day: {
  player_id: string;
  coach_id: string;
  week_number: number;
  day_of_week: number;
  meals: DietMeal[];
  comment?: string | null;
}): Promise<DietDay> {
  const { data, error } = await supabase
    .from('diet_days')
    .upsert(
      { ...day, updated_at: new Date().toISOString() },
      { onConflict: 'player_id,week_number,day_of_week' }
    )
    .select()
    .single();
  if (error) throw error;
  return data as DietDay;
}

export async function deleteDietDay(id: string): Promise<void> {
  const { error } = await supabase.from('diet_days').delete().eq('id', id);
  if (error) throw error;
}

/** Copy one diet day to the same weekday of the given target weeks (overwrites). */
export async function duplicateDietDayToWeeks(
  playerId: string,
  coachId: string,
  sourceWeek: number,
  dayOfWeek: number,
  targetWeeks: number[]
): Promise<number> {
  const { data, error } = await supabase
    .from('diet_days')
    .select('*')
    .eq('player_id', playerId)
    .eq('week_number', sourceWeek)
    .eq('day_of_week', dayOfWeek)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Nothing to duplicate — save this day first.');

  const source = data as DietDay;
  const rows = targetWeeks.map((w) => ({
    player_id: playerId,
    coach_id: coachId,
    week_number: w,
    day_of_week: dayOfWeek,
    meals: source.meals,
    updated_at: new Date().toISOString(),
  }));
  const { error: upErr } = await supabase
    .from('diet_days')
    .upsert(rows, { onConflict: 'player_id,week_number,day_of_week' });
  if (upErr) throw upErr;
  return targetWeeks.length;
}

/** Copy an entire diet week to the given target weeks (overwrites matching days). */
export async function duplicateDietWeek(
  playerId: string,
  coachId: string,
  sourceWeek: number,
  targetWeeks: number[]
): Promise<number> {
  const { data, error } = await supabase
    .from('diet_days')
    .select('*')
    .eq('player_id', playerId)
    .eq('week_number', sourceWeek);
  if (error) throw error;
  const sourceDays = (data ?? []) as DietDay[];
  if (sourceDays.length === 0) throw new Error('Week has no diet days to duplicate.');

  const rows = targetWeeks.flatMap((w) =>
    sourceDays.map((d) => ({
      player_id: playerId,
      coach_id: coachId,
      week_number: w,
      day_of_week: d.day_of_week,
      meals: d.meals,
      updated_at: new Date().toISOString(),
    }))
  );
  const { error: upErr } = await supabase
    .from('diet_days')
    .upsert(rows, { onConflict: 'player_id,week_number,day_of_week' });
  if (upErr) throw upErr;
  return targetWeeks.length;
}

/** Download an Excel template for importing a complete diet plan. */
export function generateDietXlsxTemplate(): void {
  const headers = ['week', 'day', 'meal_type', 'meal_label', 'food', 'grams', 'coach_comment'];
  const examples = [
    [1, 'Sat', 'meal', 'Meal 1', 'Eggs', 150, 'Drink plenty of water'],
    [1, 'Sat', 'meal', 'Meal 1', 'Whole-grain bread', 80, ''],
    [1, 'Sat', 'snack', 'Snack 1', 'Banana', 120, ''],
    [1, 'Sun', 'meal', 'Meal 1', 'Chicken breast', 200, ''],
  ];
  const safeExamples = examples.map((row) => row.map(sanitizeSpreadsheetCell));
  const ws = XLSX.utils.aoa_to_sheet([headers, ...safeExamples]);
  ws['!cols'] = [
    { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 18 },
    { wch: 26 }, { wch: 12 }, { wch: 32 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Diet');
  XLSX.writeFile(wb, 'diet-template.xlsx');
}

/**
 * Import a complete diet workbook. The sheet is fully validated before the
 * player's existing diet is replaced.
 */
export async function importDietFromXlsx(
  file: File,
  playerId: string,
  coachId: string,
): Promise<{ daysCreated: number; mealsCreated: number; foodsCreated: number }> {
  if (file.size > 2 * 1024 * 1024) throw new Error('Excel file must be smaller than 2 MB.');
  const buffer = await file.arrayBuffer();
  validateSpreadsheetArchive(buffer);
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!firstSheet) throw new Error('The Excel file has no worksheet.');

  const raw = XLSX.utils.sheet_to_json<Record<string, string | number>>(firstSheet, { defval: '' });
  const rows = raw.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([key, value]) => [key.trim().toLowerCase(), String(value ?? '').trim()])
    )
  ) as Record<string, string>[];
  if (rows.length === 0) throw new Error('The Excel file has no data rows.');
  if (rows.length > 5000) throw new Error('The Excel file cannot contain more than 5,000 rows.');

  type ParsedDay = {
    week: number;
    dow: number;
    comment: string | null;
    meals: Map<string, DietMeal>;
  };
  const days = new Map<string, ParsedDay>();

  for (const [index, row] of rows.entries()) {
    const line = index + 2;
    const week = Number.parseInt(row.week, 10);
    if (!week || week < 1) throw new Error(`Row ${line}: invalid week "${row.week}".`);

    const dayKey = row.day.toLowerCase();
    if (!(dayKey in DAY_TO_DOW)) {
      throw new Error(`Row ${line}: invalid day "${row.day}" (use Sat, Sun, Mon...).`);
    }

    const mealType = row.meal_type.toLowerCase();
    if (mealType !== 'meal' && mealType !== 'snack') {
      throw new Error(`Row ${line}: meal_type must be "meal" or "snack".`);
    }
    if (!row.meal_label) throw new Error(`Row ${line}: meal_label is required.`);
    if (!row.food) throw new Error(`Row ${line}: food is required.`);

    const dow = DAY_TO_DOW[dayKey];
    const dietDayKey = `${week}|${dow}`;
    let day = days.get(dietDayKey);
    if (!day) {
      day = { week, dow, comment: row.coach_comment || null, meals: new Map() };
      days.set(dietDayKey, day);
    } else if (row.coach_comment && !day.comment) {
      day.comment = row.coach_comment;
    }

    const mealKey = `${mealType}|${row.meal_label.toLowerCase()}`;
    let meal = day.meals.get(mealKey);
    if (!meal) {
      meal = { type: mealType, label: row.meal_label, content: '', items: [] };
      day.meals.set(mealKey, meal);
    }
    meal.items!.push({ food: row.food, grams: row.grams });
  }

  const dietRows = [...days.values()].map((day) => ({
    week: day.week,
    dow: day.dow,
    meals: [...day.meals.values()],
    comment: day.comment,
  }));

  const foodNames = new Map<string, string>();
  for (const row of rows) foodNames.set(row.food.toLowerCase(), row.food);
  const { data, error } = await supabase.rpc('replace_diet_import', {
    p_player_id: playerId,
    p_days: dietRows,
    p_foods: [...foodNames.values()],
  });
  if (error) throw error;
  void coachId;
  return data;
}
