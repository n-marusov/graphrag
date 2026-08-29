# Research

Updated: 2026-08-29 12:48
Status: active

## Active Summary (input for /aif-plan)
<!-- aif:active-summary:start -->
Topic: Корпоративная система знаний на базе GraphRAG (ontology-grounded) для автоматизации разработки — подготовка к генерации плана создания видения продукта.

Goal: Зафиксировать исследовательский контекст, чтобы на его основе сгенерировать план создания видения продукта (product vision) инструмента.

Product (суть): Evidence-based context layer / context compiler для AI Factory и Hand-off — корпоративная память с provenance, а не поиск по документам. Онтологический слой — машинно-читаемая DDD-модель (bounded contexts, единый язык, агрегаты, доменные события). Инструмент — субстрат инициатив I4 (знания), I6 (трассируемость), I9 (петля обучения).

Constraints:
- Источники: GitLab markdown-спеки (authoritative) + иногда PDF (книги/legacy). Confluence исключён (кладбище устаревших страниц).
- Локальные GPU, open-weight модели, ограниченный контекст → минимизация токенов и числа LLM-вызовов.
- MCP-режим для ИИ-агентов: отдавать точный набор артефактов, а не сырой текст.
- Принцип «агент готовит — человек подтверждает и отвечает».
- Соответствие инициативам I4 (знания), I6 (трассируемость), I9 (петля обучения).

Decisions (язык реализации):
- Go — по умолчанию: система I/O-bound (оркестрация LLM/DB-вызовов), быстрая итерация промптов, goroutines для fan-out.
- Rust — только для in-process CPU-тяжёлых компонентов (Leiden/HNSW/токенизатор) или FFI/библиотеки.
- Честный нюанс: прототип — Python (экосистема LLM/graph); production-сервис — Go/Rust.

Decisions (тип GraphRAG):
- НЕ чистый Microsoft GraphRAG (map-reduce на каждый запрос + полная перестройка индекса противоречат инкрементальности и локальным GPU).
- Ядро: LightRAG (dual-level retrieval, incremental update).
- Точность/непротиворечивость: KAG-принципы (mutual indexing KG↔chunks, grounding, атрибуция источников).
- Компактный контекст для MCP/локальных GPU: PathRAG (pruned paths, once retrieval без map-reduce).
- PDF: RAPTOR (книги/narrative) + StructRAG (таблицы/формы/отчёты).
- Смежные темы: PPR (HippoRAG-style, без LLM на retrieval).
- Онбординг/обзоры: community summaries (уровни C0–C1).
- Обновление: incremental + периодическая перестройка; для real-time — Graphiti (битемпоральный, готовый MCP).
- Онтологический слой: DDD-модель как машинно-читаемая онтология (инициативы I4/I6).

Кейсы (топ для MVP): K1 (ответ с grounding), K4 (анализ влияния), K5 (сверка результат↔источник), K17 (context compiler для aif-plan/handoff). Полный список 24 кейсов (K1–K24) — в Session.

Open questions:
- Масштаб корпуса (1k vs 100k документов)?
- Какая GPU/модель (8B Q4 vs 70B)?
- MVP-волны и порядок фаз внедрения?

Success signals: время выхода изменения, время ожидания ответа по продукту, точность ответов RAG, доля поставок не соответствующих требованиям, время сигнал→фикс, число противоречий, доля артефактов со связями в графе.

Next step: /aif-plan для создания видения продукта (product vision) инструмента.
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
<!-- aif:sessions:end -->
