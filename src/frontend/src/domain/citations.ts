/**
 * Цитата источника (панель «Происхождение»).
 *
 * Атрибуция фактов ответа к документам корпуса (`specs/glossary.md`,
 * «Атрибуция источников»); соответствует схеме `Citation` контракта
 * `specs/contracts/openapi.yaml`.
 *
 * Трассируемость: glossary «Атрибуция источников»; `specs/contracts/openapi.yaml` (Citation).
 */

export interface Citation {
  /** Путь к документу корпуса (например, `specs/glossary.md`) */
  source: string;
  /** Название источника */
  title?: string;
  /** Идентификатор чанка (например, «чанк 4/12») */
  chunk?: string;
  /** Цитируемый фрагмент */
  quote?: string;
}
