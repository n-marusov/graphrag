# OpenTelemetry: инфраструктура наблюдаемости — Reference

> Source: opentelemetry.io/docs/concepts/ (signals, components, context-propagation, resources, sampling); opentelemetry.io/docs/collector/ (overview, quick-start, deployment/agent, deployment/gateway); opentelemetry.io/docs/languages/go/getting-started/
> Created: 2026-09-01
> Updated: 2026-09-01

## Overview

OpenTelemetry (OTel) — vendor-agnostic стандарт для генерации, сбора и экспорта телеметрии (traces, metrics, logs). Он заменяет необходимость в vendor-специфичных SDK и инструментах: данные собираются один раз и могут отправляться в любой бэкенд (Jaeger, Zipkin, Prometheus, vendor-решения) через единый протокол OTLP. Проект состоит из Specification (API/SDK/Data), Collector (vendor-agnostic прокси для приёма/обработки/экспорта телеметрии), языковых SDK и инструментационных библиотек.

Ключевая рекомендация для продакшн-инфраструктуры: **экспортировать телеметрию в OpenTelemetry Collector, а не напрямую в бэкенд** — это best practice из официальной документации. Коллектор берёт на себя retries, batching, шифрование и фильтрацию чувствительных данных; дефолтные OTLP-экспортёры во всех языковых SDK по умолчанию указывают на локальный endpoint коллектора (`localhost:4317`), поэтому запущенный коллектор начинает получать телеметрию без дополнительной настройки приложений.

## Core Concepts

### Сигналы (Signals)

Сигналы — это выходные данные системы, описывающие её активность. OpenTelemetry поддерживает:

| Сигнал | Что это | Назначение |
|--------|---------|-----------|
| **Traces** | Путь запроса через приложение | Распределённая трассировка, причинно-следственные связи между сервисами |
| **Metrics** | Измерение, захваченное в рантайме | Агрегированные числовые показатели (счётчики, гистограммы) |
| **Logs** | Запись события | Структурированные события с timestamp, severity, body, attributes |
| **Baggage** | Контекстная информация, передаваемая между сигналами | Проброс key-value пар между сервисами (не чувствительных!) |
| **Profiles** *(в разработке)* | Запись использования ресурсов на уровне кода | Профилирование |

В разработке/на стадии предложения также: **Events** (специфичный тип логов). Группируя сигналы, можно наблюдать один и тот же компонент системы под разными углами.

### Контекст и контекстная передача (Context Propagation)

Context — объект, содержащий информацию для корреляции сигналов между отправителем и получателем (trace ID, span ID). Propagation — механизм сериализации/десериализации контекста между сервисами и процессами.

- Сервис A при вызове сервиса B включает trace ID и span ID в контекст; B создаёт новый span того же trace, устанавливая span A родителем. Так отслеживается полный поток запроса через границы сервисов.
- Обычно propagation обрабатывают инструментационные библиотеки прозрачно; при необходимости — через Propagators API (inject/extract).
- **Дефолтный пропагатор** использует заголовки W3C TraceContext. Формат заголовка `traceparent`:

```
<version>-<trace-id>-<parent-id>-<trace-flags>
```

Пример: `00-a0892f3577b34da6a3ce929d0e0e4736-f03067aa0ba902b7-01`

- **Logs**: SDK автоматически коррелируют логи с трейсами — инжектят trace ID и span ID в лог-запись; логи видны в контексте трейса/спана и связываются между границами сервисов.
- **Metrics**: контекстная передача позволяет агрегировать измерения в контексте — например, время ответа не только всех `GET /product`, но и комбинаций `POST /cart/add > GET /product` и `GET /checkout > GET /product`.

**Security best practices:**
- **Входящий контекст**: не доверять заголовкам трейсов от внешних/недоверенных источников — злоумышленник может подделать trace headers (манипуляция данными трассировки, эксплуатация уязвимостей парсинга). Игнорировать или санитизировать входящий контекст.
- **Исходящий контекст**: внутренние trace/span IDs и baggage могут раскрыть чувствительную информацию о внутренней архитектуре — настраивать пропагаторы так, чтобы не отправлять контекст внешним/public-facing endpoint'ам.
- **Baggage**: не класть чувствительные данные (учётные данные, API-ключи, PII) — baggage передаётся между сервисами и может логироваться или попадать в недоверенные downstream-сервисы.

### Ресурсы (Resources)

