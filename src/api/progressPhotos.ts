import { supabase } from '../lib/supabase';

export interface ProgressPhoto { id:string; player_id:string; coach_id:string; assignment_id:string; storage_path:string; captured_at:string; url:string }
export async function uploadAssignmentPhoto(playerId:string,assignmentId:string,file:File):Promise<string>{
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size<=0||file.size>10*1024*1024)throw new Error('Choose a JPG, PNG, or WebP image smaller than 10 MB.');
  const bytes=new Uint8Array(await file.slice(0,16).arrayBuffer());const text=String.fromCharCode(...bytes);const valid=file.type==='image/jpeg'?bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff:file.type==='image/png'?bytes[0]===0x89&&text.slice(1,4)==='PNG':text.startsWith('RIFF')&&text.slice(8,12)==='WEBP';if(!valid)throw new Error('The selected file is not a valid image.');
  const ext=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';const path=`${playerId}/${assignmentId}/${crypto.randomUUID()}.${ext}`;
  const{error}=await supabase.storage.from('progress-photos').upload(path,file,{contentType:file.type,upsert:false});if(error)throw error;return path;
}
export async function submitAssignmentPhotos(assignmentId:string,paths:string[]):Promise<void>{const{error}=await(supabase.rpc as any)('submit_assignment_progress_photos',{p_assignment_id:assignmentId,p_paths:paths});if(error)throw error}
export async function listProgressPhotos(playerId:string):Promise<ProgressPhoto[]>{const{data,error}=await(supabase.from('progress_photos' as never)as any).select('*').eq('player_id',playerId).order('captured_at',{ascending:false});if(error)throw error;return Promise.all((data??[]).map(async(row:any)=>{const signed=await supabase.storage.from('progress-photos').createSignedUrl(row.storage_path,300);if(signed.error)throw signed.error;return{...row,url:signed.data.signedUrl}}))}
