<script setup lang="ts">
// Трассируемость: `UC-answers.grounding.cited-answer` (A2 — противоречие с источниками),
// `specs/domain/domain-events.md` (`ConflictDetected`, отображение read-only).
import { useI18n } from '../../adapters/i18n';
import type { Contradiction } from '../../domain/answer';
import Icon from '../icons/Icon.vue';

defineProps<{
  contradiction: Contradiction;
}>();

const i18n = useI18n();
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-start gap-2 rounded-lg border border-warning/40 bg-surface-2 p-3">
      <span class="mt-0.5 shrink-0 text-warning">
        <Icon name="triangle-alert" :size="16" />
      </span>
      <p class="text-sm font-medium text-text">
        {{ contradiction.notice || i18n.t('chat.contradiction.notice') }}
      </p>
    </div>

    <div
      v-for="variant in contradiction.variants"
      :key="variant.label"
      class="flex flex-col gap-2 rounded-lg border border-border bg-surface-2 p-4"
    >
      <h3 class="text-sm font-semibold text-text">{{ variant.label }}</h3>
      <p class="whitespace-pre-wrap text-sm leading-relaxed text-text">{{ variant.text }}</p>
      <ul v-if="variant.citations.length > 0" class="flex flex-wrap gap-1.5">
        <li
          v-for="(citation, index) in variant.citations"
          :key="index"
          class="flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-1 font-mono text-xs text-muted"
        >
          <Icon name="file-text" :size="12" />
          {{ citation.source }}
        </li>
      </ul>
    </div>
  </div>
</template>