Resource — сущность, производящая телеметрию, описанная набором resource attributes. Пример: процесс в контейнере на Kubernetes имеет имя процесса, имя Pod'а, namespace, имя deployment'а.

- Resource привязывается к `TracerProvider`/`MeterProvider` при инициализации и **не может быть изменён позже**; все spans и metrics из провайдера несут этот resource.
- **`service.name`** — логическое имя сервиса; дефолт в SDK — `unknown_service`, рекомендуется задавать явно: в коде или через env `OTEL_SERVICE_NAME`.
- SDK сам добавляет атрибуты: `telemetry.sdk.name`, `telemetry.sdk.language`, `telemetry.sdk.version`.
- **Resource detectors** (в большинстве SDK): Operating System, Host, Process и Process Runtime, Container, Kubernetes, Cloud-Provider-specific и др. — автоматически определяют resource из окружения.
- Кастомные атрибуты: в коде или через env `OTEL_RESOURCE_ATTRIBUTES`. По семантическим конвенциям, например: `deployment.environment.name=production`.

```
env OTEL_RESOURCE_ATTRIBUTES=deployment.environment.name=production yourApp
```

### Семантические конвенции (Semantic Conventions)

Общие имена для разных видов операций и данных (атрибуты spans, метрик, ресурсов), чтобы телеметрия была единообразной между сервисами, библиотеками и бэкендами. Примеры из Go getting-started вывода: `http.request.method`, `http.response.status_code`, `http.response.body.size`, `url.path`, `url.scheme`, `server.address`, `server.port`, `network.peer.address`, `network.peer.port`, `network.protocol.version`, `user_agent.original`, `client.address`. Определяются в OTel Specification (раздел Data) как vendor-agnostic.

### Инструментирование (Instrumentation)

- **Инструментационные библиотеки** — генерируют телеметрию из популярных библиотек/фреймворков (например, входящие/исходящие HTTP-запросы из HTTP-библиотеки). Аспирационная цель проекта: все популярные библиотеки наблюдаемы «из коробки», без отдельных зависимостей.
- **Zero-code instrumentation** — инструментирование без изменения исходного кода (язык-специфичный механизм; добавляет API+SDK, инструментационные библиотеки и экспортёры).
- **Manual instrumentation** — ручная инструментация через API (создание spans, метрик, логов) для кода, не покрытого библиотеками.

### Сэмплинг (Sampling)

Ограничение объёма генерируемых трейсов. Терминология: **sampled** = обрабатывается и экспортируется; **not sampled** = не обрабатывается и не экспортируется.

Зачем: один из самых эффективных способов снизить стоимость наблюдаемости без потери видимости; основан на принципе **репрезентативности** (меньшая группа точно представляет большую; математически проверяемо). Чем больше данных генерируется, тем меньше нужен процент выборки — для high-volume систем обычна ставка **1% и ниже**.

**Когда сэмплировать:** ≥1000 трейсов/сек; большая часть трафика здоровая с малой вариацией; есть критерии (ошибки, высокая латентность, доменные признаки); есть способ роутить несэмплированные данные в дешёвое хранилище; возможность сэмплировать high/low-volume сервисы по-разному.

**Когда не сэмплировать:** очень мало данных (десятки маленьких трейсов/сек); данные нужны только в агрегатах; регуляторные ограничения на удаление данных (и нет дешёвого хранилища для несэмплированных).

**Head sampling** — решение принимается как можно раньше, без анализа трейса целиком. Наиболее распространённая форма: Consistent Probability Sampling (детерминированная, на основе trace ID и желаемого процента — например 5%). Плюсы: просто понять/настроить, эффективно, работает в любой точке пайплайна. Минус: невозможно решать по данным всего трейса (например, нельзя гарантированно сохранить все трейсы с ошибками).

**Tail sampling** — решение по всем/большинству спанов трейса. Примеры: всегда сэмплировать трейсы с ошибкой; по общей латентности; по наличию/значению атрибутов; разные ставки для разных сервисов. Для крупных систем почти всегда необходим. Минусы: сложно реализовать и эксплуатировать (stateful-компонент, хранит большие объёмы данных, может потребовать десятки/сотни нод), часто vendor-специфичен.

**Head + Tail** — комбинация: сначала head-сэмплинг защищает пайплайн от перегрузки, затем tail-сэмплинг принимает более точные решения перед экспортом.

