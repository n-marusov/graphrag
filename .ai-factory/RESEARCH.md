# Research

Updated: 2026-08-30 16:01
Status: active

## Active Summary (input for /aif-plan)
<!-- aif:active-summary:start -->
Topic: Корпоративная система знаний на базе GraphRAG (ontology-grounded) для автоматизации разработки — верификация требований завершена; фиксация ответов Q4.x и подготовка пакета правок.

Goal: Зафиксировать ответы стейкхолдера на 11 открытых вопросов верификации (Q4.1–Q4.8, Q4.10–Q4.12, 2026-08-30) и применить пакет правок к артефактам через /aif-fix: целевые значения NFR, статусы BR/NFR, синхронизация PLAN.md/ADR/RESEARCH, аудит-след, пилот index-freshness, SSO-раздел, ARCHITECTURE.md, a11y-покрытие.

Product (суть): Evidence-based context layer / context compiler для AI Factory и Hand-off — корпоративная память с provenance, а не поиск по документам. Онтологический слой — машинно-читаемая модель предметной области (онтология). Инструмент — субстрат инициатив I4 (знания), I6 (трассируемость), I9 (петля обучения).

Constraints:
- Источники: GitLab markdown-спеки (authoritative) + иногда PDF (книги/legacy). Confluence исключён (кладбище устаревших страниц).
- Целевое железо (2026-08-30): NVIDIA H200, 141 ГБ; модели — 70B open-weight (Q4/FP8).
- Масштаб корпуса (2026-08-30): тысячи артефактов, целевой максимум ~10k; 100k не планируется («больше вряд ли будет»).
- Локальные GPU, open-weight модели, ограниченный контекст → минимизация токенов и числа LLM-вызовов.
- MCP-режим для ИИ-агентов: отдавать точный набор артефактов, а не сырой текст.
- Принцип «агент готовит — человек подтверждает и отвечает».
- Соответствие инициативам I4 (знания), I6 (трассируемость), I9 (петля обучения).

Decisions (язык/стек, подтверждено 2026-08-30):
- Go — единый язык серверной кодовой базы (канон `ADR-IMPL.STACK.go-single-language-adoption`): система I/O-bound (оркестрация LLM/DB-вызовов), быстрая итерация промптов, goroutines для fan-out; CPU-компоненты (Leiden/HNSW/токенизатор) — на Go, при необходимости через CGo к зрелым C-библиотекам.
- Rust и Python исключены из кодовой базы, включая прототип (решение владельца 2026-08-30; отменяет прежние допущения: «Rust при необходимости» в PLAN.md, «прототип — Python» в RESEARCH.md).
- Фронтенд — TypeScript (тонкий SPA, вне серверной кодовой базы; `ADR-DES.UI.spa-typescript-frontend`).

Decisions (тип GraphRAG и архитектура):
- НЕ чистый Microsoft GraphRAG (map-reduce на каждый запрос + полная перестройка индекса противоречат инкрементальности и локальным GPU).
- Ядро: LightRAG (dual-level retrieval, incremental update). Точность/непротиворечивость: KAG-принципы (mutual indexing KG↔chunks, grounding, атрибуция источников).
- Компактный контекст для MCP/локальных GPU: PathRAG (pruned paths, once retrieval без map-reduce). PDF: RAPTOR (книги/narrative) + StructRAG (таблицы/формы/отчёты).
- Смежные темы: PPR (HippoRAG-style, без LLM на retrieval). Онбординг/обзоры: community summaries (уровни C0–C1).
- Обновление: incremental + периодическая перестройка; для real-time — Graphiti (битемпоральный, готовый MCP). Онтологический слой: машинно-читаемая модель предметной области (онтология) (инициативы I4/I6).
- Доступ: люди — корпоративный SSO Keycloak (`BR-constraint.sso-readonly-access`, `ADR-DES.SECURITY.sso-keycloak`); агенты — токен; read-only; один пользователь по умолчанию; ролей нет.
- Контейнеры: `ADR-DES.INFRA.container-composition` ПРИНЯТО; форма развёртывания — Docker Compose (однохостовой контур).

