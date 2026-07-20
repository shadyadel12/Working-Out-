const encoder = new TextEncoder();

function ownedBytes(value: ArrayBuffer | Uint8Array): Uint8Array<ArrayBuffer> {
  const source = value instanceof Uint8Array ? value : new Uint8Array(value);
  const copy = new Uint8Array(source.byteLength);
  copy.set(source);
  return copy;
}

export type R2Config = {
  accountId: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  host: string;
};

export function getR2Config(): R2Config {
  const accountId = Deno.env.get('R2_ACCOUNT_ID');
  const bucket = Deno.env.get('R2_BUCKET_NAME') ?? 'coach-platform-private';
  const accessKeyId = Deno.env.get('R2_ACCESS_KEY_ID');
  const secretAccessKey = Deno.env.get('R2_SECRET_ACCESS_KEY');
  if (!accountId || !bucket || !accessKeyId || !secretAccessKey) {
    throw new Error('R2 storage is not configured.');
  }
  return { accountId, bucket, accessKeyId, secretAccessKey, host: `${accountId}.r2.cloudflarestorage.com` };
}

const hex = (bytes: ArrayBuffer | Uint8Array) =>
  [...(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes))]
    .map((byte) => byte.toString(16).padStart(2, '0')).join('');

const encode = (value: string) => encodeURIComponent(value).replace(/[!'()*]/g, (char) =>
  `%${char.charCodeAt(0).toString(16).toUpperCase()}`);

const objectUri = (config: R2Config, key: string) =>
  `/${encode(config.bucket)}/${key.split('/').map(encode).join('/')}`;

async function sha256(value: string | ArrayBuffer | Uint8Array) {
  const bytes = typeof value === 'string' ? encoder.encode(value) : ownedBytes(value);
  return hex(await crypto.subtle.digest('SHA-256', bytes.buffer));
}

async function hmac(key: ArrayBuffer | Uint8Array, value: string) {
  const cryptoKey = await crypto.subtle.importKey('raw', ownedBytes(key).buffer, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(value)));
}

function stamp(now = new Date()) {
  const iso = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  return { amzDate: iso, date: iso.slice(0, 8) };
}

async function signingKey(config: R2Config, date: string) {
  const dateKey = await hmac(encoder.encode(`AWS4${config.secretAccessKey}`), date);
  const regionKey = await hmac(dateKey, 'auto');
  const serviceKey = await hmac(regionKey, 's3');
  return hmac(serviceKey, 'aws4_request');
}

export async function presignR2(key: string, method: 'GET' | 'PUT', expires = 900) {
  const config = getR2Config();
  const { amzDate, date } = stamp();
  const scope = `${date}/auto/s3/aws4_request`;
  const params: Record<string, string> = {
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': `${config.accessKeyId}/${scope}`,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': String(expires),
    'X-Amz-SignedHeaders': 'host',
  };
  const query = Object.entries(params).sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => `${encode(name)}=${encode(value)}`).join('&');
  const uri = objectUri(config, key);
  const canonical = `${method}\n${uri}\n${query}\nhost:${config.host}\n\nhost\nUNSIGNED-PAYLOAD`;
  const toSign = `AWS4-HMAC-SHA256\n${amzDate}\n${scope}\n${await sha256(canonical)}`;
  const signature = hex(await hmac(await signingKey(config, date), toSign));
  return `https://${config.host}${uri}?${query}&X-Amz-Signature=${signature}`;
}

export async function r2Request(
  key: string,
  method: 'GET' | 'PUT' | 'HEAD' | 'DELETE',
  body?: ArrayBuffer | Uint8Array,
  contentType?: string,
) {
  const config = getR2Config();
  const { amzDate, date } = stamp();
  const payloadHash = await sha256(body ?? new Uint8Array());
  const signedHeaderNames = ['host', 'x-amz-content-sha256', 'x-amz-date'];
  const canonicalHeaders = `host:${config.host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
  const uri = objectUri(config, key);
  const canonical = `${method}\n${uri}\n\n${canonicalHeaders}\n${signedHeaderNames.join(';')}\n${payloadHash}`;
  const scope = `${date}/auto/s3/aws4_request`;
  const toSign = `AWS4-HMAC-SHA256\n${amzDate}\n${scope}\n${await sha256(canonical)}`;
  const signature = hex(await hmac(await signingKey(config, date), toSign));
  const headers: Record<string, string> = {
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
    Authorization: `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${scope}, SignedHeaders=${signedHeaderNames.join(';')}, Signature=${signature}`,
  };
  if (contentType) headers['Content-Type'] = contentType;
  return fetch(`https://${config.host}${uri}`, { method, headers, body: body ? new Uint8Array(body) : undefined });
}

export function privateFileId(ref: string) {
  const match = /^r2:([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i.exec(ref);
  return match?.[1] ?? null;
}
