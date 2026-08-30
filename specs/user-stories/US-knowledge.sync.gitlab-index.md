<a id="us-knowledge.sync.gitlab-index"></a>

# US-knowledge.sync.gitlab-index — Автоиндексация изменений GitLab

```gherkin
@US-knowledge.sync.gitlab-index @UC-knowledge.sync.gitlab-index @P0 @knowledge
Feature: US-knowledge.sync.gitlab-index Изменения спек и кода в GitLab автоматически попадают в базу знаний (F2.1)

  Background:
    Given GitLab — эталонный источник корпуса (BR-fact.gitlab-authoritative)
    And система развёрнута в защищённом контуре (Docker Compose)

  Scenario: MR в GitLab автоматически обновляет базу знаний
    Given в GitLab принят MR с изменениями спек или кода
    When система получает webhook (или выполняет периодическую diff-сверку)
    Then система инкрементально пересчитывает затронутые части графа (DocumentIngested → GraphUpdated)
    And новые ответы (F1) и анализ влияния (F3) опираются на актуальную версию источника
    And повторная обработка идемпотентна (нет дублей сущностей/утверждений)

  Scenario: Потерянный webhook — восстановление diff-сверкой
    Given webhook-событие потеряно или не доставлено
    When наступает период периодической diff-сверки
    Then система выполняет сверку и переиндексирует изменения (повторная обработка идемпотентна)

  Scenario: Удалённый документ деиндексируется
    Given документ удалён из GitLab
    When система обнаруживает удаление
    Then чанки и их вклад в граф удаляются из хранилища графа и векторов

  Scenario: Сбой LLM-извлечения при индексации
    Given при извлечении произошёл сбой LLM-контура
    When система обрабатывает документ
    Then частичный успех изолируется: успешные документы фиксируются, сбойные — в очередь на повтор (backoff)
```
