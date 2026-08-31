# Веб-интерфейс GraphRAG (фронтенд)

Тонкий SPA-клиент GraphRAG: чат с системой знаний (вопрос → проверяемый ответ
с grounding и provenance). Только чат (F1) — `ADR-DES.UI.chat-only-interface`;
статусы, метрики и F3 — вне GUI (Grafana, MCP/CLI).

## Стек

- **Vue 3** (Composition API, `<script setup>`) + **Vite** + **TypeScript**
  (`ADR-DES.UI.spa-typescript-frontend`)
- **Tailwind CSS v4** (`@tailwindcss/vite`), токены `@theme`
  (`ADR-DES.UI.tailwind-css-adoption`)
- **Vitest** + **@vue/test-utils** (юнит/компонентные тесты), **axe-core** (a11y WCAG 2.1 AA)
- **Biome** — линтер и форматтер (`biome.json`, preset `recommended`)
- Маршрутизация: `vue-router` (один маршрут — чат)

## Команды

```bash
pnpm install         # установка зависимостей
pnpm dev             # dev-сервер (Vite)
pnpm build           # production-сборка
pnpm typecheck       # проверка типов (vue-tsc -b)
pnpm test            # прогон тестов (vitest)
pnpm test:watch      # тесты в watch-режиме
pnpm lint            # Biome: форматирование + импорты + lint-правила
pnpm lint:fix        # Biome: применить безопасные исправления
pnpm format          # Biome: переформатировать файлы
```

## Переменные окружения

| Переменная | Назначение | По умолчанию |
|---|---|---|
| `VITE_API_BASE_URL` | Базовый URL API (за API Gateway) | `/api/v1` |
| `VITE_LOG_LEVEL` | Уровень логгера: `debug` \| `verbose` \| `info` \| `warn` \| `error` | `info` |
| `VITE_USE_MOCK` | Демо-режим без бэкенда (`=1`): in-memory заглушки шлюзов | выкл |
| `VITE_APP_COMMIT` | Переопределение SHA сборки (ниже `CI_COMMIT_SHORT_SHA`) | — |
| `CI_COMMIT_SHORT_SHA` | SHA коммита из GitLab CI (приоритет выше `VITE_APP_COMMIT` → локальный git → `dev`) | — |

**Демо без бэкенда:** `VITE_USE_MOCK=1 pnpm dev` — контент — демо, без фактических данных; реальный контент придёт из API по контракту.

## Версия и SHA сборки

Версия и короткий SHA коммита инжектируются в сборку динамически
(`build/app-meta.ts` → Vite `define` → `src/app/meta.ts`):

- **версия** — из `package.json`;
- **SHA** — `CI_COMMIT_SHORT_SHA` (GitLab CI) → `VITE_APP_COMMIT` → `git rev-parse --short HEAD` → `dev`.

Отображаются в футере (`BR-constraint.ui-footer`, моноширинный шрифт).

## Известные ограничения

- **SSO/OIDC — заглушка.** Токен хранится в `localStorage` (`adapters/api/auth.ts`).
  До интеграции Keycloak (authorization code + PKCE) требуется: короткоживущие токены,
  CSP-заголовки на статик-сервере, рассмотреть httpOnly-куки (XSS-поверхность).

## Архитектура (Clean Architecture, зависимости — внутрь)

```
src/
├── domain/          # Сущности и VO (plain TS, без Vue): Answer, Session, Citation,
│                    #   AnswerStatus, TraceRef… (зеркало specs/domain/aggregates.md)
│   └── ports.ts     #   AnswerGateway, SessionGateway — интерфейсы
├── application/     # Use cases: AskQuestion (опрос), SessionService, машина состояний
├── adapters/        # Реализации портов и представления
│   ├── api/         #   HttpClient, DTO по контракту, auth (bearer OIDC), errors
│   ├── mappers/     #   DTO ↔ домен, presenter (view models)
│   ├── state/       #   chat-store (reactive, provide/inject)
│   └── i18n/        #   ru/en словарь
├── ui/              # Презентационные Vue-компоненты (dumb)
│   ├── icons/       #   Icon.vue + реестр (currentColor)
│   ├── layout/      #   AppLayout, AppHeader, SessionSidebar, AppFooter
│   ├── chat/        #   ChatView, QuestionInput, AnswerView, LoadingSteps,
│   │                #   NoSourcesState, ContradictionView, ErrorState
│   └── provenance/  #   ProvenancePanel, CitationCard
├── app/             # Composition root: bootstrap, router, mock-gateways (dev)
└── assets/          # Токены (@theme, `src/assets/styles/tokens.css`), шрифты (Inter, JetBrainsMono),
                     #   канонические иконки (SVG, `src/assets/icons/`)
```

Правила:

- **`domain/` и `application/` не импортируют Vue** (чистый TS).
- Порты объявлены внутри; реализации — в `adapters/`; связывание — в `app/`
  (composition root, `provide(chatStoreKey, store)`).
- Контракт API — `specs/contracts/openapi.yaml` (источник DTO и эндпоинтов).
- Строки UI — через i18n (`adapters/i18n/messages.ts`), без хардкода.

## Трассируемость требований

Каждый модуль и тест ссылается на требования (цепочка `Vision → UC → FR → ADR → COMP → TEST`,
`RULES.md`): в заголовочном комментарии файла — строка `Трассируемость: <ID>` для кода
и `Проверяет: <ID>` для тестов. Идентификаторы: функции F1/F1.1 (`specs/vision.md`),
`UC-answers.grounding.cited-answer`, `BR-constraint.ui-*`, `ADR-DES.UI.*`,
`specs/domain/aggregates.md`, `specs/contracts/openapi.yaml`, glossary-термины.

## Дизайн-система

- Токены — `src/assets/styles/tokens.css` (`@theme`): `bg-bg`, `text-text`,
  `text-muted`, `bg-accent`… по `BR-constraint.ui-visual-standards`
  (акцент зелёный, контраст WCAG 2.1 AA, паритет тем, без курсива).
- Тема переключается `data-theme` на `<html>` (`adapters/theme.ts`).
- Иконки — `ui/icons/registry.ts` (currentColor; канонические SVG — `assets/icons/`).

## Связанные артефакты

- Контракт: `specs/contracts/openapi.yaml`, `specs/contracts/README.md`
- Домен: `specs/domain/aggregates.md`, `specs/domain/context-map.md`, `specs/domain/domain-events.md`
- BR: `BR-constraint.ui-header`, `ui-footer`, `ui-session-history`, `ui-visual-standards`,
  `web-app-browser-chat`, `sso-readonly-access`, `pnpm-package-manager`,
  `traceability-comments`
- ADR: `ADR-DES.UI.spa-typescript-frontend`, `ADR-DES.UI.tailwind-css-adoption`,
  `ADR-DES.UI.chat-only-interface`
- План: `.ai-factory/plans/feature-frontend-rewrite.md`
