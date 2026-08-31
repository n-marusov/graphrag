import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import { resolveAppMeta } from './build/app-meta';

// Трассируемость: `ADR-DES.UI.spa-typescript-frontend` (Vue 3 + Vite, тонкий SPA),
// `ADR-DES.UI.tailwind-css-adoption` (@tailwindcss/vite), `BR-constraint.ui-footer` (инжекция версии/SHA).

const { APP_VERSION, APP_COMMIT } = resolveAppMeta();

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
    __APP_COMMIT__: JSON.stringify(APP_COMMIT),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
