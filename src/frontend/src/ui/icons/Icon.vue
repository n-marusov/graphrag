<script setup lang="ts">
// Трассируемость: `BR-constraint.ui-visual-standards` (иконки, contrast),
// `BR-constraint.web-app-browser-chat` (aria-hidden для декоративных иконок).
import { type IconName, icons } from './registry';

// ВАЖНО: v-html в шаблоне безопасен, только пока body берётся из статического
// реестра icons (registry.ts, `as const`). Не передавайте в реестр пользовательский ввод.
withDefaults(
  defineProps<{
    name: IconName;
    size?: number;
  }>(),
  {
    size: 16,
  },
);
</script>

<template>
  <svg
    class="gr-icon"
    :width="size"
    :height="size"
    :viewBox="icons[name].viewBox"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
    v-html="icons[name].body"
  />
</template>