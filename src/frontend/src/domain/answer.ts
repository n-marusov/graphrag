/**
 * Агрегат `Answer` (контекст `query-answering`).
 *
 * Зеркало `specs/domain/aggregates.md`: корень `Answer`, сущности
 * `AnswerSection`/`Citation`, VO `AnswerId`/`AnswerStatus`/`Confidence`/`TraceRef`.
 * Инвариант: ответ публикуется только с атрибуцией источников (grounding).
 * Соответствует схеме `Answer` контракта `specs/contracts/openapi.yaml`.
 *
 * Трассируемость: `UC-answers.grounding.cited-answer` (F1.1, альтернативные потоки
 * A1–A3); `specs/domain/aggregates.md` (агрегат `Answer`);
 * `specs/contracts/openapi.yaml` (схема `Answer`).
 */

import type { Citation } from './citations';
import { DomainInvariantError } from './errors';
import type { AnswerId, AnswerPhase, AnswerStatus, Confidence, TraceRef } from './value-objects';

// Ре-экспорт VO для удобства импорта из агрегата
export type { AnswerId, AnswerPhase, AnswerStatus, Confidence, TraceRef } from './value-objects';

/** Раздел ответа с пораздельной атрибуцией */
export interface AnswerSection {
  /** Заголовок раздела */
  heading?: string;
  /** Текст раздела */
  text: string;
  /** Ссылки, поддерживающие факты раздела */
  citations: Citation[];
}

/** Вариант противоречия (A2: «Вариант А / Б» с источниками) */
export interface ContradictionVariant {
  label: string;
  text: string;
  citations: Citation[];
}

/** Противоречие между источниками (альтернативный поток A2, UC-answers.grounding.cited-answer) */
export interface Contradiction {
  notice: string;
  variants: ContradictionVariant[];
}

/** Ошибка пайплайна ответа (контракт: `error_code`, `message`) */
export interface AnswerError {
  errorCode: string;
  message: string;
}

/** Агрегат ответа с grounding и атрибуцией */
export interface Answer {
  /** Идентификатор ответа (VO `AnswerId`) */
  id: AnswerId;
  /** Статус (VO `AnswerStatus`) */
  status: AnswerStatus;
  /** Этап пайплайна при `processing` */
  phase?: AnswerPhase;
  /** Происхождение: версия индекса, на которой построен ответ */
  traceRef?: TraceRef;
  /** Сообщение-отказ с объяснением (A1 «источники не найдены») */
  notice?: string;
  /** Уточняющий вопрос вместо ответа (A3) */
  clarification?: string;
  /** Разделы ответа */
  sections: AnswerSection[];
  /** Противоречие между источниками (A2) */
  contradiction?: Contradiction;
  /** Сводный список источников (панель «Происхождение») */
  citations: Citation[];
  /** Уверенность ответа (VO `Confidence`, 0..1) */
  confidence?: Confidence;
  /** Ошибка пайплайна при `failed` */
  error?: AnswerError;
  /** Время создания (ISO 8601) */
  createdAt: string;
}

/**
 * Проверка инвариантов агрегата `Answer`.
 *
 * Инвариант (aggregates.md): «Ответ публикуется только с атрибуцией источников» —
 * опубликованный ответ (`answered`) обязан нести grounding: хотя бы один раздел,
 * противоречие с источниками или сводные цитаты.
 */
export function assertAnswerInvariants(answer: Answer): void {
  if (answer.status !== 'answered') return;

  const hasAttribution =
    answer.sections.length > 0 || answer.contradiction !== undefined || answer.citations.length > 0;

  if (!hasAttribution) {
    throw new DomainInvariantError(
      `Answer ${answer.id}: опубликованный ответ требует атрибуции источников (sections/contradiction/citations)`,
    );
  }
}
