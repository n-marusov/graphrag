/**
 * Порты домена — интерфейсы, через которые application-слой обращается к API.
 *
 * Методы соответствуют эндпоинтам контракта `specs/contracts/openapi.yaml`:
 *   AnswerGateway  → POST /answers, GET /answers/{answerId}
 *   SessionGateway → GET /sessions, POST /sessions, GET /sessions/{id},
 *                    PATCH /sessions/{id}, DELETE /sessions/{id}
 *
 * Порты не знают о fetch/Vue: реализация живёт в `adapters/api` (Task 6).
 * Ошибки шлюза — `GatewayError` (машинный код из контракта, `error_code`).
 *
 * Трассируемость: `specs/contracts/openapi.yaml` (эндпоинты), `BR-constraint.ui-session-history`,
 * `ADR-DES.API.api-gateway-adoption` (маршрутизация `/api/*`).
 */

import type { Answer, AnswerId } from './answer';
import type { Session, SessionId, SessionSummary } from './session';

/**
 * Ошибка шлюза (внешнего API) с машинным кодом контракта.
 *
 * Код — стабильный идентификатор для локализации и UI-состояний
 * (например, `SESSION_NOT_FOUND`, `GRAPH_TIMEOUT`, `RATE_LIMITED`).
 */
export class GatewayError extends Error {
  readonly code: string;
  readonly httpStatus?: number;

  constructor(code: string, message: string, httpStatus?: number) {
    super(message);
    this.name = 'GatewayError';
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

/** Входное сообщение запроса (F1.1, POST /answers) */
export interface AskQuestionInput {
  /** Текст запроса */
  question: string;
  /** Привязка обращения к сессии (история диалога) */
  sessionId?: SessionId;
}

/** Параметры списка сессий (GET /sessions) */
export interface SessionListQuery {
  /** Подстрока заголовка для поиска */
  q?: string;
  /** Максимальное число сессий */
  limit?: number;
}

/** Шлюз ответов: создание обращения и опрос результата */
export interface AnswerGateway {
  /** POST /answers — создать обращение и запустить пайплайн ответа */
  askQuestion(input: AskQuestionInput): Promise<Answer>;
  /** GET /answers/{answerId} — опрос статуса и результата */
  getAnswer(answerId: AnswerId): Promise<Answer>;
}

/** Шлюз сессий: история диалога (BR-constraint.ui-session-history) */
export interface SessionGateway {
  /** GET /sessions — список сессий (сортировка по убыванию updatedAt) */
  listSessions(query?: SessionListQuery): Promise<SessionSummary[]>;
  /** POST /sessions — создать пустую сессию */
  createSession(title?: string): Promise<Session>;
  /** GET /sessions/{sessionId} — сессия с обращениями */
  getSession(sessionId: SessionId): Promise<Session>;
  /** PATCH /sessions/{sessionId} — переименовать сессию */
  renameSession(sessionId: SessionId, title: string): Promise<Session>;
  /** DELETE /sessions/{sessionId} — удалить сессию */
  deleteSession(sessionId: SessionId): Promise<void>;
}
