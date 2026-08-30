<a id="us-ops.restore.from-backup"></a>

# US-ops.restore.from-backup — Восстановление контура из резервной копии

```gherkin
@US-ops.restore.from-backup @P2 @ops
Feature: US-ops.restore.from-backup Администратор восстанавливает контур из резервной копии (restore-тест)

  Background:
    Given администратор авторизован через корпоративный SSO (BR-constraint.sso-readonly-access)
    And бэкапы Neo4j выполняются (dump/backup, ADR-IMPL.DATA.graph-storage)

  Scenario: Восстановление из бэкапа
    Given контур недоступен или данные повреждены
    When администратор восстанавливает из резервной копии (dump Neo4j)
    Then система разворачивается из бэкапа и обслуживает запросы (RTO ≤ 15 мин на инцидент, бюджет простоя ≤ 15 мин/день, REQ-NFR-api.availability.downtime-budget)
    And эталонные кейсы K1/K4/K5/K17 проходят на восстановленном контуре

  Scenario: Плановый restore-тест (верификация восстанавливаемости)
    Given наступил период планового restore-теста (ежеквартально)
    When администратор выполняет restore-тест в CI
    Then восстанавливаемость подтверждена: развёртывание из бэкапа + прогон эталонных кейсов
```
