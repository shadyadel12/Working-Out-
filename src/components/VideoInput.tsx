import { useState } from 'react';
import { uploadVideo } from '../api/storage';
import { validateExternalVideoUrl } from '../lib/security';

export interface VideoValue {
  url: string | null;
  isExternal: boolean;
}

/**
 * Lets a user either paste an external video URL or upload a file to Storage.
 * `ownerId` is the storage folder (a player_id) the upload goes under.
 */
export default function VideoInput({
  ownerId,
  value,
  onChange,
  disabled = false,
}: {
  ownerId: string;
  value: VideoValue;
  onChange: (v: VideoValue) => void;
  disabled?: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr(null);
    setUploading(true);
    try {
      const path = await uploadVideo(ownerId, file);
      onChange({ url: path, isExternal: false });
    } catch (er) {
      setErr(er instanceof Error ? er.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="stack" style={{ gap: '0.5rem' }}>
      <div className="field" style={{ margin: 0 }}>
        <label>Video link (YouTube or any URL)</label>
        <input
          placeholder="https://youtube.com/…"
          value={value.isExternal ? value.url ?? '' : ''}
          onChange={(e) => {
            const raw = e.target.value;
            try {
              setErr(null);
              if (!raw) onChange({ url: null, isExternal: true });
              else onChange({ url: raw, isExternal: true });
            } catch (error) {
              setErr(error instanceof Error ? error.message : 'Invalid video link.');
            }
          }}
          onBlur={(e) => {
            try {
              const safeUrl = validateExternalVideoUrl(e.target.value);
              setErr(null);
              onChange({ url: safeUrl || null, isExternal: true });
            } catch (error) {
              setErr(error instanceof Error ? error.message : 'Invalid video link.');
              onChange({ url: null, isExternal: true });
            }
          }}
          maxLength={2048}
          disabled={disabled}
        />
      </div>
      <div className="row" style={{ gap: '0.5rem', alignItems: 'center' }}>
        <span className="muted" style={{ fontSize: '0.8rem' }}>
          or upload:
        </span>
        <input type="file" accept=".mp4,.mov,.webm,video/mp4,video/quicktime,video/webm" onChange={handleFile} disabled={uploading || disabled} />
        {uploading && <span className="muted">Uploading…</span>}
      </div>
      {value.url && !value.isExternal && (
        <span className="muted" style={{ fontSize: '0.8rem' }}>
          Uploaded file attached ✓
        </span>
      )}
      {err && <span className="error">{err}</span>}
    </div>
  );
}
