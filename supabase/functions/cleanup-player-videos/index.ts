import { createClient } from 'jsr:@supabase/supabase-js@2';

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
    const { error: storageError } = await admin.storage.from('videos').remove([path]);
    if (storageError) {
      failures.push({ id: log.id, error: storageError.message });
      continue;
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
  return respond({ checked: expired?.length ?? 0, deleted, failures }, failures.length ? 207 : 200);
});
