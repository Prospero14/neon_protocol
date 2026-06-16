# SOLID-аудит Neon Protocol

Чеклист для ревью. Контекст: `docs/ARCHITECTURE.md`.

---

## Критичные нарушения SRP

| Модуль | Строк (≈) | Рекомендация |
|--------|-----------|--------------|
| `server/services/nriService.ts` | ~85 | mount-only entry |
| `server/createApp.ts` | ~90 | static SPA only |
| `src/logic/hooks/useGameState.ts` | ~1900 | `useSoloGame`, `useCoopLobby`, `useNriInvite` |
| `src/logic/nriApi.ts` | ~20 | barrel + `nriApi/*` slices |

---

## Прогресс (2026-06)

- [x] `shared/nri-domain/` — conditions + consumeApply (единый источник client/server)
- [x] Все consumable/drug в каталоге имеют запись в `nri-consume-effects.json`
- [x] HTTP-тест `POST .../player/items/:id/use`
- [x] `npm run build` включает `tsc -p tsconfig.app.json --noEmit` (legacy-типы зачищены)
- [x] Coop **live-матчи** → `CoopLiveMatch` в SQLite (`server/coop/coopMatchStore.ts`)
- [x] Персистентность БД: `NEON_DATA_DIR`, `/data` на Amvera (`persistenceMount` в `amvera.yml`)
- [x] `server/coop/coopMatchStore.ts` + `server/databasePath.ts` (вынесено из монолита createApp)
- [x] `server/coop/mountCoopRoutes.ts` — все `/neon_v1/coop/*` вынесены из `createApp.ts`
- [x] `shared/api-schemas/nri.ts` — Zod для player/preset/ice/wallet NRI routes
- [x] `nriPlayerRoutes` / `nriIceWalletRoutes` / `nriPresetRoutes` + `nriSessionHelpers`
- [x] `src/logic/nriApi/session.ts` + `players.ts` (клиент)
- [x] `nriSessionLobbyRoutes` / `nriVehicleRoutes` / `nriScenarioRoutes` — `nriService` mount-only
- [x] `src/logic/nriApi/*` — vault, wallet, map, scenario, characters, cyber, vehicles, lore
- [x] `server/routes/auth.ts` — register/login/sync
- [x] `useNriSession` hook (NRI lobby из `useGameState`)
- [ ] Split `useGameState.ts` (coop/solo) / monorepo

---

## OCP / LSP / ISP / DIP

| Принцип | Статус | Заметка |
|---------|--------|---------|
| OCP | ⚠️ | Новый NRI endpoint = правки god-файлов |
| LSP | ⚠️ | `game/sync` типизирован (`GameSyncPayload`); NRI body — частично |
| ISP | ⚠️ | Панели импортируют весь `nriApi` |
| DIP | ⚠️ | Prisma/fetch напрямую; domain layer только для consume |

---

## Уже ок

- District modules (`world/<id>/`)
- Pure logic: `nriSkillPick`, `nriDice`, `shared/nri-domain`
- Контрактные тесты JSON каталога

---

## Порядок рефакторинга

1. Split `nriApi.ts` (без смены URL)
2. Split `nriService.ts`
3. Типы `GameSyncPayload`
4. Monorepo `apps/web` + `apps/api` (см. ARCHITECTURE §8)
