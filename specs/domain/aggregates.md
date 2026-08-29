# Агрегаты — GraphRAG

> **Статус:** baseline (черновик). Правила: агрегат — граница транзакционности; внешние ссылки на агрегат — только по ID; инварианты не выходят за границы агрегата (см. `README.md`, «Принципы моделирования» п.4). Операции, не влезающие в сущности (резолвинг, анализ влияния, сверка, компиляция, фильтрация утечек), — доменные сервисы (см. раздел «Доменные сервисы»); их результаты — объекты-значения.

Кандидаты из `README.md` (`Document`, `Chunk`, `Claim`, `KnowledgeGraph`, `OntologyLayer`, `ArtifactGraph`, `ContextCompiler`): `Document` — корень в двух контекстах (разные модели одного понятия, DDD-канон); `Chunk` — сущность; `Claim` — корень; `KnowledgeGraph` — контекст (агрегат `GraphUpdate`); `OntologyLayer` — контекст `ontology-layer` с корнем `OntologyVersion`; `ArtifactGraph` — корень; `ContextCompiler` — контекст `context-compiler` (сервис `ContextAssembler` + VO `CompiledContext`).

## corpus-ingestion — Приём источников корпуса

| Агрегат | Корень | Сущности | Объекты-значения | Границы транзакций | Инварианты |
|---|---|---|---|---|---|
| `Document` | `Document` | `DocumentRevision` | `DocumentId`, `SourceRef`, `Checksum`, `IngestionStatus` | Приём/обновление одной версии документа | Стабильный ID у документа; одна текущая версия; приём идемпотентен по (источник, версия); происхождение обязательно |
| `Corpus` | `Corpus` | — (ссылки на `Document` по ID) | `CorpusId`, `CorpusScope` | Добавление/исключение документа | Границы корпуса фиксированы (проектный/глобальный); членство по ID документа |

> Источник знаний — доменное понятие (тип и правила приёма: эталонный источник, легаси; Confluence исключён — vision §2.7.3). Каналы (GitLab, S3) — внешние системы за антикоррупционным слоем (ADR-IMPL.INTEGRATION.s3-document-store), в модель не входят.

## document-extraction — Извлечение фактов из документов

| Агрегат | Корень | Сущности | Объекты-значения | Границы транзакций | Инварианты |
|---|---|---|---|---|---|
| `Document` | `Document` | `Chunk`, `ChunkEmbedding` | `ChunkRange`, `EmbeddingVector`, `SourceSpan`, `ExtractionConfidence` | Разбор одной версии документа и извлечение фактов | Чанк принадлежит ровно одной версии документа; извлечённые факты привязаны к чанку (взаимная индексация, KAG); повторный запуск для той же версии не дублирует чанки; статус: принят → разобран → факты извлечены → включён в базу знаний |

> `Document` здесь — другая модель того же понятия, чем в `corpus-ingestion`: в этом контексте важны фрагменты и извлечённые факты, а не происхождение и канал поставки (DDD-канон: разные модели в разных контекстах).

## knowledge-graph — Накопление знаний (граф знаний)

| Агрегат | Корень | Сущности | Объекты-значения | Границы транзакций | Инварианты |
|---|---|---|---|---|---|
| `GraphUpdate` | `GraphUpdate` | `Node`, `Edge`, `CommunitySummary` | `KnowledgeState`, `Provenance`, `Confidence`, `GraphChangeSet` | Применение одного набора изменений и переключение состояния знаний | Каждое изменение имеет источник (provenance); инкрементальный пересчёт затрагивает только изменённые части; переключение состояния атомарно (реализация — версионные снапшоты, ADR-IMPL.DATA.incremental-update-snapshot-publish) |
| `Claim` | `Claim` | `ClaimRevision` | `ClaimId`, `ClaimStatus`, `SourceSpan`, `Confidence` | Жизненный цикл одного утверждения | Утверждение прослеживается до породивших чанков (взаимная индексация); при изменении источника — пересмотр и смена статуса |

> `KnowledgeGraph` целиком не является агрегатом: граф хранится в Neo4j (ADR-IMPL.DATA.graph-storage), границей транзакционности выступает набор изменений `GraphUpdate`. `KnowledgeState` — объект-значение «согласованное состояние знаний, доступное для чтения». `CommunitySummary` — внутренняя сущность контекста (детекция сообществ — алгоритм Leiden, механизм; ADR-DES.API.hybrid-graphrag-composition).

## ontology-layer — Онтологический слой

| Агрегат | Корень | Сущности | Объекты-значения | Границы транзакций | Инварианты |
|---|---|---|---|---|---|
| `OntologyModel` | `OntologyVersion` | `Concept`, `RelationType`, `SemanticMapping` | `Term`, `CanonicalName`, `Alias`, `OntologyVersionId` | Публикация одной версии онтологии | Версия неизменяема после публикации; понятие имеет канонический термин; резолвинг — по опубликованной версии |

> Резолвинг терминов — доменный сервис `TermResolver`.

## query-answering — Ответы с grounding

| Агрегат | Корень | Сущности | Объекты-значения | Границы транзакций | Инварианты |
|---|---|---|---|---|---|
| `Answer` | `Answer` | `AnswerSection`, `Citation`, `GroundingCheck` | `AnswerId`, `AnswerStatus`, `Confidence`, `TraceRef` | Генерация и проверка одного ответа | Ответ публикуется только с атрибуцией источников; каждое утверждение ответа прослеживается до чанка/утверждения (provenance) |

