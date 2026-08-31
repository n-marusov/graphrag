<script setup lang="ts">
// Трассируемость: F1.1, `BR-constraint.web-app-browser-chat` (ввод с клавиатуры, WCAG).
import { ref } from 'vue';
import { useI18n } from '../../adapters/i18n';
import Icon from '../icons/Icon.vue';

defineProps<{
  /** Блокирует ввод, пока ответ формируется */
  disabled?: boolean;
}>();

const emit = defineEmits<{
  submit: [question: string];
}>();

const i18n = useI18n();
const question = ref('');

function onSubmit(): void {
  const trimmed = question.value.trim();
  if (!trimmed) return;
  emit('submit', trimmed);
  question.value = '';
}
</script>

<template>
  <form class="flex items-end gap-2 border-t border-border bg-surface p-3" @submit.prevent="onSubmit">
    <label class="sr-only" for="question-input">{{ i18n.t('chat.input-placeholder') }}</label>
    <textarea
      id="question-input"
      v-model="question"
      rows="1"
      class="max-h-32 min-h-10 flex-1 resize-y rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text placeholder:text-faint focus-visible:outline-2 focus-visible:outline-accent"
      :placeholder="i18n.t('chat.input-placeholder')"
      :disabled="disabled"
      @keydown.enter.exact.prevent="onSubmit"
    />
    <button
      type="submit"
      class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-accent"
      :disabled="disabled || !question.trim()"
      :aria-label="i18n.t('chat.submit')"
      :title="i18n.t('chat.submit')"
    >
      <Icon name="message-circle" :size="18" />
    </button>
  </form>
</template>
