import { createClient } from 'jsr:@supabase/supabase-js@2';
import { privateFileId, r2Request } from '../_shared/r2.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, ...extraHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return json({ error: 'Authentication required.' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const virusTotalKey = Deno.env.get('VIRUSTOTAL_API_KEY');
  if (!supabaseUrl || !anonKey || !serviceKey || !virusTotalKey) {
    return json({ error: 'Video scanning is not configured.' }, 503);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return json({ error: 'Invalid or expired session.' }, 401);

  let payload: { quarantinePath?: string; ownerId?: string; fileName?: string; contentType?: string; fileRef?: string };
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'Invalid request.' }, 400);
  }
  let { quarantinePath, ownerId, fileName, contentType } = payload;
  const r2Id = payload.fileRef ? privateFileId(payload.fileRef) : null;
  let r2Row: Record<string, any> | null = null;
  if (r2Id) {
    const { data } = await admin.from('private_files').select('*').eq('id', r2Id).maybeSingle();
    if (!data || data.purpose !== 'workout-video' || data.status !== 'quarantined') {
      return json({ error: 'Invalid R2 quarantine upload.' }, 400);
    }
    r2Row = data;
    quarantinePath = data.object_key;
    ownerId = data.player_id;
    fileName = data.original_name;
    contentType = data.content_type;
  }
  if (!quarantinePath || !ownerId || !fileName || !contentType || (!r2Row && !quarantinePath.startsWith(`${ownerId}/`))) {
    return json({ error: 'Invalid quarantine upload.' }, 400);
  }
  if (!['video/mp4', 'video/webm', 'video/quicktime'].includes(contentType)) {
    return json({ error: 'Unsupported video type.' }, 400);
  }

  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle();
  let authorized = profile?.role === 'admin';
  if (profile?.role === 'player' && user.id === ownerId) authorized = true;
  if (profile?.role === 'coach') {
    const { data: link } = await admin
      .from('coach_player_links')
      .select('id,coach_id')
      .eq('player_id', ownerId)
      .eq('status', 'active')
      .gte('subscription_end_date', new Date().toISOString().slice(0, 10))
      .limit(1)
      .maybeSingle();
    authorized = !!link && link.coach_id === user.id;
    if (link && !authorized) {
      const { data: teamAllowed } = await userClient.rpc('team_can_manage_player', {
        p_owner: link.coach_id, p_player: ownerId,
      });
      authorized = teamAllowed === true;
    }
  }
  if (!authorized) return json({ error: 'Access denied.' }, 403);

  try {
    let blob: Blob;
    if (r2Row) {
      const download = await r2Request(quarantinePath, 'GET');
      if (!download.ok) throw new Error('R2 quarantined video could not be read.');
      blob = await download.blob();
    } else {
      const { data, error: downloadError } = await admin.storage.from('video-quarantine').download(quarantinePath);
      if (downloadError || !data) throw new Error('Quarantined video could not be read.');
      blob = data;
    }

    let uploadUrl = 'https://www.virustotal.com/api/v3/files';
    if (blob.size > 32 * 1024 * 1024) {
      const largeResponse = await fetch('https://www.virustotal.com/api/v3/files/upload_url', {
        headers: { 'x-apikey': virusTotalKey },
      });
      if (!largeResponse.ok) throw new Error('Malware scanner is unavailable.');
      uploadUrl = (await largeResponse.json()).data;
    }

    const form = new FormData();
    form.append('file', new File([blob], fileName, { type: contentType }));
    const scanResponse = await fetch(uploadUrl, {
      method: 'POST', headers: { 'x-apikey': virusTotalKey }, body: form,
    });
    if (!scanResponse.ok) throw new Error('Malware scan could not be started.');
    const analysisId = (await scanResponse.json()).data?.id;
    if (!analysisId) throw new Error('Malware scanner returned an invalid response.');

    let stats: Record<string, number> | null = null;
    // Public VirusTotal keys are commonly limited to four requests/minute.
    for (let attempt = 0; attempt < 6; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 20000));
      const result = await fetch(`https://www.virustotal.com/api/v3/analyses/${analysisId}`, {
        headers: { 'x-apikey': virusTotalKey },
      });
      if (!result.ok) throw new Error('Malware scan result could not be verified.');
      const analysis = await result.json();
      if (analysis.data?.attributes?.status === 'completed') {
        stats = analysis.data.attributes.stats;
        break;
      }
    }
    if (!stats) throw new Error('Malware scan timed out; the upload was rejected.');
    if ((stats.malicious ?? 0) > 0 || (stats.suspicious ?? 0) > 0) {
      throw new Error('The video failed the malware scan and was rejected.');
    }
    if ((stats.harmless ?? 0) + (stats.undetected ?? 0) === 0) {
      throw new Error('The malware scan was inconclusive; the upload was rejected.');
    }

    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    if (r2Row) {
      const finalPath = `files/workout-video/${ownerId}/${r2Row.id}-${safeName}`;
      const stored = await r2Request(finalPath, 'PUT', await blob.arrayBuffer(), contentType);
      if (!stored.ok) throw new Error('Clean video could not be stored in R2.');
      await r2Request(quarantinePath, 'DELETE');
      const { error: updateError } = await admin.from('private_files').update({
        object_key: finalPath, status: 'ready', verified_at: new Date().toISOString(),
      }).eq('id', r2Row.id).eq('status', 'quarantined');
      if (updateError) {
        await r2Request(finalPath, 'DELETE').catch(() => {});
        throw updateError;
      }
      return json({ path: `r2:${r2Row.id}` });
    } else {
      const finalPath = `${ownerId}/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
      const { error: finalError } = await admin.storage.from('videos').upload(finalPath, blob, {
        contentType, cacheControl: '3600', upsert: false,
      });
      if (finalError) throw new Error('Clean video could not be stored.');
      return json({ path: finalPath });
    }
  } catch (error) {
    // A handled rejection is a successful function invocation with no path;
    // this lets the browser show the scanner's clear reason while still
    // treating the upload itself as rejected.
    return json({ error: error instanceof Error ? error.message : 'Video scan failed.' });
  } finally {
    if (r2Row) {
      if (r2Row.status !== 'ready') {
        await r2Request(quarantinePath, 'DELETE').catch(() => {});
        await admin.from('private_files').update({ status: 'rejected', deleted_at: new Date().toISOString() })
          .eq('id', r2Row.id).neq('status', 'ready');
      }
    } else {
      await admin.storage.from('video-quarantine').remove([quarantinePath]);
    }
  }
});
