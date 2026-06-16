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

---

## P0 — стабильность и контракты

| # | Задача | Зачем | Оценка |
|---|--------|-------|--------|
| 1 | **`mountCoopRoutes.ts`** — вынести все `/neon_v1/coop/*` из `createApp.ts` | SRP, проще тестировать лобби | 1–2 дня |
| 2 | **Серверная валидация condition id** при PATCH листа / мастерских статусов | Античит, единый домен `shared/nri-domain` | 0.5 дня |
| 3 | **OpenAPI или Zod-схемы** для `/neon_v1/auth/*`, `game/sync`, ключевых NRI routes | Регрессии при рефакторинге | 2–3 дня |
| 4 | **Тип `GameSyncPayload`** вместо `any` в sync | LSP, меньше silent-багов | 1 день |

---

## P1 — разрезание god-модулей

| # | Модуль | Следующий срез | Уже вынесено |
|---|--------|----------------|--------------|
| 5 | `nriService.ts` (~2900 строк) | `nriPlayerRoutes`, `nriIceWalletRoutes`, `nriPresetRoutes` | `nriItemTransfer`, `nriLoreTravel`, `nriCombatantRoutes`, `nriItemConsumeServer` |
| 6 | `createApp.ts` (~1100 строк) | `routes/auth.ts`, `mountCoopRoutes` | coop engine + match store |
| 7 | `useGameState.ts` (~1900 строк) | `useNriSession`, `useCoopLobby`, `useSoloProgress` | — |
| 8 | `nriApi.ts` (~1400 строк) | `nriApi/session.ts`, `players.ts`, `map.ts` | — |

---

## P2 — продукт и кооп

| # | Задача | Примечание |
|---|--------|------------|
| 9 | Coop **party** persist (опционально) | Сейчас party восстанавливается из матча; invite после рестарта — заново heartbeat |
| 10 | Coop **чат лобби** в Prisma или Redis | Сейчас in-memory, последние 120 сообщений |
| 11 | **Горизонтальное масштабирование** coop SSE | `matchSseByMatchId` привязан к инстансу |
| 12 | `useNpcDialogue` — пул **repeat** с `requireCompletedQuestId` на узлах | Диалоги уже передают gate в `addNode`, UI не фильтрует |

---

## P3 — инфра и миграция

| # | Задача | Примечание |
|---|--------|------------|
| 13 | Postgres вместо SQLite (prod) | См. ARCHITECTURE §8 |
| 14 | Monorepo `apps/web` + `apps/api` | После стабилизации API-контрактов |
| 15 | E2E (Playwright): login → NRI стол → use item | Дополнение к Vitest |
| 16 | `npm run typecheck:client` в CI отдельным job | Уже входит в `build` |

---

## Технический долг (низкий приоритет)

- Дублирование sequential vs parallel action handlers в `createApp` match/action (можно свести к engine)
- `NriMasterStatusPanel`: фильтр хоста по `hostUserId` из session (сейчас весь roster)
- Prettier / единый line ending (LF vs CRLF warnings в git)
- Удалить `tmp/*.mjs` из рабочей копии (не коммитить)

---

## Метрики «здоровья» (целевые)

| Метрика | Сейчас | Цель |
|---------|--------|------|
| `nriService.ts` строк | ~2920 | < 800 на файл |
| `createApp.ts` строк | ~1100 | < 400 (+ mount*) |
| `useGameState.ts` строк | ~1900 | < 600 на хук |
| Vitest тесты | 116 | расти с каждым API-slice |
| `npm run build` | зелёный | обязательно в CI |

---

*Коммиты: `4cd3cb9` — coop persist + pitch; следующий — refactor coop engine + combatant routes.*
