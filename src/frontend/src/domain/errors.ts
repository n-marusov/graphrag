/**
 * Ошибка нарушения доменного инварианта.
 *
 * Бросается guard-функциями доменного слоя (answer.ts, session.ts), когда объект
 * нарушает инварианты агрегатов из `specs/domain/aggregates.md`.
 *
 * Трассируемость: `specs/domain/aggregates.md` (инварианты агрегатов).
 */

export class DomainInvariantError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainInvariantError';
  }
}
