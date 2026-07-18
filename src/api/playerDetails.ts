import { supabase } from '../lib/supabase';
export interface PlayerDetails{player_id:string;gender:string;date_of_birth:string;height:string;country:string;mobile_number:string;sport:string;position:string;sport_level:string;experience_level:string;completed_at:string;updated_at:string}
export type PlayerDetailsInput=Omit<PlayerDetails,'player_id'|'completed_at'|'updated_at'>;
const table=()=>supabase.from('player_details' as never) as any;
export async function getPlayerDetails(playerId:string):Promise<PlayerDetails|null>{const{data,error}=await table().select('*').eq('player_id',playerId).maybeSingle();if(error)throw error;return data}
export async function savePlayerDetails(playerId:string,input:PlayerDetailsInput):Promise<PlayerDetails>{const{data,error}=await table().upsert({player_id:playerId,...input,updated_at:new Date().toISOString()},{onConflict:'player_id'}).select().single();if(error)throw error;return data}