Decisions (верификация Q4.x, 2026-08-30 — ответы стейкхолдера):
- NFR-цели (стартовые, уточняются замером Фаза 1.5):
  - `query-responsiveness` (P0): p50 ≤ 5 с, p90 ≤ 10 с; деградация при фоновой переиндексации p50 ≤ ×1.5 от простоя (потолок p90 ≤ 10 с).
  - `token-minimization` (P1): контекст — медиана ≤ 4 000 токенов, p90 ≤ 8 000; полнота ≥ 90%; LLM-вызовов ≤ 2 на запрос (лимит 3).
  - `ontology-model` (P1): 100% терминов ответов соответствуют глоссарию/онтологии; снижение терминологических противоречий в графе ≥ 50% от исходного замера к концу Фазы 2.
  - `adoption-principles` (P2): 100% метрик успеха G1–G7 имеют утверждённые целевые значения к гейту «вывод в эксплуатацию»; гейты фаз проходятся по измеренным значениям; замер ежеквартально.
  - `agent-traffic-isolation` (P1): порог деградации при агентской нагрузке — p50 ≤ ×1.5 от простоя, потолок p90 ≤ 10 с (закрыт 2026-08-30; калибровка по телеметрии Фаза 1.5).
- Статусы (правило «метрология определена → approved»): 6 действующих BR → `approved` (2026-08-30); `no-user-auth-in-mvp` → `deleted` (файл исторический); 13 NFR → `approved` (все с числами; `index-freshness` — дополнительно с пометкой «цели подтверждаются пилотом Фаза 1.5»).
- Аудит-след (`agent-audit`): 10 обязательных полей (timestamp, agent/token id, session/task id, step_type, input/output artifact refs, llm_call с hash, result_status, human_approver, immutability); хранение — 1 неделя (риск-флаг: короче типичного окна обнаружения инцидентов).
- `index-freshness` (P0): медиана ≤ 5 мин, p90 ≤ 15 мин — достижимо при инкрементальном обновлении на H200; подтверждение — пилот Фаза 1.5 (корпус ~1k артефактов, 10–20 событий, 1–50 изменённых документов).
- Масштаб в ADR: «открытый вопрос 1k vs 100k» заменён на «тысячи, до ~10k» (5 ADR + test-plan, применено 2026-08-30); упоминания 100k удалены.
- e2e-gui-testing: SSO — отдельный раздел «Авторизация (SSO)» (§11.3); «Аудит контура LLM» — §11.4, a11y — §11.5 (применено 2026-08-30).
- ARCHITECTURE.md — включить в перечень артефактов анализа как производный обзор (не источник истины).
- a11y: расширить `@accessibility` + минимум 1 a11y-сценарий на P0-US (knowledge.sync, context.impact, mcp.compile).

Кейсы (топ для MVP): K1 (ответ с grounding), K4 (анализ влияния), K5 (сверка результат↔источник), K17 (context compiler для aif-plan/handoff). Полный список 24 кейсов (K1–K24) — в Session.

Open questions:
- MVP-волны и порядок фаз внедрения (PLAN.md:35; не блокирует верификацию).
- Замер исходного уровня (Фаза 1.5): уточнение всех целевых значений NFR; пилот index-freshness.
- Применение пакета правок Q4.x к артефактам (/aif-fix).

Риски (лицензии/экспорт; решение владельца 2026-08-30: «Opensource. Добавь риски сам»):
- Экспортные ограничения (EAR/экспортный контроль США) на open-weight модели — проверка юрисдикции/лицензии модели перед выбором (LLaMA/Qwen/Mistral); применимость — юридическая проверка при внедрении.
- GPL-копилефт: Neo4j CE (GPLv3) — отдельный self-hosted компонент, не входит в кодовую базу продукта (Go, Apache-2.0-совместимый драйвер) — граница зафиксирована в ADR-IMPL.DATA.graph-storage.
- Лицензии open-weight моделей с ограничениями (коммерческое использование, распространение, fine-tuning) — SCA-гейт/политика лицензий (BR-constraint.opensource-only).
- Цепочка поставки: подпись артефактов (SM-B-07), SBOM (SM-B-08), отсутствие секретов/запрещённых зависимостей (SM-B-09); реакция на утечку секретов: детекция (G2-SEC, SM-B-09) → отозвать → перевыпустить → скан истории репозитория → ротация зависимых (процедура команды, без жёсткого SLA — «не критично»).
- ПДн-позиция: система — не оператор ПДн (vision §2.7 п.12, подтверждено владельцем 2026-08-30); при обработке идентификационных данных SSO (логин) рекомендуется юридическое подтверждение позиции при внедрении (регуляторный риск).

Success signals: время выхода изменения, время ожидания ответа по продукту, точность ответов RAG, доля поставок не соответствующих требованиям, время сигнал→фикс, число противоречий, доля артефактов со связями в графе.

Next step: /aif-fix — применить ответы Q4.1–Q4.8, Q4.10–Q4.12 к артефактам (4 NFR, статусы 13 NFR + 6 BR, PLAN.md, RESEARCH.md, 5 ADR, 2 битые ссылки ADR, e2e-gui-testing, 3 US, ARCHITECTURE.md, open-questions.md).
<!-- aif:active-summary:end -->

