<script setup lang="ts">
// Трассируемость: F1.1 (асинхронный пайплайн), `specs/contracts/openapi.yaml` (`AnswerPhase`).
import { useI18n } from '../../adapters/i18n';
import Icon from '../icons/Icon.vue';

defineProps<{
  /** Этап пайплайна (поиск источников / генерация) */
  phase: 'retrieval' | 'generation' | null;
  /** Текущий вопрос (показывается над индикатором) */
  question?: string | null;
}>();

const i18n = useI18n();
</script>

<template>
  <div class="flex flex-col items-center gap-3 py-16 text-center" role="status" aria-live="polite">
    <p v-if="question" class="max-w-xl text-sm font-medium text-text">{{ question }}</p>
    <span class="flex h-10 w-10 animate-pulse items-center justify-center rounded-full bg-surface-2 text-accent">
      <Icon name="refresh-cw" :size="18" />
    </span>
    <p class="text-sm font-medium text-muted">
      {{
        phase === 'generation'
          ? i18n.t('chat.loading.generation')
          : i18n.t('chat.loading.retrieval')
      }}
    </p>
    <p class="text-xs text-faint">{{ i18n.t('chat.loading.hint') }}</p>
  </div>
</template>
