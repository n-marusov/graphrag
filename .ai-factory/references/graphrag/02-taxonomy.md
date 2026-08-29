# Таксономия методов GraphRAG

> **Источники:** [Peng et al. "Graph Retrieval-Augmented Generation: A Survey"](https://arxiv.org/abs/2408.08921); [Zhang et al. "A Survey of GraphRAG for Customized LLMs"](https://arxiv.org/abs/2501.13958); 97 arXiv-статей
> **Создано:** 2026-08-29

---

## I. Knowledge Organization (Организация знаний / Индексация)

Этап построения индекса — как структурируются и хранятся знания.

### 1.1. Graphs for Knowledge Indexing (Графовая индексация)

Построение графовой структуры непосредственно из документов для использования как индекса при retrieval.

| Подход | Идея | Ключевые работы |
|--------|------|-----------------|
| **Entity-Relation KG** | LLM извлекает сущности и связи, строится граф | **GraphRAG** (Edge et al., 2024), **LightRAG** (Guo et al., 2024), **KAG** (Liang et al., 2024) |
| **Hierarchical Trees** | Рекурсивная кластеризация и суммаризация чанков | **RAPTOR** (Sarthi et al., 2024), **SiReRAG** (Zhang et al., 2024) |
| **Community Graphs** | Граф + детекция сообществ (Leiden/Louvain) + иерархические суммаризации | **GraphRAG** (Microsoft), **ArchRAG** (Wang et al., 2025), **KET-RAG** (Huang et al., 2025) |
| **Hypergraph Memory** | Гиперграф как рабочая память для multi-step reasoning | **HGMem** (Zhou et al., 2025) |
| **Linear/Relation-free Graphs** | Граф без извлечения отношений (только сущности + семантические связи) | **LinearRAG** (Zhuang et al., 2025) |
| **Graph Foundation Model** | Предобученная GNN на множестве графов для универсального графового retrieval | **GFM-RAG** (Luo et al., 2025), **G-reasoner** (Luo et al., 2025) |

### 1.2. Knowledge Graph Construction from Corpus

Построение KG из неструктурированного текста.

| Подход | Идея | Ключевые работы |
|--------|------|-----------------|
| **LLM-based Extraction** | LLM извлекает тройки (head, relation, tail) из чанков | **From Local to Global** (Edge et al., 2024), **Graphusion** (Yang et al., 2024), **Youtu-GraphRAG** (Dong et al., 2025) |
| **RL-based Construction** | Reinforcement Learning для оптимизации построения графа под конкретную задачу | **AutoGraph-R1** (Tsang et al., 2025), **Agentic-KGR** (Li et al., 2025) |
| **Structure-Guided Prompting** | Исследование графовой структуры текста через промпты LLM | **Structure Guided Prompt** (EMNLP 2024) |
| **Ontology-Grounded** | Построение графа на основе онтологии домена | **OG-RAG** (Sharma et al., 2024), **Ontology Learning** (da Cruz et al., 2025) |
| **Adaptive Reasoning Structures** | Динамическое построение DAG из подзадач без предварительного графа | **LogicRAG** (Chen et al., 2025) |
| **Statistics-based KG** | Избегает LLM-галлюцинаций через статистическое извлечение вместо LLM | **AGRAG** (Wang et al., 2025) |

### 1.3. GraphRAG with Existing KGs

Использование заранее построенных Knowledge Graphs (Wikidata, ConceptNet, Freebase, доменные KG).

| Подход | Идея | Ключевые работы |
|--------|------|-----------------|
| **Subgraph Retrieval** | Извлечение релевантного подграфа из KG для LLM | **SubgraphRAG** (Li et al., 2024), **GNN-RAG** (Mavromatis & Karypis, 2024) |
| **Path-based Reasoning** | Поиск путей в KG для multi-hop reasoning | **Think-on-Graph** (Sun et al., 2024), **ToG 2.0** (Ma et al., 2024), **PathRAG** (Chen et al., 2025) |
| **Beam Search over KG** | LLM-агент итеративно выполняет beam search по KG | **Think-on-Graph** (Sun et al., 2024), **Graph-CoT** (Jin et al., 2024) |
| **Graph-Constrained Decoding** | KG-Trie ограничивает декодирование LLM для faithful reasoning | **GCR** (Luo et al., 2024) |
| **Adaptive Graph Traversal** | Динамический выбор стратегии обхода графа в зависимости от типа вопроса | **PolyG** (Liu et al., 2025) |

### 1.4. Hybrid GraphRAG

Комбинация графового и векторного retrieval.

| Подход | Ключевая работа |
|--------|-----------------|
| Текстовый + реляционный retrieval с critic module | **HybGRAG** (Lee et al., 2024) |
| Dual-channel: семантические запросы к тексту + реляционные запросы к графу | **GraphSearch** (Yang et al., 2025) |
| KG-guided chunk expansion + KG-based organization | **KG²RAG** (Zhu et al., 2025) |
| LLM-friendly knowledge representation + mutual indexing KG ↔ chunks | **KAG** (Liang et al., 2024) |

---

## II. Knowledge Retrieval (Извлечение знаний)

Как находится и извлекается релевантная информация из графового индекса.

### 2.1. По типу Retriever

| Тип | Описание | Ключевые работы |
|-----|----------|-----------------|
| **Semantic Similarity-based** | Embedding-поиск по узлам/рёбрам графа | G-Retriever, GraphCoder |
| **Logical Reasoning-based** | Логический вывод на основе структуры KG | KnowGPT, ToG, RuleRAG |
| **LLM-based** | LLM как агент, принимающий решения об обходе графа | LightRAG, ToG, Graph-CoT |
| **GNN-based** | GNN-энкодер для извлечения структурированной информации из подграфа | GNN-RAG, GNN-Ret, GFM-RAG |
| **Multi-round** | Итеративный retrieval с уточнением | Graph-CoT, SubQRAG |
| **Post-retrieval** | Дополнительная обработка извлечённой информации | Readi, CoK, GCR |

### 2.2. По Retrieval Granularity (детализации)

| Уровень | Что извлекается | Примеры |
|---------|-----------------|---------|
| **Nodes** | Отдельные сущности и их атрибуты | HippoRAG, ATLANTIC |
| **Triplets** | Тройки (head, relation, tail) | KG-Rank, UniOQA |
| **Paths** | Пути между сущностями в KG | ToG, ToG 2.0, PathRAG, GNN-RAG |
| **Subgraphs** | Связные подграфы | GRAG, G-Retriever, DALK |

### 2.3. По Retrieval Paradigm

| Парадигма | Характеристика | Примеры |
|-----------|----------------|---------|
| **Once Retrieval** | Одноразовое извлечение | HippoRAG, GRAG, G-Retriever |
| **Iterative Retrieval** | Повторное извлечение с уточнением на основе промежуточных результатов | PullNet, ToG, ToG 2.0, Graph-CoT, KnowledgeNavigator, GeAR, Plan-on-Graph |
| **Multi-stage Retrieval** | Несколько этапов с разными стратегиями | GNN-RAG, PathRAG |

---

## III. Knowledge Integration (Интеграция знаний в генерацию)

Как извлечённая графовая информация встраивается в LLM для генерации ответа.

### 3.1. Fine-tuning Approaches

| Уровень | Описание | Примеры |
|---------|----------|---------|
| **Node-level** | Тонкая настройка с информацией об отдельных узлах | LLMs-based Graph Convolution, GraphGPT |
| **Path-level** | Тонкая настройка с информацией о путях в графе | MuseGraph, Structure Pretraining |
| **Subgraph-level** | Тонкая настройка с информацией о подграфах | LLaGA, GraphWiz, Graph Neural Prompting |

### 3.2. In-context Learning Approaches

| Подход | Описание | Ключевые работы |
|--------|----------|-----------------|
| **Graph-enhanced Chain-of-Thought** | CoT-рассуждение, обогащённое графовыми структурами | Reason on Graphs, ToG, ToG 2.0, Graph-CoT, Chain-of-Knowledge |
| **Collaborative KG Refinement** | Совместное уточнение KG и ответов LLM | KGR (Retrofitting), Plan-on-Graph, CogMG, Explore-then-Determine |
| **Map-Reduce over Communities** | Суммаризация сообществ → промежуточные ответы → глобальный ответ | GraphRAG (Microsoft) |
| **Dual-System Architecture** | Две LLM-системы: лёгкая (глобальная память) + мощная (генерация) | MemoRAG (Qian et al., 2024) |
| **Structurization at Inference** | Динамическое определение оптимальной структуры для задачи и реструктуризация документов | StructRAG (Li et al., 2024) |
| **Agentic Deep Search** | Multi-turn взаимодействие с модульным retrieval через agent workflow | GraphSearch (Yang et al., 2025), GeAR (Shen et al., 2024) |

---

## IV. Доменные применения

| Домен | Ключевые работы |
|-------|-----------------|
| **Медицина** | MedGraphRAG, MedRAG, HyKGE, MEG, CancerKG.ORG, Medical Graph RAG, RiTeK |
| **Право и Government** | EWEK-QA, DocPolicyKG, OG-RAG, KAG (E-Government) |
| **Код и Software Engineering** | GraphCoder, CodexGraph, Code-Graph-RAG |
| **Наука** | ATLANTIC, Graphusion, CG-RAG (citation graphs) |
| **Финансы** | KAG (Ant Group) |
| **Персонализация** | PersonaAgent with GraphRAG |
| **Кибербезопасность** | Operationalizing Cyber Threat Intelligence with GraphRAG |

---

## V. Эволюция таксономии: три поколения GraphRAG

```
Gen 1: Pre-built KG + Retrieval (2021-2023)
  └─ QA-GNN, GreaseLM, GrapeQA, Knowledge Graph Prompting
  └─ Использование существующих KG (Wikidata, ConceptNet) как внешней памяти

Gen 2: LLM-Constructed Graph + Communities (2024)
  └─ GraphRAG (Microsoft), LightRAG, HippoRAG
  └─ Построение графа LLM из корпуса + иерархическая организация

Gen 3: Agentic & Adaptive GraphRAG (2025-2026)
  └─ GraphSearch, LogicRAG, Youtu-GraphRAG, AutoGraph-R1, ACE-GraphRAG
  └─ Агентный подход к retrieval, RL-оптимизация построения графа,
    адаптивные структуры без предпостроенного графа, inference-time scaling

---

## VI. Ссылки на источники

### Индексация / Knowledge Organization

| Работа | Ссылка |
|--------|--------|
| GraphRAG (Edge et al., 2024) | [arXiv:2404.16130](https://arxiv.org/abs/2404.16130) |
| LightRAG (Guo et al., 2024) | [arXiv:2410.05779](https://arxiv.org/abs/2410.05779) |
| KAG (Liang et al., 2024) | [arXiv:2409.13731](https://arxiv.org/abs/2409.13731) |
| RAPTOR (Sarthi et al., 2024) | [arXiv:2401.18059](https://arxiv.org/abs/2401.18059) |
| SiReRAG (Zhang et al., 2024) | [arXiv:2412.06206](https://arxiv.org/abs/2412.06206) |
| ArchRAG (Wang et al., 2025) | [arXiv:2502.09891](https://arxiv.org/abs/2502.09891) |
| KET-RAG (Huang et al., 2025) | [arXiv:2502.09304](https://arxiv.org/abs/2502.09304) |
| HGMem (Zhou et al., 2025) | [arXiv:2512.23959](https://arxiv.org/abs/2512.23959) |
| LinearRAG (Zhuang et al., 2025) | [arXiv:2510.10114](https://arxiv.org/abs/2510.10114) |
| GFM-RAG (Luo et al., 2025) | [arXiv:2502.01113](https://arxiv.org/abs/2502.01113) |
| G-reasoner (Luo et al., 2025) | [arXiv:2509.24276](https://arxiv.org/abs/2509.24276) |
| Graphusion (Yang et al., 2024) | [arXiv:2407.10794](https://arxiv.org/abs/2407.10794) |
| Youtu-GraphRAG (Dong et al., 2025) | [arXiv:2508.19855](https://arxiv.org/abs/2508.19855) |
| AutoGraph-R1 (Tsang et al., 2025) | [arXiv:2510.15339](https://arxiv.org/abs/2510.15339) |
| Agentic-KGR (Li et al., 2025) | [arXiv:2510.09156](https://arxiv.org/abs/2510.09156) |
| Structure Guided Prompt (EMNLP 2024) | [ACL Anthology](https://aclanthology.org/2024.emnlp-main.528.pdf) |
| OG-RAG (Sharma et al., 2024) | [arXiv:2412.15235](https://arxiv.org/abs/2412.15235) |
| Ontology Learning (da Cruz et al., 2025) | [arXiv:2511.05991](https://arxiv.org/abs/2511.05991) |
| LogicRAG (Chen et al., 2025) | [arXiv:2508.06105](https://arxiv.org/abs/2508.06105) |
| AGRAG (Wang et al., 2025) | [arXiv:2511.05549](https://arxiv.org/abs/2511.05549) |
| SubgraphRAG (Li et al., 2024) | [arXiv:2410.20724](https://arxiv.org/abs/2410.20724) |
| GNN-RAG (Mavromatis & Karypis, 2024) | [arXiv:2405.20139](https://arxiv.org/abs/2405.20139) |
| QA-GNN (NAACL 2021) | [ACL Anthology](https://aclanthology.org/2021.naacl-main.45/) |

### Извлечение / Knowledge Retrieval

| Работа | Ссылка |
|--------|--------|
| Think-on-Graph (Sun et al., 2024) | [arXiv:2307.07697](https://arxiv.org/abs/2307.07697) |
| Think-on-Graph 2.0 (Ma et al., 2024) | [arXiv:2407.10805](https://arxiv.org/abs/2407.10805) |
| PathRAG (Chen et al., 2025) | [arXiv:2502.14902](https://arxiv.org/abs/2502.14902) |
| Graph-CoT (Jin et al., 2024) | [arXiv:2404.07103](https://arxiv.org/abs/2404.07103) |
| GCR (Luo et al., 2024) | [arXiv:2410.13080](https://arxiv.org/abs/2410.13080) |
| PolyG (Liu et al., 2025) | [arXiv:2504.02112](https://arxiv.org/abs/2504.02112) |
| HybGRAG (Lee et al., 2024) | [arXiv:2412.16311](https://arxiv.org/abs/2412.16311) |
| GraphSearch (Yang et al., 2025) | [arXiv:2509.22009](https://arxiv.org/abs/2509.22009) |
| KG²RAG (Zhu et al., 2025) | [arXiv:2502.06864](https://arxiv.org/abs/2502.06864) |
| G-Retriever (He et al., 2024) | [arXiv:2402.07630](https://arxiv.org/abs/2402.07630) |
| GraphCoder (Liu et al., 2024) | [arXiv:2406.07003](https://arxiv.org/abs/2406.07003) |
| KnowGPT (NeurIPS 2024) | [OpenReview](https://openreview.net/forum?id=PacBluO5m7) |
| RuleRAG (Chen et al., 2024) | [arXiv:2410.22353](https://arxiv.org/abs/2410.22353) |
| GNN-Ret (Li et al., 2024) | [arXiv:2406.06572](https://arxiv.org/abs/2406.06572) |
| HippoRAG (NeurIPS 2024) | [NeurIPS](https://papers.nips.cc/paper_files/paper/2024/hash/6ddc001d07ca4f319af96a3024f6dbd1-Abstract-Conference.html) |
| PullNet (EMNLP 2019) | [ACL Anthology](https://aclanthology.org/D19-1242/) |
| Reasoning on Graphs (ICLR 2024) | [OpenReview](https://openreview.net/forum?id=ZGNWW7xZ6Q) |
| StructGPT (EMNLP 2023) | [ACL Anthology](https://aclanthology.org/2023.emnlp-main.574/) |
| KG-GPT (EMNLP 2023) | [ACL Anthology](https://aclanthology.org/2023.findings-emnlp.631/) |
| GeAR (Shen et al., 2024) | [arXiv:2412.18431](https://arxiv.org/abs/2412.18431) |

### Интеграция / Knowledge Integration

| Работа | Ссылка |
|--------|--------|
| MemoRAG (Qian et al., 2024) | [arXiv:2409.05591](https://arxiv.org/abs/2409.05591) |
| StructRAG (Li et al., 2024) | [arXiv:2410.08815](https://arxiv.org/abs/2410.08815) |
| Plan-on-Graph (Chen et al., 2024) | [arXiv:2410.23875](https://arxiv.org/abs/2410.23875) |
| KGR / Retrofitting (Guan et al., 2023) | [arXiv:2311.13314](https://arxiv.org/abs/2311.13314) |
| GraphRAG-FI (Guo et al., 2025) | [arXiv:2503.13804](https://arxiv.org/abs/2503.13804) |
| GraphGPT (SIGIR 2024) | [ACM DL](https://dl.acm.org/doi/10.1145/3626772.3657775) |
| MuseGraph (Tan et al., 2024) | [arXiv:2403.04780](https://arxiv.org/abs/2403.04780) |

### Доменные применения

| Работа | Ссылка |
|--------|--------|
| MedGraphRAG (Wu et al., 2024) | [arXiv:2408.04187](https://arxiv.org/abs/2408.04187) |
| MedRAG (Zhao et al., 2025) | [arXiv:2502.04413](https://arxiv.org/abs/2502.04413) |
| HyKGE (Jiang et al., 2023) | [arXiv:2312.15883](https://arxiv.org/abs/2312.15883) |
| MEG (Cabello et al., 2024) | [arXiv:2411.03883](https://arxiv.org/abs/2411.03883) |
| CancerKG.ORG (Gubanov et al., 2024) | [arXiv:2501.00223](https://arxiv.org/abs/2501.00223) |
| RiTeK (Huang et al., 2024) | [arXiv:2410.13987](https://arxiv.org/abs/2410.13987) |
| EWEK-QA (ACL 2024) | [ACL Anthology](https://aclanthology.org/2024.acl-long.764/) |
| CodexGraph (Liu et al., 2024) | [arXiv:2408.03910](https://arxiv.org/abs/2408.03910) |
| ATLANTIC (Munikoti et al., 2023) | [arXiv:2311.12289](https://arxiv.org/abs/2311.12289) |
| CG-RAG (Hu et al., 2025) | [arXiv:2501.15067](https://arxiv.org/abs/2501.15067) |
| PersonaAgent (Liang et al., 2025) | [arXiv:2511.17467](https://arxiv.org/abs/2511.17467) |
| Knowledge Graph Prompting (AAAI 2024) | [ACM DL](https://dl.acm.org/doi/10.1609/aaai.v38i17.29889) |
```