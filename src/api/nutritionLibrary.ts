import { supabase } from '../lib/supabase';
import type { DietFoodItem, DietRecipeSnapshot } from '../types/database.types';

export interface MealPlanOption { id:string; title:string; description:string|null; weekCount:number }
export interface RecipeBookOption { id:string; title:string }
export interface RecipeOption { id:string; title:string; summary:string|null; servings:number; instructions:string|null; bookIds:string[] }

const from=(table:string)=>supabase.from(table as never) as any;

export async function listPublishedMealPlans(coachId:string):Promise<MealPlanOption[]> {
  const {data,error}=await from('menu_templates').select('id,title,description,week_count').eq('coach_id',coachId).eq('lifecycle','published').is('deleted_at',null).order('title');
  if(error) throw error;
  return (data??[]).map((row:any)=>({id:row.id,title:row.title,description:row.description,weekCount:row.week_count}));
}

export async function applyMealPlan(playerId:string,menuTemplateId:string,startWeek:number):Promise<number> {
  const {data,error}=await (supabase.rpc as any)('apply_menu_template_to_player',{p_player_id:playerId,p_menu_template_id:menuTemplateId,p_start_week:startWeek});
  if(error) throw error;
  return data;
}

export async function listRecipeBooks(coachId:string):Promise<RecipeBookOption[]> {
  const {data,error}=await from('dish_collections').select('id,title').eq('coach_id',coachId).eq('lifecycle','published').is('deleted_at',null).order('title');
  if(error) throw error; return data??[];
}

export async function listPublishedRecipes(coachId:string):Promise<RecipeOption[]> {
  const [{data:recipes,error},{data:links,error:linkError}]=await Promise.all([
    from('dishes').select('id,title,summary,servings,instructions').eq('coach_id',coachId).eq('lifecycle','published').is('deleted_at',null).order('title'),
    from('collection_dishes').select('collection_id,dish_id'),
  ]);
  if(error) throw error; if(linkError) throw linkError;
  return (recipes??[]).map((row:any)=>({...row,bookIds:(links??[]).filter((link:any)=>link.dish_id===row.id).map((link:any)=>link.collection_id)}));
}

export async function getRecipeSnapshot(recipeId:string):Promise<{recipe:DietRecipeSnapshot;items:DietFoodItem[]}> {
  const [{data:recipe,error},{data:components,error:componentError}]=await Promise.all([
    from('dishes').select('id,title,servings,instructions').eq('id',recipeId).single(),
    from('dish_components').select('quantity,unit,position,food_items(name)').eq('dish_id',recipeId).order('position'),
  ]);
  if(error) throw error; if(componentError) throw componentError;
  const ingredients=(components??[]).map((row:any)=>({food:row.food_items?.name??'Ingredient',quantity:String(row.quantity),unit:row.unit}));
  return {recipe:{id:recipe.id,title:recipe.title,servings:Number(recipe.servings),instructions:recipe.instructions,ingredients},items:ingredients.map((item:any)=>{
    const grams=['g','gram','grams'].includes(item.unit.toLowerCase());
    return {food:item.food,grams:grams?item.quantity:'',unit:grams?'grams':'quantity',quantity:grams?'':item.quantity,quantityUnit:grams?undefined:item.unit};
  })};
}

