<a id="us-decommission.stop.instance"></a>

# US-decommission.stop.instance — Остановка инстанса системы

```gherkin
@US-decommission.stop.instance @P2 @decommission
Feature: US-decommission.stop.instance Администратор останавливает инстанс системы (вывод из эксплуатации)

  Background:
    Given администратор авторизован через корпоративный SSO (BR-constraint.sso-readonly-access)
    And исходные данные находятся в GitLab/S3 (источник правды, вне системы)

  Scenario: Остановка стека
    Given принято решение о выводе инстанса из эксплуатации
    When администратор выполняет остановку стека (Docker Compose down)
    Then инстанс остановлен; пользователи уведомлены о прекращении обслуживания
    And исходные данные в GitLab/S3 не затронуты

  Scenario: Остановка без потери исходных данных
    Given инстанс остановлен
    When проверяется полнота вывода
    Then подтверждено: исходные артефакты остались в GitLab/S3 (система — производный индекс, vision §2.7 п.1)
```
