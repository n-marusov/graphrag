<script setup lang="ts">
// Трассируемость: glossary «Происхождение»;
// `REQ-NFR-data.maintainability.versioned-provenance` (версия индекса).
import { computed } from 'vue';
import { useI18n } from '../../adapters/i18n';
import { provenanceSources } from '../../adapters/mappers/presenter';
import type { ChatViewState } from '../../application/chat-state-machine';
import Icon from '../icons/Icon.vue';
import CitationCard from './CitationCard.vue';

const props = defineProps<{
  /** Текущее состояние чата (из store) */
  chat: ChatViewState;
}>();

const i18n = useI18n();

const sources = computed(() => {
  if (props.chat.kind !== 'answer') return [];
  return provenanceSources(props.chat.answer);
});

const indexVersion = computed(() => {
  if (props.chat.kind !== 'answer') return undefined;
  return props.chat.answer.traceRef?.indexVersion;
});

const emptyMessage = computed(() => {
  switch (props.chat.kind) {
    case 'no_sources':
      return i18n.t('provenance.no-sources');
    case 'error':
      return i18n.t('provenance.unavailable');
    default:
      return i18n.t('provenance.empty');
  }
});
</script>

<template>
  <aside class="flex h-full flex-col" :aria-label="i18n.t('provenance.title')">
    <div class="flex items-center justify-between border-b border-border px-4 py-3">
      <h2 class="text-sm font-semibold text-text">{{ i18n.t('provenance.title') }}</h2>
      <span v-if="sources.length > 0" class="text-xs text-faint">{{ sources.length }} {{ i18n.t('provenance.source-count') }}</span>
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto p-4">
      <div v-if="indexVersion" class="mb-4 flex items-center gap-1.5 text-xs text-faint">
        <Icon name="clock" :size="12" />
        {{ i18n.t('provenance.index-version') }}: <span class="font-mono text-muted">{{ indexVersion }}</span>
      </div>

      <div v-if="sources.length > 0" class="flex flex-col gap-2">
        <CitationCard v-for="(source, index) in sources" :key="index" :citation="source" />
      </div>

      <p v-else class="text-xs leading-relaxed text-faint">{{ emptyMessage }}</p>
    </div>
  </aside>
</template>
