import { supabase } from '../lib/supabase';

export interface AdminMessage {
  id: string;
  coach_id: string;
  sender_id: string;
  body: string;
  attachment_path: string | null;
  attachment_type: string | null;
  created_at: string;
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
): Promise<{ path: string; type: 'image' | 'video' | 'file' }> {
  const ext = file.name.split('.').pop() ?? 'bin';
  const path = `${coachId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from('support').upload(path, file);
  if (error) throw error;
  const type = file.type.startsWith('image/')
    ? 'image'
    : file.type.startsWith('video/')
    ? 'video'
    : 'file';
  return { path, type };
}

/** Get a short-lived signed URL for a support attachment (1 hour). */
export async function getSupportAttachmentUrl(path: string): Promise<string> {
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
