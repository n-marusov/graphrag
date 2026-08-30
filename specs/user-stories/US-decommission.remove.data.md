<a id="us-decommission.remove.data"></a>

# US-decommission.remove.data — Удаление данных инстанса

```gherkin
@US-decommission.remove.data @P2 @decommission
Feature: US-decommission.remove.data Администратор удаляет данные и тома инстанса (вывод из эксплуатации)

  Background:
    Given администратор авторизован через корпоративный SSO (BR-constraint.sso-readonly-access)
    And исходные данные находятся в GitLab/S3 (источник правды, вне системы)

  Scenario: Удаление данных инстанса
    Given принято решение о полном выводе инстанса из эксплуатации
    When администратор удаляет образы и тома (Docker Compose down -v / docker volume rm)
    Then данные инстанса (индекс, граф, логи, конфигурация) удалены
    And исходные данные в GitLab/S3 не затронуты (система — производный индекс)

  Scenario: Удаление без риска для исходных данных
    Given данные инстанса удалены
    When проверяется полнота удаления
    Then подтверждено: исходные артефакты остались в GitLab/S3; доступы отозваны; риск потери исходных данных отсутствует (open-questions.md Q2.5)
```
