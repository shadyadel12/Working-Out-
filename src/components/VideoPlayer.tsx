import { useEffect, useState } from 'react';
import { getVideoUrl } from '../api/storage';
import { validateExternalVideoUrl } from '../lib/security';

/** Renders a coach/player video: external link (embed or anchor) or stored file. */
export default function VideoPlayer({
  url,
  isExternal,
  onPlay,
}: {
  url: string | null;
  isExternal: boolean;
  onPlay?: () => void;
}) {
  const [signed, setSigned] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (url && !isExternal) {
      getVideoUrl(url)
        .then((u) => active && setSigned(u))
        .catch((e) => active && setErr(e instanceof Error ? e.message : 'Load failed'));
    }
    return () => {
      active = false;
    };
  }, [url, isExternal]);

  if (!url) return null;

  if (isExternal) {
    let safeUrl: string;
    try {
      safeUrl = validateExternalVideoUrl(url);
    } catch {
      return <span className="error">Invalid video link.</span>;
    }
    const embed = toYouTubeEmbed(safeUrl);
    if (embed) {
      return (
        <iframe
          src={embed}
          title="video"
          style={{ width: '100%', aspectRatio: '16 / 9', border: 0, borderRadius: 8 }}
          allowFullScreen
        />
      );
    }
    return (
      <a href={safeUrl} target="_blank" rel="noopener noreferrer">
        Open video ↗
      </a>
    );
  }

  if (err) return <span className="error">{err}</span>;
  if (!signed) return <span className="muted">Loading video…</span>;
  return (
    <video src={signed} controls onPlay={onPlay} style={{ width: '100%', borderRadius: 8 }} />
  );
}

function toYouTubeEmbed(url: string): string | null {
  const parsed = new URL(url);
  const host = parsed.hostname.replace(/^www\./, '');
  const id = host === 'youtu.be'
    ? parsed.pathname.split('/')[1]
    : host.endsWith('youtube.com')
      ? parsed.searchParams.get('v') ?? parsed.pathname.match(/^\/(?:embed|shorts)\/([\w-]{11})/)?.[1]
      : null;
  return id && /^[\w-]{11}$/.test(id) ? `https://www.youtube.com/embed/${id}` : null;
}
