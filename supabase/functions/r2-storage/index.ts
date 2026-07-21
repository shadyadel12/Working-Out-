import { createClient } from 'jsr:@supabase/supabase-js@2';
import { presignR2, privateFileId, r2Request } from '../_shared/r2.ts';
import { verifiedJwtAal } from '../_shared/auth.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...cors, 'Content-Type': 'application/json' },
});

interface AuthorizationContext {
  purpose: string;
  owner_id: string;
  coach_id: string | null;
  player_id: string | null;
}

const rules: Record<string, { max: number; types: Set<string> }> = {
  'workout-video': { max: 500 * 1024 * 1024, types: new Set(['video/mp4', 'video/webm', 'video/quicktime']) },
  'chat-attachment': { max: 500 * 1024 * 1024, types: new Set([
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime',
  ]) },
  'chat-voice': { max: 25 * 1024 * 1024, types: new Set([
    'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg', 'audio/webm',
  ]) },
  'support-attachment': { max: 500 * 1024 * 1024, types: new Set([
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime',
  ]) },
};

function attachmentType(contentType: string) {
  if (contentType.startsWith('image/')) return 'image';
  if (contentType.startsWith('video/')) return 'video';
  if (contentType.startsWith('audio/')) return 'audio';
  return 'file';
}

