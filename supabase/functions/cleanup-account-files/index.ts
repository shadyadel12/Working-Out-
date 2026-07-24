import { createClient } from 'jsr:@supabase/supabase-js@2';
import { r2Request } from '../_shared/r2.ts';

const respond=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
Deno.serve(async(request)=>{
  if(request.method!=='POST')return respond({error:'Method not allowed.'},405);
  const url=Deno.env.get('SUPABASE_URL'),service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(!url||!service)return respond({error:'Cleanup is not configured.'},503);
  if(request.headers.get('Authorization')!==`Bearer ${service}`)return respond({error:'Access denied.'},403);
  const admin=createClient(url,service,{auth:{persistSession:false}});
  const{data:rows,error}=await admin.from('account_file_deletion_queue').select('*').is('deleted_at',null).lt('attempts',20).order('created_at').limit(100);
  if(error)return respond({error:error.message},500);
  let deleted=0;const failures:unknown[]=[];
  for(const row of rows??[]){try{if(row.provider==='r2'){const response=await r2Request(row.object_key,'DELETE');if(!response.ok&&response.status!==404)throw new Error(`R2 returned ${response.status}`);}else if(String(row.provider).startsWith('supabase:')){const bucket=String(row.provider).slice('supabase:'.length);const{error:removeError}=await admin.storage.from(bucket).remove([row.object_key]);if(removeError)throw removeError;}else throw new Error('Unknown storage provider');await admin.from('account_file_deletion_queue').update({deleted_at:new Date().toISOString(),attempts:row.attempts+1,last_error:null}).eq('id',row.id);deleted++;}catch(cause){const message=cause instanceof Error?cause.message:'Deletion failed';await admin.from('account_file_deletion_queue').update({attempts:row.attempts+1,last_error:message.slice(0,1000)}).eq('id',row.id);failures.push({id:row.id,error:message});}}
  return respond({checked:rows?.length??0,deleted,failures},failures.length?207:200);
});
