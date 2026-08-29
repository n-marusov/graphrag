# Ключевые алгоритмы GraphRAG

> **Источники:** 97 arXiv-статей, foundational paper "From Local to Global", [DEEP-PolyU/Awesome-GraphRAG](https://github.com/DEEP-PolyU/Awesome-GraphRAG)
> **Создано:** 2026-08-29

---

## 1. GraphRAG (Microsoft Research)

**Бумага:** [From Local to Global: A GraphRAG Approach to Query-Focused Summarization](https://arxiv.org/abs/2404.16130) (Edge et al., 2024)

**Репозиторий:** [microsoft/graphrag](https://github.com/microsoft/graphrag)

### Алгоритм индексации

1. **Chunking:** Разбиение документов на чанки (600 токенов, перекрытие 100)
2. **Entity/Relation/Claim Extraction:** LLM (GPT-4-turbo) извлекает сущности, отношения между ними, и фактические утверждения. Few-shot exemplars настраиваются под домен
3. **Graph Construction:** Exact string matching для entity resolution. Узлы = сущности, рёбра = отношения. Дубликаты становятся весами рёбер
4. **Community Detection:** Leiden (Traag et al., 2019) иерархически. Библиотека: `graspologic`
5. **Community Summarization:** Bottom-up. Листовые сообщества: элементы приоритизируются по combined node degree (source + target). Верхние уровни: суммаризации подсообществ заменяют их элементы

### Алгоритм ответа на запрос (Map-Reduce)

```
map(community_summaries) → intermediate_answers + helpfulness_score
filter: scores > 0
sort: descending by helpfulness
reduce(intermediate_answers) → global_answer (итеративное заполнение контекстного окна)
```

**Ключевые параметры:** chunk_size, context_window (8K в базовой версии), community_level (C0-C3)

---

## 2. LightRAG

**Бумага:** [LightRAG: Simple and Fast Retrieval-Augmented Generation](https://arxiv.org/abs/2410.05779) (Guo et al., 2024)

**Репозиторий:** [HKUDS/LightRAG](https://github.com/HKUDS/LightRAG)

### Ключевые инновации

- **Dual-level retrieval:** Low-level (конкретные сущности + их отношения) + High-level (тематические концепты/сообщества)
- Графовая структура + векторные представления совместно — эффективный retrieval связанных сущностей
- **Incremental update algorithm:** своевременная интеграция новых данных без полной перестройки индекса
- Значительно быстрее Microsoft GraphRAG при сопоставимом качестве

### Алгоритм

1. Построение графа сущностей и отношений из чанков (LLM extraction)
2. Dual-level индексация: low-level (entity/relation векторы) + high-level (community векторы)
3. При запросе: поиск по обоим уровням, объединение результатов
4. Incremental update: при добавлении документов — обновление только затронутых частей графа

---

## 3. KAG (Knowledge Augmented Generation)

**Бумага:** [KAG: Boosting LLMs in Professional Domains via Knowledge Augmented Generation](https://arxiv.org/abs/2409.13731) (Liang et al., 2024)

**Индустрия:** Ant Group (E-Government, E-Health)

### Ключевые инновации (5 аспектов)

1. **LLM-friendly knowledge representation:** представление знаний, оптимизированное для понимания LLM
2. **Mutual indexing KG ↔ chunks:** двунаправленная индексация между графом и исходными чанками
3. **Logical-form-guided hybrid reasoning:** гибридный reasoning engine с направляющими логическими формами
4. **Knowledge alignment with semantic reasoning:** выравнивание знаний с семантическим рассуждением
5. **Model capability enhancement:** улучшение способностей модели для KAG

### Результаты

- +19.6% F1 на 2Wiki относительно SOTA RAG
- +33.5% F1 на HotpotQA
- Продемонстрирован в production на задачах E-Government и E-Health

---

## 4. HippoRAG / HippoRAG 2

**Бумага:** [HippoRAG: Neurobiologically Inspired Long-Term Memory for LLMs](https://papers.nips.cc/paper_files/paper/2024/hash/6ddc001d07ca4f319af96a3024f6dbd1-Abstract-Conference.html) (NeurIPS 2024)
**HippoRAG 2:** [From RAG to Memory: Non-Parametric Continual Learning for LLMs](https://arxiv.org/abs/2502.14802) (Jiménez Gutiérrez et al., 2025) · [репозиторий](https://github.com/OSU-NLP-Group/HippoRAG)

### Ключевая идея

Биоинспирированная модель долговременной памяти: имитирует взаимодействие неокортекса (LLM) и гиппокампа (KG + PageRank retrieval).

### Алгоритм HippoRAG

1. **Offline Indexing:** LLM извлекает сущности из документов, строит KG (как GraphRAG)
2. **Online Retrieval:** Personalized PageRank (PPR) по KG для нахождения релевантных пассажей
3. Обеспечивает ассоциативную память — связи между концептами, а не только фактологический retrieval

### HippoRAG 2 улучшения

- Deeper passage integration
- Более эффективное online использование LLM
- +7% на задачах ассоциативной памяти над SOTA embedding model
- Превосходит стандартный RAG на factual, sense-making и associative memory задачах

---

## 5. RAPTOR

**Бумага:** [RAPTOR: Recursive Abstractive Processing for Tree-Organized Retrieval](https://arxiv.org/abs/2401.18059) (Sarthi et al., 2024, ICLR 2024)

### Ключевая идея

Древовидная организация знаний без явного графа сущностей: рекурсивное embedding, clustering и summarization чанков строят дерево с разными уровнями абстракции.

### Алгоритм

1. **Bottom-up tree construction:**
   - Embedding всех чанков
   - Gaussian Mixture Model (GMM) кластеризация
   - LLM-суммаризация каждого кластера → новый узел дерева
   - Повторять для каждого уровня
2. **Retrieval:** Tree traversal — спуск по дереву для выбора наиболее релевантных узлов
3. **Генерация:** использование извлечённых суммаризаций как контекста

### Результаты

+20% absolute accuracy на QuALITY benchmark (с GPT-4)

---

## 6. G-Retriever

**Бумага:** [G-Retriever: Retrieval-Augmented Generation for Textual Graph Understanding and Question Answering](https://arxiv.org/abs/2402.07630) (He et al., 2024, NeurIPS 2024) · [репозиторий](https://github.com/XiaoxinHe/G-Retriever)

### Ключевая идея

Первый RAG-подход для *общих* текстовых графов (textual graphs). Формулирует retrieval как задачу Prize-Collecting Steiner Tree (PCST).

### Алгоритм

1. **Soft Prompting:** Fine-tuning GNN + LLM через мягкие промпты для улучшения понимания графа
2. **PCST optimization:** Построение минимального подграфа, соединяющего query-релевантные узлы
3. **Граф может превышать контекстное окно:** PCST выбирает оптимальный подграф размера, вмещающегося в окно

---

## 7. GNN-RAG

**Бумага:** [GNN-RAG: Graph Neural Retrieval for Large Language Model Reasoning](https://arxiv.org/abs/2405.20139) (Mavromatis & Karypis, 2024)

### Ключевая идея

GNN выступает как *dense subgraph reasoner* для извлечения кандидатов ответа из KG и reasoning paths, которые затем вербализуются и подаются LLM.

### Алгоритм

1. **GNN reasoning:** GNN обрабатывает плотный подграф KG для предсказания кандидатов ответа
2. **Path extraction:** Извлечение shortest paths, соединяющих query entities и answer candidates
3. **Verbalization:** Пути преобразуются в текст
4. **LLM RAG:** LLM использует вербализованные reasoning paths для генерации ответа
5. **Retrieval Augmentation (RA) technique:** Дополнительное улучшение через retrieval augmentation

### Результаты

- SOTA на WebQSP и CWQ (с 7B tuned LLM, сопоставимо с GPT-4)
- +8.9-15.5% points на multi-hop/multi-entity вопросах

---

## 8. Think-on-Graph (ToG) / ToG 2.0

**Бумага ToG:** [Think-on-Graph: Deep and Responsible Reasoning of LLM on Knowledge Graph](https://arxiv.org/abs/2307.07697) (Sun et al., 2024, ICLR 2024)
**Бумага ToG 2.0:** [Think-on-Graph 2.0](https://arxiv.org/abs/2407.10805) (Ma et al., 2024) · [репозиторий](https://github.com/IDEA-FinAI/ToG-2)

### Ключевая идея ToG

LLM как агент, итеративно выполняющий beam search по KG для поиска reasoning paths.

### Алгоритм ToG

1. **Инициализация:** LLM определяет стартовые сущности в KG для вопроса
2. **Beam search итерации:**
   - LLM оценивает релевантность соседних отношений и сущностей
   - Выбирает top-k (beam width) для продолжения поиска
3. **Терминация:** Когда найдены reasoning paths достаточной длины/уверенности
4. **Ответ:** LLM генерирует ответ на основе найденных путей

### ToG 2.0 улучшения

- **Hybrid retrieval:** Итеративное переключение между графовым retrieval (KG) и контекстным retrieval (документы)
- Документы используются как контекст сущностей для точного графового retrieval
- KG связывает документы через сущности для глубокого knowledge-guided retrieval
- Training-free, plug-and-play

### Результаты ToG

- SOTA на 6 из 9 датасетов
- Маленькие LLM с ToG могут превзойти GPT-4 на некоторых задачах

---

## 9. GRAG (Graph Retrieval-Augmented Generation)

**Бумага:** [GRAG: Graph Retrieval-Augmented Generation](https://arxiv.org/abs/2405.16506) (Hu et al., 2024) · [репозиторий](https://github.com/HuieL/GRAG)

### Ключевая идея

Обработка networked documents (citation graphs, social media, knowledge graphs) через retrieval текстовых подграфов.

### Алгоритм

1. **Divide-and-conquer subgraph retrieval:** Линейное время для поиска оптимального подграфа
2. **Dual-view integration:**
   - Text view: текстовое представление подграфа
   - Graph view: топологическое представление
   - Оба вида подаются LLM для более полного понимания

---

## 10. StructRAG

**Бумага:** [StructRAG: Boosting Knowledge Intensive Reasoning via Inference-time Hybrid Information Structurization](https://arxiv.org/abs/2410.08815) (Li et al., 2024)

### Ключевая идея

Вместо использования предопределённой структуры, StructRAG на этапе inference определяет оптимальный тип структуры для задачи (таблица, граф, дерево, etc.) и реструктурирует документы соответственно.

### Алгоритм

1. **Structure identification:** Определение оптимальной структуры для данной задачи
2. **Document restructuring:** Реорганизация исходных документов в выбранную структуру
3. **Structure-based reasoning:** LLM рассуждает на основе структурированной информации

---

## 11. Plan-on-Graph (PoG)

**Бумага:** [Plan-on-Graph: Self-Correcting Adaptive Planning of LLM on Knowledge Graphs](https://arxiv.org/abs/2410.23875) (Chen et al., 2024, NeurIPS 2024)

### Алгоритм

1. **Декомпозиция:** Разбиение вопроса на подцели
2. **Адаптивный цикл:**
   - **Guidance:** направление поиска reasoning paths на основе подцелей
   - **Memory:** сохранение промежуточных результатов
   - **Reflection:** самооценка и коррекция ошибочных reasoning paths
3. Повторение до достижения ответа

### Три механизма

| Механизм | Функция |
|----------|---------|
| Guidance | Определение направления поиска в KG |
| Memory | Хранение и агрегация reasoning paths |
| Reflection | Самооценка и самокоррекция ошибочных путей |

---

## 12. PathRAG

**Бумага:** [PathRAG: Pruning Graph-based Retrieval Augmented Generation with Relational Paths](https://arxiv.org/abs/2502.14902) (Chen et al., 2025) · [репозиторий](https://github.com/BUPT-GAMMA/PathRAG)

### Ключевая идея

Проблема не в недостаточности информации, а в *избыточности*. PathRAG извлекает только ключевые реляционные пути из indexing graph.

### Алгоритм

1. **Flow-based pruning:** Удаление избыточной информации на основе потокового анализа графа
2. **Path-based prompting:** Преобразование путей в текстовую форму для LLM
3. Обеспечивает более логичные и связные ответы

### Результаты

- Стабильно превосходит SOTA baselines на 6 датасетах и 5 метриках

---

## 13. Другие значимые алгоритмы

| Система | Ключевая идея | Отличительная черта |
|---------|---------------|---------------------|
| **[MemoRAG](https://arxiv.org/abs/2409.05591)** (Qian et al., 2024) | Dual-system: лёгкая LLM создаёт глобальную память, мощная LLM генерирует ответ | KV-компрессия памяти + RLGF |
| **[Graph-CoT](https://arxiv.org/abs/2404.07103)** (Jin et al., 2024) | Итеративное LLM-рассуждение на графе: reasoning → graph interaction → graph execution | Три шага на итерацию |
| **[GCR](https://arxiv.org/abs/2410.13080)** (Luo et al., 2024) | KG-Trie ограничивает декодирование LLM для faithful reasoning | Zero hallucination гарантия |
| **[LogicRAG](https://arxiv.org/abs/2508.06105)** (Chen et al., 2025) | Динамическое построение DAG подзадач без предварительного графа | Inference-time adaptive |
| **[LinearRAG](https://arxiv.org/abs/2510.10114)** (Zhuang et al., 2025) | Relation-free граф, только сущности + семантические связи | Линейное масштабирование |
| **[E²GraphRAG](https://arxiv.org/abs/2505.24226)** (Zhao et al., 2025) | Summary tree + entity graph + bidirectional indexes + adaptive retrieval | 10x быстрее индексация, 100x retrieval |
| **[GFM-RAG](https://arxiv.org/abs/2502.01113)** (Luo et al., 2025) | Graph Foundation Model (8M параметров) на 60 KG с 14M троек | Zero-shot на новых графах |
| **[SubgraphRAG](https://arxiv.org/abs/2410.20724)** (Li et al., 2024) | MLP + parallel triple scoring + directional structural distances | Гибкий размер подграфа |
| **[MixPR](https://arxiv.org/abs/2412.06078)** (Alonso & Millidge, 2024) | Mixture of PageRank-based graph retrieval через sparse matrices | CPU-only, миллионы токенов за секунды |