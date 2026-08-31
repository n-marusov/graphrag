<script setup lang="ts">
// Трассируемость: F1 (vision §2.2), `ADR-DES.UI.chat-only-interface` (UI — только чат);
// `UC-answers.grounding.cited-answer` (состояния A1–A3).
import { computed, inject, onMounted } from 'vue';
import { useI18n } from '../../adapters/i18n';
import { chatStoreKey } from '../../adapters/state/chat-store';
import AnswerView from './AnswerView.vue';
import ContradictionView from './ContradictionView.vue';
import ErrorState from './ErrorState.vue';
import LoadingSteps from './LoadingSteps.vue';
import NoSourcesState from './NoSourcesState.vue';
import QuestionInput from './QuestionInput.vue';

const store = inject(chatStoreKey);
if (!store) {
  throw new Error('[chat] chatStoreKey не предоставлен (composition root)');
}
const i18n = useI18n();

onMounted(() => {
  store.loadSessions();
});

const chat = computed(() => store.state.chat);

const suggestions = computed(() => [
  i18n.t('chat.empty.suggestion-1'),
  i18n.t('chat.empty.suggestion-2'),
  i18n.t('chat.empty.suggestion-3'),
]);
</script>

<template>
  <div class="flex h-full flex-col">
    <div class="min-h-0 flex-1 overflow-y-auto px-6 py-6">
      <!-- Транзиентные состояния: загрузка / ошибка -->
      <LoadingSteps
        v-if="chat.kind === 'loading'"
        :phase="chat.phase"
        :question="store.state.lastQuestion"
      />
      <ErrorState v-else-if="chat.kind === 'error'" :code="chat.error.code" @retry="store.retry()" />

      <!-- Нет выбранной сессии (Frame2945) -->
      <div
        v-else-if="!store.state.activeSession"
        class="flex h-full flex-col items-center justify-center gap-3 text-center"
      >
        <p class="text-base font-semibold text-text">{{ i18n.t('chat.empty.select-session') }}</p>
        <p class="max-w-md text-sm text-muted">{{ i18n.t('chat.empty.history-hint') }}</p>
      </div>

      <!-- Новая сессия: пустой диалог (Frame2921) -->
      <div
        v-else-if="store.state.activeSession.turns.length === 0"
        class="flex h-full flex-col items-center justify-center gap-4 text-center"
      >
        <h1 class="text-xl font-semibold text-text">{{ i18n.t('chat.empty.title') }}</h1>
        <p class="text-sm text-muted">{{ i18n.t('chat.empty.subtitle') }}</p>
        <div class="flex flex-wrap justify-center gap-2">
          <button
            v-for="suggestion in suggestions"
            :key="suggestion"
            type="button"
            class="rounded-full border border-border bg-surface-2 px-3 py-1.5 text-sm text-muted transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-accent"
            @click="store.ask(suggestion)"
          >
            {{ suggestion }}
          </button>
        </div>
      </div>

      <!-- Диалог: обращения сессии -->
      <div v-else class="mx-auto flex max-w-3xl flex-col gap-8 py-4">
        <div v-for="turn in store.state.activeSession.turns" :key="turn.id" class="flex flex-col gap-2">
          <p class="text-base font-semibold text-text">{{ turn.question }}</p>
          <AnswerView
            v-if="turn.answer?.status === 'answered' && !turn.answer.contradiction"
            :sections="turn.answer.sections"
          />
          <ContradictionView
            v-else-if="turn.answer?.contradiction"
            :contradiction="turn.answer.contradiction"
          />
          <NoSourcesState v-else-if="turn.answer?.status === 'no_sources'" />
          <p v-else-if="turn.answer?.status === 'ambiguous'" class="text-sm text-muted">
            {{ turn.answer.clarification }}
          </p>
        </div>
      </div>
    </div>

    <QuestionInput :disabled="chat.kind === 'loading'" @submit="store.ask($event)" />
  </div>
</template>
