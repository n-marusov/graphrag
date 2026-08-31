/**
 * Версия и SHA сборки, инжектируемые на этапе сборки
 * (vite.config.ts / vitest.config.ts → `define`).
 *
 * Значения: `package.json` version + короткий SHA git (или `CI_COMMIT_SHORT_SHA`
 * в CI; переопределение — `VITE_APP_COMMIT`). Источник — `build/app-meta.ts`.
 *
 * Трассируемость: `BR-constraint.ui-footer` (версия продукта и SHA сборки).
 */

declare const __APP_VERSION__: string;
declare const __APP_COMMIT__: string;

export const APP_VERSION: string = __APP_VERSION__;
export const APP_COMMIT: string = __APP_COMMIT__;
