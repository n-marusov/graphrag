/**
 * Проверяет: `BR-constraint.ui-footer` — инжекция версии и SHA сборки (Vite define).
 */
import { describe, expect, it } from 'vitest';
import { APP_COMMIT, APP_VERSION } from '../app/meta';

describe('app: метаданные сборки (Vite define)', () => {
  it('версия — семантическая (package.json)', () => {
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('коммит — короткий SHA или dev', () => {
    expect(APP_COMMIT).toMatch(/^[0-9a-f]{7,}$|^dev$/);
  });
});
