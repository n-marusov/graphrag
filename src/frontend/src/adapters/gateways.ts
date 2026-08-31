/**
 * Реализации портов домена (AnswerGateway, SessionGateway) поверх
 * сырого API-клиента: DTO → доменные объекты.
 *
 * Composition root (`app/`), Task 12, связывает: HttpClient + TokenProvider →
 * createApiClient → createAnswerGateway / createSessionGateway.
 *
 * Трассируемость: порты `domain/ports.ts`; `specs/contracts/openapi.yaml`;
 * `BR-constraint.ui-session-history` (сессии).
 */

import type { AnswerGateway, SessionGateway } from '../domain/ports';
import type { ApiClient } from './api/api-client';
import { toAskQuestionRequest, toSessionListQuery } from './mappers/domain-to-dto';
import { mapAnswer, mapSession, mapSessionSummary } from './mappers/dto-to-domain';

export function createAnswerGateway(api: ApiClient): AnswerGateway {
  return {
    askQuestion: async (input) => mapAnswer(await api.askQuestion(toAskQuestionRequest(input))),
    getAnswer: async (answerId) => mapAnswer(await api.getAnswer(answerId)),
  };
}

export function createSessionGateway(api: ApiClient): SessionGateway {
  return {
    listSessions: async (query) =>
      (await api.listSessions(query ? toSessionListQuery(query) : undefined)).map(
        mapSessionSummary,
      ),
    createSession: async (title) => mapSession(await api.createSession(title)),
    getSession: async (sessionId) => mapSession(await api.getSession(sessionId)),
    renameSession: async (sessionId, title) =>
      mapSession(await api.renameSession(sessionId, title)),
    deleteSession: async (sessionId) => api.deleteSession(sessionId),
  };
}
