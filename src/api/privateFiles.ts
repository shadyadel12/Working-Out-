import { supabase } from '../lib/supabase';

export type PrivateFilePurpose = 'workout-video' | 'chat-attachment' | 'support-attachment';

type UploadContext = {
  purpose: PrivateFilePurpose;
  coachId?: string;
  playerId?: string;
};

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
    const response = await fetch(created.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });
    if (!response.ok) throw new Error('Cloud storage rejected the upload.');
    await storageAction({ action: 'finalize', ref: created.ref });
    return created.ref;
  } catch (error) {
    await storageAction({ action: 'delete', ref: created.ref }).catch(() => {});
    if (error instanceof TypeError && /fetch|load|network/i.test(error.message)) {
      throw new Error('The video could not reach cloud storage. Refresh the page and try again.');
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
