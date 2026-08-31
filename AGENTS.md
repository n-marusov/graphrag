# AGENTS.md

> Карта проекта для ИИ-агентов. Обновляйте при значительном изменении структуры проекта; секцию «Документация» поддерживает `/aif-docs`.

## Обзор проекта

**GraphRAG** — корпоративная система знаний на базе ontology-grounded GraphRAG: evidence-based context layer / context compiler для ИИ-агентов автоматизации разработки (AI Factory, Hand-off). Продукт отвечает, а не выдаёт документы: каждый ответ проверяем — со ссылками на артефакты и происхождением (grounding, provenance). Проект находится на этапе видения (Фаза 0): кодовой базы ещё нет, спецификации — источник правды.

## Технологический стек

- **Язык программирования:** Go (серверная кодовая база), TypeScript (фронтенд)
- **Фреймворк:** Vue 3 + Vite (тонкий SPA, вне серверной кодовой базы; стилизация — Tailwind CSS v4, `ADR-DES.UI.tailwind-css-adoption`)
- **База данных:** Neo4j Community Edition (self-hosted) — граф + векторный индекс (HNSW) + чанки + версионные снапшоты
- **Хранилище источников:** GitLab (спеки/код/онтология), внешнее S3 (книги/легаси)
- **CI:** GitLab CI (гейт валидации mermaid-диаграмм)
- **Инструменты:** Node.js (валидация mermaid: `mermaid`, `jsdom`)

## Структура проекта

```
graphrag/
├── .agents/skills/       # Агентские скиллы AI Factory (команды /aif-*)
├── .ai-factory/          # Контекст AI Factory: ARCHITECTURE.md, RULES.md, PLAN.md, RESEARCH.md, plans/, references/, patches/
├── specs/                # Спецификации — источник правды (spec-driven development)
│   ├── vision.md         #   Канон функций F1–F4, scope MVP, roadmap
│   ├── glossary.md       #   Единый язык предметной области
│   ├── open-questions.md #   Реестр открытых вопросов
│   ├── adr/              #   Архитектурные решения (13 принятых ADR)
│   ├── c4/               #   C4-диаграммы (уровни 1–2)
│   ├── domain/           #   Модель предметной области
│   ├── use-cases/        #   Варианты использования
│   ├── user-stories/     #   Пользовательские истории
│   ├── business-rules/   #   Бизнес-правила
│   ├── nonfun-req/       #   Нефункциональные требования
│   └── qa/               #   QA-гейты и контрольные списки
├── src/                  # Продуктивная кодовая база: Go-сервер (план) + фронтенд (Vue 3 SPA, реализован)
│   └── frontend/         #   Тонкий SPA-клиент (F1): слои domain/application/adapters/ui/app
├── tools/                # Инструменты разработки (validate-mermaid.js)
├── .ai-factory.json      # Конфигурация AI Factory (скиллы, MCP)
├── .gitlab-ci.yml        # Пайплайн CI (валидация mermaid, гейт G1-C4)
├── package.json          # npm-скрипты (validate:mermaid)
└── LICENSE               # Лицензия
```

## Ключевые точки входа

| Файл | Назначение |
|---|---|
| `specs/vision.md` | Канон продукта: функции F1–F4, scope MVP, roadmap |
| `specs/glossary.md` | Единый язык предметной области |
| `specs/adr/README.md` | Реестр принятых архитектурных решений |
| `specs/c4/README.md` | C4-модель системы (уровни 1–2) |
| `.ai-factory/ARCHITECTURE.md` | Архитектура проекта (целевое состояние) |
| `.ai-factory/RULES.md` | Правила и конвенции проекта |
| `package.json` | npm-скрипты и devDependencies (валидация mermaid) |
| `tools/validate-mermaid.js` | Валидатор mermaid-диаграмм |
| `.gitlab-ci.yml` | Пайплайн CI (гейт G1-C4) |

## Документация

| Документ | Путь | Описание |
|---|---|---|
| README (каталог `src`) | `src/README.md` | Назначение кодовой базы, правила для ИИ-агентов |
| Видение | `specs/vision.md` | Концепция, функции F1–F4, MVP и roadmap |
| Глоссарий | `specs/glossary.md` | Единый язык предметной области |
| Реестр ADR | `specs/adr/README.md` | Принятые архитектурные решения |
| C4-модель | `specs/c4/README.md` | C4-диаграммы системы |

> Корневой `README.md` отсутствует — будет создан `/aif-docs` как посадочная страница проекта.

## Файлы контекста для ИИ-агентов

| Файл | Назначение |
|---|---|
| `AGENTS.md` | Карта проекта для ИИ-агентов (этот файл) |
| `.ai-factory/ARCHITECTURE.md` | Архитектура проекта (целевое состояние, этап видения) |
| `.ai-factory/RULES.md` | Правила и конвенции проекта |
| `.ai-factory/PLAN.md` | Текущий план работ |
| `.ai-factory/RESEARCH.md` | Исследования и открытые вопросы |
| `.ai-factory.json` | Конфигурация AI Factory (скиллы, MCP) |

## Правила для агентов

- Не комбинируй зависимые shell-команды в одну строку через `&&` (например, `git checkout main && git pull`). Выполняй их последовательно: сначала `git checkout main`, затем `git pull origin main`.
- Следуй правилам проекта `.ai-factory/RULES.md` и архитектуре `.ai-factory/ARCHITECTURE.md`; спецификации — источник правды.
- Обновляй этот файл при значительном изменении структуры проекта; секцию «Документация» поддерживает `/aif-docs`.
