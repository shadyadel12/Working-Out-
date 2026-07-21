import { createClient } from 'jsr:@supabase/supabase-js@2';
import { privateFileId, r2Request } from '../_shared/r2.ts';

const headers = { 'Content-Type': 'application/json' };
const respond = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers });

Deno.serve(async (request) => {
  if (request.method !== 'POST') return respond({ error: 'Method not allowed.' }, 405);
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) return respond({ error: 'Cleanup is not configured.' }, 503);
  if (request.headers.get('Authorization') !== `Bearer ${serviceKey}`) {
    return respond({ error: 'Access denied.' }, 403);
  }

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const { data: expired, error: queryError } = await admin
    .from('exercise_logs')
    .select('id, player_video_url')
    .not('player_video_url', 'is', null)
    .eq('player_video_is_external', false)
    .lte('player_video_delete_after', new Date().toISOString())
    .order('player_video_delete_after', { ascending: true })
    .limit(100);
  if (queryError) return respond({ error: queryError.message }, 500);

  let deleted = 0;
  const failures: Array<{ id: string; error: string }> = [];
  for (const log of expired ?? []) {
    const path = log.player_video_url as string;
    const r2Id = privateFileId(path);
    if (r2Id) {
      const { data: file } = await admin.from('private_files').select('object_key,status').eq('id', r2Id).maybeSingle();
      if (!file) {
        failures.push({ id: log.id, error: 'R2 metadata was not found.' });
        continue;
      }
      const removed = await r2Request(file.object_key, 'DELETE');
      if (!removed.ok && removed.status !== 404) {
        failures.push({ id: log.id, error: `R2 deletion failed (${removed.status}).` });
        continue;
      }
      await admin.from('private_files').update({ status: 'deleted', deleted_at: new Date().toISOString() }).eq('id', r2Id);
    } else {
      const { error: storageError } = await admin.storage.from('videos').remove([path]);
      if (storageError) {
        failures.push({ id: log.id, error: storageError.message });
        continue;
      }
    }
    const { error: updateError } = await admin.from('exercise_logs').update({
      player_video_url: null,
      player_video_is_external: false,
      player_video_viewed_at: null,
      player_video_delete_after: null,
    }).eq('id', log.id).eq('player_video_url', path);
    if (updateError) failures.push({ id: log.id, error: updateError.message });
    else deleted++;
  }

  // Remove uploads abandoned before finalization or after a rejected scan.
  const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const { data: abandoned, error: abandonedError } = await admin.from('private_files')
    .select('id,object_key').in('status', ['pending', 'quarantined', 'rejected'])
    .lt('created_at', cutoff).order('created_at', { ascending: true }).limit(100);
  if (abandonedError) failures.push({ id: 'private-files', error: abandonedError.message });
  let abandonedDeleted = 0;
  for (const file of abandoned ?? []) {
    const removed = await r2Request(file.object_key, 'DELETE');
    if (!removed.ok && removed.status !== 404) {
      failures.push({ id: file.id, error: `Abandoned R2 deletion failed (${removed.status}).` });
      continue;
    }
    const { error } = await admin.from('private_files').update({
      status: 'deleted', deleted_at: new Date().toISOString(),
    }).eq('id', file.id);
    if (error) failures.push({ id: file.id, error: error.message });
    else abandonedDeleted++;
  }

  return respond({
    checked: expired?.length ?? 0,
    deleted,
    abandonedChecked: abandoned?.length ?? 0,
    abandonedDeleted,
    failures,
  }, failures.length ? 207 : 200);
});
