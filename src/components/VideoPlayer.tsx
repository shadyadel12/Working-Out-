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
    if (url && !isExternal && !isHttpUrl(url)) {
      getVideoUrl(url)
        .then((u) => active && setSigned(u))
        .catch((e) => active && setErr(e instanceof Error ? e.message : 'Load failed'));
    }
    return () => {
      active = false;
    };
  }, [url, isExternal]);

  if (!url) return null;

  if (isExternal || isHttpUrl(url)) {
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
    const vimeoEmbed = toVimeoEmbed(safeUrl);
    if (vimeoEmbed) {
      return <iframe src={vimeoEmbed} title="video" style={{ width: '100%', aspectRatio: '16 / 9', border: 0, borderRadius: 8 }} allowFullScreen />;
    }
    return <video src={safeUrl} controls onPlay={onPlay} style={{ width: '100%', borderRadius: 8 }} />;
  }

  if (err) return <span className="error">{err}</span>;
  if (!signed) return <span className="muted">Loading video…</span>;
  return (
    <video src={signed} controls onPlay={onPlay} style={{ width: '100%', borderRadius: 8 }} />
  );
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function toVimeoEmbed(url: string): string | null {
  const parsed = new URL(url);
  const host = parsed.hostname.replace(/^www\./, '');
  const id = host === 'vimeo.com' ? parsed.pathname.match(/^\/(\d+)/)?.[1] : null;
  return id ? `https://player.vimeo.com/video/${id}` : null;
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
