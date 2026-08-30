# ADR-DES.INFRA.container-composition — Состав контейнеров: декомпозиция GraphRAG на логические исполняемые блоки (C4, уровень 2)

- **Статус:** ПРИНЯТО
- **Дата:** 2026-08-30
- **Решение владельца продукта:** 2026-08-30: декомпозиция ратифицирована; форма развёртывания MVP — **Docker Compose** (однохостовой контур).
- **Требование-источник:** [`specs/vision.md`](../../specs/vision.md) §2.1–2.2 (функции F1–F4), §2.4 (события), §2.5 (MVP), §2.7 (границы), §3.3 (контекст); [`specs/c4/context.md`](../../specs/c4/context.md) (уровень 1); [`specs/c4/container.md`](../../specs/c4/container.md) (уровень 2, целевое состояние); принятые ADR: [ADR-DES.API.hybrid-graphrag-composition](ADR-DES.API.hybrid-graphrag-composition.md), [ADR-IMPL.STACK.go-single-language-adoption](ADR-IMPL.STACK.go-single-language-adoption.md), [ADR-IMPL.INTEGRATION.s3-document-store](ADR-IMPL.INTEGRATION.s3-document-store.md), [ADR-IMPL.DATA.incremental-update-snapshot-publish](ADR-IMPL.DATA.incremental-update-snapshot-publish.md), [ADR-DES.API.agent-gateway-scheduling-layer](ADR-DES.API.agent-gateway-scheduling-layer.md), [ADR-IMPL.DATA.graph-storage](ADR-IMPL.DATA.graph-storage.md), [ADR-DES.API.api-gateway-adoption](ADR-DES.API.api-gateway-adoption.md); NFR: [`REQ-NFR-api.performance.query-responsiveness`](../../specs/nonfun-req/REQ-NFR-api.performance.query-responsiveness.md), [`REQ-NFR-api.performance.agent-traffic-isolation`](../../specs/nonfun-req/REQ-NFR-api.performance.agent-traffic-isolation.md), [`REQ-NFR-security.compliance.llm-contour`](../../specs/nonfun-req/REQ-NFR-security.compliance.llm-contour.md), [`REQ-NFR-api.performance.token-minimization`](../../specs/nonfun-req/REQ-NFR-api.performance.token-minimization.md); референсы GraphRAG: [01-principles](../../.ai-factory/references/graphrag/01-principles.md), [02-taxonomy](../../.ai-factory/references/graphrag/02-taxonomy.md), [03-algorithms](../../.ai-factory/references/graphrag/03-algorithms.md), [04-implementations](../../.ai-factory/references/graphrag/04-implementations.md), [05-design-guide](../../.ai-factory/references/graphrag/05-design-guide.md), [07-implementation-methodology](../../.ai-factory/references/graphrag/07-implementation-methodology.md)

## Контекст

GraphRAG — корпоративная система знаний на базе ontology-grounded GraphRAG (evidence-based context layer для ИИ-агентов автоматизации разработки). Проект находится на этапе видения (Фаза 0): `src/` не содержит реализации, архитектура описывает целевое состояние (`to be`). Уровень 1 C4 ([context.md](../../specs/c4/context.md)) фиксирует систему как единый блок; данный ADR фиксирует декомпозицию уровня 2 — состав и границы контейнеров C4, обоснованные референсами GraphRAG и принятыми решениями.

Сопоставление референсов ([01-principles](../../.ai-factory/references/graphrag/01-principles.md) … [07-implementation-methodology](../../.ai-factory/references/graphrag/07-implementation-methodology.md)) с контейнерной моделью ([container.md](../../specs/c4/container.md)) даёт три факта, определяющих границы контейнеров:

