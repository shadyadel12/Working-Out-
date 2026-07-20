import { supabase } from '../lib/supabase';

type UploadContext = {
  purpose: 'chat-attachment' | 'workout-video';
  coachId?: string;
  playerId: string;
};

async function action<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('r2-storage', { body });
  if (error) throw new Error(error.message || 'Private storage request failed.');
  if (data?.error) throw new Error(data.error);
  return data as T;
}

export async function uploadPrivateBytes(
  bytes: ArrayBuffer,
  fileName: string,
  contentType: string,
  context: UploadContext,
) {
  const created = await action<{ ref: string; uploadUrl: string }>({
    action: 'create-upload', ...context, fileName, contentType, size: bytes.byteLength,
  });
  try {
    const uploaded = await fetch(created.uploadUrl, {
      method: 'PUT', headers: { 'Content-Type': contentType }, body: bytes,
    });
    if (!uploaded.ok) throw new Error('Cloud storage rejected the upload.');
    await action({ action: 'finalize', ref: created.ref });
    return created.ref;
  } catch (error) {
    await action({ action: 'delete', ref: created.ref }).catch(() => {});
    throw error;
  }
}

export async function getPrivateFileUrl(ref: string) {
  return (await action<{ url: string }>({ action: 'download', ref })).url;
}

export async function deletePrivateFile(ref: string) {
  await action({ action: 'delete', ref });
}

export const isPrivateFileRef = (value: string) => value.startsWith('r2:');
