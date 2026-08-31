<script setup lang="ts">
// Трассируемость: glossary «Атрибуция источников» (источник, чанк, цитата).
import type { Citation } from '../../domain/citations';
import Icon from '../icons/Icon.vue';

defineProps<{
  citation: Citation;
}>();
</script>

<template>
  <div class="flex flex-col gap-1 rounded-lg border border-border bg-surface-2 p-3">
    <span v-if="citation.title" class="text-sm font-medium text-text">{{ citation.title }}</span>
    <span class="flex items-center gap-1.5 font-mono text-xs text-muted">
      <Icon name="file-text" :size="12" />
      <span class="break-all">{{ citation.source }}</span>
    </span>
    <span v-if="citation.chunk" class="text-xs text-faint">{{ citation.chunk }}</span>
    <blockquote v-if="citation.quote" class="border-l-2 border-border pl-2 text-xs font-medium text-faint">
      {{ citation.quote }}
    </blockquote>
  </div>
</template>
