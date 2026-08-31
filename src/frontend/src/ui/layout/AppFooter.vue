<script setup lang="ts">
// Трассируемость: `BR-constraint.ui-footer` (версия + SHA моноширинно, ссылка «Мониторинг»).
import { useI18n } from '../../adapters/i18n';

defineProps<{
  /** Версия продукта (BR-constraint.ui-footer, моноширинный шрифт) */
  version: string;
  /** SHA сборки (BR-constraint.ui-footer, моноширинный шрифт) */
  sha: string;
}>();

const i18n = useI18n();
</script>

<template>
  <footer class="flex h-9 shrink-0 items-center justify-between border-t border-border bg-surface px-4">
    <span class="font-mono text-xs text-faint">graphrag {{ version }} · {{ sha }}</span>
    <a href="#" class="text-xs text-muted transition-colors hover:text-accent">
      {{ i18n.t('footer.monitoring') }}
    </a>
  </footer>
</template>