1. **Два пути с разными характеристиками: индексация (offline) и запрос (online).** Референсный pipeline ([01-principles] §3) и high-level архитектура ([05-design-guide] §3.1: Ingest Pipeline → Knowledge Index → Query Engine) разделяют построение индекса и обслуживание запросов; таксономия ([02-taxonomy] I–III) отделяет Knowledge Organization от Knowledge Retrieval и Knowledge Integration. Индексация — тяжёлый пакетный LLM-процесс ([07-implementation-methodology] §6: 281 мин на 1 млн токенов на CPU), запрос — интерактивный путь с требованиями отзывчивости (query-responsiveness) и изоляции агентских нагрузок (agent-traffic-isolation). Смешение путей в одном процессе создаёт риск конкуренции за ресурсы и деградации интерактивного пути.
2. **Границы контейнеров следуют функциям F1–F4** (vision §2.1–2.2): F1 (проверяемые ответы) → Движок запросов; F2 (индексация источников) → Оркестрация пайплайнов; F3 (контекст и влияние) → Ядро; F4 (MCP-канал) → MCP-сервер. Механизмы (онтологический слой, инкрементальное обновление, контур LLM) — компоненты внутри контейнеров, а не отдельные контейнеры (канон vision §2.2: механизмы не получают F-кодов; container.md: Agent Gateway — архитектурная граница внутри MCP-сервера).
3. **Каналы доступа разделяются по протоколу и классу нагрузки** (принято в [api-gateway-adoption](ADR-DES.API.api-gateway-adoption.md) и [agent-gateway-scheduling-layer](ADR-DES.API.agent-gateway-scheduling-layer.md)): люди — HTTP(S) через API Gateway; ИИ-агенты — MCP через MCP-сервер; внутренние сервисы не публикуются наружу напрямую.

## Решение

Зафиксировать как целевую декомпозицию уровня 2 C4 состав из **10 контейнеров** ([container.md](../../specs/c4/container.md)). Контейнер C4 — логический исполняемый блок (Go-процесс/сервис в защищённом контуре организации; веб-интерфейс — приложение в браузере) и **не эквивалентен Docker-контейнеру**.

**Форма развёртывания (решение 2026-08-30):** MVP — **Docker Compose** на одном хосте в защищённом контуре организации. C4-контейнеры не эквивалентны Docker-контейнерам: compose-сервисы группируют C4-контейнеры по процессам (например, статик-сервер и API Gateway — отдельные сервисы; Neo4j CE — отдельный сервис с volume; воркеры индексации — сервис с масштабированием по числу реплик). Критерий пересмотра: рост объёмов → горизонтальное масштабирование воркеров индексации и разделение сервисов (Фаза 2/3); мультиарендность → отдельные инстансы/площадки (каждая команда — свой стек, общие точки — GitLab, S3, контур LLM).

| Контейнер | Тип | Функция | Назначение |
|---|---|---|---|
| Ядро | Сервис | F3 | Граф знаний, ArtifactGraph, онтологический слой, компилятор контекста |
| Оркестрация пайплайнов индексации | Воркер | F2 | GitLab/S3 sync и ingest, извлечение (RAPTOR/StructRAG для PDF), очередь задач, инкрементальное обновление, сборка и атомарная публикация версий, пересчёт и суммаризация сообществ |
| Движок запросов | Сервис | F1 | Retrieval (dual-level, PathRAG, PPR), генерация ответов, grounding/provenance, сверка «результат ↔ источник» |
| MCP-сервер | Сервис | F4 | Инструменты `answer`/`compile_context`, Agent Gateway (auth, политики, квоты, бюджет), слой планирования, фильтрация утечек, аудит обращений |
| API Gateway | Сервис | сквозное | Единая HTTP-точка входа для людей: authN/authZ, TLS, маршрутизация, rate limiting, квоты, аудит |
| Web-сервер (статика) | Статическая раздача | сквозное | Раздача SPA: hashed-ассеты (immutable-кэш), `index.html` (no-cache), SPA-fallback, сжатие |
| Веб-интерфейс (UI) | SPA в браузере | F1, F3 | Вопросы/ответы, статусы индексации, метрики, отчёты о влиянии |
| Интеграции | Инфраструктура | сквозное | GitLab/S3/LLM-клиенты; CPU-компоненты (Leiden, HNSW, токенизатор) через CGo |
| Мониторинг и аудит | Сервис | сквозное | Логи и метрики, события безопасности (`SecurityEventEmitted`), панели аудита |
| Хранилище графа и векторов | Хранилище данных | F1–F3 | Neo4j CE: граф, чанки (текст), векторный индекс, индексы артефактов, версионные снапшоты |

**Принципы декомпозиции** (что и почему выделяется в контейнер):

