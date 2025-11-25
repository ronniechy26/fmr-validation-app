import { AttachmentPayload, ClientFormPayload, FormRecord, ValidationForm } from '@/types/forms';
import { config } from '@/constants/config';
import { OfflineSnapshot } from '@/types/offline';
import { LoginPayload, LoginResponse } from '@/types/auth';
import { logger } from '@/lib/logger';

const { apiBaseUrl } = config;

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export class HttpError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: (RequestInit & { skipAuth?: boolean }) = {}) {
  const { skipAuth, ...restOptions } = options;
  const url = `${apiBaseUrl}${path}`;
  console.log('[API] Request:', { url, method: restOptions.method ?? 'GET', apiBaseUrl });
  logger.info('api', 'request:start', { path, method: restOptions.method ?? 'GET' });

  let response: Response;
  try {
    // Add 30-second timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn('[API] Request timeout after 30s:', url);
      controller.abort();
    }, 30000);

    try {
      response = await fetch(url, {
        ...restOptions,
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...(authToken && !skipAuth ? { Authorization: `Bearer ${authToken}` } : {}),
          ...(restOptions.headers ?? {}),
        },
      });
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    const fallbackMessage = (error as Error | undefined)?.message || 'Network request failed';
    console.error('[API] Request error:', { url, error: fallbackMessage });
    logger.error('api', 'request:error', { path, error: fallbackMessage });
    throw new HttpError(fallbackMessage, 0);
  }
  if (!response.ok) {
    const message = await safeParseError(response);
    console.warn('[API] Request failed:', { url, status: response.status, message });
    logger.warn('api', 'request:fail', { path, status: response.status, message });
    throw new HttpError(message || `Request failed with status ${response.status}`, response.status);
  }
  console.log('[API] Request success:', { url, status: response.status });
  logger.info('api', 'request:success', { path, status: response.status });
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

export function login(payload: LoginPayload) {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
    skipAuth: true,
  });
}

export function refreshSession(refreshToken: string) {
  return request<LoginResponse>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
    skipAuth: true,
  });
}

export function fetchSnapshotFromServer(signal?: AbortSignal) {
  return request<OfflineSnapshot>('/sync/snapshot', { method: 'GET' as HttpMethod, signal });
}

export function fetchProjectsFromServer(signal?: AbortSignal) {
  return request<{ projects: any[] }>('/sync/projects', { method: 'GET' as HttpMethod, signal });
}

export function fetchFormsFromServer(since?: number, signal?: AbortSignal) {
  const params = since ? `?since=${since}` : '';
  return request<{ forms: FormRecord[] }>(`/sync/forms${params}`, { method: 'GET' as HttpMethod, signal });
}

export function syncFormsFromClient(forms: ClientFormPayload[]) {
  return request<FormRecord[]>('/sync/forms', { method: 'POST', body: JSON.stringify({ forms }) });
}

export function attachFormWithPayload(formId: string, payload: AttachmentPayload) {
  return request<FormRecord>(`/forms/${encodeURIComponent(formId)}/attach`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteForm(formId: string) {
  return request<void>(`/forms/${encodeURIComponent(formId)}`, {
    method: 'DELETE',
  });
}

export function fetchSnapshotWithProgress(
  onProgress: (percent: number) => void
): Promise<OfflineSnapshot> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `${apiBaseUrl}/sync/snapshot`);

    // Add auth header if token exists
    if (authToken) {
      xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);
    }
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve(data);
        } catch (e) {
          reject(new HttpError('Failed to parse server response', xhr.status));
        }
      } else {
        reject(new HttpError(`Request failed with status ${xhr.status}`, xhr.status));
      }
    };

    xhr.onerror = () => reject(new HttpError('Network request failed', 0));
    xhr.send();
  });
}

