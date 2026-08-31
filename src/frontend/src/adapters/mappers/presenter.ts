/**
 * Presenter — view models для UI (панель «Происхождение» и заголовки).
 *
 * Не содержит логики рендеринга: готовит данные для презентационных
 * компонентов (панель источников, заголовок ответа).
 *
 * Трассируемость: glossary «Происхождение»;
 * `REQ-NFR-data.maintainability.versioned-provenance` (версия индекса в provenance).
 */

import type { Answer } from '../../domain/answer';
import type { Citation } from '../../domain/citations';

/**
 * Сводный список источников ответа для панели «Происхождение».
 *
 * Собирает цитаты из разделов, противоречий (A2) и сводного списка;
 * дедупликация по (source, chunk).
 */
export function provenanceSources(answer: Answer): Citation[] {
  const seen = new Set<string>();
  const result: Citation[] = [];

  const add = (citation: Citation): void => {
    const key = `${citation.source}#${citation.chunk ?? ''}`;
    if (seen.has(key)) return;
    seen.add(key);
    result.push(citation);
  };

  for (const section of answer.sections) {
    for (const citation of section.citations) add(citation);
  }
  for (const variant of answer.contradiction?.variants ?? []) {
    for (const citation of variant.citations) add(citation);
  }
  for (const citation of answer.citations) add(citation);

  return result;
}

/** Заголовок ответа: первый заголовок раздела или вопрос по умолчанию */
export function answerHeading(answer: Answer, fallback: string): string {
  const firstHeading = answer.sections.find((section) => section.heading?.trim());
  return firstHeading?.heading?.trim() || fallback;
}
