# Tasks: NRI table

## Done

- [x] Route slices from `nriService` (players, ice/wallet, preset, map, vault, npc, cyber, lobby, vehicles, scenario)
- [x] Client `nriApi/*` slices
- [x] Zod key NRI routes (`shared/api-schemas/nri.ts`)
- [x] `useNriSession` из `useGameState`
- [x] `validateSheetConditions` на сервере

## Open

- [ ] `NriMasterStatusPanel`: фильтр хоста по `hostUserId` из session (сейчас весь roster)
- [ ] E2E: login → NRI стол → use item (см. 001 tasks)
