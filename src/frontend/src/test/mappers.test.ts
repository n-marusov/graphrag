/**
 * Проверяет: `specs/contracts/openapi.yaml` ↔ `specs/domain/aggregates.md` —
 * мапперы DTO→домен, presenter (происхождение), gateways (реализации портов).
 */
import { describe, expect, it } from 'vitest';
import type { ApiClient } from '../adapters/api/api-client';
import type { AnswerDto, SessionDto } from '../adapters/api/dto';
import { createAnswerGateway, createSessionGateway } from '../adapters/gateways';
import { mapAnswer, mapSession } from '../adapters/mappers/dto-to-domain';
import { MappingError } from '../adapters/mappers/errors';
import { answerHeading, provenanceSources } from '../adapters/mappers/presenter';
import type { Answer } from '../domain/answer';

const answerDto: AnswerDto = {
  id: 'answer-1',
  status: 'answered',
  indexVersion: 'idx-42',
  sections: [
    {
      heading: 'Пайплайн',
      text: 'Текст',
      citations: [{ source: 'specs/vision.md', chunk: 'чанк 1/2' }],
    },
  ],
  citations: [{ source: 'specs/vision.md', chunk: 'чанк 1/2' }, { source: 'specs/glossary.md' }],
  confidence: 0.92,
  createdAt: '2026-08-30T12:00:00.000Z',
};

describe('adapters: мапперы DTO → домен', () => {
  it('полный ответ: все поля маппятся в домен', () => {
    const answer = mapAnswer(answerDto);

    expect(answer.id).toBe('answer-1');
    expect(answer.status).toBe('answered');
    expect(answer.traceRef).toEqual({ indexVersion: 'idx-42' });
    expect(answer.sections[0].heading).toBe('Пайплайн');
    expect(answer.sections[0].citations[0]).toEqual({
      source: 'specs/vision.md',
      chunk: 'чанк 1/2',
    });
    expect(answer.citations).toHaveLength(2);
    expect(answer.confidence).toBe(0.92);
  });

  it('error в DTO маппится в errorCode домена', () => {
    const answer = mapAnswer({
      ...answerDto,
      status: 'failed',
      error: { error_code: 'GRAPH_TIMEOUT', message: 'Таймаут' },
    });
    expect(answer.error).toEqual({ errorCode: 'GRAPH_TIMEOUT', message: 'Таймаут' });
  });

  it('неизвестный статус — MappingError', () => {
    expect(() => mapAnswer({ ...answerDto, status: 'unknown' as AnswerDto['status'] })).toThrow(
      MappingError,
    );
  });

  it('отсутствующие коллекции нормализуются в []', () => {
    const answer = mapAnswer({
      ...answerDto,
      sections: undefined as unknown as AnswerDto['sections'],
      citations: undefined as unknown as AnswerDto['citations'],
    });
    expect(answer.sections).toEqual([]);
    expect(answer.citations).toEqual([]);
  });

  it('сессия: summary + обращения маппятся в домен', () => {
    const sessionDto: SessionDto = {
      id: 'session-1',
      title: 'Первый вопрос?',
      createdAt: '2026-08-30T12:00:00.000Z',
      updatedAt: '2026-08-30T12:10:00.000Z',
      turns: [
        {
          id: 'turn-1',
          question: 'Вопрос',
          answer: answerDto,
          createdAt: '2026-08-30T12:05:00.000Z',
        },
      ],
    };
    const session = mapSession(sessionDto);
    expect(session.id).toBe('session-1');
    expect(session.turns).toHaveLength(1);
    expect(session.turns[0].answer?.id).toBe('answer-1');
  });
});

describe('adapters: presenter (view models)', () => {
  const answer: Answer = {
    id: 'answer-1',
    status: 'answered',
    sections: [{ heading: 'Пайплайн', text: 'Текст', citations: [{ source: 'a.md', chunk: '1' }] }],
    contradiction: {
      notice: 'Противоречие',
      variants: [
        { label: 'А', text: '…', citations: [{ source: 'a.md', chunk: '1' }, { source: 'b.md' }] },
      ],
    },
    citations: [{ source: 'c.md' }],
    createdAt: '2026-08-30T12:00:00.000Z',
  };

  it('provenanceSources: собирает и дедуплицирует источники', () => {
    const sources = provenanceSources(answer);
    expect(sources.map((s) => s.source)).toEqual(['a.md', 'b.md', 'c.md']);
  });

  it('answerHeading: первый заголовок раздела', () => {
    expect(answerHeading(answer, 'fallback')).toBe('Пайплайн');
  });

  it('answerHeading: fallback при отсутствии заголовков', () => {
    const noHeadings: Answer = { ...answer, sections: [{ text: 'Текст', citations: [] }] };
    expect(answerHeading(noHeadings, 'fallback')).toBe('fallback');
  });
});

describe('adapters: gateways (реализации портов)', () => {
  it('AnswerGateway: askQuestion возвращает доменный Answer', async () => {
    const api: ApiClient = {
      askQuestion: async () => answerDto,
      getAnswer: async () => answerDto,
      listSessions: async () => [],
      createSession: async () => {
        throw new Error('stub');
      },
      getSession: async () => {
        throw new Error('stub');
      },
      renameSession: async () => {
        throw new Error('stub');
      },
      deleteSession: async () => undefined,
    };
    const gateway = createAnswerGateway(api);
    const answer = await gateway.askQuestion({ question: 'Вопрос', sessionId: 'session-1' });
    expect(answer.id).toBe('answer-1');
    expect(answer.traceRef).toEqual({ indexVersion: 'idx-42' });
  });

  it('SessionGateway: listSessions возвращает доменные SessionSummary', async () => {
    const api: ApiClient = {
      listSessions: async () => [
        {
          id: 'session-1',
          title: 'Сессия',
          createdAt: '2026-08-30T12:00:00.000Z',
          updatedAt: '2026-08-30T12:00:00.000Z',
        },
      ],
      createSession: async () => {
        throw new Error('stub');
      },
      getSession: async () => {
        throw new Error('stub');
      },
      renameSession: async () => {
        throw new Error('stub');
      },
      deleteSession: async () => undefined,
      askQuestion: async () => {
        throw new Error('stub');
      },
      getAnswer: async () => {
        throw new Error('stub');
      },
    };
    const gateway = createSessionGateway(api);
    const sessions = await gateway.listSessions();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].title).toBe('Сессия');
  });
});
