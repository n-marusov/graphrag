/**
 * Проверяет: `specs/domain/aggregates.md` — инварианты агрегатов `Answer` и `Session`
 * (атрибуция ответа, упорядоченность обращений, заголовок сессии).
 */
import { describe, expect, it } from 'vitest';
import { type Answer, assertAnswerInvariants } from '../domain/answer';
import { DomainInvariantError } from '../domain/errors';
import { assertSessionInvariants, type Session, sessionTitle } from '../domain/session';

function makeAnswer(overrides: Partial<Answer> = {}): Answer {
  return {
    id: 'answer-1',
    status: 'answered',
    sections: [{ text: 'Раздел', citations: [] }],
    citations: [],
    createdAt: '2026-08-30T12:00:00.000Z',
    ...overrides,
  };
}

function makeSession(turns: Session['turns']): Session {
  return {
    id: 'session-1',
    title: 'Первый вопрос?',
    createdAt: '2026-08-30T12:00:00.000Z',
    updatedAt: '2026-08-30T12:10:00.000Z',
    turns,
  };
}

describe('домен: Answer (инварианты, aggregates.md)', () => {
  it('опубликованный ответ без атрибуции — нарушение инварианта', () => {
    const answer = makeAnswer({ sections: [], citations: [] });
    expect(() => assertAnswerInvariants(answer)).toThrow(DomainInvariantError);
  });

  it('опубликованный ответ с разделами — корректен', () => {
    const answer = makeAnswer();
    expect(() => assertAnswerInvariants(answer)).not.toThrow();
  });

  it('опубликованный ответ с противоречием (A2) — корректен', () => {
    const answer = makeAnswer({
      sections: [],
      contradiction: {
        notice: 'Найдены противоречия между источниками',
        variants: [{ label: 'Вариант А', text: '…', citations: [] }],
      },
    });
    expect(() => assertAnswerInvariants(answer)).not.toThrow();
  });

  it('ответ в обработке может не иметь атрибуции', () => {
    const answer = makeAnswer({ status: 'processing', sections: [], citations: [] });
    expect(() => assertAnswerInvariants(answer)).not.toThrow();
  });

  it('ответ со статусом no_sources не требует атрибуции (A1)', () => {
    const answer = makeAnswer({
      status: 'no_sources',
      notice: 'Источники не найдены',
      sections: [],
      citations: [],
    });
    expect(() => assertAnswerInvariants(answer)).not.toThrow();
  });
});

describe('домен: Session (заголовок и инварианты, BR-constraint.ui-session-history)', () => {
  it('заголовок по умолчанию — первый запрос сессии', () => {
    expect(sessionTitle('Как устроен пайплайн индексации?')).toBe(
      'Как устроен пайплайн индексации?',
    );
  });

  it('заданное пользователем имя переопределяет первый запрос', () => {
    expect(sessionTitle('Как устроен пайплайн индексации?', 'Ретривер')).toBe('Ретривер');
  });

  it('пустое пользовательское имя не переопределяет первый запрос', () => {
    expect(sessionTitle('Как устроен пайплайн индексации?', '   ')).toBe(
      'Как устроен пайплайн индексации?',
    );
  });

  it('обращения, нарушающие порядок по времени, — нарушение инварианта', () => {
    const session = makeSession([
      { id: 'turn-1', question: 'Вопрос 1', createdAt: '2026-08-30T12:10:00.000Z' },
      { id: 'turn-2', question: 'Вопрос 2', createdAt: '2026-08-30T12:00:00.000Z' },
    ]);
    expect(() => assertSessionInvariants(session)).toThrow(DomainInvariantError);
  });

  it('упорядоченные обращения — корректен', () => {
    const session = makeSession([
      { id: 'turn-1', question: 'Вопрос 1', createdAt: '2026-08-30T12:00:00.000Z' },
      { id: 'turn-2', question: 'Вопрос 2', createdAt: '2026-08-30T12:10:00.000Z' },
    ]);
    expect(() => assertSessionInvariants(session)).not.toThrow();
  });

  it('пустая сессия (без обращений) — корректен', () => {
    expect(() => assertSessionInvariants(makeSession([]))).not.toThrow();
  });
});
