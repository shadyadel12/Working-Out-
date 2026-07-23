import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { getRecipeSnapshot, listPublishedRecipes } from '../../../api/nutritionLibrary';
import type { DietFoodItem, DietRecipeSnapshot } from '../../../types/database.types';

export default function RecipePicker({ coachId, onUse }: { coachId: string; onUse: (recipe: DietRecipeSnapshot, items: DietFoodItem[]) => void }) {
  const [recipeId, setRecipeId] = useState('');
  const recipes = useQuery({ queryKey: ['published-recipes', coachId], queryFn: () => listPublishedRecipes(coachId) });
  const addRecipe = useMutation({ mutationFn: () => getRecipeSnapshot(recipeId), onSuccess: (data) => { onUse(data.recipe, data.items); setRecipeId(''); } });
  return <div className="recipe-picker"><strong>Add saved recipe</strong><p className="muted">Recipes are added together and keep foods already entered in this meal.</p><div><label>Recipe<select value={recipeId} onChange={(event) => setRecipeId(event.target.value)}><option value="">Choose a published recipe…</option>{(recipes.data ?? []).map((recipe) => <option value={recipe.id} key={recipe.id}>{recipe.title}</option>)}</select></label><button type="button" disabled={!recipeId || addRecipe.isPending} onClick={() => addRecipe.mutate()}>{addRecipe.isPending ? 'Adding…' : 'Add recipe'}</button></div>{(recipes.error || addRecipe.error) && <small className="error">{((recipes.error || addRecipe.error) as Error).message}</small>}</div>;
}
