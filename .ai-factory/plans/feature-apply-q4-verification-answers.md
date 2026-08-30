# План: Применение ответов верификации Q4.x к артефактам GraphRAG

**Ветка:** `feature/apply-q4-verification-answers`
**Дата:** 2026-08-30
**Источник:** ответы стейкхолдера на `specs/open-questions.md` (вопросы Q4.1–Q4.8, Q4.10–Q4.12, 2026-08-30); контекст — `.ai-factory/RESEARCH.md` (Active Summary, обновлён 2026-08-30)

## Settings

- **Testing:** yes (гейты согласованности: G1-LINK — битые ссылки ADR/NFR; G2-CONSIST — единая формулировка масштаба и статусов; G2-QMATRIX — матрица качества; сверка статусов NFR/BR)
- **Logging:** minimal (документная работа, кода нет)
- **Docs:** yes (план сам является документацией; изменения — только в `specs/`, `.ai-factory/`)

## Research Context

Source: `.ai-factory/RESEARCH.md` (Active Summary, 2026-08-30 16:01)

- Ответы стейкхолдера на 11 вопросов верификации (Q4.1–Q4.8, Q4.10–Q4.12) получены и зафиксированы в Active Summary.
- Закрыты зависимости: целевое железо — NVIDIA H200 (141 ГБ), модели 70B open-weight (Q4/FP8); Go-only (Rust исключён); масштаб — до ~10k («больше вряд ли будет»); правило «метрология определена → `approved`».
- Устранение V1–V6, V8–V12 — условие перехода матрицы качества к 🟢 (после замера Фаза 1.5).

## Допущения (подтверждённые ответы стейкхолдера 2026-08-30)

1. **Масштаб корпуса:** «до ~10k — больше вряд ли будет» → каноническая формулировка «тысячи артефактов, целевой максимум ~10k»; упоминания «100k Фаза 2/3» как плана — удаляются, как страховочные критерии пересмотра («100k+») — сохраняются.
2. **Железо/модель:** NVIDIA H200 (141 ГБ), 70B open-weight (Q4/FP8) — база для целевых значений `query-responsiveness` и пилота `index-freshness`.
3. **Стек:** Rust исключён полностью; Go-only (+ TypeScript-фронтенд) — единый канон.
4. **Правило статусов:** «если метрология определена — переводим в `approved`» — применяется к NFR и BR.
5. **Аудит-след (`agent-audit`):** 10 обязательных полей; срок хранения — **1 неделя** (решение стейкхолдера; риск-флаг «короче окна обнаружения инцидентов» фиксируется в NFR).
6. **`index-freshness`:** цели 5/15 мин подтверждаются пилотным замером Фаза 1.5; статус `approved` с пометкой о пилоте.
7. **SSO в e2e-gui-testing:** вариант (а) — отдельный раздел «Авторизация (SSO)».
8. **a11y:** расширить `@accessibility` + минимум один a11y-сценарий на каждую P0-US (кроме эталонной `US-answers`).

---

## Фаза 1: NFR — целевые значения и метрология (V1, V2, V9, V10)

### Задача 1.1 — `query-responsiveness` (P0): числовые цели отзывчивости
- [x] Выполнено
- Файл: `specs/nonfun-req/REQ-NFR-api.performance.query-responsiveness.md`
- В критерии приёмки заменить `TBD` на: **p50 ≤ 5 с, p90 ≤ 10 с** (E2E, интерактивные запросы с grounding); порог деградации при фоновой переиндексации — **p50 ≤ ×1.5 от простоя**, абсолютный потолок p90 ≤ 10 с.
- Добавить обоснование достижимости: H200 (4.8 ТБ/с), 70B Q4 — prefill ~2–4k ток/с, decode ~60–120 ток/с; типовой запрос (2k контекст, 300 токенов ответа) ≈ 3.5–5 с, тяжёлый (8k/500) ≈ 7–9 с.
- Статус: `proposed` → `approved` (дата 2026-08-30).

### Задача 1.2 — `token-minimization` (P1): цели контекста и полноты
- [x] Выполнено
- Файл: `specs/nonfun-req/REQ-NFR-api.performance.token-minimization.md`
- Заменить TBD на: размер контекста — **медиана ≤ 4 000 токенов, p90 ≤ 8 000** (эталонный набор); полнота (доля необходимых артефактов в контексте) — **≥ 90%**; LLM-вызовов на запрос — **≤ 2** (абсолютный лимит ≤ 3; retrieval без LLM — PPR).
- Статус: → `approved`.

