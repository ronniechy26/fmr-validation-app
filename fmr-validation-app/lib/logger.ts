import Constants from 'expo-constants';

const ENABLE_LOGS = Constants.expoConfig?.extra?.enableLogs ?? false;

type LogLevel = 'info' | 'warn' | 'error';

function log(level: LogLevel, scope: string, message: string, meta?: Record<string, unknown>) {
  if (!ENABLE_LOGS) return;
  const timestamp = new Date().toISOString();
  const body = meta ? { ...meta } : undefined;
  // eslint-disable-next-line no-console
  console[level](`[${timestamp}] [${scope}] ${message}`, body ? body : '');
}

export const logger = {
  info: (scope: string, message: string, meta?: Record<string, unknown>) => log('info', scope, message, meta),
  warn: (scope: string, message: string, meta?: Record<string, unknown>) => log('warn', scope, message, meta),
  error: (scope: string, message: string, meta?: Record<string, unknown>) => log('error', scope, message, meta),
};
