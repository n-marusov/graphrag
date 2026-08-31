/**
 * Объекты-значения домена GraphRAG.
 *
 * Зеркало `specs/domain/aggregates.md` (контекст `query-answering`):
 * VO агрегатов `Answer` и `Session` — `AnswerId`, `AnswerStatus`, `Confidence`,
 * `TraceRef`, `SessionId`, `SessionTitle`.
 *
 * Трассируемость: `specs/domain/aggregates.md` (VO контекста `query-answering`),
 * `specs/contracts/openapi.yaml` (`AnswerStatus`, `AnswerPhase`).
 */

/** Идентификатор ответа (VO `AnswerId`) */
export type AnswerId = string;

/** Идентификатор сессии (VO `SessionId`) */
export type SessionId = string;

/** Идентификатор обращения в сессии (`SessionTurn`) */
export type SessionTurnId = string;

/** Уверенность ответа (VO `Confidence`), диапазон 0..1 */
export type Confidence = number;

/** Статус ответа (VO `AnswerStatus`, контракт `openapi.yaml`) */
export type AnswerStatus = 'processing' | 'answered' | 'no_sources' | 'ambiguous' | 'failed';

/** Этап пайплайна при `processing` (контракт `openapi.yaml`) */
export type AnswerPhase = 'retrieval' | 'generation';

/**
 * Ссылка на происхождение (VO `TraceRef`): версия индекса (состояния знаний),
 * на которой построен ответ (provenance, REQ-NFR-data.maintainability.versioned-provenance).
 */
export interface TraceRef {
  indexVersion: string;
}