### Задача 1.3 — `ontology-model` (P1): цели онтологического слоя
- [x] Выполнено
- Файл: `specs/nonfun-req/REQ-NFR-data.maintainability.ontology-model.md`
- Заменить TBD на: термины ответов эталонного набора соответствуют глоссарию/онтологии — **100%**; снижение числа терминологических противоречий в графе — **≥ 50% от исходного замера** (Фаза 1.5) к концу Фазы 2.
- Статус: → `approved`.

### Задача 1.4 — `adoption-principles` (P2): цели внедрения
- [x] Выполнено
- Файл: `specs/nonfun-req/REQ-NFR-process.maintainability.adoption-principles.md`
- Заменить TBD на: **100% метрик успеха G1–G7** имеют утверждённые целевые значения к гейту «вывод в эксплуатацию»; гейты фаз проходятся только по измеренным значениям; периодичность замера — ежеквартально.
- Статус: → `approved`.

### Задача 1.5 — `agent-audit` (V9): состав полного аудит-следа и срок хранения
- [x] Выполнено
- Файл: `specs/nonfun-req/REQ-NFR-api.observability.agent-audit.md`
- В критерии приёмки раскрыть «полный аудит-след»: 10 обязательных полей — `timestamp` (ISO 8601 UTC), `agent_id`/`token_id`, `session_id`/`task_id`, `step_type`, `input_artifact_refs` (ID+version), `output_artifact_refs`, `llm_call` (модель, контур, токены, hash промпта/ответа), `result_status`, `human_approver`, `immutability` (append-only + hash-цепочка).
- Срок хранения журнала: **1 неделя** (решение стейкхолдера 2026-08-30) + риск-флаг: «короче типичного окна обнаружения инцидентов; при ужесточении корпоративной политики — пересмотр».
- Статус: → `approved`.

### Задача 1.6 — `index-freshness` (V10): пометка о пилотном подтверждении
- [x] Выполнено
- Файл: `specs/nonfun-req/REQ-NFR-data.performance.index-freshness.md`
- К существующим целям (медиана ≤ 5 мин, p90 ≤ 15 мин) добавить: «цели подтверждаются пилотным замером Фаза 1.5 (план пилота: корпус ~1k артефактов из реальных MR, 10–20 событий с 1–50 изменёнными документами, замер „событие → публикация“; критерий — медиана ≤ 5 мин, p90 ≤ 15 мин)».
- Уточнить обоснование: референс 281 мин/1М токенов CPU относится к полной перестройке (фоновая, вне горячего пути), к инкрементальному обновлению неприменим.
- Статус: → `approved` с пометкой о пилоте.

## Фаза 2: Статусы NFR и BR (V3)

### Задача 2.1 — Статусы: 7 NFR → `approved`; 6 BR → `approved`; 1 BR → `deleted`
- [x] Выполнено
- Файлы NFR (7): `REQ-NFR-api.compliance.rag-accuracy`, `REQ-NFR-security.compliance.llm-contour`, `REQ-NFR-data.maintainability.versioned-provenance`, `REQ-NFR-process.compliance.human-confirmation`, `REQ-NFR-api.availability.downtime-budget`, `REQ-NFR-api.observability.golden-signals`, `REQ-NFR-api.performance.agent-traffic-isolation` — поле «Статус»: `proposed` → `approved` (метрология определена: метрики и цели на месте).
- Файлы BR (6 действующих): `BR-constraint.web-app-browser-chat`, `BR-constraint.backend-cli-queries`, `BR-constraint.sso-readonly-access`, `BR-constraint.opensource-only`, `BR-fact.gitlab-authoritative`, `BR-constraint.source-load-minimal` — статус → `approved`, дата 2026-08-30.
- `BR-constraint.no-user-auth-in-mvp` — статус → `deleted` (файл сохраняется исторически, пометка «ЗАМЕНЕНО» уже есть в README).
- Проверка: grep «Статус» по `specs/nonfun-req/*.md` и `specs/business-rules/*.md` — не должно остаться `proposed`.

## Фаза 3: Синхронизация ADR (V5, V6)

