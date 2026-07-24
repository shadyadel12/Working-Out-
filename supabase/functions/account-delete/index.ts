import { createClient } from 'jsr:@supabase/supabase-js@2';
import { r2Request } from '../_shared/r2.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...cors, 'Content-Type': 'application/json' },
});

function jwtAuthTime(authHeader: string) {
  try {
    const payload = authHeader.replace(/^Bearer\s+/i, '').split('.')[1];
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')));
    return typeof decoded.auth_time === 'number' ? decoded.auth_time : 0;
  } catch {
    return 0;
  }
}

async function deletionHash(userId: string, secret: string) {
  const bytes = new TextEncoder().encode(`${secret}:${userId}`);
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))]
    .map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (request.method !== 'POST') return respond({ error: 'Method not allowed.' }, 405);

  const authHeader = request.headers.get('Authorization');
  const url = Deno.env.get('SUPABASE_URL');
  const anon = Deno.env.get('SUPABASE_ANON_KEY');
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const hashSecret = Deno.env.get('ACCOUNT_DELETION_HASH_SECRET');
  if (!authHeader) return respond({ error: 'Authentication required.' }, 401);
  if (!url || !anon || !service || !hashSecret || hashSecret.length < 32) {
    return respond({ error: 'Account deletion is not configured.' }, 503);
  }

  const userClient = createClient(url, anon, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const admin = createClient(url, service, { auth: { persistSession: false } });
  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) return respond({ error: 'Invalid or expired session.' }, 401);

  const recent = Math.floor(Date.now() / 1000) - jwtAuthTime(authHeader) <= 600;
  if (!recent) {
    return respond({ error: 'Sign in again or complete MFA before deleting your account.' }, 403);
  }

  const actorHash = await deletionHash(user.id, hashSecret);
  const { data: files, error: prepareError } = await userClient.rpc('begin_account_deletion', {
    p_actor_hash: actorHash,
  });
  if (prepareError) return respond({ error: prepareError.message }, 403);

  const failures: Array<{ provider: string; object_key: string; error: string }> = [];
  for (const file of files ?? []) {
    const provider = String(file.provider);
    const objectKey = String(file.object_key);
    try {
      if (provider === 'r2') {
        const removed = await r2Request(objectKey, 'DELETE');
        if (!removed.ok && removed.status !== 404) throw new Error(`R2 returned ${removed.status}`);
      } else if (provider.startsWith('supabase:')) {
        const bucket = provider.slice('supabase:'.length);
        const { error } = await admin.storage.from(bucket).remove([objectKey]);
        if (error) throw error;
      }
    } catch (error) {
      failures.push({ provider, object_key: objectKey, error: error instanceof Error ? error.message : 'Deletion failed' });
    }
  }

  if (failures.length) {
    await admin.from('account_file_deletion_queue').insert(failures.map((failure) => ({
      provider: failure.provider,
      object_key: failure.object_key,
      last_error: failure.error.slice(0, 1000),
      attempts: 1,
    })));
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) return respond({ error: 'Account data cleanup was scheduled, but account removal must be retried.' }, 500);

  return respond({ deleted: true, pending_file_deletions: failures.length });
});