**Поддержка в Collector:** Probabilistic Sampling Processor, Tail Sampling Processor. В SDK: у каждого языка свои head-samplers.

## Компоненты OpenTelemetry

- **Specification** — кросс-языковые требования для всех реализаций. Определяет: **API** (типы данных и операции для генерации/корреляции tracing, metrics, logs), **SDK** (требования к языковой реализации API: конфигурация, обработка данных, экспорт), **Data** (протокол OTLP и vendor-agnostic семантические конвенции).
- **Collector** — vendor-agnostic прокси: приём (OTLP, Jaeger, Prometheus, Fluent Bit, проприетарные форматы), обработка/фильтрация, экспорт в один или несколько бэкендов. Один бинарник, разворачивается как agent или collector, поддерживает traces+metrics+logs (цель — unification).
- **Языковые SDK** — API для генерации телеметрии + интеграция инструментационных библиотек.
- **Инструментационные библиотеки** — телеметрия из популярных библиотек/фреймворков.
- **Экспортёры** — отправка телеметрии в Collector или бэкенд. **OTLP-экспортёры** спроектированы под OTel data model и передают данные без потери информации; Prometheus, Jaeger и большинство вендоров поддерживают OTLP. Реестр экспортёров: opentelemetry.io/ecosystem/registry.
- **Zero-code instrumentation**, **Resource detectors** (из `OTEL_RESOURCE_ATTRIBUTES` и окружения: runtime, service, host, OS), **Cross-service propagators**, **Samplers** (head-samplers в каждом SDK).
- **Kubernetes Operator** — управляет Collector и auto-instrumentation рабочих нагрузок.
- **FaaS assets** — предсобранные Lambda-слои для auto-instrumentation и standalone Collector Lambda layer.

### Collector: цели и статус

Цели: *Usability* (разумный дефолтный конфиг, популярные протоколы из коробки), *Performance* (стабилен под нагрузкой), *Observability* (пример наблюдаемого сервиса), *Extensibility* (кастомизация без изменения ядра), *Unification* (один код, agent или collector, три сигнала).

**Статус:** mixed — у компонентов Collector разная степень стабильности (maturity задокументирована в `README.md` каждого компонента; полный список — в реестре компонентов). Стабильность каждого компонента — в его README.

## API / Интерфейс

### Порты и протоколы

| Порт | Протокол | Назначение |
|------|----------|-----------|
| `4317` | OTLP over gRPC | Дефолт для большинства SDK |
| `4318` | OTLP over HTTP | Для клиентов без gRPC |
| `55679` | ZPages | Встроенный debug-UI коллектора |

### Переменные окружения (SDK и экспортёры)

| Переменная | Назначение |
|-----------|-----------|
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Адрес OTLP-приёмника (пример: `http://collector.example.com:4318` или `https://jaeger.example.com:4317`) |
| `OTEL_SERVICE_NAME` | Явно задать `service.name` (иначе `unknown_service`) |
| `OTEL_RESOURCE_ATTRIBUTES` | Кастомные resource-атрибуты, например `service.name=dice,service.version=0.1.0` |
| `OTEL_TRACES_EXPORTER` | Выбор экспортёра трейсов (например, `otlp`) |
| `OTEL_METRICS_EXPORTER` | Выбор экспортёра метрик |
| `OTEL_LOGS_EXPORTER` | Выбор экспортёра логов |

> В Go пакет `autoexport` конфигурирует экспортёры через env-переменные (`OTEL_TRACES_EXPORTER`, `OTEL_METRICS_EXPORTER`, `OTEL_LOGS_EXPORTER`, `OTEL_EXPORTER_OTLP_ENDPOINT`) вместо хардкода в коде.

### Go SDK (ключевые API)

Модули: `go.opentelemetry.io/otel` (API), `go.opentelemetry.io/otel/exporters/...` (экспортёры), `go.opentelemetry.io/otel/sdk/trace|metric|log` (SDK), `go.opentelemetry.io/otel/propagation`, `go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp` (HTTP-инструментация), `go.opentelemetry.io/contrib/bridges/otelslog` (мост slog → OTel logs).

