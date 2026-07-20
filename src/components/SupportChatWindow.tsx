import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listAdminMessages,
  sendAdminMessage,
  uploadSupportAttachment,
  getSupportAttachmentUrl,
  subscribeToAdminMessages,
  type AdminMessage,
} from '../api/adminChat';
import { useMarkReadOnMount, markRead } from '../hooks/useUnreadCounts';
import LoadingSkeleton from './LoadingSkeleton';
import { Paperclip } from 'lucide-react';

/** Renders one attachment — image preview, video player, or download link. */
function Attachment({ path, type }: { path: string; type: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    getSupportAttachmentUrl(path).then(setUrl).catch(() => setUrl(null));
  }, [path]);

  if (!url) return <span className="muted" style={{ fontSize: '0.8rem' }}>Loading attachment…</span>;

  if (type === 'image') {
    return (
      <a href={url} target="_blank" rel="noreferrer">
        <img
          src={url}
          alt="attachment"
          style={{ maxWidth: '100%', maxHeight: 240, borderRadius: 8, display: 'block', marginTop: 4 }}
        />
      </a>
    );
  }
  if (type === 'video') {
    return (
      <video
        src={url}
        controls
        style={{ maxWidth: '100%', maxHeight: 240, borderRadius: 8, marginTop: 4 }}
      />
    );
  }
  return (
    <a href={url} target="_blank" rel="noreferrer" style={{ fontSize: '0.88rem' }}>
      Download file
    </a>
  );
}

export default function SupportChatWindow({
  coachId,
  currentUserId,
  coachName,
  onNewMessage,
}: {
  coachId: string;
  currentUserId: string;
  /** Shown in message bubbles on the admin side. */
  coachName?: string;
  /** Called when a new realtime message arrives (admin uses this to mark per-coach read). */
  onNewMessage?: () => void;
}) {
  const qc = useQueryClient();
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const key = ['adminChat', coachId] as const;

  // Reset unread counter when this chat is open
  useMarkReadOnMount('support');

  const { data: messages = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: () => listAdminMessages(coachId),
  });

  useEffect(() => {
    const ch = subscribeToAdminMessages(coachId, (msg) => {
      qc.setQueryData<AdminMessage[]>(key, (prev = []) =>
        prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
      );
      // Mark read immediately since chat is open
      markRead(currentUserId, 'support');
      qc.setQueryData(['unread', 'support', currentUserId], 0);
      onNewMessage?.();
    });
    return () => { ch.unsubscribe(); };
  }, [coachId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const send = useMutation({
    mutationFn: (opts: { body: string; attachmentPath?: string; attachmentType?: string }) =>
      sendAdminMessage({
        coachId,
        senderId: currentUserId,
        body: opts.body,
        attachmentPath: opts.attachmentPath,
        attachmentType: opts.attachmentType,
      }),
    onSuccess: (msg) => {
      qc.setQueryData<AdminMessage[]>(key, (prev = []) =>
        prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
      );
      setText('');
    },
  });

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setUploading(true);
    try {
      const { path, type } = await uploadSupportAttachment(coachId, file);
      send.mutate({ body: '', attachmentPath: path, attachmentType: type });
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (text.trim() && !send.isPending) send.mutate({ body: text.trim() });
    }
  }

  return (
    <div className="stack" style={{ gap: '0.6rem' }}>
      {/* Message list */}
      <div
        style={{
          display: 'flex', flexDirection: 'column', gap: '0.5rem',
          padding: '0.75rem',
          minHeight: 320, maxHeight: 520, overflowY: 'auto',
          border: '1px solid var(--border)', borderRadius: 'var(--radius)',
          background: 'var(--surface)',
        }}
      >
        {isLoading && <LoadingSkeleton rows={4} />}
        {!isLoading && messages.length === 0 && (
          <p className="muted" style={{ margin: 'auto', fontSize: '0.85rem' }}>
            No messages yet. Send a message to the admin team.
          </p>
        )}
        {messages.map((msg) => {
          const mine = msg.sender_id === currentUserId;
          // Label for incoming messages: on admin side show coach name; on coach side show "Admin Team".
          const senderLabel = mine ? null : coachName ?? 'Admin Team';
          return (
            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start' }}>
              {senderLabel && (
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', margin: '0 0.35rem 0.15rem' }}>
                  {senderLabel}
                </span>
              )}
              <div
                style={{
                  maxWidth: '72%',
                  padding: '0.5em 0.85em',
                  borderRadius: mine ? '14px 14px 3px 14px' : '14px 14px 14px 3px',
                  background: mine ? 'var(--accent)' : 'var(--surface-2)',
                  color: mine ? 'var(--accent-text)' : 'var(--text)',
                  fontSize: '0.9rem', wordBreak: 'break-word', lineHeight: 1.45,
                }}
              >
                {msg.body && <div>{msg.body}</div>}
                {msg.attachment_path && msg.attachment_type && (
                  <Attachment path={msg.attachment_path} type={msg.attachment_type} />
                )}
                <div style={{ fontSize: '0.68rem', opacity: 0.65, marginTop: '0.25rem', textAlign: 'right' }}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input row */}
      <div className="row" style={{ gap: '0.5rem', alignItems: 'flex-end' }}>
        {/* Attach button */}
        <button
          type="button"
          className="secondary"
          title="Attach image, video, or file"
          aria-label="Attach image, video, or file"
          disabled={uploading || send.isPending}
          onClick={() => fileRef.current?.click()}
          style={{ padding: '0.55em 0.75em', alignSelf: 'flex-end', flexShrink: 0 }}
        >
          {uploading ? '…' : <Paperclip size={20} aria-hidden="true" />}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*,.pdf,.doc,.docx,.xlsx"
          onChange={handleFile}
          style={{ display: 'none' }}
        />

        <textarea
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
          style={{ flex: 1, resize: 'none' }}
          disabled={send.isPending || uploading}
        />
        <button
          onClick={() => { if (text.trim()) send.mutate({ body: text.trim() }); }}
          disabled={!text.trim() || send.isPending || uploading}
          style={{ alignSelf: 'flex-end', minWidth: 72 }}
        >
          {send.isPending ? '…' : 'Send'}
        </button>
      </div>
      {send.error && <span className="error">{(send.error as Error).message}</span>}
    </div>
  );
}
