# Принципы GraphRAG: Фундаментальные основы

> **Источники:** [From Local to Global: A GraphRAG Approach to Query-Focused Summarization](https://arxiv.org/abs/2404.16130) (Microsoft Research, 2024); обзоры [Peng et al. (2024)](https://arxiv.org/abs/2408.08921) · [Zhang et al. (2025)](https://arxiv.org/abs/2501.13958) · [Han et al. (2024)](https://arxiv.org/abs/2501.00309); репозитории [pengboci/GraphRAG-Survey](https://github.com/pengboci/GraphRAG-Survey) и [DEEP-PolyU/Awesome-GraphRAG](https://github.com/DEEP-PolyU/Awesome-GraphRAG); 97 arXiv-статей
> **Создано:** 2026-08-29

---

## 1. Проблема Vector RAG

Классический Vector RAG (Retrieval-Augmented Generation) работает следующим образом:
- Запрос пользователя кодируется в вектор (embedding)
- Из внешнего корпуса извлекаются top-k семантически близких чанков
- LLM генерирует ответ на основе запроса и извлечённых чанков

**Фундаментальное ограничение:** Vector RAG работает только для *локальных* запросов — тех, на которые можно ответить по нескольким изолированным документам. Он проваливается на *глобальных* (sensemaking) запросах, требующих понимания всего корпуса:
- "Каковы основные темы в датасете?"
- "Какие тренды прослеживаются в научных открытиях за последнее десятилетие?"
- "Как различные стейкхолдеры воспринимают регулирование технологий?"

Это задача **Query-Focused Summarization (QFS)**, а не явного retrieval. Имеющиеся QFS-методы не масштабируются на объёмы, типичные для RAG (миллионы токенов).

## 2. Ключевая идея GraphRAG

GraphRAG решает проблему глобального осмысления (sensemaking) путём **построения графового индекса** из исходных документов с последующей **иерархической суммаризацией сообществ графа**.

Pipeline (основной подход Microsoft Research):

```
Source Documents → Text Chunks → Entity & Relationship Extraction (LLM)
→ Knowledge Graph → Community Detection (Leiden) → Community Summaries (LLM)
→ Map-Reduce → Community Answers → Global Answer
```

## 3. Детальный Pipeline

### 3.1. Source Documents → Text Chunks
- Документы разбиваются на чанки фиксированного размера
- Размер чанка — фундаментальное проектное решение: длиннее = дешевле (меньше LLM-вызовов), но хуже recall на информации в начале чанка
- В foundational paper: чанки по 600 токенов с перекрытием 100 токенов

### 3.2. Text Chunks → Entity & Relationship Extraction
- LLM извлекает из каждого чанка: сущности (entities) с описаниями, отношения (relationships) между сущностями, утверждения (claims)
- Промпты настраиваются под домен через few-shot exemplars
- Это форма *абстрактивной суммаризации* — отношения и утверждения могут не быть явно указаны в тексте
- Отношения имеют **числовой score силы** (relationship strength)
- **Self-reflection / «gleaning»:** для компенсации снижения recall при больших чанках — LLM повторно просят найти пропущенные сущности (logit bias=100 для yes/no). Подробности в [07-implementation-methodology.md](07-implementation-methodology.md)

### 3.3. Entity Extraction → Knowledge Graph
- Экземпляры сущностей становятся узлами, отношения — рёбрами
- Дубликаты агрегируются: количество повторений отношения становится весом ребра
- Entity matching: в базовой реализации — exact string matching; возможны мягкие методы
- GraphRAG устойчив к дубликатам — они обычно кластеризуются вместе при детекции сообществ

### 3.4. Knowledge Graph → Graph Communities
- **Алгоритм детекции сообществ:** Leiden (Traag et al., 2019) — иерархически
- Рекурсивно выделяются подсообщества до достижения листовых сообществ, которые больше не разбиваются
- Каждый уровень иерархии даёт MECE-разбиение (mutually exclusive, collectively exhaustive)
- Для реализации: библиотека `graspologic` (Chung et al., 2019)

### 3.5. Graph Communities → Community Summaries
- LLM генерирует отчёт-суммаризацию каждого сообщества
- **Листовые сообщества:** элементы (узлы, рёбра, claims) приоритизируются по combined node degree и итеративно добавляются в контекстное окно до лимита токенов
- **Сообщества верхнего уровня:** если все элементы не влезают — суммаризации подсообществ (короче) заменяют их элементы (длиннее)

### 3.6. Community Summaries → Global Answer (Map-Reduce)
- **Prepare:** Суммаризации сообществ перемешиваются и разбиваются на чанки (чтобы релевантная информация распределялась, а не концентрировалась)
- **Map:** LLM генерирует промежуточные ответы и оценку helpfulness (0-100). Ответы с 0 отфильтровываются.
- **Reduce:** Промежуточные ответы сортируются по helpfulness и итеративно добавляются в контекстное окно; LLM генерирует финальный глобальный ответ.
- **Размер контекстного окна:** эмпирически 8k токенов оказалось оптимальным (лучше 16k-64k) из-за эффекта «lost in the middle»

## 4. Иерархические уровни сообществ

| Уровень | Описание | Характер ответа |
|---------|----------|-----------------|
| C0 | Корневые сообщества (самые крупные) | Самый глобальный, наименее детальный |
| C1 | Подсообщества C0 | Баланс глобальности и детализации |
| C2 | Промежуточный уровень | Более детальный |
| C3 | Листовые сообщества (самые мелкие) | Самый детальный, менее глобальный |

Результаты foundational paper: C1-C3 значительно превосходят Vector RAG (SS) по comprehensiveness (72-83%, p<.001) и diversity (62-82%, p<.01). C1 часто оптимален по соотношению качества и токен-стоимости.

## 5. Критерии оценки GraphRAG

| Критерий | Значение |
|----------|----------|
| **Comprehensiveness** | Насколько полно ответ покрывает все аспекты вопроса? |
| **Diversity** | Насколько разнообразны перспективы и инсайты в ответе? |
| **Empowerment** | Насколько ответ помогает читателю понять тему и принимать решения? |
| **Directness** | Насколько конкретно и ясно ответ адресует вопрос? (контрольный критерий) |

## 6. Ограничения и Future Work (из foundational paper)

- Оценка проводилась на двух датасетах ~1 млн токенов — нужна валидация на других доменах
- Возможна гибридная схема: embedding-based matching + just-in-time community report generation перед map-reduce
- Потенциал "roll-up" / "drill-down" механизмов для иерархической навигации

## 7. Ключевые отличия GraphRAG от других подходов

| Подход | Механизм индексации | Тип запросов |
|--------|---------------------|--------------|
| **Vector RAG** | Embedding-поиск по чанкам | Локальные (фактологические) |
| **GraphRAG** | Граф сущностей + сообщества + иерархические суммаризации | Глобальные (sensemaking) |
| **RAPTOR** | Дерево рекурсивных суммаризаций (без графа) | Промежуточные |
| **LightRAG** | Граф + dual-level retrieval (low-level + high-level) | Смешанные |
| **HippoRAG** | KG + Personalized PageRank (биоинспирированная память) | Ассоциативные |

## 8. Три фундаментальных этапа GraphRAG (таксономия Peng et al.)

1. **Graph-Based Indexing** — построение индекса:
   - Graph Data: Self-Constructed (из корпуса) vs. Existing KG
   - Indexing: Graph Indexing, Text Indexing, Vector Indexing, Hybrid Indexing

2. **Graph-Guided Retrieval** — извлечение знаний:
   - Retriever: Non-parametric, LM-based, GNN-based
   - Retrieval Paradigm: Once, Iterative, Multi-stage
   - Retrieval Granularity: Nodes, Triplets, Paths, Subgraphs
   - Retrieval Enhancement: Query Enhancement, Knowledge Enhancement

3. **Graph-Enhanced Generation** — генерация ответа:
   - Fine-tuning: Node-level, Path-level, Subgraph-level
   - In-context Learning: Graph-enhanced Chain-of-Thought, Collaborative KG Refinement

## 9. Дополнительное измерение таксономии (DEEP-PolyU)

Трёхмерная структура:
1. **Knowledge Organization** (Организация знаний): Graphs for Knowledge Indexing, Graphs as Knowledge Carrier (KG Construction from Corpus, GraphRAG with Existing KGs), Hybrid GraphRAG
2. **Knowledge Retrieval** (Извлечение знаний): Semantic Similarity-based, Logical Reasoning-based, LLM-based, GNN-based, Multi-round, Post-retrieval, Hybrid
3. **Knowledge Integration** (Интеграция знаний): Fine-tuning (Node/Path/Subgraph), In-context Learning (Graph-enhanced CoT, Collaborative KG Refinement)

---

## 10. Методология и практика (детально)

Полные промпт-шаблоны, self-reflection/gleaning, grounding rules, методология оценки (LLM-as-judge + claim-метрики + статистика) и практические параметры — см. [07-implementation-methodology.md](07-implementation-methodology.md).