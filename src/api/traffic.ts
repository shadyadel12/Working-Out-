import { supabase } from '../lib/supabase';

const gateway = import.meta.env.VITE_API_GATEWAY_URL?.replace(/\/proxy\/?$/, '') ?? '';

export interface TrafficSummary {
  totals: { requests: number; errors: number; blocked: number; unique_ips: number };
  ips: Array<{ ip: string; country: string | null; platform: string; requests: number; errors: number; blocked: number; last_seen: string }>;
  events: Array<{ id: string; occurred_at: string; ip: string; platform: string; method: string; route: string; status: number; country: string | null; event_type: string }>;
  blocks: Array<{ ip: string; reason: string; created_at: string; expires_at: string | null }>;
  hours: number;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!gateway) throw new Error('Traffic gateway is not configured.');
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Authentication required.');
  const response = await fetch(`${gateway}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || 'Traffic request failed.');
  return body as T;
}

export const getTrafficSummary = (hours: number) => request<TrafficSummary>(`/admin/traffic?hours=${hours}`);
export const blockIp = (ip: string, reason: string, expiresAt: string | null) => request('/admin/blocks', { method: 'POST', body: JSON.stringify({ ip, reason, expiresAt }) });
export const unblockIp = (ip: string) => request(`/admin/blocks?ip=${encodeURIComponent(ip)}`, { method: 'DELETE' });
