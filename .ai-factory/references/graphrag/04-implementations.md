# Реализации и Open-Source проекты GraphRAG

> **Источники:** [microsoft/graphrag](https://github.com/microsoft/graphrag), [DEEP-PolyU/Awesome-GraphRAG](https://github.com/DEEP-PolyU/Awesome-GraphRAG), [pengboci/GraphRAG-Survey](https://github.com/pengboci/GraphRAG-Survey)
> **Создано:** 2026-08-29

---

## 1. Флагманские реализации

| Проект | Репозиторий | Язык | Ключевые особенности |
|--------|------------|------|----------------------|
| **Microsoft GraphRAG** | [microsoft/graphrag](https://github.com/microsoft/graphrag) | Python | Официальная реализация foundational paper. Entity extraction + Leiden communities + map-reduce Q&A. Модульная архитектура. |
| **Nano-GraphRAG** | [gusye1234/nano-graphrag](https://github.com/gusye1234/nano-graphrag) | Python | Простая, легко модифицируемая реализация для экспериментов |
| **Fast GraphRAG** | [circlemind-ai/fast-graphrag](https://github.com/circlemind-ai/fast-graphrag) | Python | Адаптивная система, автоматически подстраивающаяся под use case, данные и запросы |
| **LightRAG** | [HKUDS/LightRAG](https://github.com/HKUDS/LightRAG) | Python | Dual-level retrieval, incremental updates, значительно быстрее MS GraphRAG |
| **DIGIMON** | [JayLZhou/GraphRAG](https://github.com/JayLZhou/GraphRAG) | Python | Унифицированный модульный framework для всех GraphRAG методов |
| **GraphRAG-SDK** | [FalkorDB/GraphRAG-SDK](https://github.com/FalkorDB/GraphRAG-SDK) | Python | Специализированный toolkit для построения GraphRAG систем (на базе FalkorDB) |
| **HuixiangDou2** | [tpoisonooo/HuixiangDou2](https://github.com/tpoisonooo/HuixiangDou2) | Python | Robustly Optimized GraphRAG |
| **Semantica** | [Hawksight-AI/semantica](https://github.com/Hawksight-AI/semantica) | Python | Production-ready semantic layer + GraphRAG framework |
| **ApeRAG** | [apecloud/ApeRAG](https://github.com/apecloud/ApeRAG) | Python | Production-ready с multi-modal indexing, AI agents, MCP, K8s |

## 2. Knowledge Graph Infrastructure

| Проект | Репозиторий | Назначение |
|--------|------------|------------|
| **Graphiti** | [getzep/graphiti](https://github.com/getzep/graphiti) | Real-time KG construction для AI agents |
| **Cognee** | [topoteretes/cognee](https://github.com/topoteretes/cognee) | Memory engine: ECL pipeline, графовый + векторный retrieval для AI agents |
| **VeritasGraph** | [bibinprathap/VeritasGraph](https://github.com/bibinprathap/VeritasGraph) | GraphRAG pipeline с Ollama (локально) и полной атрибуцией источников |

## 3. Специализированные реализации

| Проект | Домен | Репозиторий |
|--------|-------|------------|
| **Code-Graph-RAG** | Код/Software | [vitali87/code-graph-rag](https://github.com/vitali87/code-graph-rag) — Tree-sitter + KG + MCP server |
| **Agentic-RAG** | Общий | [chensyCN/Agentic-RAG](https://github.com/chensyCN/Agentic-RAG) — чистый расширяемый agentic RAG |

## 4. Бенчмарки и оценка

### Основные бенчмарки

| Бенчмарк | Тип задач | Ключевая работа |
|----------|-----------|-----------------|
| **GraphRAG-Bench** | Иерархический retrieval + reasoning (4 типа сложности) | [GraphRAG-Bench](https://github.com/GraphRAG-Bench/GraphRAG-Benchmark) · [arXiv:2506.05690](https://arxiv.org/abs/2506.05690) |
| **PolyG / PolyBench** | 4-классовая таксономия вопросов к графам | [PolyG](https://github.com/Liu-rj/PolyG) · [arXiv:2504.02112](https://arxiv.org/abs/2504.02112) |
| **GRBench** | 1,740 вопросов на 10 доменных графах | Graph-CoT · [arXiv:2404.07103](https://arxiv.org/abs/2404.07103) |
| **MultiHop-RAG** | Multi-hop retrieval + reasoning | [MultiHop-RAG](https://github.com/yixuantt/MultiHop-RAG/) · [arXiv:2401.15391](https://arxiv.org/abs/2401.15391) |
| **DIGIMON** | Large-scale GraphRAG evaluation | DIGIMON · [arXiv:2503.04338](https://arxiv.org/abs/2503.04338) |

### Стандартные QA бенчмарки, используемые для оценки GraphRAG

| Бенчмарк | Тип | Характеристика |
|----------|-----|----------------|
| **WebQSP** | Simple QA | 4,737 вопросов, Freebase KG |
| **CWQ** (Complex WebQuestions) | Multi-hop QA | 34,689 вопросов, до 4-hop reasoning |
| **MetaQA** | Multi-hop QA | 400K+ вопросов, 1-3 hop |
| **HotpotQA** | Multi-hop QA | 113K вопросов, 2-hop |
| **2WikiMultihopQA** | Multi-hop QA | 2-hop вопросы над Wikipedia |
| **MuSiQue** | Multi-hop QA | Многошаговые вопросы (2-4 hop) |
| **GrailQA** | Domain QA | 64,331 вопросов, Freebase |
| **Mintaka** | Domain QA | 20K вопросов, Wikidata |
| **KQAPro** | Complex QA | 120K вопросов, программная генерация |

### Медицинские бенчмарки

| Бенчмарк | Характеристика |
|----------|----------------|
| **DDXPlus** | Дифференциальная диагностика |
| **CPDD** | Хроническая боль (Tan Tock Seng Hospital) |
| **TutorQA** | 6 задач, 1,200 QA пар (Graphusion) |
| **RiTeK** | Сложное reasoning над медицинскими TKGs |

## 5. Сравнение производительности (из литературы)

### Индексация

| Система | Относительная скорость | Ключевой фактор |
|---------|----------------------|-----------------|
| E²GraphRAG | **10x** быстрее MS GraphRAG | Summary tree + SpaCy (без LLM для графа) |
| LightRAG | Быстрее MS GraphRAG | Dual-level, incremental updates |
| KET-RAG | Comparable quality, **10x** дешевле индексация | Multi-granular: skeleton KG + bipartite graph |
| LinearRAG | Линейное масштабирование | Relation-free граф |

### Retrieval

| Система | Относительная скорость |
|---------|----------------------|
| E²GraphRAG | **100x** быстрее LightRAG |
| LightRAG | Значительно быстрее MS GraphRAG |
| MixPR | CPU-only, миллионы токенов за секунды |

### Качество (F1 / Win Rate)

| Система | 2Wiki | HotpotQA | CWQ | WebQSP |
|---------|-------|----------|-----|--------|
| KAG | +19.6% над RAG | +33.5% над RAG | — | — |
| GNN-RAG | — | — | SOTA (7B LLM) | SOTA (7B LLM) |
| ToG | — | SOTA (6/9 datasets) | SOTA | SOTA |
| PathRAG | SOTA (6 datasets, 5 metrics) | — | — | — |

## 6. Ресурсы для отслеживания

| Ресурс | Ссылка |
|--------|--------|
| Daily arXiv papers | [bansky-cl/graphrag-arxiv-daily-paper](https://github.com/bansky-cl/graphrag-arxiv-daily-paper) |
| Survey-88 (88-page survey) | [moqingxinai/GraphRAG-survey-88](https://github.com/moqingxinai/GraphRAG-survey-88) |
| Community collection | [Graph-RAG/GraphRAG](https://github.com/Graph-RAG/GraphRAG) |
| Awesome-GraphRAG | [DEEP-PolyU/Awesome-GraphRAG](https://github.com/DEEP-PolyU/Awesome-GraphRAG) |
| Microsoft Research Blog | [GraphRAG: Unlocking LLM Discovery](https://www.microsoft.com/en-us/research/blog/graphrag-unlocking-llm-discovery-on-narrative-private-data/) |

## 7. Интеграции

Microsoft GraphRAG интегрирован в:
- **LangChain** (langchain_graphrag)
- **LlamaIndex** (llama-index-graphrag)
- **NebulaGraph** (nebula-graphrag)
- **Neo4j** (neo4j-graphrag)