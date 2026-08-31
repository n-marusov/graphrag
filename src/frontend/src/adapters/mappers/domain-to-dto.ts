/**
 * Мапперы домен → DTO (для запросов к API).
 *
 * Запросы контракта (`openapi.yaml`) строятся из доменных входов:
 * `AskQuestionInput` → `AskQuestionRequestDto`, `SessionListQuery` →
 * `SessionListQueryDto`. Входные данные не содержат доменной логики —
 * маппинг тривиальный, зафиксирован для симметрии контракта.
 *
 * Трассируемость: `specs/contracts/openapi.yaml` (тела запросов).
 */

import type { AskQuestionInput, SessionListQuery } from '../../domain/ports';
import type { SessionListQueryDto } from '../api/api-client';
import type { AskQuestionRequestDto } from '../api/dto';

export function toAskQuestionRequest(input: AskQuestionInput): AskQuestionRequestDto {
  return {
    sessionId: input.sessionId,
    question: input.question,
  };
}

export function toSessionListQuery(query: SessionListQuery): SessionListQueryDto {
  return {
    q: query.q,
    limit: query.limit,
  };
}
