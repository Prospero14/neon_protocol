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
| `server/coop/mountCoopRoutes.ts` — все `/neon_v1/coop/*` вынесены из `createApp.ts` | ✅ |
| Серверная валидация `activeConditions` (`validateSheetConditions`) | ✅ |
| Zod auth + `game/sync` + **ключевые NRI routes** (`shared/api-schemas/nri.ts`) | ✅ |
| `nriPlayerRoutes`, `nriIceWalletRoutes`, `nriPresetRoutes` + `nriSessionHelpers` | ✅ |
| `nriMapRoutes`, `nriVaultRoutes`, `nriNpcRoutes`, `nriCyberRoutes` — map/vault/npc/cyber из `nriService` | ✅ |
| `src/logic/nriApi/session.ts`, `players.ts`, `http.ts` | ✅ (частично) |

---

## P0 — стабильность и контракты

| # | Задача | Зачем | Оценка |
|---|--------|-------|--------|
| — | *(пусто — P0 закрыт)* | | |

---

## P1 — разрезание god-модулей

| # | Модуль | Следующий срез | Уже вынесено |
|---|--------|----------------|--------------|
| 1 | `nriService.ts` (~740 строк) | scenario, vehicles, session lobby | player, ice/wallet, preset, map, vault, npc, cyber, combatant, item transfer, lore travel |
| 2 | `createApp.ts` (~298 строк) | `routes/auth.ts` | coop + mountCoopRoutes |
| 3 | `useGameState.ts` (~1900 строк) | `useNriSession`, `useCoopLobby`, `useSoloProgress` | — |
| 4 | `nriApi.ts` (~1140 строк) | wallet/map/scenario slices | session, players, http |

---

## P2 — продукт и кооп

| # | Задача | Примечание |
|---|--------|------------|
| 5 | Coop **party** persist (опционально) | Сейчас party восстанавливается из матча; invite после рестарта — заново heartbeat |
| 6 | Coop **чат лобби** в Prisma или Redis | Сейчас in-memory, последние 120 сообщений |
| 7 | **Горизонтальное масштабирование** coop SSE | `matchSseByMatchId` привязан к инстансу |
| 8 | `useNpcDialogue` — пул **repeat** с `requireCompletedQuestId` на узлах | Диалоги уже передают gate в `addNode`, UI не фильтрует |

---

## P3 — инфра и миграция

| # | Задача | Примечание |
|---|--------|------------|
| 9 | Postgres вместо SQLite (prod) | См. ARCHITECTURE §8 |
| 10 | Monorepo `apps/web` + `apps/api` | После стабилизации API-контрактов |
| 11 | E2E (Playwright): login → NRI стол → use item | Дополнение к Vitest |
| 12 | `npm run typecheck:client` в CI отдельным job | Уже входит в `build` |

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
| `nriService.ts` строк | ~740 | < 800 на файл |
| `createApp.ts` строк | ~298 | < 400 (+ mount*) |
| `useGameState.ts` строк | ~1900 | < 600 на хук |
| `nriApi.ts` строк | ~1140 | < 400 на модуль |
| Vitest тесты | 128 | расти с каждым API-slice |
| `npm run build` | зелёный | обязательно в CI |

---

*Коммиты: `93ded1d` — NRI player/ice/preset split; следующий — map/vault/npc/cyber routes.*
