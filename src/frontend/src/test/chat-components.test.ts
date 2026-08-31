import { mount } from '@vue/test-utils';
/**
 * Проверяет: F1.1 и `UC-answers.grounding.cited-answer` (A1–A3) — компоненты чата:
 * ввод вопроса, загрузка, «источники не найдены», противоречие, ошибка, ответ.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { useI18n } from '../adapters/i18n';
import AnswerView from '../ui/chat/AnswerView.vue';
import ContradictionView from '../ui/chat/ContradictionView.vue';
import ErrorState from '../ui/chat/ErrorState.vue';
import LoadingSteps from '../ui/chat/LoadingSteps.vue';
import NoSourcesState from '../ui/chat/NoSourcesState.vue';
import QuestionInput from '../ui/chat/QuestionInput.vue';

beforeEach(() => {
  useI18n().setLocale('ru');
});

describe('ui: QuestionInput', () => {
  it('эмитит submit с вопросом и очищает поле', async () => {
    const wrapper = mount(QuestionInput);
    const textarea = wrapper.find('textarea');
    await textarea.setValue('  Как устроен пайплайн?  ');
    await wrapper.find('form').trigger('submit');
    expect(wrapper.emitted('submit')).toEqual([['Как устроен пайплайн?']]);
    expect((textarea.element as HTMLTextAreaElement).value).toBe('');
  });

  it('не эмитит submit для пустого вопроса', async () => {
    const wrapper = mount(QuestionInput);
    await wrapper.find('form').trigger('submit');
    expect(wrapper.emitted('submit')).toBeUndefined();
  });

  it('disabled блокирует textarea и кнопку', () => {
    const wrapper = mount(QuestionInput, { props: { disabled: true } });
    expect(wrapper.find('textarea').attributes('disabled')).toBeDefined();
    expect(wrapper.find('button').attributes('disabled')).toBeDefined();
  });
});

describe('ui: LoadingSteps', () => {
  it('фаза retrieval показывает «Поиск источников…»', () => {
    const wrapper = mount(LoadingSteps, { props: { phase: 'retrieval' } });
    expect(wrapper.text()).toContain('Поиск источников…');
  });

  it('фаза generation показывает «Генерация ответа…»', () => {
    const wrapper = mount(LoadingSteps, { props: { phase: 'generation' } });
    expect(wrapper.text()).toContain('Генерация ответа…');
  });
});

describe('ui: NoSourcesState (A1)', () => {
  it('показывает заголовок и советы', () => {
    const wrapper = mount(NoSourcesState);
    expect(wrapper.text()).toContain('Источники не найдены');
    expect(wrapper.text()).toContain('Попробуйте:');
    expect(wrapper.findAll('li').length).toBe(3);
  });
});

describe('ui: ErrorState', () => {
  it('показывает код ошибки и эмитит retry', async () => {
    const wrapper = mount(ErrorState, { props: { code: 'GRAPH_TIMEOUT' } });
    expect(wrapper.text()).toContain('GRAPH_TIMEOUT');
    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('retry')).toHaveLength(1);
  });
});

describe('ui: AnswerView', () => {
  it('рендерит разделы и цитаты', () => {
    const wrapper = mount(AnswerView, {
      props: {
        sections: [
          {
            heading: 'Пайплайн',
            text: 'Текст раздела',
            citations: [{ source: 'specs/vision.md' }],
          },
        ],
      },
    });
    expect(wrapper.text()).toContain('Пайплайн');
    expect(wrapper.text()).toContain('Текст раздела');
    expect(wrapper.text()).toContain('specs/vision.md');
  });
});

describe('ui: ContradictionView (A2)', () => {
  it('рендерит уведомление и варианты с источниками', () => {
    const wrapper = mount(ContradictionView, {
      props: {
        contradiction: {
          notice: 'Найдены противоречия',
          variants: [
            { label: 'Вариант А', text: 'Текст А', citations: [{ source: 'a.md' }] },
            { label: 'Вариант Б', text: 'Текст Б', citations: [{ source: 'b.md' }] },
          ],
        },
      },
    });
    expect(wrapper.text()).toContain('Вариант А');
    expect(wrapper.text()).toContain('Вариант Б');
    expect(wrapper.text()).toContain('a.md');
    expect(wrapper.text()).toContain('b.md');
  });
});
