# План реализации: генерация UC первой волны

Branch: main
Created: 2026-08-29

## Settings
- Testing: no
- Logging: minimal
- Docs: yes

## Research Context
Source: `.ai-factory/RESEARCH.md` (Active Summary)

Goal:
Зафиксировать исследовательский контекст; следующим шагом — каталог прецедентов использования (UC) первой волны как основа для US, FR и E2E-тестов (цепочка `Vision → UC → FR → ADR → COMP → TEST`).

Constraints:
- Источники: GitLab markdown-спеки как authoritative source, PDF — только как legacy/книги; Confluence исключён.
- Локальные GPU и open-weight модели, ограниченный контекст, минимизация токенов и LLM-вызовов.
- MCP-режим: отдавать агентам точный набор артефактов, а не сырой текст.
- Принцип «агент готовит — человек подтверждает и отвечает».
- Соответствие инициативам I4 (знания), I6 (трассируемость), I9 (петля обучения).

Decisions:
- Канон функций: F1–F4 из `specs/vision.md` §2.2 (Q1.1; механизмы и NFR F-кодов не получают).
- Тип GraphRAG: hybrid ontology-grounded (LightRAG + KAG-принципы + PathRAG; RAPTOR/StructRAG для PDF; PPR) — ADR-DES.API.hybrid-graphrag-composition.
- Единый язык реализации — Go — ADR-IMPL.STACK.go-single-language-adoption.
- Эталонные кейсы K1, K4, K5, K17 фиксируются контрактными тестами до реализации метода (RULES.md).

Open questions:
- Масштаб корпуса (1k vs 100k документов) и целевая GPU/модель — не блокируют генерацию UC (все UC — `to be`).

## Контекст: каталог UC

- `specs/use-cases/README.md` существует (коммит `eda326a`): формат ID `UC-<L1>.<L2>.<L3>`, формат описания (секции и обязательность), правила Mermaid `sequenceDiagram`, домены/поддомены, маппинг отменённой схемы F1–F7 → канон F1–F4, классификация `as is`/`to be`.
- Файлы UC отсутствуют — план генерирует 5 UC первой волны строго по README.
- Все UC — `to be` (проект на этапе видения, Фаза 0; `src/` без реализации), фаза из `vision.md` §2.6: **Фаза 1 (MVP)**.
- Требование пользователя: **Mermaid-диаграмма последовательности обязательна в каждом артефакте UC** (секция «Диаграмма последовательности»; правила — `specs/use-cases/README.md`, референс — `.ai-factory/references/mermaid-sequence-diagrams.md`).
- Гейт `G1-C4` (`specs/qa/gates.md`): для `use-cases/` обязательны mermaid-диаграммы.
- Связь US↔UC: каждая US первой волны ссылается на свой UC (`@UC-*`, матрица `specs/user-stories/README.md`); UC файлы UC-файлов ссылаются на US в «Источник требований» по мере появления US-файлов.

## Commit Plan

- **Commit 1** (after tasks 1-2): `docs(specs): add UC for GitLab sync and cited answers`
- **Commit 2** (after tasks 3-5): `docs(specs): add trace and MCP use cases with sequence diagrams`
- **Commit 3** (after task 6): `docs(specs): align UC catalog with vision, glossary and US`

## Tasks

### Phase 1: Пилотный UC (валидация шаблона)

- [x] Task 1: Создать `specs/use-cases/UC-knowledge.sync.gitlab-index.md` — пилотный UC автоиндексации изменений GitLab (F2.1, P0), строго по формату `specs/use-cases/README.md`:
  - Заголовок `### UC-knowledge.sync.gitlab-index: Автоиндексация изменений GitLab`; метаданные: `Актор` (GitLab как внешний триггер; бенефициар — Разработчик/Аналитик), `Приоритет: P0`, `Ключевая функция: F2.1 (vision §2.2)`, `Канал: Webhook/Schedule`, `Описание`.
  - `Основной поток` (нумерованный): событие GitLab (MR merged / push) или периодическая сверка → определение diff изменённых/удалённых документов → `DocumentIngested` (загрузка, чанкинг, эмбеддинги) → `EntityExtracted` → инкрементальное `GraphUpdated` (только затронутые части) → при необходимости `CommunityRecomputed` → деиндексация удалённых документов.
  - `Альтернативные потоки`: A1 потерянный webhook → периодическая diff-сверка (идемпотентность); A2 сбой LLM-извлечения → retry с backoff, изоляция частичного успеха; A3 непарсящийся документ → пропуск с WARN.
  - `Постусловия`: граф и векторный индекс актуальны; новые ответы опираются на актуальную версию источника.
  - `Источник требований`: vision §2.2 (F2.1), §2.5 (MVP), §2.6 (Фаза 1); ADR-DES.API.hybrid-graphrag-composition (инкрементальность); glossary («Документ», «Чанк», «Взаимная индексация»).
  - **Обязательная Mermaid `sequenceDiagram`** после `Описание`: участники с русскими названиями (GitLab, Индексация, Граф знаний, Контур LLM); сообщения `->>`/`-->>` 1:1 с шагами основного потока; `alt` для A1/A2 (вложенность ≤ 2); разделители `%% --- N. Заголовок ---`; пометка `to be` — Фаза 1 (MVP).
  - Стиль пилотного UC — эталон для задач 2–5.
  Files: `specs/use-cases/UC-knowledge.sync.gitlab-index.md`
  Logging requirements: фиксировать выбранные источники (vision/ADR/glossary) и использованные термины; при автоматизированной генерации логировать начало/завершение секций на уровне `INFO`, найденные лакуны (термин без определения в glossary, событие вне vision §2.4) — на уровне `WARN`.
  Dependencies: —

