/**
 * Composition root: создание зависимостей приложения.
 *
 * Собирает HttpClient → ApiClient → gateways → services → ChatStore.
 * В dev-режиме при `VITE_USE_MOCK=1` используются in-memory заглушки
 * (бэкенд ещё не реализован; контент — демо, без фактических данных).
 *
 * Трассируемость: `ADR-DES.UI.spa-typescript-frontend` (тонкий SPA, контракт OpenAPI).
 */

import { createApiClient } from '../adapters/api/api-client';
import { createLocalStorageTokenProvider } from '../adapters/api/auth';
import { HttpClient } from '../adapters/api/http';
import { createAnswerGateway, createSessionGateway } from '../adapters/gateways';
import { createChatStore } from '../adapters/state/chat-store';
import { AskQuestion } from '../application/ask-question';
import { SessionService } from '../application/sessions';
import { createMockGateways } from './mock-gateways';

export function bootstrap() {
  const useMock = import.meta.env.DEV && import.meta.env.VITE_USE_MOCK === '1';
  if (useMock) {
    return createChatStore(createMockGateways());
  }

  const http = new HttpClient({
    baseUrl: (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api/v1',
    getToken: createLocalStorageTokenProvider().getToken,
  });
  const api = createApiClient(http);

  return createChatStore({
    sessions: new SessionService(createSessionGateway(api)),
    askQuestion: new AskQuestion({ answerGateway: createAnswerGateway(api) }),
  });
}
