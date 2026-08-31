/**
 * Агрегат `Session` (контекст `query-answering`).
 *
 * Зеркало `specs/domain/aggregates.md`: корень `Session`, сущность `SessionTurn`,
 * VO `SessionId`/`SessionTitle`. Введён по `BR-constraint.ui-session-history`
 * (история сессий веб-интерфейса, серверное хранение).
 * Инварианты: обращения упорядочены по времени; заголовок — первый запрос
 * или имя, заданное пользователем.
 * Соответствует схемам `SessionSummary`/`Session`/`SessionTurn` контракта
 * `specs/contracts/openapi.yaml`.
 *
 * Трассируемость: `BR-constraint.ui-session-history` (серверная история сессий);
 * `specs/domain/aggregates.md` (агрегат `Session`); `specs/contracts/openapi.yaml`.
 */

import type { Answer } from './answer';
import { DomainInvariantError } from './errors';
import type { SessionId, SessionTurnId } from './value-objects';

// Ре-экспорт VO для удобства импорта из агрегата
export type { SessionId, SessionTurnId } from './value-objects';

/** Обращение сессии: пара «запрос — ответ» */
export interface SessionTurn {
  /** Идентификатор обращения */
  id: SessionTurnId;
  /** Текст запроса */
  question: string;
  /** Ответ; отсутствует, пока обращение не породило ответ */
  answer?: Answer;
  /** Время обращения (ISO 8601) */
  createdAt: string;
}

/** Краткое представление сессии для списка (левая панель) */
export interface SessionSummary {
  /** Идентификатор сессии (VO `SessionId`) */
  id: SessionId;
  /** Заголовок: первый запрос или имя, заданное пользователем */
  title: string;
  /** Время создания (ISO 8601) */
  createdAt: string;
  /** Время последнего обращения (ISO 8601) */
  updatedAt: string;
}

/** Полный состав сессии: заголовок и обращения */
export interface Session extends SessionSummary {
  turns: SessionTurn[];
}

/**
 * Заголовок сессии (VO `SessionTitle`).
 *
 * По умолчанию — первый запрос сессии; заданное пользователем имя
 * переопределяет его (BR-constraint.ui-session-history).
 */
export function sessionTitle(firstQuestion: string, customTitle?: string): string {
  const trimmedCustom = customTitle?.trim();
  return trimmedCustom && trimmedCustom.length > 0 ? trimmedCustom : firstQuestion.trim();
}

/**
 * Проверка инвариантов агрегата `Session`.
 *
 * Инвариант (aggregates.md): «Обращения сессии упорядочены по времени» —
 * createdAt обращений не убывает.
 */
export function assertSessionInvariants(session: Session): void {
  for (let i = 1; i < session.turns.length; i++) {
    const prev = new Date(session.turns[i - 1].createdAt).getTime();
    const current = new Date(session.turns[i].createdAt).getTime();
    if (current < prev) {
      throw new DomainInvariantError(
        `Session ${session.id}: обращения должны быть упорядочены по времени (turn ${session.turns[i - 1].id} → ${session.turns[i].id})`,
      );
    }
  }
}
