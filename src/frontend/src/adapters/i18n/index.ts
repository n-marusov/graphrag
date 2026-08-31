/**
 * i18n-композибл (ru/en).
 *
 * Выбор языка сохраняется на время сессии пользователя
 * (BR-constraint.ui-header; постоянство между сессиями — открытый вопрос Q4.4,
 * `specs/open-questions.md`).
 *
 * Трассируемость: `BR-constraint.web-app-browser-chat` (i18n ru/en),
 * `BR-constraint.ui-header` (выбор языка на время сессии).
 */

import { reactive } from 'vue';
import { log } from '../../application/logger';
import { type Locale, type MessageKey, messages } from './messages';

export type { Locale } from './messages';

const state = reactive<{ locale: Locale }>({ locale: 'ru' });

export function useI18n() {
  return {
    state,
    setLocale(locale: Locale): void {
      state.locale = locale;
      log.debug('i18n.setLocale', { locale });
    },
    /** Перевод по ключу; при отсутствии — fallback ru, затем сам ключ */
    t(key: MessageKey): string {
      return messages[state.locale][key] ?? messages.ru[key] ?? key;
    },
  };
}
