# Neon Protocol — Constitution

Неизменяемые принципы платформы. Спеки `001`–`008` не могут им противоречить без явного решения оператора.

## Северная звезда

Neon Protocol — «операционная система» киберпанк-сессий: один аккаунт, три режима (Solo / Coop / NRI), общий auth и sync. Ощущение мегаполиса — через иерархию и плотность информации, не через количество отрисованных домиков.

## MUST

1. **Merge, не replace** — патч `game/sync` и `syncGameState` всегда через `mergeGameStatePatch(prev, patch)`; на сервере `clientSnapshot` — `{ ...prev, ...body }`.
2. **Sanitize после чтения** — login, reload из `neon_user`, ответ sync: `sanitizeClientGameState(...)` из `saveHydrationGuards.ts`.
3. **Новые поля-массивы в save** — в `sanitizeClientGameState` через `asStringArray` / `hydrateDeckEntries` / `asQuestStates`; не полагаться только на типы TS.
4. **Нормализаторы** — если `normalizeCoopClassProfiles` (или аналог) вернул `{}` / `[]`, не подставлять сырой corrupt-объект из save.
5. **`Array.isArray` перед spread/map** — для данных из save, API, `JSON.parse`, hash-route auto-join.
6. **NRI auto-join** — только после `hydrationReady` в `useNriSession`; не вызывать частичный `syncGameState` до полной гидрации.
7. **Стабильные HTTP-контракты** — `/neon_v1/auth/login`, `/register`, `/game/sync` совместимы с `AuthForm` / `AuthContext`.
8. **Стабильные id** — `QuestDefinition.id`, `completeQuestId`, NPC, узлы карты, API-маршруты не переименовывать без миграции контента и сейвов.
9. **Минимальный diff** — менять только файлы, нужные задаче; повторять стиль соседнего кода.
10. **Проверка перед коммитом save** — тест на corrupt shape в `saveHydrationGuards.test.ts`; `npm test` + `npm run build`. Не коммитить `dev.db`, `tmp/`, личные артефакты.

## MUST NOT

1. Частичный `syncGameState({ sessionMode, nriInviteCode, currentView })` до полной гидрации.
2. Spread итерируемых полей save без `asStringArray` / проверки массива.
3. Fallback на сырой corrupt после неудачного normalize.
4. Дублировать канонические хелперы (`saveHydrationGuards`, `coopClassProfiles`, `mergeGameStatePatch`) в новых модулях.
5. Ломать коды ошибок API (`NRI_*`, `SYNC_*`), которые парсит клиент.
6. Рефакторить «заодно» соседний код без запроса.

## Канонические хелперы

| Модуль | Функции |
|--------|---------|
| `saveHydrationGuards.ts` | `asStringArray`, `sanitizeClientGameState`, `hydrateDeckEntries`, `parseSoloRuntimeCache` |
| `coopClassProfiles.ts` | `normalizeCoopClassProfiles`, `applyCoopClassSave` |
| `AuthContext.tsx` | `mergeGameStatePatch` + sanitize на каждом пути записи |

## Режимы (границы доменов)

| Режим | `sessionMode` | Спека |
|-------|---------------|-------|
| Solo | `solo` | [002-solo-campaign](./002-solo-campaign/) |
| Coop | `coop` | [003-coop-mode](./003-coop-mode/) |
| NRI | `nri` | [004-nri-table](./004-nri-table/) (+ map/art 005–006) |

Платформа (auth, sync, деплой, стек): [001-platform-core](./001-platform-core/).

## SDD-дисциплина

- Продуктовые изменения → сначала `specs/NNN-*/spec.md`, затем код.
- Новая крупная фича → новый `specs/NNN-slug/`.
- Агент-правило: `.cursor/rules/sdd-workflow.mdc`.
