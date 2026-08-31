/**
 * DTO — типы HTTP API по контракту `specs/contracts/openapi.yaml`.
 *
 * Зеркалят схемы OpenAPI 3.1 (snake_case поля). Маппинг в доменные типы —
 * `adapters/mappers/dto-to-domain.ts` (Task 7).
 *
 * Трассируемость: `specs/contracts/openapi.yaml` (схемы OpenAPI 3.1).
 */

export interface ErrorDto {
  error_code: string;
  message: string;
  details?: Record<string, unknown>;
}

export type AnswerStatusDto = 'processing' | 'answered' | 'no_sources' | 'ambiguous' | 'failed';
export type AnswerPhaseDto = 'retrieval' | 'generation';

export interface CitationDto {
  source: string;
  title?: string;
  chunk?: string;
  quote?: string;
}

export interface AnswerSectionDto {
  heading?: string;
  text: string;
  citations: CitationDto[];
}

export interface ContradictionVariantDto {
  label: string;
  text: string;
  citations: CitationDto[];
}

export interface ContradictionDto {
  notice: string;
  variants: ContradictionVariantDto[];
}

export interface AnswerErrorDto {
  error_code: string;
  message: string;
}

export interface AnswerDto {
  id: string;
  status: AnswerStatusDto;
  phase?: AnswerPhaseDto;
  indexVersion?: string;
  notice?: string;
  clarification?: string;
  sections: AnswerSectionDto[];
  contradiction?: ContradictionDto;
  citations: CitationDto[];
  confidence?: number;
  error?: AnswerErrorDto;
  createdAt: string;
}

export interface SessionSummaryDto {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface SessionTurnDto {
  id: string;
  question: string;
  answer?: AnswerDto;
  createdAt: string;
}

export interface SessionDto extends SessionSummaryDto {
  turns: SessionTurnDto[];
}

export interface CreateSessionRequestDto {
  title?: string;
}

export interface UpdateSessionRequestDto {
  title: string;
}

export interface AskQuestionRequestDto {
  sessionId?: string;
  question: string;
}
