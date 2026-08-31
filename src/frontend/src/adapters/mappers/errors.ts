/**
 * Ошибка маппинга DTO → домен (несоответствие контракту).
 *
 * Трассируемость: `specs/contracts/openapi.yaml` (контракт).
 */

export class MappingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MappingError';
  }
}
