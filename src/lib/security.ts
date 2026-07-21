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
  if (file.size <= 0 || file.size > maxBytes) throw new Error(`Video must be no larger than ${maxMb} MB.`);
  const expectedExtension = VIDEO_EXTENSIONS[file.type];
  if (!expectedExtension) throw new Error('Only MP4, WebM, and MOV videos are allowed.');
  if (file.name.includes('\0') || /[\\/]/.test(file.name)) throw new Error('Invalid video filename.');
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

export type ChatAttachmentType = 'image' | 'video' | 'audio';

const CHAT_ATTACHMENT_TYPES: Record<string, { extension: string; type: 'image' | 'video'; maxBytes: number }> = {
  'image/jpeg': { extension: 'jpg', type: 'image', maxBytes: 10 * 1024 * 1024 },
  'image/png': { extension: 'png', type: 'image', maxBytes: 10 * 1024 * 1024 },
  'image/webp': { extension: 'webp', type: 'image', maxBytes: 10 * 1024 * 1024 },
  'image/gif': { extension: 'gif', type: 'image', maxBytes: 10 * 1024 * 1024 },
  'video/mp4': { extension: 'mp4', type: 'video', maxBytes: 500 * 1024 * 1024 },
  'video/webm': { extension: 'webm', type: 'video', maxBytes: 500 * 1024 * 1024 },
  'video/quicktime': { extension: 'mov', type: 'video', maxBytes: 500 * 1024 * 1024 },
};

const CHAT_VOICE_TYPES: Record<string, { extension: string; maxBytes: number }> = {
  'audio/mpeg': { extension: 'mp3', maxBytes: 25 * 1024 * 1024 },
  'audio/mp4': { extension: 'm4a', maxBytes: 25 * 1024 * 1024 },
  'audio/wav': { extension: 'wav', maxBytes: 25 * 1024 * 1024 },
  'audio/ogg': { extension: 'ogg', maxBytes: 25 * 1024 * 1024 },
  'audio/webm': { extension: 'webm', maxBytes: 25 * 1024 * 1024 },
};

/** Validate chat media using MIME, extension, size, and the file's actual signature. */
export async function validateChatAttachment(file: File): Promise<{ type: ChatAttachmentType; extension: string }> {
  const rule = CHAT_ATTACHMENT_TYPES[file.type];
  if (!rule) throw new Error('Chat attachments can only be pictures or videos.');
  if (file.size <= 0 || file.size > rule.maxBytes) {
    throw new Error(`${rule.type[0].toUpperCase()}${rule.type.slice(1)} must be no larger than ${rule.maxBytes / 1024 / 1024} MB.`);
  }
  if (file.name.includes('\0') || /[\\/]/.test(file.name)) throw new Error('Invalid attachment filename.');
  const actualExtension = file.name.split('.').pop()?.toLowerCase();
  const acceptedJpegExtension = file.type === 'image/jpeg' && actualExtension === 'jpeg';
  if (actualExtension !== rule.extension && !acceptedJpegExtension) {
    throw new Error('The file extension does not match its type.');
  }
  if (rule.type === 'video') {
    await validateVideoFile(file, rule.maxBytes);
    return { type: rule.type, extension: rule.extension };
  }

  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const ascii = String.fromCharCode(...bytes);
  const signatures: Record<string, boolean> = {
    'image/jpeg': bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
    'image/png': bytes[0] === 0x89 && ascii.slice(1, 4) === 'PNG',
    'image/gif': ascii.startsWith('GIF87a') || ascii.startsWith('GIF89a'),
    'image/webp': ascii.startsWith('RIFF') && ascii.slice(8, 12) === 'WEBP',
  };
  if (!signatures[file.type]) throw new Error('The file content does not match its reported type.');
  return { type: rule.type, extension: rule.extension };
}

/** Validate audio created by the dedicated chat microphone recorder. */
export async function validateChatVoice(file: File): Promise<void> {
  const rule = CHAT_VOICE_TYPES[file.type];
  if (!rule) throw new Error('The recorded voice format is not supported.');
  if (file.size <= 0 || file.size > rule.maxBytes) throw new Error('Voice message must be no larger than 25 MB.');
  if (file.name.includes('\0') || /[\\/]/.test(file.name)) throw new Error('Invalid voice message filename.');
  const actualExtension = file.name.split('.').pop()?.toLowerCase();
  if (actualExtension !== rule.extension) throw new Error('The voice message extension does not match its type.');
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const ascii = String.fromCharCode(...bytes);
  const signatures: Record<string, boolean> = {
    'audio/mpeg': ascii.startsWith('ID3') || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0),
    'audio/mp4': ascii.slice(4, 8) === 'ftyp',
    'audio/wav': ascii.startsWith('RIFF') && ascii.slice(8, 12) === 'WAVE',
    'audio/ogg': ascii.startsWith('OggS'),
    'audio/webm': bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3,
  };
  if (!signatures[file.type]) throw new Error('The recorded voice content does not match its format.');
}

/** Reject encrypted, malformed, or highly compressed ZIP containers before XLSX parsing. */
export function validateSpreadsheetArchive(buffer: ArrayBuffer): void {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  if (bytes.length < 4 || bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
    throw new Error('The selected file is not a valid Excel workbook.');
  }

  let entries = 0;
  let compressedTotal = 0;
  let uncompressedTotal = 0;
  for (let offset = 0; offset + 46 <= bytes.length; offset++) {
    if (view.getUint32(offset, true) !== 0x02014b50) continue;
    entries++;
    if (entries > 10000) throw new Error('The Excel workbook contains too many files.');
    const flags = view.getUint16(offset + 8, true);
    if ((flags & 0x1) !== 0) throw new Error('Encrypted Excel workbooks are not supported.');
    const compressed = view.getUint32(offset + 20, true);
    const uncompressed = view.getUint32(offset + 24, true);
    if (compressed === 0xffffffff || uncompressed === 0xffffffff) {
      throw new Error('ZIP64 Excel workbooks are not supported.');
    }
    compressedTotal += compressed;
    uncompressedTotal += uncompressed;
    if (uncompressedTotal > 25 * 1024 * 1024) throw new Error('The expanded Excel workbook is too large.');
  }
  if (entries === 0) throw new Error('The Excel workbook is malformed.');
  if (uncompressedTotal > Math.max(1024 * 1024, compressedTotal * 100)) {
    throw new Error('The Excel workbook is compressed too aggressively.');
  }
}

/** Prevent Excel/CSV from interpreting user-controlled text as a formula. */
export function sanitizeSpreadsheetCell(value: string | number): string | number {
  if (typeof value !== 'string') return value;
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}
