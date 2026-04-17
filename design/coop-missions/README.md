# Внутренние материалы: кооп-миссии и плейбуки

**Где живут настоящие миссии коопа в игре:** генератор `src/logic/coopYardMissions.ts` → попадает в `TZ_LIBRARY` через `combatTasks.ts`. Первые 10 junior-миссий полигона (`coop_yard_ju_001` … `010`) строятся из `JUNIOR_INTRO_CHAINS` + текстов `JUNIOR_INTRO_DESCRIPTIONS` в том же файле.

Эта папка — **черновики и разбор «как объяснить джуну»** (пример кода, два пути карт). Игрок смотрит карты в клиенте **`Documentation`** (`JAVA_REFERENCE` в коде), а текст миссии — в **боевом UI** из данных выше.

Здесь лежит **дизайн для авторов**, чтобы не потерять детали до того, как они полностью перенесены в `coopYardMissions.ts`.

| Файл | Содержание |
|------|------------|
| `java_junior_missions_workbook.md` | Тексты задач, пример кода, роли, чеклист. |
| `java_junior_card_playbooks.md` | Два и более карточных пути, инфра/QA. |
| `BRANCHING_AND_ADMIN_SITUATIONAL.md` | Ветвления (if / else if) и идеи UI/ТЗ для админа. |

Автотест на соответствие каталогу карт: `src/logic/javaJuniorMissionPlaybook.test.ts`.