- `otel.Tracer(name)` / `otel.Meter(name)` — получить tracer/meter по имени инструментационного scope
- `tracer.Start(ctx, spanName)` → `(ctx, span)`; `defer span.End()`; `span.SetAttributes(...)`
- `meter.Int64Counter(name, metric.WithDescription(...), metric.WithUnit(...))` → счётчик; `cnt.Add(ctx, delta, metric.WithAttributes(...))`
- `otelhttp.NewHandler(mux, "/")` — обёртка HTTP-хендлера
- `propagation.NewCompositeTextMapPropagator(propagation.TraceContext{}, propagation.Baggage{})` + `otel.SetTextMapPropagator(prop)`
- `trace.NewTracerProvider(trace.WithBatcher(exporter, ...))` — дефолтный batch timeout 5s
- `metric.NewMeterProvider(metric.WithReader(metric.NewPeriodicReader(exporter, ...)))` — дефолтный интервал 1m
- `log.NewLoggerProvider(log.WithProcessor(log.NewBatchProcessor(exporter)))` — **логи в Go всё ещё experimental**
- `otelslog.NewLogger(name)` — логгер: `logger.InfoContext(ctx, msg, "key", value)`, `logger.ErrorContext(ctx, msg, "error", err)`

### Конфигурация Collector (YAML)

Структура: `receivers:` → `processors:` → `exporters:` → `connectors:` → `extensions:` и `service.pipelines:` (пайплайны вида `traces/dev`, `metrics/prod`, `logs/dev` со списками receivers/processors/exporters). Пример агентного конфига (trace + metrics + logs):

```yaml
receivers:
  otlp: # OTLP receiver, куда приложение шлёт телеметрию
    protocols:
      http:
        endpoint: 0.0.0.0:4318

exporters:
  otlp/jaeger: # Jaeger поддерживает OTLP напрямую
    endpoint: https://jaeger.example.com:4317
    sending_queue:
      batch:

service:
  pipelines:
    traces/dev:
      receivers: [otlp]
      exporters: [otlp/jaeger]
```

```yaml
receivers:
  otlp:
    protocols:
      http:
        endpoint: 0.0.0.0:4318

exporters:
  prometheusremotewrite: # PRW-экспортёр для метрик в бэкенд
    endpoint: https://prw.example.com/v1/api/remote_write
    sending_queue:
      batch:

service:
  pipelines:
    metrics/prod:
      receivers: [otlp]
      exporters: [prometheusremotewrite]
```

```yaml
receivers:
  otlp:
    protocols:
      http:
        endpoint: 0.0.0.0:4318

exporters:
  file: # File Exporter — логи в локальный файл
    path: ./app42_example.log
    rotation:

service:
  pipelines:
    logs/dev:
      receivers: [otlp]
      exporters: [file]
```

## Паттерны деплоя инфраструктуры

### Agent (агент рядом с приложением)

Сигналы от SDK/нижестоящих Collector'ов → Collector, работающий **рядом с приложением или на том же хосте** (sidecar или DaemonSet). SDK конфигурируется на адрес Collector'а (`OTEL_EXPORTER_OTLP_ENDPOINT`), Collector экспортирует в бэкенды.

- **Плюсы:** просто начать; чёткое соответствие «приложение ↔ Collector» (1:1).
- **Минусы:** ограниченная масштабируемость; негибко для сложных/эволюционирующих деплоев.

### Gateway (единый шлюз)

Приложения/Collector'ы шлют сигналы на **единый OTLP endpoint** — один или несколько Collector'ов как standalone-сервис (обычно endpoint на кластер/дата-центр/регион). Балансировка — out-of-the-box load balancer (например, NGINX) или **load-balancing exporter**.

**Load-balancing exporter** — два ключевых поля:
- `resolver`: `static` (ручное перечисление URL) или `dns` (периодическое разрешение IP по hostname)
- `routing_key`: `traceID` (спаны по trace ID) или `service` (по имени сервиса — полезно с span metrics connector, т.к. все спаны сервиса попадают в один Collector и агрегации точны)

Пример первого яруса с DNS-резолвером:

```yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317

exporters:
  loadbalancing:
    protocol:
      otlp:
        tls:
          insecure: true
    resolver:
      dns:
        hostname: collectors.example.com

service:
  pipelines:
    traces:
      receivers: [otlp]
      exporters: [loadbalancing]
```

Вариант со static-резолвером: `resolver.static.hostnames: [collector-1.example.com:4317, ...]`. Вариант с `routing_key: service` + DNS и явным портом: `resolver.dns.port: 5317`.