1. **Разделение write/read путей.** Оркестрация (F2) — единственный владелец записи при сборке версий; Движок запросов и Ядро обслуживают только опубликованные версии ([incremental-update-snapshot-publish](ADR-IMPL.DATA.incremental-update-snapshot-publish.md)). Это изолирует тяжёлую LLM-индексацию от интерактивного пути (query-responsiveness, agent-traffic-isolation) и даёт независимое масштабирование.
2. **Функциональная граница F1–F4.** Каждый контейнер — владелец своей функции; границы контейнеров совпадают с границами функций, что даёт трассируемость «контейнер → функция → US/UC» и заменяемость компонентов по контрактным тестам ([hybrid-graphrag-composition](ADR-DES.API.hybrid-graphrag-composition.md)).
3. **Канальная граница.** API Gateway + Web-сервер (HTTP, люди) и MCP-сервер (MCP, агенты) — раздельно ([api-gateway-adoption](ADR-DES.API.api-gateway-adoption.md), [agent-gateway-scheduling-layer](ADR-DES.API.agent-gateway-scheduling-layer.md)).
4. **Технологическая граница.** Хранилище — отдельный `ContainerDb` (Neo4j CE, [graph-storage](ADR-IMPL.DATA.graph-storage.md)); UI — браузерный SPA (вне серверной Go-кодовой базы); Интеграции — нативный CPU-код через CGo ([go-single-language-adoption](ADR-IMPL.STACK.go-single-language-adoption.md), `RULES.md`).
5. **Сквозные контейнеры.** API Gateway, Web-сервер, Интеграции, Мониторинг не владеют F-функциями: они вынесены для единых политик (auth, аудит, квоты), независимых жизненных циклов (деплой фронта) и общего инфраструктурного кода (клиенты, CPU-компоненты).

## Сопоставление с референсами GraphRAG

| Контейнер | Что из референса реализует | Ссылки |
|---|---|---|
| Ядро | Граф знаний, онтологический слой (ontology-grounded KG), ArtifactGraph, компилятор контекста | [01-principles] §3.3 (KG); [02-taxonomy] §1.2 (Ontology-Grounded: OG-RAG); [03-algorithms] §3 (KAG: mutual indexing KG↔chunks, логические формы); [05-design-guide] §3.1 (Knowledge Index) |
| Оркестрация | Chunking (600/100), LLM-extraction с self-reflection/gleaning, детекция сообществ (Leiden), суммаризации сообществ, инкрементальное обновление, PDF-обработка | [01-principles] §3.1–3.5; [03-algorithms] §2 (LightRAG incremental), §5 (RAPTOR), §10 (StructRAG); [05-design-guide] §3.1 (Ingest Pipeline); [07-implementation-methodology] §1–2 |
| Движок запросов | Dual-level retrieval, PathRAG (pruned paths), PPR (ассоциативные запросы), генерация с grounding/provenance, сверка | [03-algorithms] §2 (LightRAG dual-level), §12 (PathRAG), §4 (HippoRAG PPR); [05-design-guide] §3.1 (Query Engine: adaptive router, local/structural/global, response generator); [07-implementation-methodology] §4 (grounding rules) |
| MCP-сервер | Канал F4: `answer`/`compile_context`, Agent Gateway, слой планирования | [vision.md](../../specs/vision.md) §2.2 (граница F4); [agent-gateway-scheduling-layer](ADR-DES.API.agent-gateway-scheduling-layer.md); [04-implementations] §1, §3 (MCP-серверы: ApeRAG, code-graph-rag) |
| API Gateway | Единый HTTP-вход, политики, аудит | [api-gateway-adoption](ADR-DES.API.api-gateway-adoption.md); [context.md](../../specs/c4/context.md) (персоны: команда, эксплуатация) |
| Web-сервер | Раздача SPA, кэш-заголовки | [api-gateway-adoption](ADR-DES.API.api-gateway-adoption.md) §6 |
| Веб-интерфейс | UI функций F1/F3 | [context.md](../../specs/c4/context.md) (персоны); [vision.md](../../specs/vision.md) §3.1 |
| Интеграции | GitLab/S3/LLM-клиенты; Leiden/HNSW/токенизатор (CPU) | [01-principles] §3.4 (Leiden: graspologic); [04-implementations] §2–3; [go-single-language-adoption](ADR-IMPL.STACK.go-single-language-adoption.md) (CGo) |
| Мониторинг и аудит | `SecurityEventEmitted`, логи, метрики | [vision.md](../../specs/vision.md) §2.4; [REQ-NFR-security.compliance.llm-contour](../../specs/nonfun-req/REQ-NFR-security.compliance.llm-contour.md) |
| Хранилище | Граф + чанки + векторный индекс + снапшоты | [05-design-guide] §3.1 (Entity KG + Community Summaries + Vector Index); [graph-storage](ADR-IMPL.DATA.graph-storage.md) |

