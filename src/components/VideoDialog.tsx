import { useEffect, useRef } from 'react';
import VideoPlayer from './VideoPlayer';

export default function VideoDialog({
  open, title = 'Player video', url, isExternal, onClose, onPlay,
}: {
  open: boolean;
  title?: string;
  url: string | null;
  isExternal: boolean;
  onClose: () => void;
  onPlay?: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, open]);
  if (!open || !url) return null;
  return <div className="video-dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="video-dialog" role="dialog" aria-modal="true" aria-labelledby="video-dialog-title">
      <header><h2 id="video-dialog-title">{title}</h2><button ref={closeRef} type="button" className="modal-close" aria-label="Close video" onClick={onClose}>×</button></header>
      <div className="video-dialog-body"><VideoPlayer url={url} isExternal={isExternal} onPlay={onPlay} /></div>
    </section>
  </div>;
}
