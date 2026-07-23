import { supabase } from '../lib/supabase';
import type { DietFoodItem, DietRecipeSnapshot } from '../types/database.types';

export interface MealPlanOption { id:string; title:string; description:string|null; weekCount:number }
export interface PlayerMealPlanAssignment { id:string;title:string;description:string|null;coverUrl:string|null;startWeek:number;endWeek:number;assignedAt:string;status:string }
export interface RecipeOption { id:string; title:string; summary:string|null; servings:number; instructions:string|null }

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
export async function getActiveMealPlanAssignment(playerId:string):Promise<PlayerMealPlanAssignment|null>{
  const{data,error}=await from('player_meal_plan_assignments').select('id,start_week,end_week,assigned_at,status,menu_templates(title,description,cover_url)').eq('player_id',playerId).eq('status','active').order('assigned_at',{ascending:false}).limit(1).maybeSingle();if(error)throw error;if(!data)return null;const plan=data.menu_templates as any;return{id:data.id,title:plan?.title??'Meal plan',description:plan?.description??null,coverUrl:plan?.cover_url??null,startWeek:data.start_week,endWeek:data.end_week,assignedAt:data.assigned_at,status:data.status};
}

export async function listPublishedRecipes(coachId:string):Promise<RecipeOption[]> {
  const {data,error}=await from('dishes').select('id,title,summary,servings,instructions').eq('coach_id',coachId).eq('lifecycle','published').is('deleted_at',null).order('title');
  if(error) throw error;
  return data??[];
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
