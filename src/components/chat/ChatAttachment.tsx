/** Renders a private coach/player chat attachment after resolving its signed URL. */
import { useEffect, useState } from 'react';
import { getChatAttachmentUrl } from '../../api/chat';

export default function ChatAttachment({ path, type }: { path: string; type: 'image' | 'video' | 'audio' }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    getChatAttachmentUrl(path).then((value) => { if (active) setUrl(value); }).catch(() => {});
    return () => { active = false; };
  }, [path]);
  if (!url) return <span className="muted">Loading media…</span>;
  if (type === 'image') return <a href={url} target="_blank" rel="noreferrer"><img src={url} alt="Chat attachment" style={{ display: 'block', maxWidth: '100%', maxHeight: 280, borderRadius: 8 }} /></a>;
  if (type === 'video') return <video src={url} controls preload="metadata" style={{ display: 'block', maxWidth: '100%', maxHeight: 280, borderRadius: 8 }} />;
  return <audio src={url} controls preload="metadata" style={{ display: 'block', maxWidth: '100%' }} />;
}
