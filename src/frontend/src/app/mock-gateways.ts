/**
 * In-memory заглушки шлюзов для dev-режима (`VITE_USE_MOCK=1`).
 *
 * Позволяют демонстрировать UI до реализации бэкенда. Демо-контент не
 * содержит фактических данных системы (контент придёт из API по контракту
 * `specs/contracts/openapi.yaml`).
 *
 * Трассируемость: `specs/contracts/openapi.yaml` (заглушки портов, dev-режим).
 */

import type { ChatStoreDeps } from '../adapters/state/chat-store';
import { AskQuestion } from '../application/ask-question';
import { SessionService } from '../application/sessions';
import type { Answer } from '../domain/answer';
import type { AnswerGateway, AskQuestionInput, SessionGateway } from '../domain/ports';
import type { Session, SessionSummary } from '../domain/session';

const now = () => new Date().toISOString();

let sessionSeq = 0;
const sessions = new Map<string, Session>();

function createMockSession(title?: string): Session {
  sessionSeq += 1;
  const session: Session = {
    id: `mock-session-${sessionSeq}`,
    title: title ?? 'Новая сессия',
    createdAt: now(),
    updatedAt: now(),
    turns: [],
  };
  sessions.set(session.id, session);
  return session;
}

function mockAnswer(question: string): Answer {
  return {
    id: `mock-answer-${Date.now()}`,
    status: 'answered',
    sections: [
      {
        heading: 'Демо-ответ',
        text: `Ответ на вопрос «${question}». Это заглушка dev-режима (VITE_USE_MOCK=1): реальный контент придёт из API.`,
        citations: [{ source: 'specs/glossary.md', chunk: 'демо-чанк', title: 'Глоссарий' }],
      },
    ],
    citations: [{ source: 'specs/glossary.md', chunk: 'демо-чанк', title: 'Глоссарий' }],
    traceRef: { indexVersion: 'mock-1' },
    createdAt: now(),
  };
}

const answerGateway: AnswerGateway = {
  askQuestion: async (input: AskQuestionInput) => {
    const answer = mockAnswer(input.question);
    // Демо-режим: обращение привязывается к сессии (история диалога)
    if (input.sessionId) {
      const session = sessions.get(input.sessionId);
      if (session) {
        session.turns.push({
          id: `mock-turn-${Date.now()}`,
          question: input.question,
          answer,
          createdAt: answer.createdAt,
        });
        session.updatedAt = answer.createdAt;
      }
    }
    return answer;
  },
  getAnswer: async () => {
    throw new Error('mock: getAnswer не используется (ответ синхронный)');
  },
};

const sessionGateway: SessionGateway = {
  listSessions: async (): Promise<SessionSummary[]> =>
    [...sessions.values()]
      .map(({ id, title, createdAt, updatedAt }) => ({ id, title, createdAt, updatedAt }))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
  createSession: async (title?: string) => createMockSession(title),
  getSession: async (sessionId: string) => sessions.get(sessionId) ?? createMockSession(),
  renameSession: async (sessionId: string, title: string) => {
    const session = sessions.get(sessionId) ?? createMockSession();
    session.title = title;
    session.updatedAt = now();
    return session;
  },
  deleteSession: async (sessionId: string) => {
    sessions.delete(sessionId);
  },
};

export function createMockGateways(): ChatStoreDeps {
  return {
    sessions: new SessionService(sessionGateway),
    askQuestion: new AskQuestion({ answerGateway, pollIntervalMs: 50, maxAttempts: 1 }),
  };
}