### Phase 2: Остальные UC волны 1

- [x] Task 2: Создать `specs/use-cases/UC-answers.grounding.cited-answer.md` — ответ на конкретный вопрос с grounding (F1.1, P0, Канал: GUI/API, Актор: Разработчик/Аналитик). Основной поток: `QueryReceived` → нормализация и классификация запроса (граница F1.1/F1.2) → retrieval (PPR/PathRAG, без LLM на извлечении) → фильтрация кандидатов через онтологический слой и mutual indexing (KG↔chunks) → генерация ответа LLM с атрибуцией фактов на чанки/артефакты → валидация ссылок → `QueryAnswered` с provenance. Альтернативы: A1 нет релевантных источников → честный отказ; A2 противоречивые источники → оба варианта с provenance; A3 двусмысленный запрос → уточняющий вопрос. **Mermaid `sequenceDiagram`**: Пользователь, Query Engine, Граф знаний, Контур LLM; `alt` A1/A2; пометка `to be` — Фаза 1. NFR-ACC-1 (порог точности ≥ 70%) — целевое примечание, не основной поток (все UC — `to be`). Источник требований: vision §2.2 (F1.1), §2.5, §2.6; эталонный кейс K1 (RESEARCH.md, RULES.md); glossary («Привязка к источнику», «Происхождение», «Двухуровневое извлечение»).
  Files: `specs/use-cases/UC-answers.grounding.cited-answer.md`
  Logging requirements: фиксировать grounding-термины и источники; при автоматизированной генерации логировать секции на `INFO`, спорные формулировки (гарантии без источника) — на `WARN`.
  Dependencies: зависит от Task 1 (стиль/шаблон).

- [x] Task 3: Создать `specs/use-cases/UC-trace.impact.analyze.md` — анализ влияния изменения артефакта (F3.1, P0, Канал: GUI/API, Актор: Разработчик/Архитектор). Основной поток: указание изменяемого артефакта (или MR diff) → локализация в `ArtifactGraph` → вычисление прямых и транзитивных связей (с ограничением глубины) → классификация влияния по типу и направлению связи → фильтрация и приоритизация → детерминированный список связанных артефактов → `InfluenceComputed`. UC детерминированный, без LLM. Альтернативы: A1 артефакт не найден в графе → сообщение + предложение индексации; A2 циклы зависимостей → детекция и дедупликация; A3 неполный граф → пометка «связи неполны». **Mermaid `sequenceDiagram`**: Пользователь, Ядро (ArtifactGraph); `opt` A1/A2; пометка `to be` — Фаза 1. Источник требований: vision §2.2 (F3.1), §2.5; эталонный кейс K4; glossary («Артефактный граф», «Анализ влияния» — сверить фактические статьи glossary).
  Files: `specs/use-cases/UC-trace.impact.analyze.md`
  Logging requirements: фиксировать детерминированный характер (без LLM) и правила графа; при автоматизированной генерации — секции на `INFO`, неоднозначности правил влияния — на `WARN`.
  Dependencies: зависит от Task 1.

