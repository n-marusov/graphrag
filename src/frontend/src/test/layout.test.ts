/**
 * Проверяет: `BR-constraint.ui-header`, `BR-constraint.ui-footer`,
 * `BR-constraint.ui-session-history` — layout-компоненты (шапка, сайдбар, футер).
 */
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useI18n } from '../adapters/i18n';
import { chatStoreKey, createChatStore } from '../adapters/state/chat-store';
import { AskQuestion } from '../application/ask-question';
import { SessionService } from '../application/sessions';
import { type AnswerGateway, GatewayError, type SessionGateway } from '../domain/ports';
import type { Session, SessionSummary } from '../domain/session';
import AppFooter from '../ui/layout/AppFooter.vue';
import AppHeader from '../ui/layout/AppHeader.vue';
import SessionSidebar from '../ui/layout/SessionSidebar.vue';

function makeSessionGateway(sessions: SessionSummary[] = []): SessionGateway {
  return {
    listSessions: vi.fn(async () => sessions),
    createSession: vi.fn(async (title?: string) => ({
      id: 'session-new',
      title: title ?? 'Новая сессия',
      createdAt: '2026-08-30T12:00:00.000Z',
      updatedAt: '2026-08-30T12:00:00.000Z',
      turns: [],
    })),
    getSession: vi.fn(async (id: string) => ({
      id,
      title: 'Сессия',
      createdAt: '2026-08-30T12:00:00.000Z',
      updatedAt: '2026-08-30T12:00:00.000Z',
      turns: [] as Session['turns'],
    })),
    renameSession: vi.fn(async (id: string, title: string) => ({
      id,
      title,
      createdAt: '2026-08-30T12:00:00.000Z',
      updatedAt: '2026-08-30T12:00:00.000Z',
      turns: [],
    })),
    deleteSession: vi.fn(async () => undefined),
  };
}

function makeAnswerGateway(): AnswerGateway {
  return {
    askQuestion: vi.fn(async () => {
      throw new GatewayError('UNKNOWN_ERROR', 'stub');
    }),
    getAnswer: vi.fn(),
  };
}

function mountSidebar(sessions: SessionSummary[]) {
  const store = createChatStore({
    sessions: new SessionService(makeSessionGateway(sessions)),
    askQuestion: new AskQuestion({ answerGateway: makeAnswerGateway() }),
  });
  const wrapper = mount(SessionSidebar, {
    global: { provide: { [chatStoreKey]: store } },
  });
  return { wrapper, store };
}

describe('ui: AppHeader (BR-constraint.ui-header)', () => {
  it('рендерит название продукта', () => {
    const wrapper = mount(AppHeader);
    expect(wrapper.text()).toContain('GraphRAG');
  });

  it('показывает версию индекса', () => {
    const wrapper = mount(AppHeader, { props: { indexVersion: 'idx-42' } });
    expect(wrapper.text()).toContain('idx-42');
  });

  it('переключатель темы переключает data-theme', async () => {
    const wrapper = mount(AppHeader);
    const button = wrapper.find('button');
    await button.trigger('click');
    expect(document.documentElement.dataset.theme).toBe('light');
    await button.trigger('click');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('выбор языка меняет локаль', async () => {
    const wrapper = mount(AppHeader);
    const select = wrapper.find('select');
    await select.setValue('en');
    expect(wrapper.text()).toContain('GraphRAG');
    const themeButton = wrapper.find('button');
    expect(themeButton.attributes('aria-label')).toBe('Theme');
  });
});

describe('ui: SessionSidebar (BR-constraint.ui-session-history)', () => {
  beforeEach(() => {
    useI18n().setLocale('ru');
  });

  it('рендерит список сессий с заголовками', async () => {
    const { wrapper } = mountSidebar([
      {
        id: 's1',
        title: 'Первый вопрос?',
        createdAt: '2026-08-30T12:00:00.000Z',
        updatedAt: '2026-08-30T12:00:00.000Z',
      },
    ]);
    await flushPromises();
    expect(wrapper.text()).toContain('Первый вопрос?');
  });

  it('кнопка «+ Новая сессия» создаёт сессию', async () => {
    const { wrapper, store } = mountSidebar([]);
    await flushPromises();
    const createButton = wrapper.findAll('button')[0];
    await createButton.trigger('click');
    await flushPromises();
    expect(store.state.activeSession?.id).toBe('session-new');
  });

  it('клик по сессии выбирает её', async () => {
    const { wrapper, store } = mountSidebar([
      {
        id: 's1',
        title: 'Сессия 1',
        createdAt: '2026-08-30T12:00:00.000Z',
        updatedAt: '2026-08-30T12:00:00.000Z',
      },
    ]);
    await flushPromises();
    const sessionButton = wrapper.find('li button');
    await sessionButton.trigger('click');
    await flushPromises();
    expect(store.state.activeSession?.id).toBe('s1');
  });

  it('переименование: pencil открывает инлайн-редактор, Enter сохраняет', async () => {
    const { wrapper, store } = mountSidebar([
      {
        id: 's1',
        title: 'Старое имя',
        createdAt: '2026-08-30T12:00:00.000Z',
        updatedAt: '2026-08-30T12:00:00.000Z',
      },
    ]);
    await flushPromises();

    const pencil = wrapper.find('li span button');
    await pencil.trigger('click');
    await flushPromises();

    const input = wrapper.find('li input');
    expect(input.exists()).toBe(true);
    await input.setValue('Новое имя');
    await input.trigger('keydown.enter');
    await flushPromises();

    expect(wrapper.find('li input').exists()).toBe(false);
    expect(store.state.sessions[0].title).toBe('Новое имя');
  });

  it('переименование: Escape отменяет без сохранения', async () => {
    const { wrapper, store } = mountSidebar([
      {
        id: 's1',
        title: 'Старое имя',
        createdAt: '2026-08-30T12:00:00.000Z',
        updatedAt: '2026-08-30T12:00:00.000Z',
      },
    ]);
    await flushPromises();

    const pencil = wrapper.find('li span button');
    await pencil.trigger('click');
    await flushPromises();

    const input = wrapper.find('li input');
    await input.setValue('Новое имя');
    await input.trigger('keydown.esc');
    await flushPromises();

    expect(wrapper.find('li input').exists()).toBe(false);
    expect(store.state.sessions[0].title).toBe('Старое имя');
  });

  it('пустое состояние: «Сессий пока нет»', async () => {
    const { wrapper } = mountSidebar([]);
    await flushPromises();
    expect(wrapper.text()).toContain('Сессий пока нет');
  });
});

describe('ui: AppFooter (BR-constraint.ui-footer)', () => {
  beforeEach(() => {
    useI18n().setLocale('ru');
  });

  it('рендерит версию, SHA и ссылку «Мониторинг»', () => {
    const wrapper = mount(AppFooter, { props: { version: '0.1.0', sha: 'a3f2b8c' } });
    expect(wrapper.text()).toContain('graphrag 0.1.0 · a3f2b8c');
    expect(wrapper.text()).toContain('Мониторинг');
    expect(wrapper.find('a').attributes('href')).toBe('#');
  });
});
