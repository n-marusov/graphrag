# Implementation Plan: Переписывание веб-интерфейса (Clean Architecture + домен)

Branch: `feature/frontend-rewrite`
Created: 2026-08-30

## Settings
- Testing: yes
- Logging: standard
- Docs: yes

## Research Context

Source: `.ai-factory/RESEARCH.md` (Active Summary, релевантные решения), `specs/domain/`, `specs/contracts/openapi.yaml`, `specs/business-rules/` (BR UI), `specs/adr/` (ADR-DES.UI.*)

Goal: Переписать `src/frontend/` — текущий код является генерацией из Pixso-макета (7 экранов-фреймов, ~12 300 строк, дублирование layout и SVG-ассетов, захардкоженный контент, без API/i18n/Tailwind) — в тонкий SPA по Clean Architecture, согласованный с доменной моделью и контрактом API.

Constraints:
- Фронтенд — тонкий SPA на TypeScript (Vue 3 + Vite), вне серверной Go-кодовой базы (`ADR-DES.UI.spa-typescript-frontend`); клиент генерируется из OpenAPI 3.1 (`specs/contracts/openapi.yaml`).
- UI — только чат (F1): история сессий слева, чат по центру, панель происхождения справа, шапка, футер (`ADR-DES.UI.chat-only-interface`).
- Стилизация — Tailwind CSS v4 (`@tailwindcss/vite`, токены `@theme`), тёмная тема по умолчанию, без UI-китов (`ADR-DES.UI.tailwind-css-adoption`).
- Визуальные стандарты — `BR-constraint.ui-visual-standards`: акцент зелёный `#22C55E` (тёмная) / `#15803D` (светлая), контраст WCAG 2.1 AA ≥ 4.5:1, без курсива, паритет тем.
- Шапка — `BR-constraint.ui-header`: название продукта; версия индекса, переключатель темы, выбор языка (ru/en).
- Сессии — `BR-constraint.ui-session-history`: история на сервере (не localStorage), создание/переименование/удаление/поиск, активная подсвечена.
- Футер — `BR-constraint.ui-footer`: версия продукта + SHA (моноширинно), ссылка «Мониторинг».
- Доступ — знания read-only; данные приложения (сессии) записываемые (`BR-constraint.sso-readonly-access`, решение владельца 2026-08-30).
- Домен — агрегаты `Answer` и `Session` в контексте `query-answering` (`specs/domain/aggregates.md`); состояния ответа по `UC-answers.grounding.cited-answer` (A1–A3).
- i18n: ru/en без жёстко зашитых строк; WCAG 2.1 AA (`BR-constraint.web-app-browser-chat`).
- TDD: тесты пишутся до реализации (`RULES.md`); комментарии — человеко-читаемые (бизнес-логика — русский, идентификаторы — английский).

Decisions:
- Слои: `domain/` (plain TS, без Vue) → `application/` (use cases, порты) → `adapters/` (API-клиент, мапперы, состояние, i18n) → `ui/` (Vue-компоненты) → `app/` (composition root). Зависимости — только внутрь (Dependency Rule).
- Один маршрут (чат) + машина состояний: `empty → loading(retrieval/generation) → answered | no_sources | ambiguous | failed`.
- SVG-ассеты дедуплицируются до ~12 канонических файлов + компонент `Icon` (переиспользование).
- Заглушки контента макета (qdrant, OpenAI, ADR-0017) в код не переносятся — контент приходит из API.

Open questions:
- Генерация типов клиента из OpenAPI (кодогенерация в CI) — отложено; первый шаг — типизированный fetch-клиент, повторяющий контракт.
- Пагинация/лимиты сессий — открытый вопрос Q4.1 (`specs/open-questions.md`), в контракте параметр `limit`.

## Commit Plan

- **Commit 1** (после задач 1–2): `chore(frontend): scaffold build, tokens, dedupe svg assets`
- **Commit 2** (после задач 3–5): `feat(frontend): add domain and application layers`
- **Commit 3** (после задач 6–8): `feat(frontend): add api adapters, state, i18n`
- **Commit 4** (после задач 9–11): `feat(frontend): add chat ui components`
- **Commit 5** (после задач 12–14): `feat(frontend): wire chat flow, a11y, cleanup`

## Tasks

### Phase 0: Фундамент и ассеты

- [x] **Task 1: Каркас сборки и дизайн-токены** (TDD: конфиг-тест сборки)
  Заменить Pixso-каркас на чистый Vite + Tailwind v4: подключить `@tailwindcss/vite`, объявить токены в `@theme` по `BR-constraint.ui-visual-standards` (зелёный акцент, тёмная/светлая темы), подключить шрифты (Inter, JetBrains Mono). Добавить vitest + @vue/test-utils. Удалить дубли стилей (`style.css`/`styles.css`, `pixso-*` из `global.css`), debug-хак `window.app` в `App.vue`, лишние импорты в `main.ts`.
  Файлы: `src/frontend/package.json`, `vite.config.ts`, `src/main.ts`, `src/App.vue`, `src/style.css`, `src/styles.css`, `src/assets/styles/*`, `vitest.config.ts`, `src/test/`
  Логирование: настроить логгер (обёртка `console`, уровень через `import.meta.env.VITE_LOG_LEVEL`); залогировать успешный старт сборки.

