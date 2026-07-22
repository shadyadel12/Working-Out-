import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

const directUrl = import.meta.env.VITE_SUPABASE_URL;
const url = import.meta.env.VITE_API_GATEWAY_URL || directUrl;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const gatewayBase = import.meta.env.VITE_API_GATEWAY_URL?.replace(/\/$/, '');
const directBase = directUrl?.replace(/\/$/, '');

/** Keep auth available when a device or ISP cannot reach the Cloudflare gateway. */
async function resilientFetch(input: RequestInfo | URL, init?: RequestInit) {
  const requestUrl = typeof input === 'string' || input instanceof URL ? String(input) : input.url;
  try {
    return await fetch(input, init);
  } catch (error) {
    const canRetryDirect = error instanceof TypeError
      && gatewayBase
      && directBase
      && gatewayBase !== directBase
      && requestUrl.startsWith(gatewayBase);
    if (!canRetryDirect) throw error;
    return fetch(`${directBase}${requestUrl.slice(gatewayBase.length)}`, init);
  }
}

if (!directUrl || !key) {
  // Fail loud in dev so a missing .env.local is obvious rather than a cryptic 401.
  console.error(
    'Missing Supabase env vars. Copy .env.example to .env.local and fill in ' +
      'VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.'
  );
}

/**
 * Single shared Supabase client. Uses the publishable (browser-safe) key.
 * The secret key must NEVER appear in this file or any VITE_ var — it lives
 * only in the `admin` edge function's server env.
 */
export const supabase = createClient<Database>(url ?? '', key ?? '', {
  global: {
    fetch: resilientFetch,
    headers: { 'x-client-platform': 'web' },
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
