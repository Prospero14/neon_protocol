# Java junior: миссия BANK-JU-001 — карточные решения (≥2 пути)

> Внутренняя спека авторов; игроковская «дока по картам» — экран **Documentation** в клиенте.

Миссия: **сумма списка сумм за день**; edge — **пустой список → 0**.  
Игровая проверка: цепочка карт на шине + финальный деплой-чек (`useCombatLogic.ts`).

---

## Путь A — императив (явный `if` на пустоту)

**Порядок карт (execution chain):** каждый шаг i — карта в слоте `runtimeRail[i]`.


| #   | `cardId`             | Имя в билде    | Зачем в решении           |
| --- | -------------------- | -------------- | ------------------------- |
| 1   | `syntax_package`     | PACKAGE_DECL   | пакет модуля              |
| 2   | `syntax_class_decl`  | CLASS_PUBLIC   | класс                     |
| 3   | `syntax_main_method` | STATIC_MAIN    | `main`                    |
| 4   | `syntax_list_init`   | LIST_ARRAYLIST | список сумм               |
| 5   | `syntax_if`          | IF_CONDITION   | ветка «пусто?»            |
| 6   | `fn_sysout_print`    | SYSOUT_PRINT   | печать `0`                |
| 7   | `syntax_foreach`     | FOR_EACH_LOOP  | обход при непустом списке |
| 8   | `fn_sysout_print`    | SYSOUT_PRINT   | печать итога              |


**Важно для дизайна ТЗ:** шаги 5–6 и 7–8 — **две ветки**; в данных миссии либо две отдельные цепочки квестов, либо одна цепочка с пометкой «при пустом списке играй только 1–6», иначе игроку кажется линейный абсурд. В текущем движке **одна** execution-chain не выражает if/else без дублирования шагов — см. «Сомнения» в `java_junior_missions_workbook.md` и `BRANCHING_AND_ADMIN_SITUATIONAL.md`.

**Минимальный сокращённый вариант под движок «одна линия»** (без ветки, только happy-path + отдельная миссия на empty):

1. `syntax_package`
2. `syntax_class_decl`
3. `syntax_main_method`
4. `syntax_list_init`
5. `syntax_foreach`
6. `fn_sysout_print`

Edge «пустой список» тогда закрывается **миссией QA** или второй миссией «только guard».

---

## Путь B — Stream (пустой список даёт сумму 0 без отдельного `if`)


| #   | `cardId`             | Зачем                    |
| --- | -------------------- | ------------------------ |
| 1   | `syntax_package`     | пакет                    |
| 2   | `syntax_class_decl`  | класс                    |
| 3   | `syntax_main_method` | `main`                   |
| 4   | `syntax_list_init`   | данные                   |
| 5   | `mid_stream_init`    | `stream()`               |
| 6   | `mid_stream_map`     | извлечь число / маппинг  |
| 7   | `mid_stream_collect` | сведение (в ТЗ: «сумма») |
| 8   | `fn_sysout_print`    | вывод                    |


---

## Проверка в игре (где смотреть код)

1. **Прогресс по шагам (execution chain):** в `useCombatLogic.ts` — `useEffect` на `runtimeRail`: для каждого индекса `i` карта должна входить в `getStepCardIds(missionTz.steps[i])`.
2. **Переход DEVELOPMENT → COMPILE:** при `isExecutionChain` нужен полный префикс валидных слотов подряд.
3. **Финал:** `runFinalDeploymentCheck` — `missingSteps`, `slotsOk` (`ramSlotsMax >= steps.length`), `ramOk`, `cpuOk`.

---

## Ресурсы инфры (оценка под формулы в коде)

Обозначения из `runFinalDeploymentCheck` / `ramSlotsMax`:

- `ramSlotsMax = floor(ramMaxMb / 512)` для ранга **не** `script-kiddie`.  
- Успех: `ramSlotsMax >= missionTz.steps.length`.  
- Также: `ramMaxMb >= productionCards * 256`, `cpuMax >= productionCards * 0.5` (в т.ч. `productionCards` — число code-карт на шине).

**Пример:** цепочка из **8** code-карт.

- Нужно `ramMaxMb >= 8 * 512 = 4096` МБ **или** эквивалентные инфра-карты, дающие столько RAM.  
- Грубо: **6×** `infra_basic_pod` (+512 МБ каждая) + стартовый `deckRamMb` — зависит от колоды; надёжнее **8×** `infra_basic_pod` или смесь с `infra_s3_bucket` (+1536).  
- **Кооп Admin ARCHITECTURE:** чтобы выйти из фазы, нужно **≥6** заполненных `infraSlots` (`filled >= 6` в `useCombatLogic.ts`).

**Минимально линейная выкладка админа (идея):** 6 карт инфры подряд в слоты (часть из них даёт RAM/CPU), затем COMPILE — дальше дев кладёт код.

---

## QA: какие карты логично привязать к кейсам


| Кейс                             | Примеры `cardId` из каталога QA           |
| -------------------------------- | ----------------------------------------- |
| Пустой список → 0                | `react_unit_test`, `react_boundary_case`  |
| Несколько сумм → ожидаемая сумма | `react_integration_test`, `def_validator` |
| Регресс после правки             | `react_refactoring`, `def_smoke_suite`    |


Все перечисленные id есть в `ROLE_SPECIALTY_IDS.qa` и в `COOP_QA_CATALOG_IDS` (см. `sessionMode.ts` / `deckCatalog.ts`).

---

## Admin: хватает ли карт в каталоге

Стартовый набор админа уже содержит несколько **INFRASTRUCTURE** карт (`infra_basic_pod`, `infra_dns_resolver`, …) и скрипты — см. `COOP_STARTER_IDS.admin` в `sessionMode.ts`. Для **6** слотов ARCHITECTURE обычно хватает **линейной** выкладки без редких карт, если в колоде не вырезали инфру полностью.

---

## Проверка «все карты пути в Java-каталоге коопа»

После правки `LANGUAGE_CORE_IDS.java` в `deckCatalog.ts` следующие id входят в `DEVELOPER_STACK_BROWSE_IDS.java`:

`syntax_package`, `syntax_class_decl`, `syntax_main_method`, `syntax_list_init`, `syntax_if`, `syntax_foreach`, `fn_sysout_print`, `mid_stream_init`, `mid_stream_map`, `mid_stream_collect`, …

Автотест: `javaJuniorMissionPlaybook.test.ts`.