**Расхождения с референсами** (референс — общее руководство по домену; принятые проектные решения имеют приоритет):

| Тема | Рекомендация референса | Решение проекта | Основание |
|---|---|---|---|
| Язык серверной части | Python/FastAPI, Rust ([05-design-guide] §3.2) | Go; нативный CPU-код — CGo | [go-single-language-adoption](ADR-IMPL.STACK.go-single-language-adoption.md) |
| Хранилище | Neo4j + отдельный векторный движок (pgvector/Qdrant/Milvus) ([05-design-guide] §3.2) | Neo4j CE: граф + чанки + нативный векторный индекс в одном движке | [graph-storage](ADR-IMPL.DATA.graph-storage.md) |
| Глобальные обзорные ответы | Map-reduce по суммаризациям сообществ ([01-principles] §3.6) | PathRAG (pruned paths, без map-reduce) + community summaries C0–C1 — компактный контекст для локальных GPU и MCP | [hybrid-graphrag-composition](ADR-DES.API.hybrid-graphrag-composition.md) |
| MCP-доступ | MCP встроен в framework-реализации ([04-implementations] §1, §3) | Отдельный MCP-сервер с Agent Gateway (изоляция агентских нагрузок) | [agent-gateway-scheduling-layer](ADR-DES.API.agent-gateway-scheduling-layer.md) |
| Обновление индекса | Инкрементальное обновление ([05-design-guide] §2.4; [03-algorithms] §2 LightRAG) | Инкрементальное + версионные снапшоты + атомарная публикация | [incremental-update-snapshot-publish](ADR-IMPL.DATA.incremental-update-snapshot-publish.md) |

## Рассмотренные альтернативы

| Альтернатива | Описание | Причины отклонения |
|---|---|---|
| **Монолит (один Go-процесс)** | Весь pipeline (индексация + запрос + MCP + гейтвей) в одном сервисе | Смешение пакетной LLM-индексации и интерактивного пути: риск для query-responsiveness и agent-traffic-isolation; нет независимого масштабирования; замена методов ([hybrid-graphrag-composition](ADR-DES.API.hybrid-graphrag-composition.md)) требует передеплоя всего |
| **Сервис на каждый метод** (микросервисы LightRAG/PathRAG/PPR/RAPTOR…) | Каждый алгоритм — отдельный контейнер | Методы — взаимозаменяемые компоненты внутри Движка запросов/Оркестрации (заменяемость по контрактным тестам); N сервисов → операционная сложность без выгоды для MVP |
| **Движок запросов и Ядро в одном контейнере** | Retrieval и граф/онтология — один сервис | Разные потребители и жизненные циклы: MCP обращается к Ядру напрямую (UC-compile_context), минуя Движок запросов; Движок запросов — тонкий горячий путь, заменяемый по контракту; Ядро — владелец модели графа, онтологии и компилятора контекста |
| **Единая точка входа HTTP + MCP** | Один гейтвей для людей и агентов | Отклонено в [api-gateway-adoption](ADR-DES.API.api-gateway-adoption.md): разделение по протоколу и классу нагрузки; изоляция агентских нагрузок — [agent-gateway-scheduling-layer](ADR-DES.API.agent-gateway-scheduling-layer.md) |
| **Agent Gateway/слой планирования — отдельный контейнер** | Отдельный сервис-оркестратор агентских запросов | Отложено: в MVP — компоненты MCP-сервера; критерий пересмотра — рост workflow (см. [agent-gateway-scheduling-layer](ADR-DES.API.agent-gateway-scheduling-layer.md)) |
| **Статика в гейтвее (go:embed)** | SPA встроена в бинарник API Gateway | Отклонено в [api-gateway-adoption](ADR-DES.API.api-gateway-adoption.md): независимый жизненный цикл фронта, зрелое кэширование |
| **Мониторинг и аудит — внешняя система** | Логи/метрики отдаются во внешний контур | `SecurityEventEmitted` — внутренняя функция системы (vision §2.4); NFR-SEC-1: данные не покидают периметр |
| **Хранилище: граф + отдельный векторный движок** | Neo4j + pgvector/Qdrant/Milvus (как в [05-design-guide] §3.2) | Отклонено в [graph-storage](ADR-IMPL.DATA.graph-storage.md): единый движок Neo4j CE (граф, чанки, вектор, снапшоты) — меньше движков, один язык запросов, CE — одна БД на инстанс |

