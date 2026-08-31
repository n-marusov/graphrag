/**
 * Лёгкий логгер приложения (application-слой).
 *
 * Уровень задаётся через `VITE_LOG_LEVEL` (debug | verbose | info | warn | error),
 * по умолчанию — info. Не зависит от UI-фреймворка; префикс `[graphrag]`
 * облегчает фильтрацию в консоли разработчика.
 *
 * Трассируемость: `REQ-NFR-api.observability.golden-signals` (логирование приложения).
 */

type LogLevel = 'debug' | 'verbose' | 'info' | 'warn' | 'error';

const currentLevel: LogLevel = (import.meta.env.VITE_LOG_LEVEL as LogLevel | undefined) ?? 'info';

const enabled = { debug: 0, verbose: 1, info: 2, warn: 3, error: 4 }[currentLevel] ?? 2;

function shouldLog(level: LogLevel): boolean {
  return { debug: 0, verbose: 1, info: 2, warn: 3, error: 4 }[level] >= enabled;
}

export const log = {
  debug(...args: unknown[]): void {
    if (shouldLog('debug')) console.debug('[graphrag]', ...args);
  },
  info(...args: unknown[]): void {
    if (shouldLog('info')) console.info('[graphrag]', ...args);
  },
  warn(...args: unknown[]): void {
    if (shouldLog('warn')) console.warn('[graphrag]', ...args);
  },
  error(...args: unknown[]): void {
    if (shouldLog('error')) console.error('[graphrag]', ...args);
  },
};
