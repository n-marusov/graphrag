/**
 * Проверяет: `BR-constraint.ui-session-history` — CRUD сессий и поиск через `SessionService`.
 */
import { describe, expect, it, vi } from 'vitest';
import { SessionService } from '../application/sessions';
import type { SessionGateway, SessionListQuery } from '../domain/ports';
import type { Session } from '../domain/session';

function makeGateway(): SessionGateway & { listCalls: SessionListQuery[] } {
  const listCalls: SessionListQuery[] = [];
  return {
    listCalls,
    listSessions: vi.fn(async (query?: SessionListQuery) => {
      listCalls.push(query ?? {});
      return [];
    }),
    createSession: vi.fn(async (title?: string) => makeSession(title)),
    getSession: vi.fn(async () => makeSession()),
    renameSession: vi.fn(async (_id: string, title: string) => makeSession(title)),
    deleteSession: vi.fn(async () => undefined),
  };
}

function makeSession(title = 'Сессия'): Session {
  return {
    id: 'session-1',
    title,
    createdAt: '2026-08-30T12:00:00.000Z',
    updatedAt: '2026-08-30T12:00:00.000Z',
    turns: [],
  };
}

describe('application: SessionService (BR-constraint.ui-session-history)', () => {
  it('load: запрос списка без параметров', async () => {
    const gateway = makeGateway();
    const service = new SessionService(gateway);

    const result = await service.load();

    expect(result).toEqual([]);
    expect(gateway.listSessions).toHaveBeenCalledWith();
  });

  it('search: непустой запрос передаёт q', async () => {
    const gateway = makeGateway();
    const service = new SessionService(gateway);

    await service.search('пайплайн');

    expect(gateway.listSessions).toHaveBeenCalledWith({ q: 'пайплайн' });
  });

  it('search: пустой запрос возвращается к списку без q', async () => {
    const gateway = makeGateway();
    const service = new SessionService(gateway);

    await service.search('   ');

    expect(gateway.listSessions).toHaveBeenCalledWith();
  });

  it('create: создаёт сессию с заголовком', async () => {
    const gateway = makeGateway();
    const service = new SessionService(gateway);

    const session = await service.create('Новая сессия');

    expect(gateway.createSession).toHaveBeenCalledWith('Новая сессия');
    expect(session.title).toBe('Новая сессия');
  });

  it('rename: переименовывает сессию', async () => {
    const gateway = makeGateway();
    const service = new SessionService(gateway);

    const session = await service.rename('session-1', 'Новое имя');

    expect(gateway.renameSession).toHaveBeenCalledWith('session-1', 'Новое имя');
    expect(session.title).toBe('Новое имя');
  });

  it('remove: удаляет сессию', async () => {
    const gateway = makeGateway();
    const service = new SessionService(gateway);

    await service.remove('session-1');

    expect(gateway.deleteSession).toHaveBeenCalledWith('session-1');
  });
});
