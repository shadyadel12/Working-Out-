/** Builds interleaved meal and snack slots for a diet day. */
import type { DietMeal } from '../../../types/database.types';

export function buildSlots(meals: number, snacks: number): DietMeal[] {
  const slots: DietMeal[] = [];
  let snackIdx = 0;
  for (let m = 1; m <= meals; m++) {
    slots.push({ type: 'meal', label: `Meal ${m}`, content: '', items: [] });
    const snacksSoFar = Math.round((m / Math.max(1, meals)) * snacks);
    while (snackIdx < snacksSoFar && snackIdx < snacks && m < meals) {
      snackIdx++;
      slots.push({ type: 'snack', label: `Snack ${snackIdx}`, content: '', items: [] });
    }
  }
  while (snackIdx < snacks) {
    snackIdx++;
    slots.push({ type: 'snack', label: `Snack ${snackIdx}`, content: '', items: [] });
  }
  return slots;
}
