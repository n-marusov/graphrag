<script setup lang="ts">
// Трассируемость: транспортные ошибки, `specs/contracts/openapi.yaml` (`error_code`, 5xx).
import { useI18n } from '../../adapters/i18n';
import Icon from '../icons/Icon.vue';

const i18n = useI18n();

defineProps<{
  /** Код ошибки (error_code контракта) */
  code: string;
}>();

const emit = defineEmits<{
  retry: [];
}>();
</script>

<template>
  <div class="flex flex-col items-start gap-3 py-8">
    <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-danger">
      <Icon name="server-crash" :size="18" />
    </span>
    <h2 class="text-base font-semibold text-text">{{ i18n.t('chat.error.title') }}</h2>
    <p class="max-w-xl text-sm text-muted">{{ i18n.t('chat.error.description') }}</p>
    <p class="font-mono text-xs text-faint">{{ i18n.t('chat.error.code') }}: {{ code }}</p>
    <button
      type="button"
      class="mt-1 flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-bg transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-accent"
      @click="emit('retry')"
    >
      <Icon name="refresh-cw" :size="14" />
      {{ i18n.t('chat.error.retry') }}
    </button>
  </div>
</template>
