import { createClient } from 'jsr:@supabase/supabase-js@2';
import { verifiedJwtAal } from '../_shared/auth.ts';

const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
const clean=(value:unknown)=>String(value??'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
const normalized=(value:string)=>value.normalize('NFKC').toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
async function hash(value:unknown){const bytes=new TextEncoder().encode(JSON.stringify(value));return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('')}
async function secureEqual(left:string,right:string){if(!left||!right)return false;const[a,b]=await Promise.all([crypto.subtle.digest('SHA-256',new TextEncoder().encode(left)),crypto.subtle.digest('SHA-256',new TextEncoder().encode(right))]);const x=new Uint8Array(a),y=new Uint8Array(b);let difference=0;for(let index=0;index<x.length;index++)difference|=x[index]^y[index];return difference===0}
async function fetchRetry(url:string,init:RequestInit,attempts=3){let last:unknown;for(let i=0;i<attempts;i++){try{const response=await fetch(url,init);if(response.ok)return response;if(response.status!==429&&response.status<500)throw new Error(`Provider returned ${response.status}`);last=new Error(`Provider returned ${response.status}`)}catch(error){last=error}if(i+1<attempts)await new Promise(resolve=>setTimeout(resolve,Math.min(4000,400*2**i)))}throw last}

Deno.serve(async(request)=>{
 if(request.method!=='POST')return json({error:'Method not allowed'},405);
 const url=Deno.env.get('SUPABASE_URL'),serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
 const auth=request.headers.get('authorization')??'';if(!url||!serviceKey)return json({error:'Catalog import is not configured'},503);
 const token=auth.replace(/^Bearer\s+/i,'');const admin=createClient(url,serviceKey,{auth:{persistSession:false}});const bootstrap=await secureEqual(request.headers.get('x-catalog-bootstrap')??'',Deno.env.get('CATALOG_BOOTSTRAP_TOKEN')??'');let actorId:string;
 if(bootstrap){const{data:owner}=await admin.from('profiles').select('id').eq('role','admin').order('created_at').limit(1).single();if(!owner)return json({error:'Catalog owner is unavailable'},503);actorId=owner.id}else{const{data:{user}}=await admin.auth.getUser(token);if(!user||verifiedJwtAal(auth)!=='aal2')return json({error:'Administrator MFA is required'},403);const{data:profile}=await admin.from('profiles').select('role').eq('id',user.id).single();if(profile?.role!=='admin')return json({error:'Access denied'},403);actorId=user.id}
 const ownerId=actorId;
 let input:{provider?:string;query?:string;limit?:number};try{input=await request.json()}catch{return json({error:'Invalid JSON'},400)}
 const provider=input.provider,query=clean(input.query),limit=Math.max(1,Math.min(Number(input.limit)||20,50));if(!['wger','usda_fdc','open_food_facts'].includes(provider??''))return json({error:'Unsupported provider'},400);
 const{data:source}=await admin.from('external_catalog_sources').select('*').eq('provider',provider).single();if(!source?.enabled)return json({error:'This source is disabled'},409);
 const minuteAgo=new Date(Date.now()-60_000).toISOString();const{count:recent}=await admin.from('external_catalog_sync_runs').select('id',{count:'exact',head:true}).eq('provider',provider).gte('started_at',minuteAgo);if((recent??0)>=source.requests_per_minute)return json({error:'Provider rate limit reached. Try again shortly.'},429);
 const{data:run,error:runError}=await admin.from('external_catalog_sync_runs').insert({provider,requested_by:actorId,requested_count:limit}).select('id').single();if(runError)return json({error:runError.message},500);
 let imported=0,updated=0,skipped=0,quarantined=0;
 try{
  let records:any[]=[];
  if(provider==='wger'){
   const response=await fetchRetry(`${source.base_url}/exerciseinfo/?language=2&limit=${limit}&search=${encodeURIComponent(query)}`,{headers:{Accept:'application/json'}});records=(await response.json()).results??[];
  }else if(provider==='usda_fdc'){
   const key=Deno.env.get('USDA_FDC_API_KEY');if(!key)throw new Error('USDA_FDC_API_KEY is not configured');
   const response=await fetchRetry(`${source.base_url}/foods/search?api_key=${encodeURIComponent(key)}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({query:query||'whole foods',pageSize:limit,pageNumber:1})});records=(await response.json()).foods??[];
  }else{
   const agent=Deno.env.get('OPEN_FOOD_FACTS_USER_AGENT');if(!agent)throw new Error('OPEN_FOOD_FACTS_USER_AGENT is not configured');
   const response=await fetchRetry(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query||'food')}&search_simple=1&action=process&json=1&page_size=${limit}`,{headers:{Accept:'application/json','User-Agent':agent}});records=(await response.json()).products??[];
  }
  for(const raw of records.slice(0,limit)){
   const translation=provider==='wger'?((raw.translations??[]).find((item:any)=>item.language===2)??raw.translations?.[0]):null;const externalId=String(raw.id??raw.fdcId??raw.code??'');const name=clean(translation?.name??raw.name??raw.description??raw.product_name);
   if(!externalId||!name){await admin.from('external_catalog_quarantine').insert({provider,external_id:externalId||null,entity_type:provider==='wger'?'exercise':'ingredient',reason:'Missing external ID or name',payload:raw,sync_run_id:run.id});quarantined++;continue}
   let table:string,payload:Record<string,unknown>;
   if(provider==='wger'){
    const licenseName=clean(translation?.license_title??raw.license?.full_name??raw.license?.short_name);const image=licenseName?((raw.images??[]).find((x:any)=>x.is_main)?.image??raw.images?.[0]?.image??null):null;
    payload={coach_id:ownerId,name,category:clean(raw.category?.name)||'Exercise',equipment:(raw.equipment??[]).map((x:any)=>clean(x.name)).filter(Boolean).join(', ')||null,instructions:clean(translation?.description),target_muscle_groups:[...(raw.muscles??[]),...(raw.muscles_secondary??[])].map((x:any)=>clean(x.name)).filter(Boolean),movement_patterns:[],tracking_fields:['Sets','Reps'],image_url:image,visibility:'public',lifecycle:'published',creator_name:'Trainova Catalog',source_provider:provider,external_id:externalId,source_url:`https://wger.de/en/exercise/${externalId}/view`,source_license:licenseName||source.license_name,source_attribution:clean(translation?.license_author??raw.license_author)||source.attribution,imported_at:new Date().toISOString(),last_synced_at:new Date().toISOString(),sync_status:'ok',moderation_status:'visible'};table='exercise_library';
   }else{
    const nutrients=provider==='usda_fdc'?Object.fromEntries((raw.foodNutrients??[]).map((x:any)=>[clean(x.nutrientName),x.value])):raw.nutriments??{};
    const pick=(...keys:string[])=>{for(const key of keys)if(nutrients[key]!=null)return Number(nutrients[key]);return null};
    payload={coach_id:ownerId,name,category:clean(raw.foodCategory??raw.categories)||'Food',default_unit:'g',serving_size:Number(raw.servingSize??raw.serving_quantity)||null,serving_unit:clean(raw.servingSizeUnit??raw.serving_quantity_unit)||null,calories:pick('Energy','energy-kcal_100g','energy-kcal'),protein_g:pick('Protein','proteins_100g'),carbs_g:pick('Carbohydrate, by difference','carbohydrates_100g'),fat_g:pick('Total lipid (fat)','fat_100g'),fiber_g:pick('Fiber, total dietary','fiber_100g'),micronutrients:nutrients,image_url:null,visibility:'public',lifecycle:'published',creator_name:'Trainova Catalog',source_provider:provider,external_id:externalId,source_url:provider==='usda_fdc'?`https://fdc.nal.usda.gov/fdc-app.html#/food-details/${externalId}/nutrients`:`https://world.openfoodfacts.org/product/${externalId}`,source_license:source.license_name,source_attribution:source.attribution,imported_at:new Date().toISOString(),last_synced_at:new Date().toISOString(),sync_status:'ok',moderation_status:'visible'};table='food_items';
   }
   payload.content_hash=await hash({...payload,name:normalized(name),imported_at:undefined,last_synced_at:undefined});
   const{data:existing}=await admin.from(table).select('id,content_hash').eq('source_provider',provider).eq('external_id',externalId).maybeSingle();
   if(!existing){const{data:sameContent}=await admin.from(table).select('id').eq('content_hash',payload.content_hash).limit(1).maybeSingle();if(sameContent){skipped++;continue}}
   const result=existing?await admin.from(table).update({...payload,imported_at:undefined}).eq('id',existing.id).select('id').single():await admin.from(table).insert(payload).select('id').single();if(result.error)throw result.error;existing?updated++:imported++;
   await admin.from('library_audit_events').insert({coach_id:ownerId,actor_id:actorId,entity_type:table,entity_id:result.data.id,action:existing?'import_update':'import_create',after_state:{provider,external_id:externalId,content_hash:payload.content_hash}});
  }
  await admin.from('external_catalog_sync_runs').update({status:'ok',imported_count:imported,updated_count:updated,skipped_count:skipped,quarantined_count:quarantined,finished_at:new Date().toISOString()}).eq('id',run.id);await admin.from('external_catalog_sources').update({last_sync_at:new Date().toISOString(),last_status:'ok',updated_by:actorId}).eq('provider',provider);
  return json({runId:run.id,imported,updated,skipped,quarantined});
 }catch(error){const message=error instanceof Error?error.message:String(error);await admin.from('external_catalog_sync_runs').update({status:'failed',error_message:message,imported_count:imported,updated_count:updated,quarantined_count:quarantined,finished_at:new Date().toISOString()}).eq('id',run.id);await admin.from('external_catalog_sources').update({last_status:'failed',updated_by:actorId}).eq('provider',provider);return json({error:message,runId:run.id},502)}
});