## Последствия

**Положительные:**

- Изоляция тяжёлой индексации от интерактивного пути: отзывчивость запросов (query-responsiveness), изоляция агентских нагрузок (agent-traffic-isolation), независимое масштабирование write/read путей.
- Границы контейнеров = границы функций F1–F4: трассируемость «контейнер → функция → US/UC», понятная карта системы для команды.
- Заменяемость компонентов по контрактным тестам ([hybrid-graphrag-composition](ADR-DES.API.hybrid-graphrag-composition.md)): методы (PathRAG, PPR, LightRAG-retrieval) — компоненты внутри Движка запросов, обновляются без смены контрактов.
- Единые сквозные политики (auth, аудит, квоты) в API Gateway и MCP-сервере; независимый деплой фронта (Web-сервер).
- Согласованность с принятыми ADR (Go-only, Neo4j, S3, инкрементальные снапшоты, Agent Gateway, API Gateway) — без конфликтов границ.

**Отрицательные и смягчение:**

1. **Число контейнеров и межсервисные вызовы (10 контейнеров).** Смягчение: контейнеры — логические Go-процессы; форма развёртывания MVP — Docker Compose (однохостовой контур); взаимодействия — внутренний API с контрактными тестами; в MVP контейнеры деплоятся на одном хосте.
2. **Риск «тонкого» Ядра или «толстого» Движка запросов.** Смягчение: правило владения функциями (Ядро — модель графа/онтология/компилятор контекста; Движок запросов — retrieval/генерация/сверка), код-ревью, контрактные тесты.
3. **Дублирование политик между API Gateway и MCP-сервером (Agent Gateway).** Смягчение: общие библиотеки политик (auth, аудит) в общем коде, границы контейнеров раздельны (принято в [api-gateway-adoption](ADR-DES.API.api-gateway-adoption.md)).
4. **Оркестрация — единая точка записи.** Смягчение: очередь задач внутри контейнера; при росте объёмов пайплайны индексации масштабируются горизонтально (воркер).

**Критерии пересмотра:**

- Рост workflow-нагрузок агентов → выделение слоя планирования/оркестратора в отдельный контейнер ([agent-gateway-scheduling-layer](ADR-DES.API.agent-gateway-scheduling-layer.md)).
- Потребность в мультиарендности или гарантированных SLO на крупный корпус → пересмотр масштабирования контейнеров (vision §2.6, Фаза 2/3).
- Появление реального кода: диаграмма актуализируется до `as-is`; расхождения с данным ADR — через новый ADR (статус «ЗАМЕНЕНО»).

**Открытые вопросы (вне этого ADR):**

- Протоколы между контейнерами — фиксируются ADR уровня `IMPL` (по [container.md](../../specs/c4/container.md)).
- Состав compose-сервисов (маппинг 10 C4-контейнеров на сервисы Docker Compose) — при реализации, в `deploy/`.
- Детализация компонентов внутри контейнеров — уровень 3 (`component-*.md`).

## Связанные артефакты

- [Диаграмма контейнеров (C4, уровень 2)](../../specs/c4/container.md)
- [System Context (C4, уровень 1)](../../specs/c4/context.md)
- [Реестр ADR](../../specs/adr/README.md)
- [Видение продукта](../../specs/vision.md)
- [Референсы GraphRAG](../../.ai-factory/references/graphrag/INDEX.md)
