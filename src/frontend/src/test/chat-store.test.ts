/**
 * Проверяет: F1 и `BR-constraint.ui-session-history` — store чата: загрузка/создание/выбор
 * сессий, поток вопроса (loading → answer/error), retry, гонка переключения сессии.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createChatStore } from '../adapters/state/chat-store';
import { AskQuestion } from '../application/ask-question';
import { SessionService } from '../application/sessions';
import type { Answer } from '../domain/answer';
import { type AnswerGateway, GatewayError, type SessionGateway } from '../domain/ports';
import type { Session, SessionSummary } from '../domain/session';

function makeAnswerGateway(sequence: Array<Partial<Answer>> = []): AnswerGateway {
  let index = 0;
  const next = (): Partial<Answer> => sequence[Math.min(index++, sequence.length - 1)];
  return {
    askQuestion: vi.fn(async () => next() as unknown as Answer),
    getAnswer: vi.fn(async () => next() as unknown as Answer),
  };
}

function makeSessionGateway(
  initialSessions: SessionSummary[] = [],
  turns: Session['turns'] = [],
): SessionGateway & {
  getSessionCalls: string[];
} {
  const getSessionCalls: string[] = [];
  return {
    getSessionCalls,
    listSessions: vi.fn(async () => initialSessions),
    createSession: vi.fn(async (title?: string) => ({
      id: 'session-new',
      title: title ?? 'Новая сессия',
      createdAt: '2026-08-30T12:00:00.000Z',
      updatedAt: '2026-08-30T12:00:00.000Z',
      turns: [],
    })),
    getSession: vi.fn(async (id: string) => {
      getSessionCalls.push(id);
      return {
        id,
        title: 'Сессия',
        createdAt: '2026-08-30T12:00:00.000Z',
        updatedAt: '2026-08-30T12:00:00.000Z',
        turns,
      };
    }),
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

function makeAnswer(overrides: Partial<Answer> = {}): Answer {
  return {
    id: 'answer-1',
    status: 'answered',
    sections: [{ text: 'Раздел', citations: [] }],
    citations: [],
    createdAt: '2026-08-30T12:00:00.000Z',
    ...overrides,
  };
}

function makeStore(
  overrides: { answerSequence?: Array<Partial<Answer>>; sessions?: SessionSummary[] } = {},
) {
  const answerGateway = makeAnswerGateway(overrides.answerSequence);
  const sessionGateway = makeSessionGateway(overrides.sessions ?? []);
  const store = createChatStore({
    sessions: new SessionService(sessionGateway),
    askQuestion: new AskQuestion({ answerGateway, pollIntervalMs: 1, maxAttempts: 3 }),
  });
  return { store, answerGateway, sessionGateway };
}

describe('adapters: chat-store', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('loadSessions заполняет список', async () => {
    const { store } = makeStore({
      sessions: [
        {
          id: 's1',
          title: 'Сессия',
          createdAt: '2026-08-30T12:00:00.000Z',
          updatedAt: '2026-08-30T12:00:00.000Z',
        },
      ],
    });
    await store.loadSessions();
    expect(store.state.sessions).toHaveLength(1);
    expect(store.state.sessions[0].title).toBe('Сессия');
  });

  it('createSession создаёт и выбирает новую сессию', async () => {
    const { store } = makeStore();
    await store.createSession();
    expect(store.state.activeSession?.id).toBe('session-new');
    expect(store.state.chat.kind).toBe('idle');
  });

  it('selectSession загружает сессию с обращениями', async () => {
    const { store, sessionGateway } = makeStore();
    await store.selectSession('s1');
    expect(store.state.activeSession?.id).toBe('s1');
    expect(sessionGateway.getSessionCalls).toContain('s1');
  });

  it('ask: обработка → loading → answer', async () => {
    const { store } = makeStore({
      answerSequence: [
        { id: 'a1', status: 'processing', phase: 'retrieval', sections: [], citations: [] },
        {
          id: 'a1',
          status: 'answered',
          sections: [{ text: 'Ответ', citations: [] }],
          citations: [],
        },
      ],
    });
    await store.ask('Вопрос');
    expect(store.state.chat.kind).toBe('answer');
    if (store.state.chat.kind === 'answer') {
      expect(store.state.chat.answer.id).toBe('a1');
    }
  });

  it('ask: ошибка шлюза → состояние error', async () => {
    const answerGateway: AnswerGateway = {
      askQuestion: vi.fn(async () => {
        throw new GatewayError('GRAPH_TIMEOUT', 'Таймаут', 504);
      }),
      getAnswer: vi.fn(),
    };
    const sessionGateway = makeSessionGateway();
    const store = createChatStore({
      sessions: new SessionService(sessionGateway),
      askQuestion: new AskQuestion({ answerGateway }),
    });

    await store.ask('Вопрос');

    expect(store.state.chat.kind).toBe('error');
    if (store.state.chat.kind === 'error') {
      expect(store.state.chat.error.code).toBe('GRAPH_TIMEOUT');
    }
  });

  it('retry повторяет последний вопрос', async () => {
    const answerGateway: AnswerGateway = {
      askQuestion: vi.fn(async () => {
        throw new GatewayError('GRAPH_TIMEOUT', 'Таймаут', 504);
      }),
      getAnswer: vi.fn(),
    };
    const sessionGateway = makeSessionGateway();
    const store = createChatStore({
      sessions: new SessionService(sessionGateway),
      askQuestion: new AskQuestion({ answerGateway }),
    });

    await store.ask('Вопрос');
    await store.retry();

    expect(answerGateway.askQuestion).toHaveBeenCalledTimes(2);
    expect(store.state.lastQuestion).toBe('Вопрос');
  });

  it('гонка: переключение сессии во время генерации не показывает чужой ответ', async () => {
    let resolveAnswer: (a: Answer) => void = () => {};
    const answerGateway: AnswerGateway = {
      askQuestion: vi.fn(
        () =>
          new Promise<Answer>((resolve) => {
            resolveAnswer = resolve;
          }),
      ),
      getAnswer: vi.fn(),
    };
    const sessionGateway = makeSessionGateway();
    const store = createChatStore({
      sessions: new SessionService(sessionGateway),
      askQuestion: new AskQuestion({ answerGateway }),
    });

    await store.selectSession('s1');
    const askPromise = store.ask('Вопрос');
    await store.selectSession('s2');
    resolveAnswer(makeAnswer());
    await askPromise;

    expect(store.state.chat.kind).not.toBe('answer');
    expect(store.state.activeSession?.id).toBe('s2');
  });

  it('гонка: ошибка при переключённой сессии не показывает чужую ошибку', async () => {
    let rejectAnswer: (e: unknown) => void = () => {};
    const answerGateway: AnswerGateway = {
      askQuestion: vi.fn(
        () =>
          new Promise<Answer>((_resolve, reject) => {
            rejectAnswer = reject;
          }),
      ),
      getAnswer: vi.fn(),
    };
    const sessionGateway = makeSessionGateway();
    const store = createChatStore({
      sessions: new SessionService(sessionGateway),
      askQuestion: new AskQuestion({ answerGateway }),
    });

    await store.selectSession('s1');
    const askPromise = store.ask('Вопрос');
    await store.selectSession('s2');
    rejectAnswer(new GatewayError('GRAPH_TIMEOUT', 'Таймаут', 504));
    await askPromise;

    expect(store.state.chat.kind).toBe('idle');
    expect(store.state.activeSession?.id).toBe('s2');
  });
});
