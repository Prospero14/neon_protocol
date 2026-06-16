# Neon Protocol — бэклог

Актуальный список задач (обновлено 2026-06-17). Детали архитектуры: [ARCHITECTURE.md](./ARCHITECTURE.md), аудит: [SOLID_AUDIT.md](./SOLID_AUDIT.md).

---

## Сделано недавно

| Задача | Статус |
|--------|--------|
| Coop live-матчи в SQLite (`CoopLiveMatch`) | ✅ |
| `server/coop/coopMatchStore.ts` — persist/load матчей | ✅ |
| `server/coop/coopMatchEngine.ts` — логика боя (intent, parallel window) | ✅ |
| `server/databasePath.ts` — `NEON_DATA_DIR`, `/data` на Amvera | ✅ |
| Client `tsc` в `npm run build` | ✅ |
| `docs/PITCH.md` | ✅ |
| `server/services/nriCombatantRoutes.ts` — CRUD боевиков вынесен из `nriService` | ✅ |
| HTTP-тест persist матча + 116 unit/integration тестов | ✅ |
| `server/coop/mountCoopRoutes.ts` — все `/neon_v1/coop/*` вынесены из `createApp.ts` | ✅ |
| Серверная валидация `activeConditions` (`validateSheetConditions`) | ✅ |

---

## P0 — стабильность и контракты

| # | Задача | Зачем | Оценка |
|---|--------|-------|--------|
| 1 | **OpenAPI или Zod-схемы** для `/neon_v1/auth/*`, `game/sync`, ключевых NRI routes | Регрессии при рефакторинге | 2–3 дня |
| 2 | **Тип `GameSyncPayload`** вместо `any` в sync | LSP, меньше silent-багов | 1 день |

---

## P1 — разрезание god-модулей

| # | Модуль | Следующий срез | Уже вынесено |
|---|--------|----------------|--------------|
| 4 | `nriService.ts` (~2900 строк) | `nriPlayerRoutes`, `nriIceWalletRoutes`, `nriPresetRoutes` | `nriItemTransfer`, `nriLoreTravel`, `nriCombatantRoutes`, `nriItemConsumeServer` |
| 5 | `createApp.ts` (~300 строк) | `routes/auth.ts` | coop engine + match store + `mountCoopRoutes` |
| 6 | `useGameState.ts` (~1900 строк) | `useNriSession`, `useCoopLobby`, `useSoloProgress` | — |
| 7 | `nriApi.ts` (~1400 строк) | `nriApi/session.ts`, `players.ts`, `map.ts` | — |

---

## P2 — продукт и кооп

| # | Задача | Примечание |
|---|--------|------------|
| 8 | Coop **party** persist (опционально) | Сейчас party восстанавливается из матча; invite после рестарта — заново heartbeat |
| 9 | Coop **чат лобби** в Prisma или Redis | Сейчас in-memory, последние 120 сообщений |
| 10 | **Горизонтальное масштабирование** coop SSE | `matchSseByMatchId` привязан к инстансу |
| 11 | `useNpcDialogue` — пул **repeat** с `requireCompletedQuestId` на узлах | Диалоги уже передают gate в `addNode`, UI не фильтрует |

---

## P3 — инфра и миграция

| # | Задача | Примечание |
|---|--------|------------|
| 12 | Postgres вместо SQLite (prod) | См. ARCHITECTURE §8 |
| 13 | Monorepo `apps/web` + `apps/api` | После стабилизации API-контрактов |
| 14 | E2E (Playwright): login → NRI стол → use item | Дополнение к Vitest |
| 15 | `npm run typecheck:client` в CI отдельным job | Уже входит в `build` |

---

## Технический долг (низкий приоритет)

- Дублирование sequential vs parallel action handlers в `mountCoopRoutes` match/action (можно свести к engine)
- `NriMasterStatusPanel`: фильтр хоста по `hostUserId` из session (сейчас весь roster)
- Prettier / единый line ending (LF vs CRLF warnings в git)
- Удалить `tmp/*.mjs` из рабочей копии (не коммитить)

---

## Метрики «здоровья» (целевые)

| Метрика | Сейчас | Цель |
|---------|--------|------|
| `nriService.ts` строк | ~2920 | < 800 на файл |
| `createApp.ts` строк | ~298 | < 400 (+ mount*) |
| `useGameState.ts` строк | ~1900 | < 600 на хук |
| Vitest тесты | 121 | расти с каждым API-slice |
| `npm run build` | зелёный | обязательно в CI |

---

*Коммиты: `a8e9e46` — mountCoopRoutes; `…` — validateSheetConditions.*