### Задача 3.1 — Масштаб корпуса в 5 ADR: убрать «открытый вопрос 1k vs 100k»
- [x] Выполнено
- `specs/adr/README.md:5` — «масштаб корпуса (открытый вопрос 1k vs 100k; …)» из списка «подлежат фиксации» → «масштаб корпуса — до ~10k (решение 2026-08-30)» (закрытый, не «подлежит фиксации»).
- `specs/adr/ADR-DES.API.hybrid-graphrag-composition.md:84` — «Масштаб корпуса (1k vs 100k документов) — открытый вопрос RESEARCH.md.» → «Масштаб корпуса — до ~10k (решение стейкхолдера 2026-08-30; RESEARCH.md синхронизирован).»
- `specs/adr/ADR-IMPL.INTEGRATION.s3-document-store.md:22` — «проектный корпус остаётся предметом открытого вопроса масштаба (1k vs 100k)» → «проектный корпус — до ~10k (решение 2026-08-30)».
- `specs/adr/ADR-IMPL.DATA.graph-storage.md:16` — «Масштаб. MVP — до 10k документов, Фаза 2/3 — 100k (открытый вопрос RESEARCH.md)» → «Масштаб. Целевой корпус — до ~10k документов (решение 2026-08-30; 100k не планируется)». Вторичные упоминания «100k Фаза 2/3» (п. 21) согласовать; критерии пересмотра «100k+» оставить.
- `specs/adr/ADR-IMPL.STACK.go-single-language-adoption.md:15` — «масштаб корпуса — открытый вопрос (1k vs 100k документов)» → «масштаб корпуса — до ~10k (решение 2026-08-30)»; п. 21 «100k — Фаза 2/3» → «до ~10k (100k не планируется)».
- `specs/adr/ADR-IMPL.DATA.graph-storage.md:5` — строка «Требование-источник»: «масштаб корпуса 1k vs 100k» → «масштаб корпуса (до ~10k)».
- Проверка: grep «1k vs 100k|открытый вопрос.*масштаб|масштаб корпуса (1k» по `specs/adr/` — 0 совпадений.

### Задача 3.2 — Битая ссылка на ADR в 2 файлах
- [x] Выполнено
- `specs/adr/ADR-DES.API.hybrid-graphrag-composition.md:83` и `specs/adr/ADR-IMPL.INTEGRATION.s3-document-store.md:65`: «кандидат `ADR-IMPL.DATA.incremental-update-model`» → «принято, [ADR-IMPL.DATA.incremental-update-snapshot-publish](ADR-IMPL.DATA.incremental-update-snapshot-publish.md)» (убрать «кандидат», заменить ID).
- Проверка: grep «incremental-update-model» по всему `specs/` — 0 совпадений (кроме исторических упоминаний при необходимости).

## Фаза 4: Синхронизация `.ai-factory` (V4)

### Задача 4.1 — PLAN.md: Go-only, масштаб, железо
- [x] Выполнено
- Файл: `.ai-factory/PLAN.md`
- L27 «CPU-heavy части: Rust только при необходимости» → «CPU-компоненты — на Go, при необходимости через CGo к зрелым C-библиотекам (Rust исключён, решение 2026-08-30)».
- L33 «Масштаб корпуса: 1k или 100k документов?» → закрыт: «до ~10k (решение 2026-08-30)».
- L34 «Какая GPU/модель будет целевой для MVP?» → закрыт: «NVIDIA H200 (141 ГБ), 70B open-weight (Q4/FP8)».
- L35 «Какие MVP-волны нужны?» — остаётся открытым (пометить «открыт»).

### Задача 4.2 — RESEARCH.md: верификация синхронности
- [x] Выполнено
- Файл: `.ai-factory/RESEARCH.md` — Active Summary уже обновлён (2026-08-30 16:01) в explore-режиме: Go-only, H200/70B, масштаб до ~10k, ответы Q4.x, правило статусов.
- Проверить: нет ли расхождений после применения задач 1.x–6.x; при необходимости синхронизировать формулировки (масштаб, статусы, аудит-след).
- Итог задачи — grep-сверка ключевых решений Q4.x присутствуют в Active Summary.

## Фаза 5: QA и US (V8, V12)

### Задача 5.1 — e2e-gui-testing: отдельный раздел «Авторизация (SSO)»
- [x] Выполнено
- Файл: `specs/qa/e2e-gui-testing.md` §11
- Вынести SSO-сценарии из §11.3 «Аудит контура LLM» (L484: доступ только авторизованным, SSO Keycloak, OIDC-токен; negative cases «неавторизованная попытка, невалидный/истёкший токен SSO» из L489) в новый раздел **«11.3. Авторизация (SSO)»** (`BR-constraint.sso-readonly-access`, `ADR-DES.SECURITY.sso-keycloak`).
- Перенумеровать: «Аудит контура LLM» → §11.4, «Доступность (a11y)» → §11.5.
- Проверить перекрёстные ссылки на §11.x по всему файлу и в других QA-документах; обновить при необходимости.

### Задача 5.2 — a11y-сценарии в 3 P0-US
- [x] Выполнено
- Файлы: `specs/user-stories/US-knowledge.sync.gitlab-index.md`, `specs/user-stories/US-context.impact.analyze.md`, `specs/user-stories/US-mcp.compile.context.md`
- Паттерн эталонной `US-answers.grounding.cited-answer` (L6, L35–39): добавить тег `@accessibility` в строку Feature + один сценарий «Доступность … для screen reader (a11y)»: screen reader (NVDA/VoiceOver) объявляет ключевые элементы, текстовые альтернативы (WCAG 2.1 AA), keyboard-only навигация.
- Статус US: без изменений (US не имеют поля статуса).

## Фаза 6: Закрытие open-questions.md и финальные гейты (V1–V12)

### Задача 6.1 — open-questions.md: закрыть Q4.x, обновить матрицу и перечень
- [x] Выполнено
- Файл: `specs/open-questions.md`
- L3 (перечень артефактов анализа): добавить `.ai-factory/ARCHITECTURE.md` с пометкой «производный обзор для ИИ-агентов, **не источник истины**» (V11).
- Секция «Открытые вопросы: верификация и синхронизация»: Q4.1–Q4.8, Q4.10–Q4.12 → отметить как **отвеченные 2026-08-30** (закрыть, сохранив трассировку V-номеров и ссылки на фиксацию в артефактах; сами тексты вопросов можно удалить по аналогии с Блоками 1–3, зафиксировав ответы).
- Обновить «Сводную матрицу программирования качества», «Сводку дефектов», «Верификацию зафиксированных ответов», «Итоговый вердикт»: V1–V12 устранены; 13 NFR → `approved` (все с метрологией; `index-freshness` — с пилотом Фаза 1.5); 6 BR → `approved`, 1 → `deleted`; остаточные TBD — только подтверждение целей замером Фаза 1.5.

### Задача 6.2 — Финальные гейты согласованности
- [x] Выполнено
- G1-LINK: grep битых ссылок — «incremental-update-model» (0), ссылки на ADR-файлы существуют, ссылки `specs/...` резолвятся.
- G2-CONSIST: grep «1k vs 100k|открытый вопрос.*масштаб» по `specs/` и `.ai-factory/` — 0; статусы NFR/BR — ни одного `proposed` среди действующих; формулировка масштаба едина («до ~10k»).
- G2-QMATRIX: матрица качества — 🟡 по всем 20 ячейкам с остаточными TBD «замер Фаза 1.5», заявлений «🟠 = 0» без оснований нет.
- RESEARCH.md: финальная сверка с применёнными решениями.

---

## Commit Plan

| № | Коммит | Задачи |
|---|---|---|
| 1 | `docs(nfr): set P0/P1/P2 targets for NFR stubs and audit trail` | 1.1, 1.2, 1.3, 1.4 |
| 2 | `docs(nfr): define audit-trail fields, retention and freshness pilot` | 1.5, 1.6 |
| 3 | `docs(nfr,br): approve NFR and BR statuses` | 2.1 |
| 4 | `docs(adr): sync corpus scale decision and fix broken ADR links` | 3.1, 3.2 |
| 5 | `docs(specs): sync PLAN.md, split SSO section, extend a11y scenarios` | 4.1, 4.2, 5.1, 5.2 |
| 6 | `docs(open-questions): close Q4.x answers and run consistency gates` | 6.1, 6.2 |

---

## Критерии завершения

- 4 NFR-заглушки имеют числовые целевые значения (Q4.1/Q4.2): `query-responsiveness` p50 ≤ 5 с / p90 ≤ 10 с; `token-minimization` 4k/8k токенов + полнота ≥ 90%; `ontology-model` 100% / ≥ 50%; `adoption-principles` 100% метрик к гейту.
- 13 NFR → `approved` (Q4.3; `index-freshness` — с пометкой о пилоте); 6 BR → `approved`, `no-user-auth-in-mvp` → `deleted`.
- `agent-audit` содержит 10 обязательных полей и срок хранения 1 неделя (Q4.7); `index-freshness` — план пилота Фаза 1.5 (Q4.8).
- PLAN.md без Rust, с закрытыми масштабом и железом (Q4.4); RESEARCH.md синхронизирован.
- 5 ADR без «открытого вопроса 1k vs 100k» (Q4.5); 2 битые ссылки исправлены (Q4.6).
- e2e-gui-testing: SSO — отдельный раздел «Авторизация (SSO)» (Q4.10); `@accessibility` + a11y-сценарий в 3 P0-US (Q4.12).
- open-questions.md: ARCHITECTURE.md в перечне артефактов (Q4.11); Q4.x закрыты с трассировкой; матрица и вердикт обновлены.
- Гейты G1-LINK, G2-CONSIST, G2-QMATRIX пройдены; grep-проверки чистые.
