import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listChatMessages,
  sendChatMessage,
  subscribeToChatMessages,
  type ChatMessage,
} from '../api/chat';

export default function ChatWindow({
  coachId,
  playerId,
  currentUserId,
}: {
  coachId: string;
  playerId: string;
  currentUserId: string;
}) {
  const qc = useQueryClient();
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const key = ['chat', coachId, playerId] as const;

  const { data: messages = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: () => listChatMessages(coachId, playerId),
  });

  // Real-time: append new messages without refetching
  useEffect(() => {
    const channel = subscribeToChatMessages(coachId, playerId, (msg) => {
      qc.setQueryData<ChatMessage[]>(key, (prev = []) =>
        prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
      );
    });
    return () => { channel.unsubscribe(); };
  }, [coachId, playerId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const send = useMutation({
    mutationFn: () => sendChatMessage(coachId, playerId, currentUserId, text.trim()),
    onSuccess: (msg) => {
      qc.setQueryData<ChatMessage[]>(key, (prev = []) =>
        prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
      );
      setText('');
    },
  });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (text.trim() && !send.isPending) send.mutate();
    }
  };

  return (
    <div className="stack" style={{ gap: '0.6rem' }}>
      {/* Message list */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          padding: '0.75rem',
          minHeight: 320,
          maxHeight: 520,
          overflowY: 'auto',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          background: 'var(--surface)',
        }}
      >
        {isLoading && <p className="muted" style={{ margin: 'auto', fontSize: '0.85rem' }}>Loading…</p>}
        {!isLoading && messages.length === 0 && (
          <p className="muted" style={{ margin: 'auto', fontSize: '0.85rem' }}>
            No messages yet. Say hello!
          </p>
        )}
        {messages.map((msg) => {
          const mine = msg.sender_id === currentUserId;
          return (
            <div key={msg.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
              <div
                style={{
                  maxWidth: '72%',
                  padding: '0.5em 0.85em',
                  borderRadius: mine ? '14px 14px 3px 14px' : '14px 14px 14px 3px',
                  background: mine ? 'var(--accent)' : 'var(--surface-2)',
                  color: mine ? 'var(--accent-text)' : 'var(--text)',
                  fontSize: '0.9rem',
                  wordBreak: 'break-word',
                  lineHeight: 1.45,
                }}
              >
                {msg.body}
                <div style={{ fontSize: '0.68rem', opacity: 0.65, marginTop: '0.25rem', textAlign: 'right' }}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="row" style={{ gap: '0.5rem', alignItems: 'flex-end' }}>
        <textarea
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
          style={{ flex: 1, resize: 'none' }}
          disabled={send.isPending}
        />
        <button
          onClick={() => send.mutate()}
          disabled={!text.trim() || send.isPending}
          style={{ alignSelf: 'flex-end', minWidth: 72 }}
        >
          {send.isPending ? '…' : 'Send'}
        </button>
      </div>
      {send.error && <span className="error">{(send.error as Error).message}</span>}
    </div>
  );
}
