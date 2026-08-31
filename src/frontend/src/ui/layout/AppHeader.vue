<script setup lang="ts">
// Трассируемость: `BR-constraint.ui-header` (название продукта; версия индекса,
// переключатель темы, выбор языка).
import { type Locale, useI18n } from '../../adapters/i18n';
import { useTheme } from '../../adapters/theme';
import Icon from '../icons/Icon.vue';

defineProps<{
  /** Версия индекса (provenance, BR-constraint.ui-header) */
  indexVersion?: string;
}>();

const i18n = useI18n();
const theme = useTheme();

function onLocaleChange(event: Event): void {
  i18n.setLocale((event.target as HTMLSelectElement).value as Locale);
}
</script>

<template>
  <header class="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-4">
    <span class="text-lg font-semibold text-text">{{ i18n.t('app.name') }}</span>

    <div class="flex items-center gap-2">
      <span
        v-if="indexVersion"
        class="font-mono text-xs text-muted"
        :title="i18n.t('header.index-version')"
      >
        {{ i18n.t('header.index-version') }}: {{ indexVersion }}
      </span>

      <button
        type="button"
        class="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:text-text focus-visible:outline-2 focus-visible:outline-accent"
        :aria-label="i18n.t('header.theme')"
        :title="i18n.t('header.theme')"
        @click="theme.toggle()"
      >
        <Icon name="moon" :size="16" />
      </button>

      <select
        class="h-8 cursor-pointer rounded-lg border border-border bg-surface-2 px-2 text-sm text-text focus-visible:outline-2 focus-visible:outline-accent"
        :value="i18n.state.locale"
        :aria-label="i18n.t('header.language')"
        @change="onLocaleChange"
      >
        <option value="ru">RU</option>
        <option value="en">EN</option>
      </select>
    </div>
  </header>
</template>
