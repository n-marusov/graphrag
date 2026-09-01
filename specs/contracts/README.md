# Контракты — GraphRAG

> **Статус:** создан 2026-08-30 (черновик, Фаза 0). Контрактный слой формируется до реализации (spec-driven): спецификации контрактов фиксируются отдельно и являются источником правды для реализации и тестирования.

## Документы

| Контракт | Формат | Содержание |
|---|---|---|
| [`openapi.yaml`](openapi.yaml) | OpenAPI 3.1 | HTTP API веб-интерфейса (F1): сессии и ответы с grounding и provenance |

## Назначение

- **Клиент веб-интерфейса генерируется из OpenAPI-схемы** — тонкий SPA, контрактный подход (`ADR-DES.UI.spa-typescript-frontend`); типы клиента не пишутся вручную.
- **Conformance-проверки** интеграционных тестов выполняются по схеме: path, method, status code, schema, required fields, `error_code`.
- **Сгенерированный код напрямую unit-тестами не покрывается** — тестируются мапперы и обработчики вокруг контрактов.

## Границы контракта

- **Знания (источники корпуса) — только чтение**: write-эндпоинты для данных знаний в контракте отсутствуют (`BR-constraint.sso-readonly-access`).
- **Данные приложения — записываемые**: история сессий веб-интерфейса (создание/переименование/удаление) — данные приложения, не знания (`BR-constraint.ui-session-history`; решение владельца продукта, 2026-08-30).
- **F4 (MCP) и F3 (context compiler)** — вне этого контракта: MCP — JSON-RPC (`UC-mcp.compile.context`), F3 — MCP/CLI (`ADR-DES.UI.chat-only-interface`).

## Версионирование контрактов

SemVer: для стабильных версий — additive-only; breaking changes — только через явную миграцию и version bump. Текущая версия — `0.1.0` (черновик; до `1.0` допустимы breaking changes с фиксацией в этом реестре).

## Связанные артефакты

- Видение: `specs/vision.md` (F1), глоссарий: `specs/glossary.md` (единый язык)
- Доменная модель: `specs/domain/aggregates.md` (агрегаты `Answer`, `Session`), `specs/domain/context-map.md`, `specs/domain/domain-events.md`
- Use cases: `specs/use-cases/UC-answers.grounding.cited-answer.md` (F1.1, A1–A3)
- Бизнес-правила: `BR-constraint.sso-readonly-access`, `BR-constraint.ui-session-history`, `BR-constraint.ui-header`, `BR-constraint.ui-footer`
- ADR: `ADR-DES.UI.spa-typescript-frontend`, `ADR-DES.API.api-gateway-adoption`, `ADR-DES.SECURITY.sso-keycloak`, `ADR-DES.UI.chat-only-interface`
