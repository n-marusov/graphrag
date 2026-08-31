import { mount } from '@vue/test-utils';
/**
 * Проверяет: glossary «Происхождение»/«Атрибуция источников» — панель происхождения:
 * версия индекса, дедупликация источников, пустые состояния.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { useI18n } from '../adapters/i18n';
import type { ChatViewState } from '../application/chat-state-machine';
import type { Answer } from '../domain/answer';
import CitationCard from '../ui/provenance/CitationCard.vue';
import ProvenancePanel from '../ui/provenance/ProvenancePanel.vue';

beforeEach(() => {
  useI18n().setLocale('ru');
});

function makeAnswer(overrides: Partial<Answer> = {}): Answer {
  return {
    id: 'answer-1',
    status: 'answered',
    sections: [
      {
        heading: 'Раздел',
        text: 'Текст',
        citations: [{ source: 'specs/vision.md', chunk: 'чанк 1/2', title: 'Видение' }],
      },
    ],
    citations: [{ source: 'specs/glossary.md' }],
    traceRef: { indexVersion: 'idx-42' },
    createdAt: '2026-08-30T12:00:00.000Z',
    ...overrides,
  };
}

describe('ui: CitationCard', () => {
  it('рендерит источник, чанк и цитату', () => {
    const wrapper = mount(CitationCard, {
      props: {
        citation: {
          source: 'specs/glossary.md',
          chunk: 'чанк 2/5',
          title: 'Глоссарий',
          quote: 'Фрагмент',
        },
      },
    });
    expect(wrapper.text()).toContain('Глоссарий');
    expect(wrapper.text()).toContain('specs/glossary.md');
    expect(wrapper.text()).toContain('чанк 2/5');
    expect(wrapper.text()).toContain('Фрагмент');
  });
});

describe('ui: ProvenancePanel', () => {
  it('idle: «Задайте вопрос, чтобы увидеть источники»', () => {
    const wrapper = mount(ProvenancePanel, { props: { chat: { kind: 'idle' } } });
    expect(wrapper.text()).toContain('Задайте вопрос, чтобы увидеть источники');
  });

  it('answer: показывает версию индекса и дедуплицированные источники', () => {
    const answer = makeAnswer({
      sections: [
        {
          heading: 'Раздел',
          text: 'Текст',
          citations: [{ source: 'specs/vision.md', chunk: 'чанк 1/2' }],
        },
      ],
      citations: [
        { source: 'specs/vision.md', chunk: 'чанк 1/2' },
        { source: 'specs/glossary.md' },
      ],
    });
    const chat: ChatViewState = { kind: 'answer', answer };
    const wrapper = mount(ProvenancePanel, { props: { chat } });

    expect(wrapper.text()).toContain('idx-42');
    expect(wrapper.text()).toContain('specs/vision.md');
    expect(wrapper.text()).toContain('specs/glossary.md');
    // Дедупликация: vision.md с чанком 1/2 показан один раз
    const sourceCount = wrapper.text().match(/specs\/vision\.md/g)?.length ?? 0;
    expect(sourceCount).toBe(1);
  });

  it('no_sources: «Источники не найдены»', () => {
    const wrapper = mount(ProvenancePanel, {
      props: { chat: { kind: 'no_sources', answer: makeAnswer({ status: 'no_sources' }) } },
    });
    expect(wrapper.text()).toContain('Источники не найдены');
  });

  it('error: «Недоступно из-за ошибки»', () => {
    const wrapper = mount(ProvenancePanel, {
      props: {
        chat: {
          kind: 'error',
          error: { name: 'GatewayError', code: 'GRAPH_TIMEOUT', message: 'Таймаут' },
        },
      },
    });
    expect(wrapper.text()).toContain('Недоступно из-за ошибки');
  });
});
