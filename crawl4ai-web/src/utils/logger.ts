type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const logLevel = (import.meta.env.VITE_LOG_LEVEL || 'info') as LogLevel;
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const shouldLog = (level: LogLevel): boolean => {
  return LOG_LEVELS[level] >= LOG_LEVELS[logLevel];
};

const formatMessage = (level: LogLevel, ...args: any[]): string[] => {
  const timestamp = new Date().toISOString();
  const prefix = `[${level.toUpperCase()}] ${timestamp}`;
  return [prefix, ...args];
};

export const logger = {
  debug: (...args: any[]) => {
    if (shouldLog('debug')) {
      console.debug(...formatMessage('debug', ...args));
    }
  },
  info: (...args: any[]) => {
    if (shouldLog('info')) {
      console.log(...formatMessage('info', ...args));
    }
  },
  warn: (...args: any[]) => {
    if (shouldLog('warn')) {
      console.warn(...formatMessage('warn', ...args));
    }
  },
  error: (...args: any[]) => {
    if (shouldLog('error')) {
      console.error(...formatMessage('error', ...args));
    }
  },
  group: (name: string) => {
    if (shouldLog('debug')) {
      console.group(name);
    }
  },
  groupEnd: () => {
    if (shouldLog('debug')) {
      console.groupEnd();
    }
  }
};