**Двухъярусная схема (two-tiered)** — когда телеметрия должна обрабатываться в конкретном Collector'е: первый ярус с load-balancing exporter'ом (trace ID/service-name-aware), второй ярус — Collector'ы с tail sampling processor'ом, чтобы все спаны трейса попадали в одну ноду, где применяется политика сэмплирования.

**NGINX как балансировщик** (4317 gRPC + 4318 HTTP, upstream из трёх коллекторов):

```nginx
server {
    listen 4317 http2;
    server_name _;

    location / {
            grpc_pass      grpc://collector4317;
            grpc_next_upstream     error timeout invalid_header http_500;
            grpc_connect_timeout   2;
            grpc_set_header        Host            $host;
            grpc_set_header        X-Real-IP       $remote_addr;
            grpc_set_header        X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

server {
    listen 4318;
    server_name _;

    location / {
            proxy_pass      http://collector4318;
            proxy_redirect  off;
            proxy_next_upstream     error timeout invalid_header http_500;
            proxy_connect_timeout   2;
            proxy_set_header        Host            $host;
            proxy_set_header        X-Real-IP       $remote_addr;
            proxy_set_header        X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

upstream collector4317 {
    server collector1:4317;
    server collector2:4317;
    server collector3:4317;
}

upstream collector4318 {
    server collector1:4318;
    server collector2:4318;
    server collector3:4318;
}
```

**Метрики самого load-balancing exporter'а** для мониторинга: `otelcol_loadbalancer_num_backends`, `otelcol_loadbalancer_backend_latency`.

- **Плюсы:** разделение ответственности (централизованные credentials); централизованное управление политиками (фильтрация логов, сэмплинг).
- **Минусы:** ещё один компонент для поддержки; добавленная латентность при каскаде коллекторов; больший расход ресурсов.

### Принцип единого писателя (single-writer principle)

Все metric data streams внутри OTLP должны иметь **единственного писателя**. При деплое нескольких Collector'ов в gateway-режиме каждый metric stream обязан иметь single writer и глобально уникальный identity. Иначе: конкурентная запись одних и тех же данных → потеря данных/деградация качества (разные источники перезаписывают друг друга; серия с необъяснимыми пропусками/скачками). Признак в Prometheus-бэкенде:

```
Error on ingesting out-of-order samples
```

Best practices для gateway: **k8sattributes processor** (добавляет лейблы Kubernetes-ресурсов), **resourcedetection processor** (определяет resource из хоста).

### Quick start (Docker)

```
docker pull otel/opentelemetry-collector:0.159.0
```

```
docker run \
  -p 127.0.0.1:4317:4317 \
  -p 127.0.0.1:4318:4318 \
  -p 127.0.0.1:55679:55679 \
  otel/opentelemetry-collector:0.159.0
```

Генерация тестовых трейсов: `telemetrygen traces --otlp-insecure --traces 3` (устанавливается `go install github.com/open-telemetry/opentelemetry-collector-contrib/cmd/telemetrygen@latest`).

## Usage Patterns

### Go: инициализация SDK (bootstrap-паттерн)

Канонический паттерн `setupOTelSDK` — инициализация propagator'а, tracer/meter/logger provider'ов с корректным shutdown (cleanup-функции собираются в срез и вызываются в обратном порядке через `errors.Join`):

