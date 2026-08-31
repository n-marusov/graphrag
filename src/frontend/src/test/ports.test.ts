/**
 * Проверяет: `specs/contracts/openapi.yaml` — контракт портов (`AnswerGateway`,
 * `SessionGateway`) и `GatewayError` (error_code).
 */
import { describe, expect, it } from 'vitest';
import { type AnswerGateway, GatewayError, type SessionGateway } from '../domain/ports';

const stubAnswerGateway: AnswerGateway = {
  askQuestion: async () => {
    throw new Error('stub: not implemented');
  },
  getAnswer: async () => {
    throw new Error('stub: not implemented');
  },
};

const stubSessionGateway: SessionGateway = {
  listSessions: async () => [],
  createSession: async () => {
    throw new Error('stub: not implemented');
  },
  getSession: async () => {
    throw new Error('stub: not implemented');
  },
  renameSession: async () => {
    throw new Error('stub: not implemented');
  },
  deleteSession: async () => undefined,
};

describe('домен: порты (контракт openapi.yaml)', () => {
  it('AnswerGateway предоставляет методы askQuestion и getAnswer', () => {
    const gateway: AnswerGateway = stubAnswerGateway;
    expect(typeof gateway.askQuestion).toBe('function');
    expect(typeof gateway.getAnswer).toBe('function');
  });

  it('SessionGateway предоставляет CRUD-методы сессий', () => {
    const gateway: SessionGateway = stubSessionGateway;
    expect(typeof gateway.listSessions).toBe('function');
    expect(typeof gateway.createSession).toBe('function');
    expect(typeof gateway.getSession).toBe('function');
    expect(typeof gateway.renameSession).toBe('function');
    expect(typeof gateway.deleteSession).toBe('function');
  });

  it('GatewayError несёт машинный код и HTTP-статус', () => {
    const error = new GatewayError('GRAPH_TIMEOUT', 'Таймаут пайплайна ответа', 504);
    expect(error.code).toBe('GRAPH_TIMEOUT');
    expect(error.httpStatus).toBe(504);
    expect(error).toBeInstanceOf(Error);
  });
});
