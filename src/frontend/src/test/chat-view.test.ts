import { flushPromises, mount } from '@vue/test-utils';
/**
 * Проверяет: F1, `ADR-DES.UI.chat-only-interface` — связка ChatView + store:
 * пустые состояния, вопрос → ответ, ошибка → ErrorState.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { useI18n } from '../adapters/i18n';
import { chatStoreKey, createChatStore } from '../adapters/state/chat-store';
import { createMockGateways } from '../app/mock-gateways';
import { AskQuestion } from '../application/ask-question';
import { SessionService } from '../application/sessions';
import { type AnswerGateway, GatewayError, type SessionGateway } from '../domain/ports';
import type { Session } from '../domain/session';
import ChatView from '../ui/chat/ChatView.vue';

beforeEach(() => {
  useI18n().setLocale('ru');
});

function mountChat(store: ReturnType<typeof createChatStore>) {
  return mount(ChatView, {
    global: { provide: { [chatStoreKey]: store } },
  });
}

describe('ui: ChatView (связка store + компоненты)', () => {
  it('нет активной сессии: «Выберите или создайте сессию»', async () => {
    const store = createChatStore(createMockGateways());
    const wrapper = mountChat(store);
    await flushPromises();
    expect(wrapper.text()).toContain('Выберите или создайте сессию');
  });

  it('новая сессия: «Начните диалог» и подсказки', async () => {
    const store = createChatStore(createMockGateways());
    await store.createSession();
    const wrapper = mountChat(store);
    await flushPromises();
    expect(wrapper.text()).toContain('Начните диалог');
  });

  it('вопрос → демо-ответ отображается в диалоге', async () => {
    const store = createChatStore(createMockGateways());
    await store.createSession();
    const wrapper = mountChat(store);
    await flushPromises();

    const textarea = wrapper.find('textarea');
    await textarea.setValue('Как устроен пайплайн?');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(wrapper.text()).toContain('Как устроен пайплайн?');
    expect(wrapper.text()).toContain('Демо-ответ');
  });

  it('ошибка шлюза → ErrorState с кодом', async () => {
    const answerGateway: AnswerGateway = {
      askQuestion: async () => {
        throw new GatewayError('GRAPH_TIMEOUT', 'Таймаут', 504);
      },
      getAnswer: async () => {
        throw new Error('stub');
      },
    };
    const sessionGateway: SessionGateway = {
      listSessions: async () => [],
      createSession: async () => ({
        id: 's1',
        title: 'Сессия',
        createdAt: '2026-08-30T12:00:00.000Z',
        updatedAt: '2026-08-30T12:00:00.000Z',
        turns: [] as Session['turns'],
      }),
      getSession: async (id: string) => ({
        id,
        title: 'Сессия',
        createdAt: '2026-08-30T12:00:00.000Z',
        updatedAt: '2026-08-30T12:00:00.000Z',
        turns: [] as Session['turns'],
      }),
      renameSession: async () => {
        throw new Error('stub');
      },
      deleteSession: async () => undefined,
    };
    const store = createChatStore({
      sessions: new SessionService(sessionGateway),
      askQuestion: new AskQuestion({ answerGateway }),
    });
    await store.createSession();
    const wrapper = mountChat(store);
    await flushPromises();

    const textarea = wrapper.find('textarea');
    await textarea.setValue('Вопрос');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(wrapper.text()).toContain('GRAPH_TIMEOUT');
    expect(wrapper.text()).toContain('Повторить');
  });
});
