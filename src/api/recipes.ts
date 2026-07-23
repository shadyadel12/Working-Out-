import { supabase } from "../lib/supabase";
import type { CatalogLifecycle } from "./coachLibrary";

export interface RecipeStep {
  text: string;
  imageUrl: string;
}
export interface RecipeIngredient {
  id?: string;
  foodItemId: string;
  name: string;
  quantity: number;
  unit: string;
}
export interface Recipe {
  id: string;
  title: string;
  summary: string | null;
  cover_url: string | null;
  servings: number;
  categories: string[];
  prep_minutes: number | null;
  cook_minutes: number | null;
  dietary_labels: string[];
  instruction_video_url: string | null;
  preparation_steps: RecipeStep[];
  cooking_steps: RecipeStep[];
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  saturated_fat_g: number | null;
  sugar_g: number | null;
  fiber_g: number | null;
  lifecycle: CatalogLifecycle;
  visibility?: "private" | "public";
  updated_at: string;
}
export type RecipeInput = Omit<Recipe, "id" | "updated_at"> & {
  ingredients: RecipeIngredient[];
};

const table = (name: string) => supabase.from(name as never) as any;
export async function listRecipes(coachId: string): Promise<Recipe[]> {
  const { data, error } = await table("dishes")
    .select("*")
    .eq("coach_id", coachId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
export async function getRecipe(
  id: string,
): Promise<Recipe & { ingredients: RecipeIngredient[] }> {
  const [{ data, error }, { data: components, error: componentError }] =
    await Promise.all([
      table("dishes").select("*").eq("id", id).single(),
      table("dish_components")
        .select("*,food_items(name)")
        .eq("dish_id", id)
        .order("position"),
    ]);
  if (error) throw error;
  if (componentError) throw componentError;
  return {
    ...data,
    ingredients: (components ?? []).map((row: any) => ({
      id: row.id,
      foodItemId: row.food_item_id,
      name: row.food_items?.name ?? "Ingredient",
      quantity: Number(row.quantity),
      unit: row.unit,
    })),
  };
}
export async function saveRecipe(
  coachId: string,
  id: string | null,
  input: RecipeInput,
): Promise<string> {
  const { ingredients, ...recipe } = input;
  const payload = {
    ...recipe,
    coach_id: coachId,
    category: recipe.categories[0] ?? null,
    instructions: [...recipe.preparation_steps, ...recipe.cooking_steps]
      .map((step) => step.text)
      .filter(Boolean)
      .join("\n"),
    updated_at: new Date().toISOString(),
  };
  const query = id
    ? table("dishes").update(payload).eq("id", id)
    : table("dishes").insert(payload);
  const { data, error } = await query.select("id").single();
  if (error) throw error;
  const recipeId = data.id as string;
  const { error: removeError } = await table("dish_components")
    .delete()
    .eq("dish_id", recipeId);
  if (removeError) throw removeError;
  if (ingredients.length) {
    const rows = ingredients.map((item, position) => ({
      dish_id: recipeId,
      food_item_id: item.foodItemId,
      quantity: item.quantity,
      unit: item.unit,
      position,
    }));
    const { error: ingredientError } =
      await table("dish_components").insert(rows);
    if (ingredientError) throw ingredientError;
  }
  return recipeId;
}
export async function archiveRecipe(id: string): Promise<void> {
  const { error } = await (supabase.rpc as any)("soft_delete_library_item", {
    p_table: "dishes",
    p_id: id,
  });
  if (error) throw error;
}
