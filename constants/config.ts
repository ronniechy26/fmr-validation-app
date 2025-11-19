const DEFAULT_API_URL = 'http://localhost:3000';

const normalizeUrl = (url: string) => url.replace(/\/+$/, '');

export const config = {
  apiBaseUrl: normalizeUrl(process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL),
};
