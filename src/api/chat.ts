import { supabase } from '../lib/supabase';
import { validateChatAttachment, type ChatAttachmentType } from '../lib/security';

export interface ChatMessage {
  id: string;
  coach_id: string;
  player_id: string;
  sender_id: string;
  body: string;
  attachment_path: string | null;
  attachment_type: ChatAttachmentType | null;
  created_at: string;
}

export interface CoachChatThread { player_id: string; latest_at: string; latest_body: string; unread: boolean }

export async function listCoachChatThreads(coachId: string): Promise<CoachChatThread[]> {
  const { data, error } = await supabase.from('chat_messages').select('player_id,sender_id,body,attachment_type,created_at').eq('coach_id', coachId).order('created_at', { ascending: false }).limit(1000);
  if (error) throw error;
  const latest = new Map<string, CoachChatThread>();
  for (const row of data ?? []) {
    if (latest.has(row.player_id)) continue;
    const lastRead = localStorage.getItem(`lastRead_${coachId}_chat_${row.player_id}`) ?? new Date(0).toISOString();
    latest.set(row.player_id, { player_id: row.player_id, latest_at: row.created_at, latest_body: row.body || (row.attachment_type ? `${row.attachment_type} attachment` : 'Message'), unread: row.sender_id !== coachId && row.created_at > lastRead });
  }
  return [...latest.values()];
}

export function markCoachThreadRead(coachId: string, playerId: string) {
  localStorage.setItem(`lastRead_${coachId}_chat_${playerId}`, new Date().toISOString());
}

/** Last N messages between a coach and player, oldest first. */
export async function listChatMessages(
  coachId: string,
  playerId: string,
  limit = 100
): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('coach_id', coachId)
    .eq('player_id', playerId)
    .order('created_at', { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

/** Send a message in the coach↔player thread. */
export async function sendChatMessage(
  coachId: string,
  playerId: string,
  senderId: string,
  body: string,
  attachmentPath: string | null = null,
  attachmentType: ChatAttachmentType | null = null
): Promise<ChatMessage> {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({ coach_id: coachId, player_id: playerId, sender_id: senderId, body, attachment_path: attachmentPath, attachment_type: attachmentType })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function uploadChatAttachment(
  coachId: string,
  playerId: string,
  senderId: string,
  file: File
): Promise<{ path: string; type: ChatAttachmentType }> {
  const { type, extension } = await validateChatAttachment(file);
  const path = `${coachId}/${playerId}/${senderId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from('chat-attachments').upload(path, file, {
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;
  return { path, type };
}

export async function getChatAttachmentUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from('chat-attachments').createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}

/**
 * Subscribe to new messages in the coach↔player thread.
 * Returns the Supabase channel — call .unsubscribe() on cleanup.
 */
export function subscribeToChatMessages(
  coachId: string,
  playerId: string,
  onNew: (msg: ChatMessage) => void
) {
  return supabase
    .channel(`chat-${coachId}-${playerId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `coach_id=eq.${coachId}`,
      },
      (payload) => {
        const msg = payload.new as ChatMessage;
        if (msg.player_id === playerId) onNew(msg);
      }
    )
    .subscribe();
}
