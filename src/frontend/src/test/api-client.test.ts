/**
 * Проверяет: `specs/contracts/openapi.yaml` — HttpClient (URL, заголовки, статусы,
 * `error_code`) и эндпоинты `ApiClient`; `toGatewayError`.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type ApiClient, createApiClient } from '../adapters/api/api-client';
import { toGatewayError } from '../adapters/api/errors';
import { HttpClient, HttpError } from '../adapters/api/http';
import { GatewayError } from '../domain/ports';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function makeHttp(token: string | null = null): HttpClient {
  return new HttpClient({ baseUrl: '/api/v1', getToken: () => token });
}

describe('adapters: HttpClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('GET: корректный URL и заголовки', async () => {
    const fetchMock = vi.fn(async () => jsonResponse(200, { ok: true }));
    vi.stubGlobal('fetch', fetchMock);
    const client = makeHttp('token-123');

    const result = await client.get<{ ok: boolean }>('/sessions');

    expect(result).toEqual({ ok: true });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/v1/sessions');
    expect(init.headers).toMatchObject({
      Accept: 'application/json',
      Authorization: 'Bearer token-123',
    });
  });

  it('POST: сериализует тело и ставит Content-Type', async () => {
    const fetchMock = vi.fn(async () => jsonResponse(201, { id: 's1' }));
    vi.stubGlobal('fetch', fetchMock);
    const client = makeHttp();

    await client.post('/sessions', { title: 'Новая' });

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/v1/sessions');
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json');
    expect(init.body).toBe(JSON.stringify({ title: 'Новая' }));
  });

  it('204: возвращает undefined', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 204 })),
    );
    const client = makeHttp();

    await expect(client.delete('/sessions/s1')).resolves.toBeUndefined();
  });

  it('ошибка с error_code → HttpError', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse(404, { error_code: 'SESSION_NOT_FOUND', message: 'Не найдена' }),
      ),
    );
    const client = makeHttp();

    await expect(client.get('/sessions/nope')).rejects.toMatchObject({
      name: 'HttpError',
      status: 404,
      code: 'SESSION_NOT_FOUND',
    });
  });

  it('сетевая ошибка → HttpError NETWORK_ERROR', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new TypeError('fetch failed'))),
    );
    const client = makeHttp();

    await expect(client.get('/sessions')).rejects.toMatchObject({
      name: 'HttpError',
      status: 0,
      code: 'NETWORK_ERROR',
    });
  });
});

describe('adapters: ApiClient (эндпоинты контракта)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  let client: ApiClient;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn(async () => jsonResponse(200, []));
    vi.stubGlobal('fetch', fetchMock);
    client = createApiClient(makeHttp());
  });

  it('listSessions: GET /sessions с параметрами поиска', async () => {
    await client.listSessions({ q: 'пайплайн', limit: 20 });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/sessions?q=%D0%BF%D0%B0%D0%B9%D0%BF%D0%BB%D0%B0%D0%B9%D0%BD&limit=20',
      expect.anything(),
    );
  });

  it('createSession: POST /sessions', async () => {
    await client.createSession('Новая');
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/sessions', expect.anything());
  });

  it('getSession: GET /sessions/{id}', async () => {
    await client.getSession('s-1');
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/sessions/s-1', expect.anything());
  });

  it('renameSession: PATCH /sessions/{id}', async () => {
    await client.renameSession('s-1', 'Имя');
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/sessions/s-1', expect.anything());
  });

  it('deleteSession: DELETE /sessions/{id}', async () => {
    await client.deleteSession('s-1');
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/sessions/s-1', expect.anything());
  });

  it('askQuestion: POST /answers', async () => {
    await client.askQuestion({ question: 'Вопрос', sessionId: 's-1' });
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/answers', expect.anything());
  });

  it('getAnswer: GET /answers/{id}', async () => {
    await client.getAnswer('a-1');
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/answers/a-1', expect.anything());
  });
});

describe('adapters: toGatewayError', () => {
  it('HttpError → GatewayError с кодом и статусом', () => {
    const error = toGatewayError(new HttpError(504, 'GRAPH_TIMEOUT', 'Таймаут'));
    expect(error).toBeInstanceOf(GatewayError);
    expect(error.code).toBe('GRAPH_TIMEOUT');
    expect(error.httpStatus).toBe(504);
  });

  it('GatewayError проходит без изменений', () => {
    const original = new GatewayError('RATE_LIMITED', 'Лимит', 429);
    expect(toGatewayError(original)).toBe(original);
  });

  it('прочие ошибки → UNKNOWN_ERROR', () => {
    const error = toGatewayError(new Error('boom'));
    expect(error.code).toBe('UNKNOWN_ERROR');
  });
});
