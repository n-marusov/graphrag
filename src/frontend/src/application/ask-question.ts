/**
 * Use case «Задать вопрос» (F1.1, UC-answers.grounding.cited-answer).
 *
 * Поток: создать обращение (POST /answers) → опрашивать результат
 * (GET /answers/{answerId}) до терминального статуса
 * (`answered | no_sources | ambiguous | failed`).
 *
 * Зависимость — порт `AnswerGateway` (интерфейс из `domain/ports.ts`),
 * реализация — в `adapters/api` (Task 6). При превышении числа попыток
 * опроса выбрасывается `GatewayError('ANSWER_POLL_TIMEOUT')`.
 *
 * Трассируемость: `UC-answers.grounding.cited-answer` (F1.1, каскад
 * `QueryReceived → QueryAnswered`); `specs/contracts/openapi.yaml` (асинхронный ответ).
 */

import type { Answer, AnswerId } from '../domain/answer';
import { type AnswerGateway, type AskQuestionInput, GatewayError } from '../domain/ports';
import { log } from './logger';

export interface AskQuestionDeps {
  answerGateway: AnswerGateway;
  /** Интервал опроса, мс (по умолчанию 300) */
  pollIntervalMs?: number;
  /** Максимальное число опросов (по умолчанию 30) */
  maxAttempts?: number;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class AskQuestion {
  private readonly answerGateway: AnswerGateway;
  private readonly pollIntervalMs: number;
  private readonly maxAttempts: number;

  constructor(deps: AskQuestionDeps) {
    this.answerGateway = deps.answerGateway;
    this.pollIntervalMs = deps.pollIntervalMs ?? 300;
    this.maxAttempts = deps.maxAttempts ?? 30;
  }

  async execute(input: AskQuestionInput): Promise<Answer> {
    log.info('AskQuestion.execute: создание обращения', {
      sessionId: input.sessionId ?? null,
      questionLength: input.question.length,
    });
    const answer = await this.answerGateway.askQuestion(input);
    if (answer.status !== 'processing') {
      log.info('AskQuestion.execute: терминальный статус сразу', {
        answerId: answer.id,
        status: answer.status,
      });
      return answer;
    }
    return this.waitForTerminal(answer.id);
  }

  private async waitForTerminal(answerId: AnswerId): Promise<Answer> {
    // Начальный запрос учитывается в счётчике: maxAttempts — общее число опросов
    let answer = await this.answerGateway.getAnswer(answerId);
    let attempts = 1;

    while (answer.status === 'processing') {
      if (attempts >= this.maxAttempts) {
        log.error('AskQuestion.waitForTerminal: превышено число попыток', { answerId, attempts });
        throw new GatewayError('ANSWER_POLL_TIMEOUT', 'Превышено время ожидания ответа', 504);
      }
      log.debug('AskQuestion.waitForTerminal: опрос', {
        answerId,
        phase: answer.phase ?? null,
        attempt: attempts,
      });
      await delay(this.pollIntervalMs);
      answer = await this.answerGateway.getAnswer(answerId);
      attempts++;
    }

    log.info('AskQuestion.waitForTerminal: завершено', { answerId, status: answer.status });
    return answer;
  }
}
