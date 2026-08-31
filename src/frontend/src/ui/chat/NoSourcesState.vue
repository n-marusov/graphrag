<script setup lang="ts">
// Трассируемость: `UC-answers.grounding.cited-answer` (A1 — «источники не найдены»).
import { useI18n } from '../../adapters/i18n';
import Icon from '../icons/Icon.vue';

const i18n = useI18n();
</script>

<template>
  <div class="flex flex-col items-start gap-3 py-8">
    <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-warning">
      <Icon name="search-x" :size="18" />
    </span>
    <h2 class="text-base font-semibold text-text">{{ i18n.t('chat.no-sources.title') }}</h2>
    <p class="max-w-xl text-sm text-muted">{{ i18n.t('chat.no-sources.description') }}</p>
    <p class="mt-2 text-sm font-medium text-text">{{ i18n.t('chat.no-sources.try') }}</p>
    <ul class="list-inside list-disc text-sm text-muted">
      <li>{{ i18n.t('chat.no-sources.tip-1') }}</li>
      <li>{{ i18n.t('chat.no-sources.tip-2') }}</li>
      <li>{{ i18n.t('chat.no-sources.tip-3') }}</li>
    </ul>
  </div>
</template>
