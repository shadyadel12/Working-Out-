import { supabase } from '../lib/supabase';

const BUCKET = 'profile-photos';
const MAX_BYTES = 5 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export function validateProfilePhoto(file: File) {
  if (!EXTENSIONS[file.type]) throw new Error('Choose a JPEG, PNG, or WebP image.');
  if (file.size > MAX_BYTES) throw new Error('The profile photo must be 5 MB or smaller.');
}

export async function getProfilePhotoUrl(path: string) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}

export async function uploadProfilePhoto(userId: string, file: File, previousPath: string | null) {
  validateProfilePhoto(file);
  const extension = EXTENSIONS[file.type];
  const path = `${userId}/avatar-${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const upload = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    contentType: file.type,
    upsert: false,
  });
  if (upload.error) throw upload.error;

  const update = await supabase.from('profiles').update({ avatar_path: path }).eq('id', userId);
  if (update.error) {
    await supabase.storage.from(BUCKET).remove([path]);
    throw update.error;
  }

  if (previousPath && previousPath !== path) {
    const removal = await supabase.storage.from(BUCKET).remove([previousPath]);
    if (removal.error) console.warn('The previous profile photo could not be removed.', removal.error);
  }
  return { path, signedUrl: await getProfilePhotoUrl(path) };
}