async function storedContentMatches(objectKey: string, contentType: string) {
  const response = await fetch(await presignR2(objectKey, 'GET', 60), {
    headers: { Range: 'bytes=0-15' },
  });
  if (response.status !== 206) return false;
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length < 4 || bytes.length > 16) return false;
  const ascii = String.fromCharCode(...bytes);
  const ftyp = ascii.slice(4, 8) === 'ftyp';
  const webm = bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3;
  const signatures: Record<string, boolean> = {
    'image/jpeg': bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
    'image/png': bytes[0] === 0x89 && ascii.slice(1, 4) === 'PNG',
    'image/gif': ascii.startsWith('GIF87a') || ascii.startsWith('GIF89a'),
    'image/webp': ascii.startsWith('RIFF') && ascii.slice(8, 12) === 'WEBP',
    'video/mp4': ftyp && ascii.slice(8, 12) !== 'qt  ',
    'video/quicktime': ftyp && ascii.slice(8, 12) === 'qt  ',
    'video/webm': webm,
    'audio/mpeg': ascii.startsWith('ID3') || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0),
    'audio/mp4': ftyp,
    'audio/wav': ascii.startsWith('RIFF') && ascii.slice(8, 12) === 'WAVE',
    'audio/ogg': ascii.startsWith('OggS'),
    'audio/webm': webm,
  };
  return signatures[contentType] === true;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
  const authHeader = request.headers.get('Authorization');
  const url = Deno.env.get('SUPABASE_URL');
  const anon = Deno.env.get('SUPABASE_ANON_KEY');
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!authHeader) return json({ error: 'Authentication required.' }, 401);
  if (!url || !anon || !service) return json({ error: 'Storage service is not configured.' }, 503);
  const userClient = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
  const admin = createClient(url, service, { auth: { persistSession: false } });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return json({ error: 'Invalid or expired session.' }, 401);
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!profile) return json({ error: 'Profile not found.' }, 403);
  const userId = user.id;
  const profileRole = profile.role;
  const aal = verifiedJwtAal(authHeader);

  let payload: Record<string, unknown>;
  try { payload = await request.json(); } catch { return json({ error: 'Invalid request.' }, 400); }
  const action = String(payload.action ?? '');

  async function activeLink(coachId: string, playerId: string) {
    const { data } = await admin.from('coach_player_links').select('id').eq('coach_id', coachId)
      .eq('player_id', playerId).eq('status', 'active').gte('subscription_end_date', new Date().toISOString().slice(0, 10)).maybeSingle();
    return !!data;
  }

  async function playerHasActiveLink(playerId: string) {
    const { data } = await admin.from('coach_player_links').select('id').eq('player_id', playerId)
      .eq('status', 'active').gte('subscription_end_date', new Date().toISOString().slice(0, 10)).limit(1);
    return (data?.length ?? 0) > 0;
  }

  async function teamCan(capability: 'view' | 'chat' | 'manage', coachId: string, playerId: string) {
    const { data } = await userClient.rpc(`team_can_${capability}_player`, {
      p_owner: coachId, p_player: playerId,
    });
    return data === true;
  }

  async function authorized(row: AuthorizationContext, destructive = false, creating = false) {
    if (profileRole === 'admin') return aal === 'aal2';
    if (destructive) return row.owner_id === userId;
    if (row.purpose === 'support-attachment') return row.coach_id === userId && profileRole === 'coach';
    if (row.purpose === 'chat-attachment' || row.purpose === 'chat-voice') {
      if (!row.coach_id || !row.player_id) return false;
      if (!await activeLink(row.coach_id, row.player_id)) return false;
      return row.coach_id === userId || row.player_id === userId || await teamCan('chat', row.coach_id, row.player_id);
    }
    if (row.purpose === 'workout-video') {
      if (!row.player_id) return false;
      if (row.player_id === userId) return playerHasActiveLink(userId);
      if (profileRole === 'coach') {
        const { data: links } = await admin.from('coach_player_links').select('coach_id').eq('player_id', row.player_id)
          .eq('status', 'active').gte('subscription_end_date', new Date().toISOString().slice(0, 10));
        for (const link of links ?? []) {
          if (link.coach_id === userId) return true;
          if (await teamCan(creating ? 'manage' : 'view', link.coach_id, row.player_id)) return true;
        }
      }
    }
    return false;
  }

  try {
    if (action === 'create-upload') {
      const purpose = String(payload.purpose ?? '');
      const contentType = String(payload.contentType ?? '').toLowerCase();
      const size = Number(payload.size ?? 0);
      const originalName = String(payload.fileName ?? '').replace(/[\u0000-\u001f\\/]/g, '_').slice(0, 255);
      const coachId = payload.coachId ? String(payload.coachId) : null;
      const playerId = payload.playerId ? String(payload.playerId) : null;
      const rule = rules[purpose];
      const max = (purpose === 'chat-attachment' || purpose === 'support-attachment') && contentType.startsWith('image/')
        ? 10 * 1024 * 1024
        : rule?.max ?? 0;
      if (!rule || !rule.types.has(contentType) || !Number.isSafeInteger(size) || size <= 0 || size > max || !originalName) {
        return json({ error: 'File type, name, or size is not allowed.' }, 400);
      }
      const context: AuthorizationContext = { purpose, owner_id: userId, coach_id: coachId, player_id: playerId };
      if (!await authorized(context, false, true)) return json({ error: 'Access denied.' }, 403);
      const id = crypto.randomUUID();
      const extension = originalName.includes('.') ? originalName.split('.').pop()!.replace(/[^a-z0-9]/gi, '').slice(0, 10) : 'bin';
      const objectKey = `quarantine/${purpose}/${id}.${extension || 'bin'}`;
      const { error } = await admin.rpc('register_private_upload', {
        p_id: id,
        p_object_key: objectKey,
        p_owner_id: userId,
        p_coach_id: coachId,
        p_player_id: playerId,
        p_purpose: purpose,
        p_original_name: originalName,
        p_content_type: contentType,
        p_byte_size: size,
        p_attachment_type: purpose === 'workout-video' ? 'video' : attachmentType(contentType),
      });
      if (error) return json({ error: error.message }, error.message.includes('quota') ? 429 : 400);
      const uploadSeconds = purpose === 'workout-video' || size > 50 * 1024 * 1024 ? 3600 : 900;
      return json({ ref: `r2:${id}`, uploadUrl: await presignR2(objectKey, 'PUT', uploadSeconds) });
    }

    const ref = String(payload.ref ?? '');
    const id = privateFileId(ref);
    if (!id) return json({ error: 'Invalid private file reference.' }, 400);
    const { data: row, error: rowError } = await admin.from('private_files').select('*').eq('id', id).maybeSingle();
    if (rowError || !row || !await authorized(row, action === 'delete')) return json({ error: 'File not found or access denied.' }, 404);

    if (action === 'finalize') {
      if (row.status !== 'pending') return json({ error: 'Upload is not pending.' }, 409);
      const head = await r2Request(row.object_key, 'HEAD');
      const length = Number(head.headers.get('content-length') ?? -1);
      const storedType = (head.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
      if (!head.ok || length !== Number(row.byte_size) || storedType !== row.content_type
        || !await storedContentMatches(row.object_key, row.content_type)) {
        await r2Request(row.object_key, 'DELETE').catch(() => {});
        await admin.from('private_files').update({ status: 'rejected', deleted_at: new Date().toISOString() }).eq('id', id);
        return json({ error: 'Uploaded file could not be verified.' }, 400);
      }
      const status = row.purpose === 'workout-video' ? 'quarantined' : 'ready';
      await admin.from('private_files').update({ status, verified_at: new Date().toISOString() }).eq('id', id).eq('status', 'pending');
      return json({ ref, status });
    }
    if (action === 'download') {
      if (row.status !== 'ready') return json({ error: 'File is not available.' }, 409);
      return json({ url: await presignR2(row.object_key, 'GET', 3600) });
    }
    if (action === 'delete') {
      if (row.status !== 'deleted') await r2Request(row.object_key, 'DELETE');
      await admin.from('private_files').update({ status: 'deleted', deleted_at: new Date().toISOString() }).eq('id', id);
      return json({ deleted: true });
    }
    return json({ error: 'Unknown action.' }, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Storage operation failed.' }, 500);
  }
});
