import { supabase } from '../lib/supabase';

const table = (name: string) => supabase.from(name as never) as any;
export interface MealPlanInput { title:string; description:string; weekCount:number; coverUrl:string; showDietaryInfo:boolean }
export async function createMealPlan(coachId:string,input:MealPlanInput):Promise<string>{
 const{data,error}=await table('menu_templates').insert({coach_id:coachId,title:input.title.trim(),description:input.description.trim()||null,week_count:input.weekCount,cover_url:input.coverUrl.trim()||null,show_dietary_info:input.showDietaryInfo,lifecycle:'draft',share_mode:'private'}).select('id').single();if(error)throw error;return data.id;
}
export async function updateMealPlan(id:string,input:Partial<MealPlanInput>):Promise<void>{
 const payload:Record<string,unknown>={updated_at:new Date().toISOString()};if(input.title!==undefined)payload.title=input.title.trim();if(input.description!==undefined)payload.description=input.description.trim()||null;if(input.weekCount!==undefined)payload.week_count=input.weekCount;if(input.coverUrl!==undefined)payload.cover_url=input.coverUrl.trim()||null;if(input.showDietaryInfo!==undefined)payload.show_dietary_info=input.showDietaryInfo;const{error}=await table('menu_templates').update(payload).eq('id',id);if(error)throw error;
}
export async function saveMealEntry(input:{id?:string;planId:string;recipeId:string;mealName:string;mealType:'meal'|'snack';week:number;day:number;position:number}):Promise<void>{
 const payload={menu_template_id:input.planId,dish_id:input.recipeId,meal_name:input.mealName.trim(),meal_type:input.mealType,week_number:input.week,day_number:input.day,position:input.position};const query=input.id?table('menu_entries').update(payload).eq('id',input.id):table('menu_entries').insert(payload);const{error}=await query;if(error)throw error;
}
export async function reorderMealEntries(rows:{id:string;position:number}[]):Promise<void>{for(const row of rows){const{error}=await table('menu_entries').update({position:row.position}).eq('id',row.id);if(error)throw error}}
