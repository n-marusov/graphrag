/**
 * Проверяет: `specs/contracts/openapi.yaml` (`AnswerStatus`) и `UC-answers.grounding.cited-answer`
 * (A1/A2/A3) — маппинг статусов ответа в состояния представления.
 */
import { describe, expect, it } from 'vitest';
import { chatStateFromAnswer } from '../application/chat-state-machine';
import type { Answer } from '../domain/answer';

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

describe('application: машина состояний чата', () => {
  it('processing → loading с фазой', () => {
    const answer = makeAnswer({
      status: 'processing',
      phase: 'retrieval',
      sections: [],
      citations: [],
    });
    expect(chatStateFromAnswer(answer)).toEqual({ kind: 'loading', phase: 'retrieval' });
  });

  it('answered → answer', () => {
    const answer = makeAnswer();
    expect(chatStateFromAnswer(answer)).toEqual({ kind: 'answer', answer });
  });

  it('no_sources → no_sources', () => {
    const answer = makeAnswer({
      status: 'no_sources',
      notice: 'Источники не найдены',
      sections: [],
      citations: [],
    });
    expect(chatStateFromAnswer(answer)).toEqual({ kind: 'no_sources', answer });
  });

  it('ambiguous → clarification', () => {
    const answer = makeAnswer({
      status: 'ambiguous',
      clarification: 'Уточните запрос',
      sections: [],
      citations: [],
    });
    expect(chatStateFromAnswer(answer)).toEqual({ kind: 'clarification', answer });
  });

  it('failed с error → error (GatewayError с кодом)', () => {
    const answer = makeAnswer({
      status: 'failed',
      sections: [],
      citations: [],
      error: { errorCode: 'GRAPH_TIMEOUT', message: 'Таймаут' },
    });
    const state = chatStateFromAnswer(answer);
    expect(state.kind).toBe('error');
    if (state.kind === 'error') {
      expect(state.error.code).toBe('GRAPH_TIMEOUT');
    }
  });
});
