# ADR-IMPL.OPS.opentelemetry-adoption — Телеметрия: OpenTelemetry для сбора observability-данных

| Поле | Значение |
|------|----------|
| **Статус** | ПРИНЯТО |
| **Дата** | 2026-09-01 |
| **Контекст** | Контейнер «Мониторинг и аудит» (C4) публикует метрики золотых сигналов и события безопасности (`REQ-NFR-api.observability.golden-signals`, `SecurityEventEmitted`); панели — self-hosted Grafana (`ADR-IMPL.OPS.monitoring-grafana`). Инструмент сбора и экспорта телеметрии (traces/metrics/logs) не был зафиксирован: без него нет единой инструментации Go-сервисов, сквозного `trace-id` (основа аудит-следа агентов, `REQ-NFR-api.observability.agent-audit`) и стандартного канала данных в Grafana-стек. |
| **Требование-источник** | `REQ-NFR-api.observability.golden-signals`; `REQ-NFR-api.observability.agent-audit` (trace-id); `REQ-NFR-security.compliance.llm-contour` (данные не покидают периметр); `ADR-DES.INFRA.container-composition` (контейнер «Мониторинг и аудит»); `ADR-IMPL.OPS.monitoring-grafana` (панели Grafana); `BR-constraint.opensource-only` |

## Решение

Телеметрия всех Go-сервисов — **OpenTelemetry** (traces, metrics, logs): официальный Go SDK (`go.opentelemetry.io/otel`) как единая инструментация для контейнеров «Ядро», «Движок запросов», «Оркестрация пайплайнов индексации», «MCP-сервер», «API Gateway», «Интеграции», «Мониторинг и аудит».

- **Сбор и экспорт:** сервисы отправляют телеметрию по OTLP в **OpenTelemetry Collector** (внутри периметра); Collector маршрутизирует данные в Grafana-стек: метрики → Prometheus, трейсы → Tempo, логи → Loki (панели — Grafana, `ADR-IMPL.OPS.monitoring-grafana`).
- **Метрики:** золотые сигналы (`REQ-NFR-api.observability.golden-signals`) и события безопасности (`SecurityEventEmitted`) публикуются как метрики/логи через OTel; алерты — в корпоративном мониторинге.
- **Трейсинг:** сквозные `trace-id` через HTTP/MCP-границы — основа воспроизводимости аудит-следа агентских шагов по trace-id (`REQ-NFR-api.observability.agent-audit`) и сверки «результат ↔ источник».
- **Периметр и конфиденциальность:** Collector и хранилища телеметрии разворачиваются внутри периметра; чувствительные поля (промпты/ответы LLM, артефакты) не передаются в телеметрию или маскируются — данные разработки не покидают периметр (`REQ-NFR-security.compliance.llm-contour`).
- **Open-source:** OTel SDK, Collector, Prometheus, Tempo, Loki — open-source (`BR-constraint.opensource-only`).

## Рассмотренные альтернативы

- **Проприетарные APM-агенты (Datadog, New Relic и т. п.)** — отклонено: данные покидают периметр; платное ПО (конфликт с `BR-constraint.opensource-only`).
- **Самописная телеметрия/логирование** — отклонено: дублирование работы, нестандартные форматы, нет сквозного `trace-id` как индустриального стандарта.
- **Прямой экспорт в Prometheus без OTel** — отклонено: покрывает только метрики, но не трейсы/логи; OTel даёт единый стандарт для всех трёх сигналов и vendor-neutral инструментацию.

## Последствия

**Положительные:**
- Единый стандарт инструментации для всех Go-сервисов; сквозной `trace-id` — основа аудит-следа агентов (`REQ-NFR-api.observability.agent-audit`).
- Индустриальный, vendor-neutral стандарт; экспорт в Grafana-стек согласован с `ADR-IMPL.OPS.monitoring-grafana`.
- Открытый исходный код, развёртывание внутри периметра.

**Отрицательные и смягчение:**
- Дополнительные компоненты стека (OTel Collector, хранилища трейсов/логов) → включаются в compose-контур MVP (`ADR-DES.INFRA.container-composition`); нагрузка ограничивается выборкой (sampling) и retention в соответствии с мягкими порогами.
- OTel SDK — новая зависимость Go-модуля → официальный SDK, инструментация через middleware/контекст без проникновения в бизнес-логику.
- Трейсы/логи могут содержать чувствительные данные → маскирование полей (промпты LLM, артефакты), фильтрация на уровне экспорта; данные не покидают периметр.

## Критерии пересмотра

- Появление корпоративного стандарта телеметрии, конфликтующего с OpenTelemetry.
- Рост требований аудита за пределы OTel и Grafana-стека (пересмотр экспорта/хранения).
