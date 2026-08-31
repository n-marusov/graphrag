import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';

/**
 * Единственный маршрут — чат (ADR-DES.UI.chat-only-interface).
 *
 * Трассируемость: `ADR-DES.UI.chat-only-interface` (UI — только чат, F1).
 */
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'chat',
    component: () => import('@/ui/chat/ChatView.vue'),
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
