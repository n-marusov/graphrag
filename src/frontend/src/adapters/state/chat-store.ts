/**
 * Store чата — реактивное состояние веб-интерфейса (F1).
 *
 * Связывает application-слой (SessionService, AskQuestion) и машину состояний
 * `chatStateFromAnswer` с реактивным состоянием Vue. Единая точка истины для
 * UI: список сессий, активная сессия, состояние чата, версия индекса.
 *
 * Трассируемость: F1 (vision §2.2); `BR-constraint.ui-session-history`;
 * `UC-answers.grounding.cited-answer` (состояния ответа);
 * `specs/domain/aggregates.md` (агрегаты `Answer`, `Session`).
 */

import { type InjectionKey, reactive } from 'vue';
import type { AskQuestion } from '../../application/ask-question';
import type { ChatViewState } from '../../application/chat-state-machine';
import { chatStateFromAnswer } from '../../application/chat-state-machine';
import { log } from '../../application/logger';
import type { SessionService } from '../../application/sessions';
import type { Session, SessionId, SessionSummary } from '../../domain/session';
import { toGatewayError } from '../api/errors';

export interface ChatStoreDeps {
  sessions: SessionService;
  askQuestion: AskQuestion;
}

interface ChatStoreState {
  sessions: SessionSummary[];
  activeSession: Session | null;
  chat: ChatViewState;
  lastQuestion: string | null;
  loadingSessions: boolean;
}

const initial: ChatStoreState = {
  sessions: [],
  activeSession: null,
  chat: { kind: 'idle' },
  lastQuestion: null,
  loadingSessions: false,
};

export function createChatStore(deps: ChatStoreDeps) {
  const state = reactive<ChatStoreState>({ ...initial });

  async function loadSessions(): Promise<void> {
    state.loadingSessions = true;
    try {
      state.sessions = await deps.sessions.load();
      log.debug('chat-store.loadSessions', { count: state.sessions.length });
    } catch (error) {
      log.error('chat-store.loadSessions: ошибка', { error: String(error) });
    } finally {
      state.loadingSessions = false;
    }
  }

  async function selectSession(sessionId: SessionId): Promise<void> {
    try {
      state.activeSession = await deps.sessions.get(sessionId);
      state.chat = { kind: 'idle' };
      log.info('chat-store.selectSession', { sessionId });
    } catch (error) {
      const gatewayError = toGatewayError(error);
      log.error('chat-store.selectSession: ошибка', { sessionId, code: gatewayError.code });
      state.chat = { kind: 'error', error: gatewayError };
    }
  }

  async function createSession(): Promise<Session | null> {
    try {
      const session = await deps.sessions.create();
      await loadSessions();
      state.activeSession = session;
      state.chat = { kind: 'idle' };
      log.info('chat-store.createSession', { sessionId: session.id });
      return session;
    } catch (error) {
      const gatewayError = toGatewayError(error);
      log.error('chat-store.createSession: ошибка', { code: gatewayError.code });
      state.chat = { kind: 'error', error: gatewayError };
      return null;
    }
  }

  async function renameSession(sessionId: SessionId, title: string): Promise<void> {
    try {
      const updated = await deps.sessions.rename(sessionId, title);
      state.sessions = state.sessions.map((s) => (s.id === sessionId ? updated : s));
      if (state.activeSession?.id === sessionId) state.activeSession = updated;
      log.info('chat-store.renameSession', { sessionId, title });
    } catch (error) {
      const gatewayError = toGatewayError(error);
      log.error('chat-store.renameSession: ошибка', { sessionId, code: gatewayError.code });
      state.chat = { kind: 'error', error: gatewayError };
    }
  }

  async function removeSession(sessionId: SessionId): Promise<void> {
    try {
      await deps.sessions.remove(sessionId);
      await loadSessions();
      if (state.activeSession?.id === sessionId) {
        state.activeSession = null;
        state.chat = { kind: 'idle' };
      }
      log.info('chat-store.removeSession', { sessionId });
    } catch (error) {
      const gatewayError = toGatewayError(error);
      log.error('chat-store.removeSession: ошибка', { sessionId, code: gatewayError.code });
      state.chat = { kind: 'error', error: gatewayError };
    }
  }

  async function ask(question: string): Promise<void> {
    if (state.chat.kind === 'loading') return;
    const trimmed = question.trim();
    if (!trimmed) return;

    state.lastQuestion = trimmed;
    state.chat = { kind: 'loading', phase: null };
    log.info('chat-store.ask', { questionLength: trimmed.length });

    // Сессия-источник фиксируется до вызова: во время генерации пользователь
    // может переключиться на другую сессию (гонка), и ответ не должен
    // отображаться в чужом контексте.
    const originSessionId = state.activeSession?.id;
    const stillOnOriginSession = (): boolean =>
      originSessionId === undefined
        ? state.activeSession === null
        : state.activeSession?.id === originSessionId;

    try {
      const answer = await deps.askQuestion.execute({
        question: trimmed,
        sessionId: originSessionId,
      });
      if (stillOnOriginSession()) {
        state.chat = chatStateFromAnswer(answer);
        if (originSessionId) {
          state.activeSession = await deps.sessions.get(originSessionId);
        }
      } else {
        log.info('chat-store.ask: сессия переключена во время генерации; ответ не показан', {
          originSessionId: originSessionId ?? null,
        });
      }
    } catch (error) {
      const gatewayError = toGatewayError(error);
      log.error('chat-store.ask: ошибка', { code: gatewayError.code });
      if (stillOnOriginSession()) {
        state.chat = { kind: 'error', error: gatewayError };
      }
    }
  }

  /** Повтор последнего вопроса из состояния ошибки */
  async function retry(): Promise<void> {
    if (!state.lastQuestion) return;
    await ask(state.lastQuestion);
  }

  return {
    state,
    loadSessions,
    selectSession,
    createSession,
    renameSession,
    removeSession,
    ask,
    retry,
  };
}

export type ChatStore = ReturnType<typeof createChatStore>;

/** Ключ provide/inject для store чата (создаётся в composition root, app/) */
export const chatStoreKey: InjectionKey<ChatStore> = Symbol('chatStore');
