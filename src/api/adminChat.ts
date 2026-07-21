import { supabase } from '../lib/supabase';
import { validateChatAttachment } from '../lib/security';
import { getPrivateFileUrl, isPrivateFileRef, uploadPrivateFile } from './privateFiles';

export interface AdminMessage {
  id: string;
  coach_id: string;
  sender_id: string;
  body: string;
  attachment_path: string | null;
  attachment_type: string | null;
  created_at: string;
}

export interface CoachThreadSummary {
  coach_id: string;
  last_body: string;
  last_at: string;
  last_sender_id: string;
  unread: number;
}

export async function listAdminMessages(coachId: string, limit = 100): Promise<AdminMessage[]> {
  const { data, error } = await supabase
    .from('admin_messages')
    .select('*')
    .eq('coach_id', coachId)
    .order('created_at', { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

/**
 * For the admin inbox: latest message per coach thread + unread count.
 * sinceByCoach maps coachId → lastRead ISO string for per-coach unread tracking.
 */
export async function listCoachThreadSummaries(
  adminId: string,
  sinceByCoach: Record<string, string>
): Promise<CoachThreadSummary[]> {
  const { data, error } = await supabase
    .from('admin_messages')
    .select('coach_id, body, created_at, sender_id, attachment_type')
    .order('created_at', { ascending: false });
  if (error) throw error;

  const rows = (data ?? []) as (AdminMessage & { attachment_type: string | null })[];

  // Latest message per coach
  const seen = new Set<string>();
  const latest: Record<string, typeof rows[0]> = {};
  for (const row of rows) {
    if (!seen.has(row.coach_id)) {
      seen.add(row.coach_id);
      latest[row.coach_id] = row;
    }
  }

  // Per-coach unread (messages from coach after lastRead)
  const unread: Record<string, number> = {};
  for (const row of rows) {
    if (row.sender_id === adminId) continue;
    const since = sinceByCoach[row.coach_id] ?? new Date(0).toISOString();
    if (row.created_at > since) {
      unread[row.coach_id] = (unread[row.coach_id] ?? 0) + 1;
    }
  }

  return Object.values(latest).map((r) => ({
    coach_id: r.coach_id,
    last_body: r.body || (r.attachment_type ? `[${r.attachment_type}]` : ''),
    last_at: r.created_at,
    last_sender_id: r.sender_id,
    unread: unread[r.coach_id] ?? 0,
  })).sort((a, b) => b.last_at.localeCompare(a.last_at));
}

export async function sendAdminMessage(opts: {
  coachId: string;
  senderId: string;
  body: string;
  attachmentPath?: string | null;
  attachmentType?: string | null;
}): Promise<AdminMessage> {
  const { data, error } = await supabase
    .from('admin_messages')
    .insert({
      coach_id: opts.coachId,
      sender_id: opts.senderId,
      body: opts.body,
      attachment_path: opts.attachmentPath ?? null,
      attachment_type: opts.attachmentType ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Upload a file to the support bucket; returns the storage path. */
export async function uploadSupportAttachment(
  coachId: string,
  file: File
): Promise<{ path: string; type: 'image' | 'video' }> {
  const { type } = await validateChatAttachment(file);
  const path = await uploadPrivateFile(file, { purpose: 'support-attachment', coachId });
  return { path, type };
}

/** Get a 1-hour signed URL for a support attachment. */
export async function getSupportAttachmentUrl(path: string): Promise<string> {
  if (isPrivateFileRef(path)) return getPrivateFileUrl(path);
  const { data, error } = await supabase.storage
    .from('support')
    .createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}

export function subscribeToAdminMessages(
  coachId: string,
  onNew: (msg: AdminMessage) => void
) {
  return supabase
    .channel(`admin-msg-${coachId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'admin_messages', filter: `coach_id=eq.${coachId}` },
      (payload) => onNew(payload.new as AdminMessage)
    )
    .subscribe();
}

/** Admin inbox: listen to every coach thread (no coach_id filter). */
export function subscribeToAllAdminMessages(onNew: (msg: AdminMessage) => void) {
  return supabase
    .channel('admin-msg-all')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'admin_messages' },
      (payload) => onNew(payload.new as AdminMessage)
    )
    .subscribe();
}