- [x] **Task 2: Дедупликация SVG-ассетов и компонент Icon** (TDD: тест реестра иконок)
  Канонизировать ~12 уникальных SVG (сверить содержимое, удалить числовые суффиксы-дубли: `chevrondown0–5`, `moon0–5`, `externallink0–8`, `pencil0–2`, `trash20–22`, `search0–5`/`searchx`, `filetext0`, `Group_2_*`). Создать компонент `ui/icons/Icon.vue` (или SVG-спрайт) с реестром `{ name → path }`, переиспользовать в шаблонах; единая раскраска через `currentColor`. Удалить дубликаты файлов.
  Файлы: `src/frontend/src/assets/icons/*.svg` (канонические), `src/frontend/src/ui/icons/Icon.vue`, `src/frontend/src/ui/icons/registry.ts`
  Логирование: логгер фиксирует число удалённых/канонизированных файлов; падение на обращение к несуществующей иконке — ERROR.

### Phase 1: Домен (внутренний слой, plain TS, без Vue)

- [x] **Task 3: Доменные модели и объекты-значения** (TDD: юнит-тесты инвариантов) (depends on 1)
  Типы/классы без зависимостей от Vue: `Session`, `SessionTurn`, `Question`, `Answer`, `AnswerSection`, `Citation`, `Contradiction`, `ContradictionVariant`, `AnswerStatus` (`processing|answered|no_sources|ambiguous|failed`), `AnswerPhase` (`retrieval|generation`), `TraceRef`, `Confidence` — зеркало `specs/domain/aggregates.md` (агрегаты `Answer`, `Session`) и схем `specs/contracts/openapi.yaml`. Инварианты: ответ публикуется только с атрибуцией; обращения сессии упорядочены.
  Файлы: `src/frontend/src/domain/answer.ts`, `session.ts`, `citations.ts`, `value-objects.ts`
  Логирование: DEBUG при создании агрегатов; ERROR при нарушении инварианта.

- [x] **Task 4: Порты** (TDD: контрактные тесты интерфейсов) (depends on 3)
  Интерфейсы `AnswerGateway` (askQuestion, getAnswer) и `SessionGateway` (list, create, get, rename, delete) — методы соответствуют эндпоинтам контракта; типы DTO — по `openapi.yaml`. Порты не знают о fetch/Vue.
  Файлы: `src/frontend/src/domain/ports.ts`
  Логирование: — (интерфейсы, логирование в реализациях, Task 6).

### Phase 2: Приложение (use cases)

- [x] **Task 5: Use cases и машина состояний** (TDD: юнит-тесты на fake-портах) (depends on 3, 4)
  `AskQuestion` (создание обращения + опрос статуса, маппинг `processing → answered | no_sources | ambiguous | failed` с `phase`), `LoadSessions`, `SearchSessions`, `CreateSession`, `RenameSession`, `DeleteSession`. Состояние чата как конечный автомат (idle → loading → результат/ошибка, retry).
  Файлы: `src/frontend/src/application/ask-question.ts`, `sessions.ts`, `chat-state-machine.ts`
  Логирование: INFO на смену состояния (с `sessionId`/`answerId`), ERROR на провал use case, DEBUG на опрос статуса.

### Phase 3: Адаптеры

- [x] **Task 6: API-клиент по контракту** (TDD: тесты fetch через mock) (depends on 4)
  Типизированный fetch-клиент (`/api/v1`), реализующий порты; заголовок авторизации (bearer OIDC-токен); обработка ошибок по `error_code` (401/404/422/429/504, `GRAPH_TIMEOUT`); опрос `GET /answers/{id}` с `phase`.
  Файлы: `src/frontend/src/adapters/api/client.ts`, `http.ts`, `auth.ts`, `errors.ts`
  Логирование: INFO на запрос/ответ (method, path, status), WARN на retry/опрос, ERROR на транспортную ошибку.

- [x] **Task 7: Мапперы DTO ↔ домен и presenter/view models** (TDD) (depends on 3, 6)
  Маппинг ответов API в доменные объекты и обратно (запросы); view model для UI-состояний (заголовок, фаза, цитаты, ошибки — локализованные ключи).
  Файлы: `src/frontend/src/adapters/mappers/dto-to-domain.ts`, `domain-to-dto.ts`, `presenter.ts`
  Логирование: WARN при несоответствии контракту (неизвестный статус, пустые обязательные поля), ERROR при невозможности маппинга.

- [x] **Task 8: Состояние приложения и i18n** (TDD) (depends on 6)
  Store (Pinia или composable): сессии, активная сессия, чат-состояние; i18n ru/en (словарь ключей, переключатель языка), без хардкода строк; переключение темы (тёмная по умолчанию), выбор сохраняется на время сессии (BR-constraint.ui-header).
  Файлы: `src/frontend/src/adapters/state/*`, `src/frontend/src/adapters/i18n/*`, `src/frontend/src/adapters/theme.ts`
  Логирование: DEBUG при смене локали/темы, ERROR на сбой инициализации хранилища.

