/**
 * HTTP-клиент (адаптер) — fetch-обёртка поверх API Gateway.
 *
 * Маршрутизация `/api/v1` (контракт `specs/contracts/openapi.yaml`);
 * авторизация — bearer OIDC-токен (ADR-DES.SECURITY.sso-keycloak);
 * ошибки — `HttpError` со статусом и `error_code` из тела ответа.
 *
 * Трассируемость: `ADR-DES.API.api-gateway-adoption` (маршрутизация `/api/*`),
 * `specs/contracts/openapi.yaml` (`bearerAuth`, схема `Error`).
 */

import { log } from '../../application/logger';
import type { ErrorDto } from './dto';

export interface HttpClientOptions {
  baseUrl: string;
  /** Возвращает OIDC-токен (или null, если не аутентифицирован) */
  getToken: () => string | null;
}

/** Ошибка HTTP-запроса: HTTP-статус + машинный код контракта */
export class HttpError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
  }
}

export class HttpClient {
  private readonly options: HttpClientOptions;

  constructor(options: HttpClientOptions) {
    this.options = options;
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  patch<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('PATCH', path, body);
  }

  delete(path: string): Promise<void> {
    return this.request<void>('DELETE', path);
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.options.baseUrl}${path}`;
    const headers: Record<string, string> = { Accept: 'application/json' };
    const token = this.options.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body !== undefined) headers['Content-Type'] = 'application/json';

    log.info('HttpClient.request', { method, path });

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch (cause) {
      log.error('HttpClient.request: сетевая ошибка', { method, path, cause: String(cause) });
      throw new HttpError(0, 'NETWORK_ERROR', 'Не удалось связаться с сервером');
    }

    if (response.status === 204) {
      log.info('HttpClient.request: 204', { method, path });
      return undefined as T;
    }

    let payload: unknown = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok) {
      const errorBody = payload as ErrorDto | null;
      const code = errorBody?.error_code ?? 'HTTP_ERROR';
      const message = errorBody?.message ?? `HTTP ${response.status}`;
      log.warn('HttpClient.request: ошибка ответа', {
        method,
        path,
        status: response.status,
        code,
      });
      throw new HttpError(response.status, code, message);
    }

    log.info('HttpClient.request: успех', { method, path, status: response.status });
    return payload as T;
  }
}
