/**
 * Проверяет: `BR-constraint.web-app-browser-chat` (i18n ru/en, паритет ключей),
 * `BR-constraint.ui-header` (тема/язык), `ADR-DES.UI.tailwind-css-adoption` (тёмная по умолчанию).
 */
import { describe, expect, it } from 'vitest';
import { useI18n } from '../adapters/i18n';
import { messages } from '../adapters/i18n/messages';
import { useTheme } from '../adapters/theme';

describe('adapters: i18n (ru/en)', () => {
  it('по умолчанию — русский', () => {
    const i18n = useI18n();
    expect(i18n.state.locale).toBe('ru');
  });

  it('переключение локали меняет перевод', () => {
    const i18n = useI18n();
    i18n.setLocale('en');
    expect(i18n.t('sidebar.new-session')).toBe('+ New session');
    i18n.setLocale('ru');
    expect(i18n.t('sidebar.new-session')).toBe('+ Новая сессия');
  });

  it('все ключи ru присутствуют в en (паритет локалей)', () => {
    const ruKeys = Object.keys(messages.ru).sort();
    const enKeys = Object.keys(messages.en).sort();
    expect(enKeys).toEqual(ruKeys);
  });

  it('нет пустых переводов', () => {
    for (const locale of ['ru', 'en'] as const) {
      for (const [key, value] of Object.entries(messages[locale])) {
        expect(value.trim(), `${locale}:${key}`).not.toBe('');
      }
    }
  });
});

describe('adapters: theme', () => {
  it('по умолчанию — тёмная тема', () => {
    const theme = useTheme();
    expect(theme.state.theme).toBe('dark');
  });

  it('setTheme применяет data-theme на html', () => {
    const theme = useTheme();
    theme.setTheme('light');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(theme.state.theme).toBe('light');
    theme.setTheme('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });
});