- [x] Task 4: Создать `specs/use-cases/UC-trace.context.generate.md` — компиляция контекста для генерации артефакта (F3.2, P1, Канал: GUI/MCP, Актор: Разработчик/ИИ-агент автоматизации разработки). Основной поток: запрос на компиляцию контекста для задачи → определение границ задачи (тип артефакта, связанные артефакты по `ArtifactGraph`) → сбор набора (спеки, код, ADR, факты с grounding) → оптимизация до минимума токенов при требуемой полноте (PathRAG-принципы, NFR-PERF-1) → формирование JSON-объекта (артефакты + направления связей + факты) → `ContextCompiled`. Альтернативы: A1 недостаточно данных в графе → «контекст неполон» + список пробелов; A2 превышение окна модели → сокращение с указанием опущенного; A3 задача вне корпуса → отказ. **Mermaid `sequenceDiagram`**: Пользователь/ИИ-агент, Context Compiler, Граф знаний, Контур LLM; `opt` A1/A2; пометка `to be` — Фаза 1. Источник требований: vision §2.2 (F3.2), §2.5 (критерий «полнота при минимуме токенов»); glossary («Компилятор контекста», «PathRAG»).
  Files: `specs/use-cases/UC-trace.context.generate.md`
  Logging requirements: фиксировать критерий полноты/токенов; при автоматизированной генерации — `INFO` по секциям, `WARN` на неоднозначности границ контекста.
  Dependencies: зависит от Task 1; концептуально от Task 3 (предусловие — `ArtifactGraph`).

- [x] Task 5: Создать `specs/use-cases/UC-mcp.compile.context.md` — доставка контекста агенту через MCP (F4, P0, Канал: MCP, Актор: ИИ-агент автоматизации разработки). UC-канал (граница F4, vision §2.2): ядро — включённые UC `UC-trace.context.generate` и `UC-answers.grounding.cited-answer`. Основной поток: подключение к MCP-серверу (handshake, аутентификация) → вызов инструмента (`compile_context` / `answer`) → исполнение включённого UC → сериализация результата в структурированный ответ (точный набор артефактов, направления связей, факты с grounding) → фильтрация утечек и аудит обращения → возврат агенту (`ContextCompiled` / `QueryAnswered`, аудит — `SecurityEventEmitted`). Альтернативы: A1 нет прав / истёк токен → отказ с кодом ошибки; A2 rate limit (Q1.4 — placeholder-лимиты) → 429/backoff; A3 промпт-инъекция через содержимое корпуса → детекция, блокировка, `SecurityEventEmitted`; A4 таймаут LLM → частичный результат с пометкой. **Mermaid `sequenceDiagram`**: ИИ-агент, MCP-сервер, Context Compiler, Контур LLM, Аудит; `alt` A1–A4; пометка `to be` — Фаза 1. NFR-SEC-1 (фильтрация утечек, аудит) и NFR-PROC-1 — целевые примечания. Источник требований: vision §2.2 (F4), §2.5; эталонный кейс K17; glossary («MCP», «Компилятор контекста», «Безопасный контур LLM»).
  Files: `specs/use-cases/UC-mcp.compile.context.md`
  Logging requirements: фиксировать границу F4 (канал, не механизм) и включённые UC; при автоматизированной генерации — `INFO` по секциям, `WARN` на неоднозначности лимитов (Q1.4 — placeholder).
  Dependencies: зависит от Task 1 и Task 4 (включённый UC); концептуально от Task 2.

### Phase 3: Согласование каталога

- [x] Task 6: Выполнить сверку каталога `specs/use-cases/` (README + 5 UC): термины — из `specs/glossary.md` (гейт G1-GLOSS); ссылки «Ключевая функция» — канон F1–F4 (маппинг Q1.1, гейт G1-TRACE); доменные события — из vision §2.4; связи US↔UC — матрица `specs/user-stories/README.md` (каждая US первой волны ссылается на свой UC); пометки `as is`/`to be` с фазами из vision §2.6 (все UC — `to be`, Фаза 1); mermaid-диаграммы — синтаксис `sequenceDiagram` по референсу `.ai-factory/references/mermaid-sequence-diagrams.md` и правилам README (сообщения 1:1 с основным потоком, вложенность `alt` ≤ 2, пометка `to be`) — гейт G1-C4; согласованность с `specs/qa/test-plan.md` §7 (планы по F1–F4). Исправить найденные расхождения в файлах UC и README.
  Files: `specs/use-cases/`, `specs/user-stories/README.md` (только при расхождениях), `specs/qa/test-plan.md` (только при расхождениях)
  Logging requirements: фиксировать все исправления и оставшиеся риски; при автоматизированной проверке логировать результаты проверок (структура, ссылки, терминология, mermaid) на `INFO`, остаточные расхождения — на `WARN`.
  Dependencies: зависит от задач 1–5.
