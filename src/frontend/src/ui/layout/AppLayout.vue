<script setup lang="ts">
// Трассируемость: `ADR-DES.UI.chat-only-interface` (композиция UI: шапка/сайдбар/чат/происхождение/футер).
import AppFooter from './AppFooter.vue';
import AppHeader from './AppHeader.vue';
import SessionSidebar from './SessionSidebar.vue';

defineProps<{
  /** Версия индекса для шапки (BR-constraint.ui-header) */
  indexVersion?: string;
  /** Версия продукта для футера (BR-constraint.ui-footer) */
  version?: string;
  /** SHA сборки для футера (BR-constraint.ui-footer) */
  sha?: string;
}>();
</script>

<template>
  <div class="flex h-full flex-col bg-bg text-text">
    <AppHeader :index-version="indexVersion" />
    <div class="flex min-h-0 flex-1">
      <aside class="w-72 shrink-0 border-r border-border bg-surface">
        <SessionSidebar />
      </aside>
      <main class="min-w-0 flex-1 overflow-y-auto">
        <slot name="chat" />
      </main>
      <aside class="hidden w-80 shrink-0 border-l border-border bg-surface lg:block">
        <slot name="provenance" />
      </aside>
    </div>
    <AppFooter :version="version ?? '0.1.0'" :sha="sha ?? 'dev'" />
  </div>
</template>
