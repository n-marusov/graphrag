/**
 * Тема интерфейса (тёмная/светлая).
 *
 * Тёмная по умолчанию (ADR-DES.UI.tailwind-css-adoption); выбор сохраняется
 * на время сессии (BR-constraint.ui-header). Токены переключаются атрибутом
 * `data-theme` на `<html>` (`assets/styles/tokens.css`).
 *
 * Трассируемость: `ADR-DES.UI.tailwind-css-adoption` (тёмная тема по умолчанию);
 * `BR-constraint.ui-header` (переключатель темы); `BR-constraint.ui-visual-standards`.
 */

import { reactive } from 'vue';
import { log } from '../application/logger';

export type Theme = 'dark' | 'light';

const DEFAULT_THEME: Theme = 'dark';

const state = reactive<{ theme: Theme }>({ theme: DEFAULT_THEME });

function apply(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
}

// Инициализация при первом использовании (html уже имеет data-theme="dark")
apply(state.theme);

export function useTheme() {
  return {
    state,
    setTheme(theme: Theme): void {
      state.theme = theme;
      apply(theme);
      log.debug('theme.setTheme', { theme });
    },
    toggle(): void {
      this.setTheme(state.theme === 'dark' ? 'light' : 'dark');
    },
  };
}
