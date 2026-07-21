import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listChatMessages,
  sendChatMessage,
  uploadChatAttachment,
  uploadChatVoice,
  subscribeToChatMessages,
  type ChatMessage,
} from '../api/chat';
import { useMarkReadOnMount } from '../hooks/useUnreadCounts';
import LoadingSkeleton from './LoadingSkeleton';
import ChatAttachment from './chat/ChatAttachment';
import { Mic, Plus, Send, Smile, Square } from 'lucide-react';

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
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const recordingTimerRef = useRef<number | null>(null);
  const discardRecordingRef = useRef(false);
  const key = ['chat', coachId, playerId] as const;

  // Reset unread counter when this chat is open
  useMarkReadOnMount('chat');

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
      // Mark read immediately since chat is open
      import('../hooks/useUnreadCounts').then(({ markRead }) => {
        markRead(currentUserId, 'chat');
        qc.setQueryData(['unread', 'chat', currentUserId], 0);
      });
    });
    return () => { channel.unsubscribe(); };
  }, [coachId, playerId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const send = useMutation({
    mutationFn: (messageText: string) => sendChatMessage(coachId, playerId, currentUserId, messageText),
    onSuccess: (msg) => {
      qc.setQueryData<ChatMessage[]>(key, (prev = []) =>
        prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
      );
      setText('');
    },
  });

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const attachment = await uploadChatAttachment(coachId, playerId, currentUserId, file);
      const msg = await sendChatMessage(coachId, playerId, currentUserId, '', attachment.path, attachment.type);
      qc.setQueryData<ChatMessage[]>(key, (prev = []) => prev.some((item) => item.id === msg.id) ? prev : [...prev, msg]);
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function sendRecordedAudio(file: File) {
    setUploading(true);
    try {
      const attachment = await uploadChatVoice(coachId, playerId, currentUserId, file);
      const msg = await sendChatMessage(coachId, playerId, currentUserId, '', attachment.path, attachment.type);
      qc.setQueryData<ChatMessage[]>(key, (prev = []) => prev.some((item) => item.id === msg.id) ? prev : [...prev, msg]);
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function toggleRecording() {
    if (recording) {
      recorderRef.current?.stop();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      alert('Audio recording is not supported by this browser.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm']
        .find((type) => MediaRecorder.isTypeSupported(type)) ?? '';
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      discardRecordingRef.current = false;
      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) => { if (event.data.size > 0) chunks.push(event.data); };
      recorder.onstop = () => {
        if (recordingTimerRef.current !== null) window.clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
        recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
        recordingStreamRef.current = null;
        recorderRef.current = null;
        setRecording(false);
        setRecordingSeconds(0);
        const recordedType = recorder.mimeType.split(';')[0] || 'audio/webm';
        const extension = recordedType === 'audio/mp4' ? 'm4a' : 'webm';
        const blob = new Blob(chunks, { type: recordedType });
        if (!discardRecordingRef.current && blob.size > 0) {
          void sendRecordedAudio(new File([blob], `voice-${Date.now()}.${extension}`, { type: recordedType }));
        }
      };
      recorderRef.current = recorder;
      recordingStreamRef.current = stream;
      recorder.start(1000);
      setRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = window.setInterval(() => setRecordingSeconds((seconds) => seconds + 1), 1000);
    } catch {
      alert('Microphone permission is required to record audio.');
    }
  }

  useEffect(() => () => {
    discardRecordingRef.current = true;
    if (recordingTimerRef.current !== null) window.clearInterval(recordingTimerRef.current);
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (text.trim() && !send.isPending) send.mutate(text.trim());
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
        {isLoading && <LoadingSkeleton rows={4} />}
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
                {msg.body && <div>{msg.body}</div>}
                {msg.attachment_path && msg.attachment_type && (
                  <ChatAttachment path={msg.attachment_path} type={msg.attachment_type} />
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

      {/* Input */}
      <div className="chat-composer-row">
        <button
          type="button"
          className="chat-tool-button attach"
          title="Send a picture or video (videos up to 500 MB)"
          aria-label="Attach picture or video"
          onClick={() => fileRef.current?.click()}
          disabled={uploading || send.isPending || recording}
        >
          {uploading ? <span aria-label="Uploading">…</span> : <Plus size={24} aria-hidden="true" />}
        </button>
        <button type="button" className="chat-tool-button emoji" title="Add emoji" aria-label="Add emoji" onClick={() => setEmojiOpen((open) => !open)} disabled={recording}>
          <Smile size={22} aria-hidden="true" />
        </button>
        {emojiOpen && <div className="chat-emoji-tray" role="group" aria-label="Choose an emoji">
          {['😊', '💪', '👍', '🔥', '❤️', '😂'].map((emoji) => <button type="button" key={emoji} onClick={() => { setText((value) => value + emoji); setEmojiOpen(false); }}>{emoji}</button>)}
        </div>}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
          onChange={handleFile}
          style={{ display: 'none' }}
        />
        <textarea
          className="chat-composer-input"
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message"
          disabled={send.isPending || uploading || recording}
        />
        <button
          type="button"
          className={recording ? 'chat-tool-button recording mic' : 'chat-tool-button mic'}
          title={recording ? 'Stop and send recording' : text.trim() ? 'Send message' : 'Record a voice message'}
          aria-label={recording ? 'Stop and send voice message' : text.trim() ? 'Send message' : 'Record voice message'}
          onClick={() => text.trim() ? send.mutate(text.trim()) : void toggleRecording()}
          disabled={uploading || send.isPending}
        >
          {recording ? <><Square size={17} aria-hidden="true" /><span className="sr-only">Stop {Math.floor(recordingSeconds / 60)}:{String(recordingSeconds % 60).padStart(2, '0')}</span></> : text.trim() ? <Send size={21} aria-hidden="true" /> : <Mic size={21} aria-hidden="true" />}
        </button>
      </div>
      {send.error && <span className="error">{(send.error as Error).message}</span>}
    </div>
  );
}