### Phase 4: UI-компоненты (Vue)

- [x] **Task 9: Layout-компоненты** (TDD: @vue/test-utils) (depends on 2, 8)
  `AppLayout` (сетка: шапка / сайдбар / чат / происхождение / футер); `AppHeader` (название продукта; версия индекса, переключатель темы, выбор языка — `BR-constraint.ui-header`); `SessionSidebar` (список сессий, поиск, «+ Новая сессия», переименование/удаление, активная подсвечена — `BR-constraint.ui-session-history`); `AppFooter` (версия + SHA моноширинно, ссылка «Мониторинг» — `BR-constraint.ui-footer`).
  Файлы: `src/frontend/src/ui/layout/*.vue`
  Логирование: DEBUG на действия сессий (создание/удаление/переименование), ERROR на сбой операций.

- [x] **Task 10: Компоненты чата** (TDD) (depends on 5, 8)
  `QuestionInput` (ввод, отправка, disabled при загрузке); `AnswerView` (разделы с пораздельной атрибуцией); `LoadingSteps` (фазы «Поиск источников…» / «Генерация ответа…» по `phase`); `NoSourcesState` (A1: объяснение + советы); `ContradictionView` (A2: варианты с источниками, read-only); `ErrorState` (ошибка + «Повторить»).
  Файлы: `src/frontend/src/ui/chat/*.vue`
  Логирование: INFO на отправку вопроса, DEBUG на рендер состояния, ERROR на ошибку ответа.

- [x] **Task 11: Панель «Происхождение»** (TDD) (depends on 5, 8)
  `ProvenancePanel` (сводные источники, версия индекса), `CitationCard` (источник, чанк, цитата) — отображение `citations` и `indexVersion` ответа.
  Файлы: `src/frontend/src/ui/provenance/*.vue`
  Логирование: DEBUG при отображении пустой панели (пустые состояния), ERROR при повреждённых данных цитат.

### Phase 5: Интеграция и качество

- [x] **Task 12: Маршрутизация и связка машины состояний** (TDD: компонентные тесты ChatView) (depends on 9, 10, 11)
  Один маршрут (chat): `app/router` → `ChatView`, который связывает use cases, store и компоненты; замена всех `Frame*.vue`; удаление мок-контента (qdrant/OpenAI/ADR-0017); контент — из API/заглушек на время отсутствия бэкенда.
  Файлы: `src/frontend/src/app/router/index.ts`, `src/frontend/src/ui/chat/ChatView.vue`, удаление `src/views/Frame*.vue`
  Логирование: INFO на навигацию, ERROR на фатальную ошибку загрузки сессии.

- [x] **Task 13: Доступность и паритет тем** (проверка axe-core) (depends on 12)
  WCAG 2.1 AA: keyboard-навигация, порядок фокуса, контраст ≥ 4.5:1, aria-атрибуты, focus-visible; активное состояние не только цветом (WCAG 1.4.1); без курсивных начертаний; светлая тема — та же компоновка, что тёмная. Прогон axe-core (`wcag2a/wcag2aa/wcag21a/wcag21aa`).
  Файлы: `src/frontend/src/ui/**/*.vue`, `src/frontend/src/assets/styles/*` (токены), `src/frontend/src/app/`
  Логирование: ERROR при нарушении контраста/фокуса в dev-проверке, WARN на оставшиеся a11y-предупреждения.

- [x] **Task 14: Чистка и финальная верификация** (depends on 13)
  Удалить остатки Pixso: `src/views/Frame*.vue`, `src/utils/variables.js`, `pixso-*` классы, неиспользуемые стили; финальная сборка `vite build` + полный прогон тестов; обновить `src/frontend/README.md` (русский): структура слоёв, команды, связь с контрактом.
  Файлы: `src/frontend/**`, `src/frontend/README.md`
  Логирование: ERROR на сбой сборки/тестов, INFO на итоговый отчёт (сборка, тесты, число файлов до/после).

## Связанные артефакты

- Контракт: `specs/contracts/openapi.yaml` (источник типов/эндпоинтов)
- Домен: `specs/domain/aggregates.md` (агрегаты `Answer`, `Session`), `specs/domain/context-map.md`, `specs/domain/domain-events.md`
- BR: `BR-constraint.ui-header`, `BR-constraint.ui-footer`, `BR-constraint.ui-session-history`, `BR-constraint.ui-visual-standards`, `BR-constraint.web-app-browser-chat`, `BR-constraint.sso-readonly-access`
- ADR: `ADR-DES.UI.spa-typescript-frontend`, `ADR-DES.UI.tailwind-css-adoption`, `ADR-DES.UI.chat-only-interface`
- Use case: `specs/use-cases/UC-answers.grounding.cited-answer.md` (F1.1, A1–A3)
