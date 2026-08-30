# Доменные события — GraphRAG

> **Статус:** baseline (черновик). Каталог расширяет `specs/vision.md` §2.4 (не дублируя его): добавляет payload, producer/consumer по контекстам, класс события и события контура подтверждения. События классифицируются: **внешние** (бизнес-значимые, пересекают границы контекстов/систем, публикуются для интеграций) и **внутренние** (пайплайнные, в пределах контекста). Доменные события — PascalCase; внешние представления — dotted lowercase; внешние события идемпотентные и повторяемые.

## Каталог событий

| Событие | Класс | Триггер | Producer (контекст) | Consumer (контексты) | Эскиз payload |
|---|---|---|---|---|---|
| `DocumentIngested` | внешнее | Новый/изменённый документ: MR/webhook GitLab, событие/сверка S3 | `corpus-ingestion` | `document-extraction` | `documentId, sourceRef, revision, checksum, ingestedAt` |
| `EntityExtracted` | внутреннее | Обработка чанка в пайплайне извлечения | `document-extraction` | `knowledge-graph` | `chunkId, documentId, nodes[], edges[], claims[], confidence` |
| `GraphUpdated` | внутреннее | Применение результата извлечения к графу | `knowledge-graph` | `knowledge-graph` (сообщества), `artifact-traceability`, `query-answering`, `context-compiler` | `graphVersion, updatedSubgraphs[], affectedChunks[]` |
| `CommunityRecomputed` | внутреннее | Изменение графа затрагивает сообщества | `knowledge-graph` | `knowledge-graph` (сборка состояния) | `communityIds[], summaryIds[], stateVersion` |
| `KnowledgeBaseUpdated` | внешнее | Переключение чтения на новое согласованное состояние знаний | `knowledge-graph` | `query-answering`, `artifact-traceability`, `context-compiler` | `stateVersion, publishedAt, baseState, changeSet` |
| `OntologyUpdated` | внешнее | Новая версия модели предметной области из репозитория модели | `ontology-layer` | `knowledge-graph` (re-resolve), `query-answering`, `context-compiler` | `ontologyVersion, conceptsDelta[], relationTypesDelta[]` |
| `QueryReceived` | внутреннее | Запрос пользователя (UI/API) или ИИ-агента (MCP) | `query-answering` (вход F1) | `query-answering` | `queryId, queryText, intent, channel, actor` |
| `QueryAnswered` | внешнее | Ответ сформирован и готов к доставке | `query-answering` | Пользователь/агент (UI/MCP), мониторинг (метрики) | `answerId, queryId, citations[], confidence, publishedAt` |
| `InfluenceComputed` | внешнее | Запрос анализа влияния / изменение артефакта | `artifact-traceability` | Разработчик, архитектор, `context-compiler` | `analysisRunId, artifactId, affected[], depth, stateVersion` |
| `ConflictDetected` | внешнее | Сверка «результат ↔ источник» (K5) / анализ корпуса | `query-answering` (сверка), `artifact-traceability` | `artifact-traceability` (агрегат `Contradiction`) | `conflictId, artifactPair, evidence[], severity` |
| `OwnerSignalDelivered` | внешнее | Противоречие зарегистрировано; требуется решение владельца | `artifact-traceability` | Владелец артефакта (контур сигналов) | `signalId, contradictionId, artifactId, evidence[], severity, ownerId` |
| `ChangeConfirmed` | внешнее | Владелец подтвердил предлагаемое изменение | Владелец (канал подтверждения — MCP/CLI) | `artifact-traceability`, `corpus-ingestion` | `signalId, contradictionId, artifactId, decidedBy, decidedAt` |
| `ChangeRejected` | внешнее | Владелец отклонил предлагаемое изменение | Владелец (канал подтверждения — MCP/CLI) | `artifact-traceability` | `signalId, contradictionId, artifactId, reason, decidedAt` |
| `ContextCompiled` | внешнее | Запрос агента на компиляцию контекста (MCP `compile_context`) | `context-compiler` | ИИ-агент (через MCP), Hand-off | `compilationId, requestId, artifacts[], relations[], tokenEstimate, policy` |
| `SecurityEventEmitted` | внешнее | Фильтрация утечек, нарушение политик Agent Gateway, аудит обращений | `llm-contour` (также MCP/Gateway для аудита) | IT-безопасность (панели аудита), мониторинг | `eventId, eventCode, severity, actor, resource, timestamp` |

