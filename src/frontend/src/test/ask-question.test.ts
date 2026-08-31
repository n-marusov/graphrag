/**
 * Проверяет: `UC-answers.grounding.cited-answer` (F1.1) — создание обращения и опрос
 * результата до терминального статуса; обработка ошибок шлюза.
 */
import { describe, expect, it, vi } from 'vitest';
import { AskQuestion } from '../application/ask-question';
import type { Answer } from '../domain/answer';
import { type AnswerGateway, GatewayError } from '../domain/ports';

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

function makeGateway(answers: Answer[]): AnswerGateway & { getCalls: number } {
  let index = 0;
  return {
    getCalls: 0,
    askQuestion: vi.fn(async () => answers[0]),
    getAnswer: vi.fn(async () => {
      const value = answers[Math.min(index, answers.length - 1)];
      index++;
      return value;
    }),
  };
}

describe('application: AskQuestion (F1.1)', () => {
  it('терминальный статус сразу — опрос не выполняется', async () => {
    const gateway = makeGateway([makeAnswer()]);
    const useCase = new AskQuestion({ answerGateway: gateway, pollIntervalMs: 1, maxAttempts: 3 });

    const result = await useCase.execute({ question: 'Вопрос' });

    expect(result.status).toBe('answered');
    expect(gateway.getAnswer).not.toHaveBeenCalled();
  });

  it('опрашивает до терминального статуса (processing → answered)', async () => {
    const gateway = makeGateway([
      makeAnswer({
        id: 'answer-1',
        status: 'processing',
        phase: 'retrieval',
        sections: [],
        citations: [],
      }),
      makeAnswer({
        id: 'answer-1',
        status: 'processing',
        phase: 'generation',
        sections: [],
        citations: [],
      }),
      makeAnswer({ id: 'answer-1', status: 'answered' }),
    ]);
    const useCase = new AskQuestion({ answerGateway: gateway, pollIntervalMs: 1, maxAttempts: 5 });

    const result = await useCase.execute({ question: 'Вопрос' });

    expect(result.status).toBe('answered');
    expect(gateway.getAnswer).toHaveBeenCalledTimes(3);
  });

  it('превышение числа попыток — GatewayError ANSWER_POLL_TIMEOUT', async () => {
    const gateway = makeGateway([
      makeAnswer({ id: 'answer-1', status: 'processing', sections: [], citations: [] }),
    ]);
    const useCase = new AskQuestion({ answerGateway: gateway, pollIntervalMs: 1, maxAttempts: 2 });

    await expect(useCase.execute({ question: 'Вопрос' })).rejects.toMatchObject({
      name: 'GatewayError',
      code: 'ANSWER_POLL_TIMEOUT',
    });
  });

  it('передаёт sessionId в шлюз при создании обращения', async () => {
    const gateway = makeGateway([makeAnswer()]);
    const useCase = new AskQuestion({ answerGateway: gateway });

    await useCase.execute({ question: 'Вопрос', sessionId: 'session-1' });

    expect(gateway.askQuestion).toHaveBeenCalledWith({
      question: 'Вопрос',
      sessionId: 'session-1',
    });
  });
});

describe('application: AskQuestion (обработка ошибок)', () => {
  it('ошибка шлюза пробрасывается как GatewayError', async () => {
    const gateway: AnswerGateway = {
      askQuestion: vi.fn(async () => {
        throw new GatewayError('GRAPH_TIMEOUT', 'Таймаут', 504);
      }),
      getAnswer: vi.fn(),
    };
    const useCase = new AskQuestion({ answerGateway: gateway });

    await expect(useCase.execute({ question: 'Вопрос' })).rejects.toMatchObject({
      code: 'GRAPH_TIMEOUT',
    });
  });
});
