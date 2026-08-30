<a id="us-mcp.compile.context"></a>

# US-mcp.compile.context — Контекст для ИИ-агента через MCP

```gherkin
@US-mcp.compile.context @UC-mcp.compile.context @P0 @mcp @accessibility
Feature: US-mcp.compile.context ИИ-агент получает точный набор артефактов и фактов под задачу через MCP (F4, K17)

  Background:
    Given ИИ-агент автоматизации разработки подключён к MCP-серверу
    And агент аутентифицирован по токену (BR-constraint.sso-readonly-access)

  Scenario: Компиляция контекста под задачу
    Given агент вызывает инструмент compile_context с параметрами задачи
    When MCP-сервер исполняет компиляцию контекста (UC-context.build.generate)
    Then агент получает точный структурированный набор артефактов и фактов (ContextCompiled) вместо сырого текста
    And обращение зафиксировано в журнале аудита; выполнена фильтрация утечек

  Scenario: Ответ с grounding через MCP
    Given агент вызывает инструмент answer с вопросом
    When MCP-сервер исполняет ответ с grounding (UC-answers.grounding.cited-answer)
    Then агент получает ответ со ссылками на артефакты (QueryAnswered)

  Scenario: Нет прав / истёк токен
    Given агентский токен невалиден или истёк
    When агент вызывает инструмент MCP
    Then MCP-сервер возвращает отказ с кодом ошибки

  Scenario: Превышение rate limit
    Given агент превышает бюджет/квоту (REQ-NFR-api.performance.agent-traffic-isolation)
    When агент вызывает инструмент MCP
    Then MCP-сервер возвращает 429 / backoff с фиксацией причины

  Scenario: Промпт-инъекция через содержимое корпуса
    Given содержимое корпуса содержит попытку инъекции («игнорируй предыдущие инструкции»)
    When MCP-сервер обрабатывает запрос
    Then система детектирует инъекцию, блокирует запрос и фиксирует SecurityEventEmitted

  Scenario: Доступность статуса компиляции контекста для screen reader (a11y)
    Given пользователь использует screen reader (NVDA / VoiceOver)
    When статус компиляции контекста отображается в веб-интерфейсе
    Then ключевые элементы и статусы имеют текстовые альтернативы (WCAG 2.1 AA)
    And навигация достижима с клавиатуры (keyboard-only)
```
