/**
 * Мапперы DTO (контракт `openapi.yaml`) → доменные объекты.
 *
 * Адаптерный слой: переводит snake_case DTO в доменные типы
 * (`specs/domain/aggregates.md`). Неизвестный статус ответа — ошибка
 * маппинга (`MappingError`); обязательные коллекции нормализуются в `[]`.
 *
 * Трассируемость: `specs/contracts/openapi.yaml` → `specs/domain/aggregates.md`.
 */

import { log } from '../../application/logger';
import type {
  Answer,
  AnswerSection,
  Contradiction,
  ContradictionVariant,
} from '../../domain/answer';
import type { Citation } from '../../domain/citations';
import type { Session, SessionSummary, SessionTurn } from '../../domain/session';
import type {
  AnswerDto,
  AnswerSectionDto,
  CitationDto,
  ContradictionDto,
  ContradictionVariantDto,
  SessionDto,
  SessionSummaryDto,
  SessionTurnDto,
} from '../api/dto';
import { MappingError } from './errors';

export function mapCitation(dto: CitationDto): Citation {
  return {
    source: dto.source,
    title: dto.title,
    chunk: dto.chunk,
    quote: dto.quote,
  };
}

export function mapAnswerSection(dto: AnswerSectionDto): AnswerSection {
  return {
    heading: dto.heading,
    text: dto.text,
    citations: (dto.citations ?? []).map(mapCitation),
  };
}

export function mapContradictionVariant(dto: ContradictionVariantDto): ContradictionVariant {
  return {
    label: dto.label,
    text: dto.text,
    citations: (dto.citations ?? []).map(mapCitation),
  };
}

export function mapContradiction(dto: ContradictionDto): Contradiction {
  return {
    notice: dto.notice,
    variants: (dto.variants ?? []).map(mapContradictionVariant),
  };
}

export function mapAnswer(dto: AnswerDto): Answer {
  const knownStatuses = new Set(['processing', 'answered', 'no_sources', 'ambiguous', 'failed']);
  if (!knownStatuses.has(dto.status)) {
    log.error('mapAnswer: неизвестный статус ответа', { answerId: dto.id, status: dto.status });
    throw new MappingError(`Answer ${dto.id}: неизвестный статус «${dto.status}»`);
  }

  return {
    id: dto.id,
    status: dto.status,
    phase: dto.phase,
    traceRef: dto.indexVersion !== undefined ? { indexVersion: dto.indexVersion } : undefined,
    notice: dto.notice,
    clarification: dto.clarification,
    sections: (dto.sections ?? []).map(mapAnswerSection),
    contradiction: dto.contradiction ? mapContradiction(dto.contradiction) : undefined,
    citations: (dto.citations ?? []).map(mapCitation),
    confidence: dto.confidence,
    error: dto.error ? { errorCode: dto.error.error_code, message: dto.error.message } : undefined,
    createdAt: dto.createdAt,
  };
}

export function mapSessionTurn(dto: SessionTurnDto): SessionTurn {
  return {
    id: dto.id,
    question: dto.question,
    answer: dto.answer ? mapAnswer(dto.answer) : undefined,
    createdAt: dto.createdAt,
  };
}

export function mapSessionSummary(dto: SessionSummaryDto): SessionSummary {
  return {
    id: dto.id,
    title: dto.title,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

export function mapSession(dto: SessionDto): Session {
  return {
    ...mapSessionSummary(dto),
    turns: (dto.turns ?? []).map(mapSessionTurn),
  };
}
