const DEFAULT_API_URL = 'http://172.16.9.22:3000';

const normalizeUrl = (url: string) => url.replace(/\/+$/, '');

export const config = {
  apiBaseUrl: normalizeUrl(process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL),
};
