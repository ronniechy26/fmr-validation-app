import { config } from '@/constants/config';
import { OfflineSnapshot } from '@/storage/offline-store';

const { apiBaseUrl } = config;

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

async function request<T>(path: string, options: RequestInit = {}) {
  const url = `${apiBaseUrl}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });
  if (!response.ok) {
    const message = await safeParseError(response);
    throw new Error(message || `Request failed with status ${response.status}`);
  }
  return (await response.json()) as T;
}

async function safeParseError(response: Response) {
  try {
    const payload = await response.json();
    if (typeof payload?.message === 'string') {
      return payload.message;
    }
  } catch {
    // ignore
  }
  return undefined;
}

export function fetchSnapshotFromServer(signal?: AbortSignal) {
  return request<OfflineSnapshot>('/sync/snapshot', { method: 'GET' as HttpMethod, signal });
}