```go
// setupOTelSDK bootstraps the OpenTelemetry pipeline.
// If it does not return an error, make sure to call shutdown for proper cleanup.
func setupOTelSDK(ctx context.Context) (func(context.Context) error, error) {
	var shutdownFuncs []func(context.Context) error
	var err error

	// shutdown calls cleanup functions registered via shutdownFuncs.
	// The errors from the calls are joined.
	// Each registered cleanup will be invoked once.
	shutdown := func(ctx context.Context) error {
		var err error
		for _, fn := range shutdownFuncs {
			err = errors.Join(err, fn(ctx))
		}
		shutdownFuncs = nil
		return err
	}

	// handleErr calls shutdown for cleanup and makes sure that all errors are returned.
	handleErr := func(inErr error) {
		err = errors.Join(inErr, shutdown(ctx))
	}

	// Set up propagator.
	prop := newPropagator()
	otel.SetTextMapPropagator(prop)

	// Set up trace provider.
	tracerProvider, err := newTracerProvider()
	if err != nil {
		handleErr(err)
		return shutdown, err
	}
	shutdownFuncs = append(shutdownFuncs, tracerProvider.Shutdown)
	otel.SetTracerProvider(tracerProvider)

	// Set up meter provider.
	meterProvider, err := newMeterProvider()
	if err != nil {
		handleErr(err)
		return shutdown, err
	}
	shutdownFuncs = append(shutdownFuncs, meterProvider.Shutdown)
	otel.SetMeterProvider(meterProvider)

	// Set up logger provider.
	loggerProvider, err := newLoggerProvider()
	if err != nil {
		handleErr(err)
		return shutdown, err
	}
	shutdownFuncs = append(shutdownFuncs, loggerProvider.Shutdown)
	global.SetLoggerProvider(loggerProvider)

	return shutdown, err
}

func newPropagator() propagation.TextMapPropagator {
	return propagation.NewCompositeTextMapPropagator(
		propagation.TraceContext{},
		propagation.Baggage{},
	)
}

func newTracerProvider() (*trace.TracerProvider, error) {
	traceExporter, err := stdouttrace.New(stdouttrace.WithPrettyPrint())
	if err != nil {
		return nil, err
	}

	tracerProvider := trace.NewTracerProvider(
		trace.WithBatcher(traceExporter,
			// Default is 5s. Set to 1s for demonstrative purposes.
			trace.WithBatchTimeout(time.Second)),
	)
	return tracerProvider, nil
}

func newMeterProvider() (*metric.MeterProvider, error) {
	metricExporter, err := stdoutmetric.New(stdoutmetric.WithPrettyPrint())
	if err != nil {
		return nil, err
	}

	meterProvider := metric.NewMeterProvider(
		metric.WithReader(metric.NewPeriodicReader(metricExporter,
			// Default is 1m. Set to 3s for demonstrative purposes.
			metric.WithInterval(3*time.Second))),
	)
	return meterProvider, nil
}

func newLoggerProvider() (*log.LoggerProvider, error) {
	logExporter, err := stdoutlog.New(stdoutlog.WithPrettyPrint())
	if err != nil {
		return nil, err
	}

	loggerProvider := log.NewLoggerProvider(
		log.WithProcessor(log.NewBatchProcessor(logExporter)),
	)
	return loggerProvider, nil
}
```

Дефолты (из доков): batch timeout батчера трейсов — **5s**; интервал периодического reader'а метрик — **1m**. Для продакшна вместо stdout-экспортёров — OTLP-экспортёр и/или `autoexport` (env-конфигурация). В `main` shutdown вызывается через `defer errors.Join(err, otelShutdown(...))`.

### Go: инструментирование HTTP-сервера

```go
// Add HTTP instrumentation for the whole server.
handler := otelhttp.NewHandler(mux, "/")
```

### Go: кастомная инструментация (traces + metrics + logs)

```go
const name = "go.opentelemetry.io/contrib/examples/dice"

var (
	tracer  = otel.Tracer(name)
	meter   = otel.Meter(name)
	logger  = otelslog.NewLogger(name)
	rollCnt metric.Int64Counter
)

func init() {
	var err error
	rollCnt, err = meter.Int64Counter("dice.rolls",
		metric.WithDescription("The number of rolls by roll value"),
		metric.WithUnit("{roll}"))
	if err != nil {
		panic(err)
	}
}
```

Внутри обработчика: создать span (`tracer.Start(r.Context(), "roll")` + `defer span.End()`), писать структурированные логи через `logger.InfoContext(ctx, msg, "result", roll)`, выставлять атрибуты спана (`span.SetAttributes(attribute.Int("roll.value", roll))`), инкрементить счётчик (`rollCnt.Add(ctx, 1, metric.WithAttributes(rollValueAttr))`).

Запуск с ресурсами:

```
export OTEL_RESOURCE_ATTRIBUTES="service.name=dice,service.version=0.1.0"
go run .
```

## Configuration (сводка)

| Параметр | Дефолт | Где задаётся |
|----------|--------|-------------|
| OTLP endpoint | `localhost:4317` (дефолт SDK) | `OTEL_EXPORTER_OTLP_ENDPOINT` / код |
| `service.name` | `unknown_service` | `OTEL_SERVICE_NAME` / код / resource detector |
| Batch timeout (traces) | 5s | `trace.WithBatcher(..., trace.WithBatchTimeout(...))` |
| Metric reader interval | 1m | `metric.WithReader(metric.NewPeriodicReader(..., metric.WithInterval(...)))` |
| Пропагатор | W3C TraceContext | `propagation.TraceContext{}` (+ `Baggage{}`) |
| Сэмплинг (Collector) | — | Probabilistic Sampling Processor / Tail Sampling Processor |
| Ports Collector | 4317 gRPC / 4318 HTTP / 55679 ZPages | docker run / конфиг receivers |

