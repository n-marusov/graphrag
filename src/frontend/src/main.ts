/**
 * Точка входа SPA: монтирование приложения и роутера.
 *
 * Трассируемость: `ADR-DES.UI.spa-typescript-frontend` (тонкий SPA, Vue 3 + Vite),
 * `ADR-DES.UI.chat-only-interface` (UI — только чат).
 */
import { createApp } from 'vue';
import App from './App.vue';
import { router } from './app/router';
import './style.css';

createApp(App).use(router).mount('#app');
