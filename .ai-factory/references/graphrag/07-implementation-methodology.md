# Методология и практика реализации GraphRAG (из foundational paper)

> **Источник:** [From Local to Global: A GraphRAG Approach to Query-Focused Summarization](https://arxiv.org/abs/2404.16130) (Edge et al., Microsoft Research, 2024) — Приложения A–G
> **Создано:** 2026-08-29

Этот документ содержит методологическую и практическую информацию, извлечённую из полного текста foundational paper (включая приложения с промптами, которые обычно не попадают в краткие обзоры).

---

## 1. Практические параметры индексации

### 1.1. Chunking
- **Размер чанка по умолчанию:** 600 токенов, перекрытие 100 токенов
- Документы 1M+ токенов: Podcast → 1669 чанков, News → 3197 чанков

### 1.2. Выбор размера контекстного окна (важное эмпирическое открытие)

Проверялись окна 8k, 16k, 32k и 64k токенов. **Неожиданный результат: наименьшее окно (8k) оказалось лучшим**:

| Размер окна | Comprehensiveness (win rate) | Diversity | Empowerment |
|-------------|------------------------------|-----------|-------------|
| **8k** | **58.1%** (лучший) | 52.4% | 51.3% |
| 16k-64k | хуже | сопоставимо | сопоставимо |

**Причина:** эффект «lost in the middle» — информация в середине длинного контекста теряется (Kuratov et al., 2024; Liu et al., 2023).

**Вывод для практики:** не гонитесь за большим контекстным окном. Для задач суммирования/сенсмейкинга 8k часто оптимально, а 128k-окно не даёт преимущества.

### 1.3. Уровни сообществ и стоимость токенов (token efficiency)

| Уровень | Единиц контекста | Токенов | % от максимума |
|---------|-----------------|---------|----------------|
| **C0** (корень) | 34-55 | ~27-40k | **2.3-2.6%** |
| **C1** | 367-555 | ~226-353k | 20.7-22.2% |
| **C2** | 969-1797 | ~566-981k | 55.8-57.4% |
| **C3** (листья) | 1310-2142 | ~746-1140k | 66.8-73.5% |
| **TS** (без графа) | 1669-3197 | ~1015-1708k | 100% |

**Ключевой вывод:** C0 (корневой уровень) требует в **9-43 раза меньше токенов** на запрос, чем полный map-reduce по исходному тексту, при этом сохраняя выигрыш по comprehensiveness (72%) и diversity (62%) над Vector RAG. Для итеративного сенсмейкинга C0 — самый эффективный режим.

---

## 2. Self-Reflection / «Gleaning» — ключевая практическая техника

**Проблема:** чем больше чанк, тем дешевле (меньше LLM-вызовов), но тем ниже recall извлечения сущностей. В эксперименте GPT-4 извлёк почти **вдвое больше** сущностей при размере чанка 600 токенов, чем при 2400.

**Решение (self-reflection / gleaning):**
1. LLM извлекает сущности из чанка
2. Извлечённые сущности подаются обратно LLM
3. LLM просят оценить, все ли сущности извлечены — используется **logit bias = 100** для принудительного yes/no-решения (без «возможно»)
4. Если LLM отвечает, что сущности пропущены → prompt-продолжение «MANY entities were missed in the last extraction» стимулирует LLM найти пропущенные
5. Процесс повторяется до заданного максимума итераций

**Результат:** позволяет использовать большие чанки без потери качества и без принудительного добавления шума.

**Применение:** это готовая методика для снижения стоимости индексации при сохранении качества — критично для больших корпусов.

---

## 3. Промпт-шаблоны (verbatim, из приложения E)

### 3.1. Element Instance Generation (извлечение сущностей и отношений)

Многокомпонентный промпт. Ключевая структура:

```
---Goal---
Given a text document ... and a list of entity types, identify all entities
of those types from the text and all relationships among the identified entities.

---Steps---
1. Identify all entities. For each: entity name (capitalized), entity type
   (from {entity types}), entity description.
   Format: ("entity"{tuple delimiter}<name>{tuple delimiter}<type>{tuple delimiter}<description>)
2. From entities in step 1, identify all pairs of (source, target) that are
   *clearly related*. For each: source entity, target entity, relationship
   description, relationship strength (numeric score).
   Format: ("relationship"{tuple delimiter}<source>{tuple delimiter}<target>{tuple delimiter}<description>{tuple delimiter}<strength>)
3. Return output as a single list using **{record delimiter}** as delimiter.
4. When finished, output {completion delimiter}

---Examples---
[few-shot examples tailored to the domain]

---Real Data---
Entity types: {entity types}
Input: {input text}
Output:
```

**Важные детали:**
- Отношения имеют **числовой score силы** (relationship strength)
- Few-shot examples адаптируются под домен (named entities по умолчанию; наука/медицина/право — специализированные)
- Используются tuple/record/completion делимитеры для структурированного парсинга

### 3.2. Community Summary Generation (генерация отчёта сообщества)

Выход — **JSON** со строгой структурой:

```
---Role---
You are an AI assistant that helps a human analyst to perform general
information discovery...

---Goal---
Write a comprehensive report of a community, given a list of entities,
their relationships and optional associated claims.

---Report Structure---
- TITLE: short but specific; include representative named entities
- SUMMARY: executive summary of structure and relations
- IMPACT SEVERITY RATING: float 0-10 (importance of the community)
- RATING EXPLANATION: single sentence
- DETAILED FINDINGS: 5-10 key insights, each with short summary + explanation

Return output as well-formed JSON:
{ "title": ..., "summary": ..., "rating": ..., "rating explanation": ...,
  "findings": [ { "summary": ..., "explanation": ... }, ... ] }

---Grounding Rules---
Points supported by data should list data references:
"This is ... supported by multiple data references [Data: Reports (ids); Entities (ids); ...]"
Do not list more than 5 record ids in a single reference; use "+more".
Do not include information where supporting evidence is not provided.
```

**Ключевые особенности:**
- Отчёт сообщества структурирован в JSON (не свободный текст) — это упрощает downstream-обработку
- **Impact severity rating (0-10)** — скор-важность сообщества, полезен для приоритизации
- **Grounding rules** — обязательная атрибуция каждого утверждения к source record IDs

### 3.3. Community Answer Generation (map-шаг)

```
---Role---
You are a helpful assistant responding to questions about a dataset by
synthesizing perspectives from multiple analysts.

---Goal---
Generate a response that summarizes all reports from multiple analysts...
Note that the analysts' reports are ranked in descending order of helpfulness.
If you don't know the answer, just say so. Do not make anything up.
... preserve all data references ... Style in markdown.
```

### 3.4. Global Answer Generation (reduce-шаг)

```
---Role---
You are a helpful assistant responding to questions about data in tables.

---Goal---
... summarize all relevant information ...
At the beginning of your response, generate an integer score 0-100 indicating
how helpful this response is, in format:
<ANSWER HELPFULNESS> score </ANSWER HELPFULNESS>
```

**Ключевые особенности map-reduce:**
- Map: каждый отчёт сообщества → промежуточный ответ + helpfulness score (0-100)
- Ответы с score 0 отфильтровываются
- Reduce: промежуточные ответы сортируются по helpfulness и итеративно заполняют контекстное окно

---

## 4. Grounding Rules (правила атрибуции данных)

Из приложений E.2, E.3, E.4 — общие правила:

1. **Каждое утверждение, подкреплённое данными, должно ссылаться на источник** через `[Data: ...]`
2. **Не более 5 record ID** в одной ссылке; остальные — через `+more`
3. **Не включать информацию без подтверждающего источника**
4. Формат ссылки: `[Data: Reports (2, 7, 34, 46, 64, +more)]` — где числа — это **id записей**, а не индексы
5. Сохранять модальные глаголы (`shall`, `may`, `will`) — для точности утверждений

---

## 5. Методология оценки

### 5.1. LLM-as-Judge (относительная оценка, F.1)

Промпт для сравнения двух ответов:

```
---Role---
You are a helpful assistant responsible for grading two answers...

---Goal---
Given a question and two answers, assess which answer is better according to
{criteria}. Output JSON:
{ "winner": <1, 2, or 0>, "reasoning": "Answer 1 is better because ..." }
```

- `winner = 1` — Answer 1 лучше, `2` — Answer 2 лучше, `0` — фундаментально одинаковы
- Каждое сравнение повторяется несколько раз (5 реплик) для учёта стохастичности

### 5.2. Метрики (F.2) — полные определения

| Метрика | Определение |
|---------|-------------|
| **Comprehensiveness** | Насколько полно ответ покрывает все аспекты и детали вопроса; не должен быть избыточным или нерелевантным |
| **Diversity** | Насколько разнообразны перспективы и инсайты; многогранность и многоаспектность; разные источники |
| **Directness** | Насколько конкретно и ясно отвечает на вопрос (контрольная метрика, противоположна comprehensiveness) |
| **Empowerment** | Насколько помогает понять тему и принимать решения без введения в заблуждение; качество объяснения и источников |

### 5.3. Валидация через claims (не LLM-оценка)

Для независимой проверки LLM-оценок используется **Claimify** (Metropolitansky & Larson, 2025):
1. Извлекает factual claims из ответов (self-contained, verifiable statements)
2. **Comprehensiveness** = среднее число уникальных claims на ответ
3. **Diversity** = среднее число кластеров claims (агломеративная кластеризация, complete linkage, расстояние = 1 − ROUGE-L)

**Согласованность:** LLM-judge согласуется с claim-метриками в **78%** случаев (comprehensiveness) и **69-70%** (diversity) — умеренно сильное соответствие.

### 5.4. Статистический анализ (Приложение G)

- **Shapiro-Wilk test** → данные не соответствуют нормальному распределению
- Поэтому **Wilcoxon signed-rank test** (непараметрический)
- **Holm-Bonferroni correction** для множественных попарных сравнений
- Каждый ответ оценивался 5 раз, результаты усреднялись

---

## 6. Затраты и производительность индексации

| Параметр | Значение |
|----------|----------|
| Датасет | Podcast transcripts (~1M токенов) |
| Время индексации | **281 минута** |
| Окно индексации | 600 токенов |
| Оборудование | 16GB RAM, Intel Xeon Platinum 8171M @ 2.60GHz |
| LLM | gpt-4-turbo (2M TPM, 10k RPM, публичный OpenAI endpoint) |
| Граф | 8,564 узла, 20,691 рёбер (Podcast); 15,754 узла, 19,520 рёбер (News) |
| Детекция сообществ | Leiden через библиотеку `graspologic` |

**Ключевой практический вывод:** индексация — дорогой этап (часы на 1M токенов на CPU). Это мотивирует подходы KET-RAG / LinearRAG для снижения стоимости (см. [03-algorithms.md](03-algorithms.md) и [05-design-guide.md](05-design-guide.md)).

---

## 7. Визуализация графа (Приложение B)

Для визуализации сообществ:
- **Детекция:** Leiden (Traag et al., 2019)
- **Раскладка:** OpenORD (Martin et al., 2011) + Force Atlas 2 (Jacomy et al., 2014)
- Узлы = сущности, размер пропорционален degree, цвет = сообщество
- Показывает два уровня иерархии: Level 0 (максимальная modularity) и Level 1 (внутренняя структура)

---

## 8. Связь с остальным референсом

- **Принципы и pipeline:** [01-principles.md](01-principles.md)
- **Алгоритмы (GraphRAG/MS подробно):** [03-algorithms.md](03-algorithms.md)
- **Рекомендации по проектированию:** [05-design-guide.md](05-design-guide.md)
- **Полный индекс источников:** [06-paper-index.md](06-paper-index.md)
