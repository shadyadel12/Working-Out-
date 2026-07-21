import { supabase } from '../lib/supabase';

export type PrivateFilePurpose = 'workout-video' | 'chat-attachment' | 'support-attachment';

type UploadContext = {
  purpose: PrivateFilePurpose;
  coachId?: string;
  playerId?: string;
};

const MAX_UPLOAD_ATTEMPTS = 3;

const retryDelay = (attempt: number) => new Promise((resolve) => setTimeout(resolve, attempt * 1_000));

async function putFile(uploadUrl: string, file: File) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_UPLOAD_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (response.ok) return;
      if (response.status !== 408 && response.status !== 429 && response.status < 500) {
        throw new Error('Cloud storage rejected the upload.');
      }
      lastError = new Error('Cloud storage temporarily rejected the upload.');
    } catch (error) {
      lastError = error;
      if (error instanceof Error && error.message === 'Cloud storage rejected the upload.') throw error;
    }
    if (attempt < MAX_UPLOAD_ATTEMPTS) await retryDelay(attempt);
  }
  throw lastError;
}

async function storageAction<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('r2-storage', { body });
  if (error) throw new Error(error.message || 'Private storage request failed.');
  if (data?.error) throw new Error(data.error);
  return data as T;
}

/** Upload directly to private R2 using a short-lived server-authorized URL. */
export async function uploadPrivateFile(file: File, context: UploadContext): Promise<string> {
  const created = await storageAction<{ ref: string; uploadUrl: string }>({
    action: 'create-upload',
    ...context,
    fileName: file.name,
    contentType: file.type,
    size: file.size,
  });
  try {
    await putFile(created.uploadUrl, file);
    await storageAction({ action: 'finalize', ref: created.ref });
    return created.ref;
  } catch (error) {
    await storageAction({ action: 'delete', ref: created.ref }).catch(() => {});
    if (error instanceof TypeError && /fetch|load|network/i.test(error.message)) {
      throw new Error('The file could not reach cloud storage. Check your connection and try again.');
    }
    throw error;
  }
}

export async function getPrivateFileUrl(ref: string): Promise<string> {
  const result = await storageAction<{ url: string }>({ action: 'download', ref });
  return result.url;
}

export async function deletePrivateFile(ref: string): Promise<void> {
  await storageAction({ action: 'delete', ref });
}

export const isPrivateFileRef = (value: string) => value.startsWith('r2:');
