import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Трассируемость: `BR-constraint.ui-footer` (версия продукта и SHA сборки в футере).

/**
 * Метаданные сборки приложения: версия пакета + короткий SHA коммита.
 *
 * Используется конфигами Vite/Vitest для инжекции в сборку через `define`
 * (`__APP_VERSION__`, `__APP_COMMIT__`); потребитель — `src/app/meta.ts`.
 *
 * Источник SHA: `CI_COMMIT_SHORT_SHA` (GitLab CI) → `VITE_APP_COMMIT`
 * (ручное переопределение) → `git rev-parse --short HEAD` → `dev`.
 */
export interface AppMeta {
  APP_VERSION: string;
  APP_COMMIT: string;
}

export function resolveAppMeta(): AppMeta {
  const pkgPath = fileURLToPath(new URL('../package.json', import.meta.url));
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as { version: string };

  let commit = process.env.CI_COMMIT_SHORT_SHA ?? process.env.VITE_APP_COMMIT;
  if (!commit) {
    try {
      commit = execSync('git rev-parse --short HEAD', {
        stdio: ['ignore', 'pipe', 'ignore'],
      })
        .toString()
        .trim();
    } catch {
      commit = undefined;
    }
  }

  return {
    APP_VERSION: pkg.version,
    APP_COMMIT: commit || 'dev',
  };
}
