/**
 * Машина состояний чата (представление F1.1).
 *
 * Состояния соответствуют статусам ответа контракта `openapi.yaml`
 * и экранам макета: idle → loading (поиск источников / генерация) →
 * answer | no_sources | clarification | error.
 *
 * Трассируемость: `specs/contracts/openapi.yaml` (`AnswerStatus`),
 * `UC-answers.grounding.cited-answer` (A1 — no_sources, A2 — противоречие, A3 — уточнение).
 */

import type { Answer } from '../domain/answer';
import { GatewayError } from '../domain/ports';
import type { AnswerPhase } from '../domain/value-objects';

export type ChatViewState =
  | { kind: 'idle' }
  | { kind: 'loading'; phase: AnswerPhase | null }
  | { kind: 'answer'; answer: Answer }
  | { kind: 'no_sources'; answer: Answer }
  | { kind: 'clarification'; answer: Answer }
  | { kind: 'error'; error: GatewayError };

/** Маппинг статуса ответа на состояние представления */
export function chatStateFromAnswer(answer: Answer): ChatViewState {
  switch (answer.status) {
    case 'processing':
      return { kind: 'loading', phase: answer.phase ?? null };
    case 'answered':
      return { kind: 'answer', answer };
    case 'no_sources':
      return { kind: 'no_sources', answer };
    case 'ambiguous':
      return { kind: 'clarification', answer };
    case 'failed':
      return {
        kind: 'error',
        error: answer.error
          ? new GatewayError(answer.error.errorCode, answer.error.message)
          : new GatewayError('ANSWER_FAILED', 'Ответ завершился ошибкой'),
      };
  }
}
