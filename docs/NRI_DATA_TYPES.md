# NRI — типы данных сервиса

> Справочник полей API и Prisma для стола Carbon 2185.  
> Рядом: [SOLID_AUDIT.md](./SOLID_AUDIT.md) · [ARCHITECTURE.md](./ARCHITECTURE.md) §4.3

Префикс HTTP: `/neon_v1/services/nri/:code/...` (`:code` = invite, напр. `NRI-JB5X`).

---

## Сессия (`NriSession`)

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | `string` (uuid) | PK |
| `inviteCode` | `string` | Уникальный код стола |
| `hostUserId` | `string` | User.id мастера |
| `title` | `string` | Название стола (≤80 при create) |
| `chatRoomId` | `string` | ChatRoom.id (`kind: nri`) |
| `status` | `'open' \| 'closed'` | |
| `spamBotEnabled` | `boolean` | SPAM-бот в чате стола |
| `liveDialogEnabled` | `boolean` | Реплики НПС — попап перед лентой |
| `spamPausedUntil` | `DateTime?` | Антиспам игроков |

---

## Узел сценария (`NriScenarioNode`)

| Поле | Тип | Лимит | Кто видит |
|------|-----|-------|-----------|
| `id` | `string` | uuid | — |
| `sessionId` | `string` | | — |
| `parentId` | `string?` | | `null` = корень (один на стол) |
| `title` | `string` | 120 | Мастер + индекс `[[ссылок]]` |
| `summary` | `string` | 600 | **Игроки** — попап в чате |
| `body` | `string` | 20000 | **Только мастер** |
| `sortOrder` | `number` | int | порядок среди siblings |
| `links` | `Json` → `NriScenarioLinks` | см. ниже | мастер |

### `NriScenarioLinks`

| Поле | Тип | Описание |
|------|-----|----------|
| `npcIds` | `string[]` | НПС стола |
| `catalogIds` | `string[]` | id из `nri-item-catalog.json` |
| `fileIds` | `string[]` | NriVaultFile.id |
| `syncToLore` | `boolean?` | Дублировать карточку места в лор |
| `lorePlaceId` | `string?` | Связанная NriLorePlace |
| `placeTitle` | `string?` | Название места (≤120) |
| `mapMarkerId` | `string?` | Маркер на карте |
| `zoneKey` | `string?` | NriMapZone.zoneKey |
| `meetCheckpoint` | `boolean?` | Все игроки в zoneKey + текущий пункт |

Валидация: `shared/nri-domain/scenarioSchema.ts`.

---

## Лор

| Модель | Краткое (`summary`) | Полное (`body` / `description`) | Карточка чата |
|--------|---------------------|----------------------------------|---------------|
| `NriLorePlace` | ✓ | `body` | `kind: place` |
| `NriFaction` | ✓ | `description` | `kind: faction` |
| `NriLoreEntry` | ✓ | `body` | `kind: entry` |
| `NriScenarioNode` | ✓ | `body` (мастер) | `kind: scenario` |

`GET .../lore/cards` → `{ cards: LoreCardRef[] }` — только `title` + `summary`.

---

## Чат (сообщение от НПС)

Мастер: `POST /neon_v1/services/chat/rooms/:roomId/messages` с `{ text, asNpcId, nriCode? }`.

| Поле ответа | Тип | Описание |
|-------------|-----|----------|
| `isNpc` | `boolean` | true |
| `npcId` | `string?` | NriNpc.id |
| `npcName` | `string?` | displayName |
| `npcImageUrl` | `string?` | portrait |
| `npcArchetype` | `string?` | из sheet |
| `text` | `string` | ≤500 |
| `ts` | `number` | ms |

При `liveDialogEnabled` клиент показывает `NriLiveDialogPopup` до появления в ленте.

---

## Прогресс сценария (`NriScenarioProgress`)

| Поле | Тип |
|------|-----|
| `sessionId` | `string` (PK) |
| `currentScriptNodeId` | `string?` |
| `completedNodeIds` | `string[]` (Json) |

---

## Коды ошибок API

Формат ответа: `{ "code": "NRI_…", "message": "…", "error": "…" }` — `message` и `error` совпадают.

**В UI клиент показывает:** `[CODE] сообщение` — см. `formatNriApiError` в `src/logic/nriApi/http.ts`.

### Общие (все зоны NRI)

| Код | HTTP | Сообщение (пример) |
|-----|------|---------------------|
| `NRI_NO_TOKEN` | 401 | Нет токена авторизации. |
| `NRI_USER_NOT_FOUND` | 401 | Пользователь не найден. |
| `NRI_NOT_FOUND` | 404 | Стол не найден. |
| `NRI_HOST_ONLY` | 403 | Доступно только мастеру. |
| `NRI_NOT_HOST` | 403 | Действие только для мастера стола. |

### Сценарий / квест (`/scenario`)

| Код | HTTP | Когда |
|-----|------|-------|
| `NRI_SCENARIO_TITLE_REQUIRED` | 400 | Пустой или отсутствующий `title` при создании |
| `NRI_SCENARIO_TITLE_STRING` | 400 | `title` не строка |
| `NRI_SCENARIO_SUMMARY_STRING` | 400 | `summary` не строка |
| `NRI_SCENARIO_BODY_STRING` | 400 | `body` не строка |
| `NRI_SCENARIO_LINKS_OBJECT` | 400 | `links` не объект |
| `NRI_SCENARIO_SORT_NUMBER` | 400 | `sortOrder` не число |
| `NRI_SCENARIO_PARENT_STRING` | 400 | `parentId` не строка и не null |
| `NRI_SCENARIO_ROOT` | 400 | Второй корневой узел |
| `NRI_SCENARIO_PARENT` | 404 | `parentId` не найден в столе |
| `NRI_SCENARIO_NOT_FOUND` | 404 | `nodeId` не найден |
| `NRI_SCENARIO_CYCLE` | 400 | Узел — родитель сам себе |
| `NRI_SCENARIO_GET_FAILED` | 500 | Ошибка чтения |
| `NRI_SCENARIO_CREATE_FAILED` | 500 | Ошибка создания |
| `NRI_SCENARIO_PATCH_FAILED` | 500 | Ошибка сохранения |
| `NRI_SCENARIO_DELETE_FAILED` | 500 | Ошибка удаления |

### Живой диалог / SPAM

| Код | HTTP | Когда |
|-----|------|-------|
| `NRI_LIVE_DIALOG_ENABLED_REQUIRED` | 400 | `enabled` не boolean |
| `NRI_LIVE_DIALOG_FAILED` | 500 | Не удалось переключить |
| `NRI_SPAM_FLAG_REQUIRED` | 400 | `enabled` не boolean |
| `NRI_TABLE_CLOSED` | 400 | Стол закрыт |

---

## Файлы

| Назначение | Путь |
|------------|------|
| Prisma | `prisma/schema.prisma` |
| Bootstrap SQLite | `server/services/nriSchemaBootstrap.ts` |
| Роуты сценария | `server/services/nriScenarioRoutes.ts` |
| Валидация | `shared/nri-domain/scenarioSchema.ts`, `scenarioLinks.ts` |
| Карточки чата | `shared/nri-domain/loreCards.ts` |
| UI сценарий | `src/components/NriScenarioPanel.tsx` |
| UI живой диалог | `src/components/NriLiveDialogPopup.tsx` |
