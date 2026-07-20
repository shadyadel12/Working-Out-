import { supabase } from '../lib/supabase';
import { validateVideoFile } from '../lib/security';
import { deletePrivateFile, getPrivateFileUrl, isPrivateFileRef, uploadPrivateFile } from './privateFiles';

const BUCKET = 'videos';
const QUARANTINE_BUCKET = 'video-quarantine';
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

/**
 * Upload a video to private quarantine, then ask the server-side scanner to
 * copy it into the final private bucket only after a clean result.
 * ownerId must be the player_id folder (RLS enforces the caller may write there:
 * a player writes their own folder; a coach may write a linked player's folder).
 * Returns the storage path (store this in *_video_url with is_external=false).
 */
export async function uploadVideo(ownerId: string, file: File): Promise<string> {
  await validateVideoFile(file, MAX_VIDEO_BYTES);
  const r2Ref = await uploadPrivateFile(file, { purpose: 'workout-video', playerId: ownerId });
  const { data, error } = await supabase.functions.invoke('scan-video', { body: { fileRef: r2Ref } });
  if (error || !data?.path) {
    await deletePrivateFile(r2Ref).catch(() => {});
    throw new Error(data?.error ?? error?.message ?? 'Video scan failed.');
  }
  return data.path as string;
}

/** Legacy Supabase quarantine path retained for rollback and old deployments. */
export async function uploadVideoToSupabase(ownerId: string, file: File): Promise<string> {
  await validateVideoFile(file, MAX_VIDEO_BYTES);
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const quarantinePath = `${ownerId}/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
  const { error } = await supabase.storage.from(QUARANTINE_BUCKET).upload(quarantinePath, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;
  const { data, error: scanError } = await supabase.functions.invoke('scan-video', {
    body: { quarantinePath, ownerId, fileName: safeName, contentType: file.type },
  });
  if (scanError || !data?.path) {
    await supabase.storage.from(QUARANTINE_BUCKET).remove([quarantinePath]).catch(() => {});
    throw new Error(data?.error ?? scanError?.message ?? 'Video scan failed.');
  }
  return data.path as string;
}

/** Signed URL for a stored (private) video path. Expires in `seconds`. */
export async function getVideoUrl(path: string, seconds = 3600): Promise<string> {
  if (isPrivateFileRef(path)) return getPrivateFileUrl(path);
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, seconds);
  if (error) throw error;
  return data.signedUrl;
}
