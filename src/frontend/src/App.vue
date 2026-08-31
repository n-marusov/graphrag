<script setup lang="ts">
// Трассируемость: `ADR-DES.UI.spa-typescript-frontend` (composition root),
// `ADR-DES.UI.chat-only-interface` (композиция UI), `BR-constraint.ui-footer` (версия/SHA).
import { computed, provide } from 'vue';
import { chatStoreKey } from './adapters/state/chat-store';
import { bootstrap } from './app/bootstrap';
import { APP_COMMIT, APP_VERSION } from './app/meta';
import AppLayout from './ui/layout/AppLayout.vue';
import ProvenancePanel from './ui/provenance/ProvenancePanel.vue';

const store = bootstrap();
provide(chatStoreKey, store);

const chat = computed(() => store.state.chat);
const indexVersion = computed(() => {
  if (store.state.activeSession) {
    const turns = store.state.activeSession.turns;
    const lastTurn = turns[turns.length - 1];
    if (lastTurn?.answer?.traceRef?.indexVersion) return lastTurn.answer.traceRef.indexVersion;
  }
  if (chat.value.kind === 'answer') return chat.value.answer.traceRef?.indexVersion;
  return undefined;
});
</script>

<template>
  <AppLayout :index-version="indexVersion" :version="APP_VERSION" :sha="APP_COMMIT">
    <template #chat>
      <router-view />
    </template>
    <template #provenance>
      <ProvenancePanel :chat="chat" />
    </template>
  </AppLayout>
</template>
