import { supabase } from '../lib/supabase';
import * as FileSystem from 'expo-file-system/legacy';

type UploadContext = {
  purpose: 'chat-attachment' | 'chat-voice' | 'workout-video';
  coachId?: string;
  playerId: string;
};

const MAX_UPLOAD_ATTEMPTS = 3;

const retryDelay = (attempt: number) => new Promise((resolve) => setTimeout(resolve, attempt * 1_000));

function retryableStatus(status: number) {
  return status === 408 || status === 429 || status >= 500;
}

async function action<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('r2-storage', { body });
  if (error) throw new Error(error.message || 'Private storage request failed.');
  if (data?.error) throw new Error(data.error);
  return data as T;
}

function uploadError(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  if (/network|fetch|load|timed?\s*out|connection/i.test(message)) {
    return new Error('The file could not reach cloud storage. Check your connection and try again.');
  }
  return error instanceof Error ? error : new Error('Cloud storage upload failed.');
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
    let uploaded = false;
    let lastError: unknown;
    for (let attempt = 1; attempt <= MAX_UPLOAD_ATTEMPTS; attempt++) {
      try {
        const response = await fetch(created.uploadUrl, {
          method: 'PUT', headers: { 'Content-Type': contentType }, body: bytes,
        });
        if (response.ok) {
          uploaded = true;
          break;
        }
        if (!retryableStatus(response.status)) throw new Error('Cloud storage rejected the upload.');
        lastError = new Error('Cloud storage temporarily rejected the upload.');
      } catch (error) {
        lastError = error;
        if (error instanceof Error && error.message === 'Cloud storage rejected the upload.') throw error;
      }
      if (attempt < MAX_UPLOAD_ATTEMPTS) await retryDelay(attempt);
    }
    if (!uploaded) throw lastError;
    await action({ action: 'finalize', ref: created.ref });
    return created.ref;
  } catch (error) {
    await action({ action: 'delete', ref: created.ref }).catch(() => {});
    throw uploadError(error);
  }
}

/** Stream a device file to R2 without copying a large video into JS memory. */
export async function uploadPrivateUri(
  uri: string,
  size: number,
  fileName: string,
  contentType: string,
  context: UploadContext,
) {
  const created = await action<{ ref: string; uploadUrl: string }>({
    action: 'create-upload', ...context, fileName, contentType, size,
  });
  try {
    let uploaded = false;
    let lastError: unknown;
    for (let attempt = 1; attempt <= MAX_UPLOAD_ATTEMPTS; attempt++) {
      try {
        const response = await FileSystem.uploadAsync(created.uploadUrl, uri, {
          httpMethod: 'PUT',
          uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
          headers: { 'Content-Type': contentType },
        });
        if (response.status >= 200 && response.status < 300) {
          uploaded = true;
          break;
        }
        if (!retryableStatus(response.status)) throw new Error('Cloud storage rejected the upload.');
        lastError = new Error('Cloud storage temporarily rejected the upload.');
      } catch (error) {
        lastError = error;
        if (error instanceof Error && error.message === 'Cloud storage rejected the upload.') throw error;
      }
      if (attempt < MAX_UPLOAD_ATTEMPTS) await retryDelay(attempt);
    }
    if (!uploaded) throw lastError;
    await action({ action: 'finalize', ref: created.ref });
    return created.ref;
  } catch (error) {
    await action({ action: 'delete', ref: created.ref }).catch(() => {});
    throw uploadError(error);
  }
}

export async function getPrivateFileUrl(ref: string) {
  return (await action<{ url: string }>({ action: 'download', ref })).url;
}

export async function deletePrivateFile(ref: string) {
  await action({ action: 'delete', ref });
}

export const isPrivateFileRef = (value: string) => value.startsWith('r2:');
