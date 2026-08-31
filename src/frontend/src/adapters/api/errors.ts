/**
 * Маппинг ошибок адаптера в `GatewayError` домена.
 *
 * `HttpError` (статус + error_code контракта) → `GatewayError`;
 * прочие ошибки — `UNKNOWN_ERROR`. Используется use cases и UI-слоем
 * для локализованных состояний ошибки.
 *
 * Трассируемость: `specs/contracts/openapi.yaml` (`error_code`),
 * `specs/qa/integration.md` (conformance: status, required fields, `error_code`).
 */

import { GatewayError } from '../../domain/ports';
import { HttpError } from './http';

export function toGatewayError(error: unknown): GatewayError {
  if (error instanceof GatewayError) return error;
  if (error instanceof HttpError) return new GatewayError(error.code, error.message, error.status);
  return new GatewayError('UNKNOWN_ERROR', 'Неизвестная ошибка');
}