> `Query` — не агрегат: запрос — вход без собственных инвариантов; чтение вне доменной модели (CQRS). Извлечение (retrieval) — механизм (vision §2.2), его стратегии (dual-level, PathRAG, PPR) — ADR-DES.API.hybrid-graphrag-composition, в модель не входят. Сверка «результат ↔ источник» (K5) — доменный сервис `ConsistencyChecker`; при расхождении публикуется `ConflictDetected` (потребитель — `artifact-traceability`, агрегат `Contradiction`).

## artifact-traceability — Трассируемость артефактов

| Агрегат | Корень | Сущности | Объекты-значения | Границы транзакций | Инварианты |
|---|---|---|---|---|---|
| `ArtifactGraph` | `ArtifactGraph` | `Artifact`, `ArtifactLink`, `ArtifactOwner` | `ArtifactId`, `ArtifactKind`, `LinkType` | Добавление/обновление связей артефакта | Связи направлены и типизированы; стабильный ID артефакта; каждому артефакту назначен владелец |
| `Contradiction` | `Contradiction` | `ContradictionEvidence`, `OwnerSignal` | `ContradictionId`, `ContradictionStatus`, `Severity` | Жизненный цикл одного противоречия (обнаружение → сигнал → подтверждение/отклонение) | Противоречие фиксируется с доказательствами; сигнал доставляется владельцу; изменение применяется только после подтверждения («агент готовит — человек подтверждает») |

> `Contradiction` создаётся по событию `ConflictDetected` из сверки (`query-answering`, K5). Анализ влияния — доменный сервис `ImpactAnalyzer`: детерминированное замыкание затронутых артефактов по `ArtifactGraph`; результат — VO `ImpactReport` (зависит от состояния знаний).

## context-compiler — Компиляция контекста

В контексте нет агрегатов: компиляция — доменный сервис `ContextAssembler`, результат — неизменяемый объект-значение `CompiledContext` {items[], relations[], tokenEstimate, policy}; `CompilationRequest` — вход (не агрегат).

Инварианты: полнота при минимуме токенов (бюджет); только опубликованные и разрешённые артефакты; выданный контекст неизменяем.

## llm-contour — Безопасный контур LLM

| Агрегат | Корень | Сущности | Объекты-значения | Границы транзакций | Инварианты |
|---|---|---|---|---|---|
| `LlmRequest` | `LlmRequest` | `AuditRecord` | `RequestId`, `PromptClass`, `LeakRisk`, `AccessDecision` | Одно обращение к модели (проверка → исполнение → аудит) | Проверка и фильтрация утечек до отправки; аудит обязателен; блокировка при утечке |
| `AuditJournal` | `AuditJournal` | `SecurityEvent` | `Severity`, `EventCode`, `EventTime` | Запись события безопасности | Журнал append-only; события не редактируются и не теряются |

> Фильтрация утечек — доменный сервис `LeakGuard` (глоссарий «Фильтрация утечек»); аудит — «Аудит обращений» (глоссарий).

## Доменные сервисы

Stateless-операции, не влезающие в сущности (референс DDD: «Доменные сервисы»).

| Сервис | Контекст | Операция | Результат (VO) |
|---|---|---|---|
| `TermResolver` | `ontology-layer` | Резолвинг термина запроса по опубликованной онтологии | `ResolvedTerm` (каноническое понятие, алиасы, связи) |
| `ImpactAnalyzer` | `artifact-traceability` | Детерминированное замыкание затронутых артефактов по `ArtifactGraph` | `ImpactReport` (affected[], depth, stateVersion) |
| `ConsistencyChecker` | `query-answering` | Сверка «результат ↔ источник» (K5) | `ConsistencyVerdict` (согласовано / расхождение с evidence) |
| `ContextAssembler` | `context-compiler` | Сбор минимально достаточного контекста под задачу | `CompiledContext` (items[], relations[], tokenEstimate, policy) |
| `LeakGuard` | `llm-contour` | Фильтрация утечек и проверка обращения до отправки | `AccessDecision` |

## Сводная таблица агрегатов

| Агрегат | Контекст | Корень | Назначение |
|---|---|---|---|
| `Document` | `corpus-ingestion` | `Document` | Приём и версионирование источника |
| `Corpus` | `corpus-ingestion` | `Corpus` | Границы и членство корпуса |
| `Document` | `document-extraction` | `Document` | Разбор документа и извлечение фактов |
| `GraphUpdate` | `knowledge-graph` | `GraphUpdate` | Применение изменений графа и переключение состояния знаний |
| `Claim` | `knowledge-graph` | `Claim` | Утверждение с provenance — единица проверяемости |
| `OntologyModel` | `ontology-layer` | `OntologyVersion` | Версионируемая модель предметной области |
| `Answer` | `query-answering` | `Answer` | Ответ с grounding и атрибуцией |
| `ArtifactGraph` | `artifact-traceability` | `ArtifactGraph` | Связи артефактов разработки |
| `Contradiction` | `artifact-traceability` | `Contradiction` | Противоречие с доказательствами, владельцем и статусом |
| `LlmRequest` | `llm-contour` | `LlmRequest` | Обращение к модели с проверкой и аудитом |
| `AuditJournal` | `llm-contour` | `AuditJournal` | Журнал аудита обращений (append-only) |

> `Document` фигурирует в двух контекстах с разными моделями — это соответствует канону DDD (разные модели одного понятия в разных ограниченных контекстах), а не дублирование агрегата.

## Связанные артефакты

- [Карта контекстов](context-map.md) — границы и отношения контекстов
- [Доменные события](domain-events.md) — события, порождаемые агрегатами и сервисами
- [Глоссарий](../glossary.md) — термины модели (термины-кандидаты README)
