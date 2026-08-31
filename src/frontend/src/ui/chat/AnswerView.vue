<script setup lang="ts">
// Трассируемость: F1.1, glossary «Ответ»/«Атрибуция источников» (пораздельная атрибуция).
import type { AnswerSection } from '../../domain/answer';
import Icon from '../icons/Icon.vue';

defineProps<{
  sections: AnswerSection[];
}>();
</script>

<template>
  <div class="flex flex-col gap-6">
    <section v-for="(section, index) in sections" :key="index" class="flex flex-col gap-2">
      <h3 v-if="section.heading" class="text-base font-semibold text-text">{{ section.heading }}</h3>
      <p class="whitespace-pre-wrap text-sm leading-relaxed text-text">{{ section.text }}</p>
      <ul v-if="section.citations.length > 0" class="flex flex-wrap gap-1.5">
        <li
          v-for="(citation, cIndex) in section.citations"
          :key="cIndex"
          class="flex items-center gap-1 rounded-md border border-border bg-surface-2 px-2 py-1 font-mono text-xs text-muted"
        >
          <Icon name="file-text" :size="12" />
          {{ citation.source }}
        </li>
      </ul>
    </section>
  </div>
</template>
