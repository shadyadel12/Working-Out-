import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { getRecipeSnapshot, listPublishedRecipes, listRecipeBooks } from '../../../api/nutritionLibrary';
import type { DietFoodItem, DietRecipeSnapshot } from '../../../types/database.types';

export default function RecipePicker({coachId,onUse}:{coachId:string;onUse:(recipe:DietRecipeSnapshot,items:DietFoodItem[])=>void}) {
  const [bookId,setBookId]=useState(''); const [recipeId,setRecipeId]=useState('');
  const books=useQuery({queryKey:['recipe-books',coachId],queryFn:()=>listRecipeBooks(coachId)});
  const recipes=useQuery({queryKey:['published-recipes',coachId],queryFn:()=>listPublishedRecipes(coachId)});
  const visible=useMemo(()=>bookId?(recipes.data??[]).filter(recipe=>recipe.bookIds.includes(bookId)):(recipes.data??[]),[bookId,recipes.data]);
  const useRecipe=useMutation({mutationFn:()=>getRecipeSnapshot(recipeId),onSuccess:data=>{onUse(data.recipe,data.items);setRecipeId('')}});
  return <div className="recipe-picker"><strong>Use saved recipe</strong><p className="muted">Choosing a recipe replaces this meal’s current foods.</p><div><label>Recipe book<select value={bookId} onChange={event=>{setBookId(event.target.value);setRecipeId('')}}><option value="">All recipes</option>{(books.data??[]).map(book=><option value={book.id} key={book.id}>{book.title}</option>)}</select></label><label>Recipe<select value={recipeId} onChange={event=>setRecipeId(event.target.value)}><option value="">Choose a published recipe…</option>{visible.map(recipe=><option value={recipe.id} key={recipe.id}>{recipe.title}</option>)}</select></label><button type="button" disabled={!recipeId||useRecipe.isPending} onClick={()=>useRecipe.mutate()}>{useRecipe.isPending?'Adding…':'Use recipe'}</button></div>{(books.error||recipes.error||useRecipe.error)&&<small className="error">{((books.error||recipes.error||useRecipe.error) as Error).message}</small>}</div>;
}

