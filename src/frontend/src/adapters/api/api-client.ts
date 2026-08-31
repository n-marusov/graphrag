/**
 * Сырой API-клиент (возвращает DTO контракта).
 *
 * Методы соответствуют эндпоинтам `specs/contracts/openapi.yaml`.
 * Реализации портов домена (маппинг DTO → домен) — `adapters/gateways.ts` (Task 7).
 *
 * Трассируемость: `specs/contracts/openapi.yaml` (эндпоинты `/sessions`, `/answers`).
 */

import type { AnswerDto, AskQuestionRequestDto, SessionDto, SessionSummaryDto } from './dto';
import type { HttpClient } from './http';

export interface SessionListQueryDto {
  q?: string;
  limit?: number;
}

export interface ApiClient {
  listSessions(query?: SessionListQueryDto): Promise<SessionSummaryDto[]>;
  createSession(title?: string): Promise<SessionDto>;
  getSession(sessionId: string): Promise<SessionDto>;
  renameSession(sessionId: string, title: string): Promise<SessionDto>;
  deleteSession(sessionId: string): Promise<void>;
  askQuestion(input: AskQuestionRequestDto): Promise<AnswerDto>;
  getAnswer(answerId: string): Promise<AnswerDto>;
}

export function createApiClient(http: HttpClient): ApiClient {
  const encode = (value: string): string => encodeURIComponent(value);

  return {
    listSessions: async (query) => {
      const params = new URLSearchParams();
      if (query?.q) params.set('q', query.q);
      if (query?.limit !== undefined) params.set('limit', String(query.limit));
      const qs = params.toString();
      return http.get<SessionSummaryDto[]>(`/sessions${qs ? `?${qs}` : ''}`);
    },
    createSession: async (title) =>
      http.post<SessionDto>('/sessions', title !== undefined ? { title } : undefined),
    getSession: async (sessionId) => http.get<SessionDto>(`/sessions/${encode(sessionId)}`),
    renameSession: async (sessionId, title) =>
      http.patch<SessionDto>(`/sessions/${encode(sessionId)}`, { title }),
    deleteSession: async (sessionId) => http.delete(`/sessions/${encode(sessionId)}`),
    askQuestion: async (input) => http.post<AnswerDto>('/answers', input),
    getAnswer: async (answerId) => http.get<AnswerDto>(`/answers/${encode(answerId)}`),
  };
}