## Sessions
<!-- aif:sessions:start -->
### 2026-08-29 12:48 — Выбор языка, метода GraphRAG и кейсов
What changed:
- Проведён анализ выбора языка (Rust vs Go) и оптимального типа GraphRAG для корпоративной разработки.
- Изучены референс-документы GraphRAG и модель автоматизации разработки.
- Сформирован список из 24 кейсов применения (K1–K24) с привязкой к симптомам/причинам и ценностями.

Key notes:
- Язык: Go по умолчанию (I/O-bound, оркестрация), Rust для CPU-heavy in-process или FFI.
- Тип: ontology-grounded hybrid GraphRAG (LightRAG + KAG-principles + PathRAG + RAPTOR/StructRAG для PDF + PPR).
- Роль инструмента: субстрат для I4 (знания), I6 (трассируемость), I9 (петля обучения).
- Инструмент = context compiler для AI Factory + Hand-off, а не чат-бот.
- Источники: GitLab markdown (authoritative) + PDF (legacy); Confluence исключён.

Список кейсов (24):
- Контур знаний (I4): K1 ответ с grounding; K2 единый язык/глоссарий; K3 онбординг-тур.
- Трассируемость (I6): K4 анализ влияния; K5 сверка результат↔источник; K6 Definition of Ready; K7 конфликт-детекция.
- Петля обучения (I8/I9): K8 сигнал→требование/тест; K9 разбор инцидента; K10 тест-дизайн.
- Проактивные/кросс-проектные: K11 риск изменения; K12 скоринг свежести; K13 coverage-анализ; K14 федерация знаний; K15 археология решений; K16 код-поиск↔требования.
- AI Factory + Hand-off: K17 context compiler; K18 review against specs; K19 pre-completion gate; K20 QA-контекст.
- Комплаенс/безопасность: K21 комплаенс-карта; K22 контролируемый LLM-контур.
- Продуктовые: K23 статистика решения проблем; K24 приоритизация вытеснения.

Links (paths):
- .ai-factory/references/graphrag/INDEX.md
- .ai-factory/references/graphrag/01-principles.md
- .ai-factory/references/graphrag/02-taxonomy.md
- .ai-factory/references/graphrag/03-algorithms.md
- .ai-factory/references/graphrag/04-implementations.md
- .ai-factory/references/graphrag/05-design-guide.md
- .ai-factory/references/graphrag/07-implementation-methodology.md

### 2026-08-30 16:01 — Верификация и синхронизация: закрытие вопросов Q4.1–Q4.8, Q4.10–Q4.12
What changed:
- Получены и подтверждены ответы стейкхолдера на 11 открытых вопросов верификации; закрыты зависимости: H200 (141 ГБ) + 70B open-weight, Go-only (Rust исключён), масштаб до ~10k, правило «метрология → approved».
- Зафиксированы стартовые целевые значения 4 NFR-заглушек; правило статусов применено к BR (6 → approved, 1 → deleted) и NFR (13 → approved).

Key notes:
- query-responsiveness (P0): p50 ≤ 5 с / p90 ≤ 10 с; деградация при фоновой переиндексации ≤ ×1.5 от простоя.
- token-minimization: контекст ≤ 4k токенов (p90 ≤ 8k), полнота ≥ 90%, LLM-вызовов ≤ 2 (лимит 3).
- ontology-model: 100% соответствие терминов; снижение противоречий ≥ 50% к концу Фазы 2.
- adoption-principles: 100% метрик G1–G7 с целями к гейту «вывод в эксплуатацию».
- Аудит-след: 10 обязательных полей; хранение — 1 неделя (риск-флаг: короче окна обнаружения инцидентов).
- index-freshness → approved, цели 5/15 мин подтверждаются пилотом Фаза 1.5.
- agent-traffic-isolation: порог деградации закрыт — p50 ≤ ×1.5 от простоя, потолок p90 ≤ 10 с (калибровка Фаза 1.5).
- Масштаб: «тысячи, до ~10k» (100k не планируется) — синхронизировать 5 ADR.

Links (paths):
- specs/open-questions.md
- specs/nonfun-req/ (query-responsiveness, token-minimization, ontology-model, adoption-principles, index-freshness, agent-audit)
- specs/adr/ (README, hybrid-graphrag-composition, s3-document-store, graph-storage, go-single-language-adoption)
- specs/qa/e2e-gui-testing.md
- specs/user-stories/ (US-answers, knowledge.sync, context.impact, mcp.compile)
- .ai-factory/PLAN.md, .ai-factory/ARCHITECTURE.md, .ai-factory/RESEARCH.md
<!-- aif:sessions:end -->