> Каналы подтверждения владельца (`ChangeConfirmed` / `ChangeRejected`) — вне веб-интерфейса: GUI — только чат (F1, `ADR-DES.UI.chat-only-interface`); F3 доставляется через MCP/CLI. В веб-интерфейсе противоречие отображается read-only (`ConflictDetected` → отображение вариантов с provenance, без кнопок подтверждения).

## Матрица каскадов «событие → события»

| Событие | Запускает |
|---|---|
| `DocumentIngested` | `EntityExtracted` |
| `EntityExtracted` | `GraphUpdated` |
| `GraphUpdated` | `CommunityRecomputed`; пересмотр `Claim`; `InfluenceComputed` (если затронуты артефакты) |
| `CommunityRecomputed` | `KnowledgeBaseUpdated` (сборка согласованного состояния) |
| `KnowledgeBaseUpdated` | Переключение чтения на новое состояние; актуализация контекстов |
| `OntologyUpdated` | `GraphUpdated` (re-resolve сущностей); пересборка контекстов |
| `QueryReceived` | `QueryAnswered` |
| `QueryAnswered` | `ConflictDetected` (при сверке, K5); `SecurityEventEmitted` (по политике аудита) |
| `ConflictDetected` | `OwnerSignalDelivered` (регистрация противоречия у владельца) |
| `OwnerSignalDelivered` | `ChangeConfirmed` / `ChangeRejected` (решение владельца) |
| `ChangeConfirmed` | Внесение изменения в источник → `DocumentIngested` |
| `ChangeRejected` | Противоречие остаётся открытым; система не меняет состояние |
| `InfluenceComputed` | `ContextCompiled` (использование результатов влияния) |
| `ContextCompiled` | Доставка контекста агенту через MCP |
| `SecurityEventEmitted` | Панели аудита, метрики безопасности |

Эталонные каскады README: `DocumentIngested → GraphUpdated → QueryAnswered`; `ConflictDetected → сигнал владельцу`; `SecurityEventEmitted → обработка в контуре LLM`.

## Внешние события (интеграции)

Внешние представления — dotted lowercase; события идемпотентные и повторяемые (повторная доставка не меняет состояние).

| Внешнее представление | Событие | Ключ идемпотентности | Повторяемость | Потребители |
|---|---|---|---|---|
| `document.ingested` | `DocumentIngested` | `(sourceRef, revision)` | Повторная поставка игнорируется | Оркестрация индексации, мониторинг |
| `knowledge.base.updated` | `KnowledgeBaseUpdated` | `stateVersion` | Повторное уведомление о состоянии | Движок запросов, context compiler |
| `ontology.updated` | `OntologyUpdated` | `ontologyVersion` | Повторное уведомление о версии | Резолвинг, контексты |
| `query.answered` | `QueryAnswered` | `answerId` | Повторная доставка ответа | UI, MCP, метрики |
| `influence.computed` | `InfluenceComputed` | `analysisRunId` | Повторная выдача результата | Пользователи, context compiler |
| `conflict.detected` | `ConflictDetected` | `conflictId` | Повторная регистрация игнорируется | Контур сигналов владельцу |
| `owner.signal.delivered` | `OwnerSignalDelivered` | `signalId` | Повторная доставка сигнала | Владелец артефакта |
| `change.confirmed` | `ChangeConfirmed` | `signalId` | Повторное подтверждение игнорируется | Трассируемость, корпус |
| `change.rejected` | `ChangeRejected` | `signalId` | Повторное отклонение игнорируется | Трассируемость |
| `context.compiled` | `ContextCompiled` | `compilationId` | Повторная выдача контекста | ИИ-агенты, Hand-off |
| `security.event.emitted` | `SecurityEventEmitted` | `eventId` | Журнал append-only, повтор не дублирует | Панели безопасности, мониторинг |

> Внутренние события (`entity.extracted`, `graph.updated`, `community.recomputed`, `query.received`) наружу не публикуются; наблюдаемы через мониторинг и логи.

## Связанные артефакты

- [Карта контекстов](context-map.md) — producer/consumer по контекстам
- [Агрегаты](aggregates.md) — агрегаты и сервисы, порождающие события
- [Видение продукта](../vision.md) — канонический список событий §2.4
- [Прецеденты использования](../use-cases/README.md) — описание каскадов в UC
