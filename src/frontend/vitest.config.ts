import { fileURLToPath, URL } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';
import { resolveAppMeta } from './build/app-meta';

// Трассируемость: `RULES.md` (TDD, тесты до реализации), `specs/qa/unit-testing.md`,
// `BR-constraint.ui-footer` (инжекция версии/SHA для тестов метаданных).

const { APP_VERSION, APP_COMMIT } = resolveAppMeta();

export default defineConfig({
  plugins: [vue()],
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
    __APP_COMMIT__: JSON.stringify(APP_COMMIT),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