## Best Practices

1. **Всегда используйте Collector в продакшене** — приложение быстро отдаёт данные локальному Collector'у, тот берёт на себя retries, batching, шифрование и фильтрацию чувствительных данных. Прямая отправка в бэкенд — только для ознакомления/малого окружения.
2. **Задавайте `service.name` явно** (`OTEL_SERVICE_NAME` или код) — иначе в бэкенде будут ресурсы `unknown_service`, неразличимые между собой. Добавляйте `service.version` и `deployment.environment.name`.
3. **Используйте OTLP-экспортёры** — они спроектированы под OTel data model, передают данные без потери информации, и поддерживаются большинством бэкендов.
4. **Используйте resource detectors** (Kubernetes, host, container) — телеметрия становится привязываемой к конкретному поду/контейнеру/деплою для расследования инцидентов.
5. **Соблюдайте single-writer principle** для metric streams при нескольких Collector'ах в gateway-режиме — иначе out-of-order samples и потеря данных.
6. **Сэмплируйте при объёме ≥1000 трейсов/сек**: head-сэмплинг для защиты пайплайна, tail-сэмплинг для гарантии сохранения трейсов с ошибками/высокой латентностью; несэмплированные данные можно роутить в дешёвое хранилище.
7. **Защищайте периметр контекста**: санитизируйте входящие trace-заголовки от внешних сервисов; не шлите внутренний контекст наружу; не кладите секреты и PII в baggage.
8. **В gateway-деплое** используйте load-balancing exporter с `routing_key: service` при span-metrics, k8sattributes/resourcedetection процессоры; мониторьте сам коллектор (`otelcol_loadbalancer_num_backends`, `otelcol_loadbalancer_backend_latency`).
9. **В Go**: вызывайте shutdown-функцию провайдеров (паттерн `setupOTelSDK`) — иначе телеметрия теряется при завершении; используйте `errors.Join` для объединения ошибок очистки.

## Common Pitfalls

- **Не задан `service.name`** → все сервисы видны как `unknown_service`; телеметрия неразличима. Решение: `OTEL_SERVICE_NAME` или resource attribute.
- **Прямой экспорт в бэкенд в продакшене** → приложение блокируется на сетевых сбоях бэкенда, нет retries/batching/фильтрации. Решение: Collector рядом с сервисом.
- **Нарушение single-writer principle** → метрики с одинаковым identity пишутся из нескольких мест: серии с пропусками/скачками, `Error on ingesting out-of-order samples` в Prometheus.
- **Доверие входящим trace-заголовкам** → подделка trace ID/span ID, манипуляция данными трассировки. Решение: санитизация контекста от недоверенных источников.
- **Секреты/PII в baggage** → данные утекают в логи и недоверенные downstream-сервисы (baggage передаётся между сервисами).
- **Head-сэмплинг как единственная стратегия** → трейсы с ошибками могут быть не сэмплированы; для гарантии нужен tail-сэмплинг (в Collector — tail sampling processor).
- **Забыт shutdown SDK** → буферизованные спаны/метрики/логи не экспортируются при graceful shutdown приложения.
- **Полагаться на «стабильность» всех компонентов Collector** — статус mixed: проверяйте maturity конкретного компонента в его README.

## Version Notes

- **Collector**: дистрибутив `otel/opentelemetry-collector` v0.159.0 (2026-08); статус Collector — mixed (стабильность компонентов разная). Контриб-дистрибутив (`opentelemetry-collector-contrib`) содержит расширенный набор компонентов (tail sampling, k8sattributes, resourcedetection, prometheusremotewrite, file и др.).
- **Go SDK**: примеры в getting-started на `go.opentelemetry.io/otel` v1.39.0, `otelhttp` v0.64.0 (contrib); требуется **Go 1.23+**.
- **Logs signal в Go**: experimental — возможны breaking changes в будущих версиях.
- **Go**: пакет `autoexport` ещё не стабилен (замечание в доках 2026-05).
- В разработке/предложении: Events (тип логов), Profiles (профилирование на уровне кода).
