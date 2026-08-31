import { flushPromises, mount } from '@vue/test-utils';
import axe, { type AxeResults, type Result } from 'axe-core';
/**
 * Проверяет: `BR-constraint.web-app-browser-chat` (WCAG 2.1 AA, axe-core с тегами
 * wcag2a/wcag2aa/wcag21a/wcag21aa) — `specs/qa/e2e-gui-testing.md` §7.4.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { useI18n } from '../adapters/i18n';
import { chatStoreKey, createChatStore } from '../adapters/state/chat-store';
import { createMockGateways } from '../app/mock-gateways';
import type { ChatViewState } from '../application/chat-state-machine';
import ChatView from '../ui/chat/ChatView.vue';
import AppLayout from '../ui/layout/AppLayout.vue';
import ProvenancePanel from '../ui/provenance/ProvenancePanel.vue';

/**
 * a11y-проверки WCAG 2.1 AA (BR-constraint.web-app-browser-chat, specs/qa/e2e-gui-testing.md §7.4):
 * axe-core с тегами wcag2a/wcag2aa/wcag21a/wcag21aa.
 */

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function runAxe(html: string): Promise<AxeResults> {
  document.body.innerHTML = html;
  return axe.run(document.body, { runOnly: { type: 'tag', values: WCAG_TAGS } });
}

function seriousViolations(results: AxeResults): Result[] {
  return results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
}

beforeEach(() => {
  useI18n().setLocale('ru');
});

describe('a11y: WCAG 2.1 AA (axe-core)', () => {
  it('AppLayout с шапкой/сайдбаром/футером не имеет critical/serious нарушений', async () => {
    const store = createChatStore(createMockGateways());
    const wrapper = mount(AppLayout, {
      props: { indexVersion: 'idx-42' },
      slots: {
        chat: '<p>Контент чата</p>',
        provenance: '<p>Происхождение</p>',
      },
      global: {
        provide: { [chatStoreKey]: store },
      },
    });
    await flushPromises();
    const results = await runAxe(wrapper.html());
    const serious = seriousViolations(results);
    expect(
      serious.map((v) => v.id),
      JSON.stringify(serious, null, 2),
    ).toEqual([]);
  });

  it('ChatView в пустом состоянии не имеет critical/serious нарушений', async () => {
    const store = createChatStore(createMockGateways());
    await store.createSession();
    const wrapper = mount(ChatView, {
      global: { provide: { [chatStoreKey]: store } },
    });
    await flushPromises();
    const results = await runAxe(wrapper.html());
    const serious = seriousViolations(results);
    expect(
      serious.map((v) => v.id),
      JSON.stringify(serious, null, 2),
    ).toEqual([]);
  });

  it('ProvenancePanel с источниками не имеет critical/serious нарушений', async () => {
    const chat: ChatViewState = {
      kind: 'answer',
      answer: {
        id: 'a1',
        status: 'answered',
        sections: [
          { heading: 'Раздел', text: 'Текст', citations: [{ source: 'specs/vision.md' }] },
        ],
        citations: [{ source: 'specs/vision.md' }],
        traceRef: { indexVersion: 'idx-42' },
        createdAt: '2026-08-30T12:00:00.000Z',
      },
    };
    const wrapper = mount(ProvenancePanel, { props: { chat } });
    const results = await runAxe(wrapper.html());
    const serious = seriousViolations(results);
    expect(
      serious.map((v) => v.id),
      JSON.stringify(serious, null, 2),
    ).toEqual([]);
  });
});
