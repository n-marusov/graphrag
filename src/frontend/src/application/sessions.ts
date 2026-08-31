/**
 * Use cases управления сессиями (BR-constraint.ui-session-history).
 *
 * Список/поиск/создание/чтение/переименование/удаление сессий через порт
 * `SessionGateway` (реализация — `adapters/api`, Task 6).
 *
 * Трассируемость: `BR-constraint.ui-session-history` (создание/переименование/удаление/поиск).
 */

import type { SessionGateway } from '../domain/ports';
import type { Session, SessionId, SessionSummary } from '../domain/session';
import { log } from './logger';

export class SessionService {
  private readonly gateway: SessionGateway;

  constructor(gateway: SessionGateway) {
    this.gateway = gateway;
  }

  /** GET /sessions — список сессий (левая панель) */
  async load(): Promise<SessionSummary[]> {
    log.debug('SessionService.load');
    return this.gateway.listSessions();
  }

  /** GET /sessions?q= — поиск по заголовкам */
  async search(query: string): Promise<SessionSummary[]> {
    const q = query.trim();
    log.debug('SessionService.search', { q });
    return q.length > 0 ? this.gateway.listSessions({ q }) : this.gateway.listSessions();
  }

  /** POST /sessions — «+ Новая сессия» */
  async create(title?: string): Promise<Session> {
    log.info('SessionService.create', { title: title ?? null });
    return this.gateway.createSession(title);
  }

  /** GET /sessions/{id} — сессия с историей обращений */
  async get(id: SessionId): Promise<Session> {
    log.debug('SessionService.get', { sessionId: id });
    return this.gateway.getSession(id);
  }

  /** PATCH /sessions/{id} — переименование */
  async rename(id: SessionId, title: string): Promise<Session> {
    log.info('SessionService.rename', { sessionId: id, title });
    return this.gateway.renameSession(id, title);
  }

  /** DELETE /sessions/{id} — удаление */
  async remove(id: SessionId): Promise<void> {
    log.info('SessionService.remove', { sessionId: id });
    await this.gateway.deleteSession(id);
  }
}
