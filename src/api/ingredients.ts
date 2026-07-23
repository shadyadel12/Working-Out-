import { supabase } from '../lib/supabase';
export interface Ingredient {id:string;coach_id:string;name:string;category:string|null;default_unit:string;image_url:string|null;created_at:string;updated_at:string}
export interface IngredientInput {name:string;category:string;defaultUnit:string;imageUrl:string}
const table=()=>supabase.from('food_items' as never) as any;
export async function listIngredients(coachId:string):Promise<Ingredient[]>{const{data,error}=await table().select('*').eq('coach_id',coachId).is('deleted_at',null).order('name');if(error)throw error;return data??[]}
export async function saveIngredient(coachId:string,id:string|null,input:IngredientInput):Promise<string>{const payload={coach_id:coachId,name:input.name.trim(),category:input.category.trim()||null,default_unit:input.defaultUnit.trim()||'g',image_url:input.imageUrl.trim()||null,updated_at:new Date().toISOString()};const query=id?table().update(payload).eq('id',id):table().insert(payload);const{data,error}=await query.select('id').single();if(error)throw error;return data.id}
export async function saveIngredients(coachId:string,inputs:IngredientInput[]):Promise<void>{const rows=inputs.map(input=>({coach_id:coachId,name:input.name.trim(),category:input.category.trim()||null,default_unit:input.defaultUnit.trim()||'g',image_url:input.imageUrl.trim()||null}));const{error}=await table().insert(rows);if(error)throw error}
export async function removeIngredients(ids:string[]):Promise<void>{const{error}=await table().update({deleted_at:new Date().toISOString(),updated_at:new Date().toISOString()}).in('id',ids);if(error)throw error}

