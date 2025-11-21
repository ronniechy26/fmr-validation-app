import { AttachmentPayload, ClientFormPayload, FormRecord, ValidationForm } from '@/types/forms';
import { config } from '@/constants/config';
import { OfflineSnapshot } from '@/types/offline';
import { LoginPayload, LoginResponse } from '@/types/auth';

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
  let response: Response;
  try {
    response = await fetch(url, {
      ...restOptions,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(authToken && !skipAuth ? { Authorization: `Bearer ${authToken}` } : {}),
        ...(restOptions.headers ?? {}),
      },
    });
  } catch (error) {
    const fallbackMessage = (error as Error | undefined)?.message || 'Network request failed';
    throw new HttpError(fallbackMessage, 0);
  }
  if (!response.ok) {
    const message = await safeParseError(response);
    throw new HttpError(message || `Request failed with status ${response.status}`, response.status);
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
