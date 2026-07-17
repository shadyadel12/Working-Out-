import { supabase } from '../lib/supabase';

export interface ChatMessage {
  id: string;
  coach_id: string;
  player_id: string;
  sender_id: string;
  body: string;
  created_at: string;
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
  body: string
): Promise<ChatMessage> {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({ coach_id: coachId, player_id: playerId, sender_id: senderId, body })
    .select()
    .single();
  if (error) throw error;
  return data;
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
