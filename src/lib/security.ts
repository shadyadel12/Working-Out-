const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^\[?::1\]?$/i,
  /^\[?f[cd][0-9a-f]{2}:/i,
  /^\[?fe80:/i,
];

/** Accept only public HTTP(S) URLs. The app never fetches these server-side. */
export function validateExternalVideoUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.length > 2048) throw new Error('Video link is too long.');

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error('Enter a valid http:// or https:// video link.');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Only http:// and https:// video links are allowed.');
  }
  if (url.username || url.password) throw new Error('Video links cannot contain credentials.');
  if (PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(url.hostname))) {
    throw new Error('Local and private-network video links are not allowed.');
  }
  return url.toString();
}

const VIDEO_EXTENSIONS: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
};

/** Verify extension, reported MIME, and the file's actual container signature. */
export async function validateVideoFile(file: File, maxBytes: number): Promise<void> {
  const maxMb = Math.floor(maxBytes / (1024 * 1024));
  if (file.size <= 0 || file.size > maxBytes) throw new Error(`Video must be smaller than ${maxMb} MB.`);
  const expectedExtension = VIDEO_EXTENSIONS[file.type];
  if (!expectedExtension) throw new Error('Only MP4, WebM, and MOV videos are allowed.');
  const actualExtension = file.name.split('.').pop()?.toLowerCase();
  if (actualExtension !== expectedExtension) throw new Error('Video extension does not match its type.');

  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const isWebm = bytes.length >= 4
    && bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3;
  const hasFtyp = bytes.length >= 12
    && bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70;
  const brand = String.fromCharCode(...bytes.slice(8, 12));
  const valid = file.type === 'video/webm'
    ? isWebm
    : file.type === 'video/quicktime'
      ? hasFtyp && brand === 'qt  '
      : hasFtyp && brand !== 'qt  ';
  if (!valid) throw new Error('The selected file is not a valid video or its content does not match its extension.');
}
