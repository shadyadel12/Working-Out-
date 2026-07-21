import { createClient } from 'jsr:@supabase/supabase-js@2';
import { privateFileId, r2Request } from '../_shared/r2.ts';
import { verifiedJwtAal } from '../_shared/auth.ts';

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

function streamedMultipartFile(source: ReadableStream<Uint8Array>, fileName: string, contentType: string, size: number) {
  const boundary = `----pulsefit-${crypto.randomUUID()}`;
  const safeName = fileName.replace(/[\r\n"]/g, '_');
  const prefix = new TextEncoder().encode(
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${safeName}"\r\nContent-Type: ${contentType}\r\n\r\n`,
  );
  const suffix = new TextEncoder().encode(`\r\n--${boundary}--\r\n`);
  const reader = source.getReader();
  let phase: 'prefix' | 'file' | 'suffix' | 'done' = 'prefix';
  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (phase === 'prefix') {
        phase = 'file';
        controller.enqueue(prefix);
        return;
      }
      if (phase === 'file') {
        const chunk = await reader.read();
        if (!chunk.done) {
          controller.enqueue(chunk.value);
          return;
        }
        phase = 'suffix';
      }
      if (phase === 'suffix') {
        phase = 'done';
        controller.enqueue(suffix);
        controller.close();
      }
    },
    cancel(reason) { return reader.cancel(reason); },
  });
  return {
    body,
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': String(prefix.byteLength + size + suffix.byteLength),
    },
  };
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
  const aal = verifiedJwtAal(authHeader);

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
  let authorized = profile?.role === 'admin' && aal === 'aal2';
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

  let r2Ready = false;
  try {
    let blob: Blob;
    let r2Download: Response | null = null;
    if (r2Row) {
      const download = await r2Request(quarantinePath, 'GET');
      if (!download.ok) throw new Error('R2 quarantined video could not be read.');
      if (!download.body) throw new Error('R2 quarantined video returned no content.');
      r2Download = download;
      blob = new Blob();
    } else {
      const { data, error: downloadError } = await admin.storage.from('video-quarantine').download(quarantinePath);
      if (downloadError || !data) throw new Error('Quarantined video could not be read.');
      blob = data;
    }

    let uploadUrl = 'https://www.virustotal.com/api/v3/files';
    const fileSize = r2Row ? Number(r2Row.byte_size) : blob.size;
    if (fileSize > 32 * 1024 * 1024) {
      const largeResponse = await fetch('https://www.virustotal.com/api/v3/files/upload_url', {
        headers: { 'x-apikey': virusTotalKey },
      });
      if (!largeResponse.ok) throw new Error('Malware scanner is unavailable.');
      uploadUrl = (await largeResponse.json()).data;
    }

    const streamed = r2Download
      ? streamedMultipartFile(r2Download.body!, fileName, contentType, fileSize)
      : null;
    const form = streamed ? null : new FormData();
    form?.append('file', new File([blob], fileName, { type: contentType }));
    const scanResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: { 'x-apikey': virusTotalKey, ...(streamed?.headers ?? {}) },
      body: streamed?.body ?? form,
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
      const { error: updateError } = await admin.from('private_files').update({
        status: 'ready', verified_at: new Date().toISOString(),
      }).eq('id', r2Row.id).eq('status', 'quarantined');
      if (updateError) throw updateError;
      r2Ready = true;
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
      if (!r2Ready) {
        await r2Request(quarantinePath, 'DELETE').catch(() => {});
        await admin.from('private_files').update({ status: 'rejected', deleted_at: new Date().toISOString() })
          .eq('id', r2Row.id).neq('status', 'ready');
      }
    } else {
      await admin.storage.from('video-quarantine').remove([quarantinePath]);
    }
  }
});
