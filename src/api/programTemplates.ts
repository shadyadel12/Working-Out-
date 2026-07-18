import { supabase } from '../lib/supabase';
export interface ProgramTemplate{id:string;coach_id:string;name:string;description:string|null;difficulty:string;duration_weeks:number;created_at:string;updated_at:string}
const table=()=>supabase.from('program_templates' as never) as any;
export async function listProgramTemplates(coachId:string):Promise<ProgramTemplate[]>{const{data,error}=await table().select('*').eq('coach_id',coachId).order('created_at',{ascending:false});if(error)throw error;return data??[]}
export async function createProgramTemplate(coachId:string,input:Omit<ProgramTemplate,'id'|'coach_id'|'created_at'|'updated_at'>):Promise<ProgramTemplate>{const{data,error}=await table().insert({coach_id:coachId,...input}).select().single();if(error)throw error;return data}
export async function updateProgramTemplate(id:string,input:Omit<ProgramTemplate,'id'|'coach_id'|'created_at'|'updated_at'>):Promise<ProgramTemplate>{const{data,error}=await table().update({...input,updated_at:new Date().toISOString()}).eq('id',id).select().single();if(error)throw error;return data}
export async function duplicateProgramTemplate(item:ProgramTemplate):Promise<ProgramTemplate>{let name=`${item.name} Copy`;const{data,error}=await table().insert({coach_id:item.coach_id,name,description:item.description,difficulty:item.difficulty,duration_weeks:item.duration_weeks}).select().single();if(error)throw error;return data}
export async function deleteProgramTemplate(id:string){const{error}=await table().delete().eq('id',id);if(error)throw error}
