# Tasks: Platform core

Источник: бывший `docs/BACKLOG.md` (P1 platform / P3) + SOLID open items.

## Done

- [x] `createApp.ts` → coop/auth/static slices
- [x] Zod auth + `game/sync`
- [x] `NEON_DATA_DIR` / Amvera `/data`
- [x] Client `tsc` in build

## Open

- [ ] Split `useGameState.ts` (~1850) → `useCoopLobby`, `useSoloProgress` (остаток после `useNriSession`)
- [ ] Postgres instead of SQLite (prod) — see plan §8
- [ ] Monorepo `apps/web` + `apps/api` after API contracts stabilize
- [ ] E2E Playwright: login → NRI table → use item
- [ ] Optional: separate CI job `typecheck:client` (already in build)
- [ ] Prettier / LF line endings
- [ ] Do not commit `tmp/*.mjs`

## Debt notes

- Liskov: reduce `any` in sync payload (`AuthContext`, `game/sync`)
- DIP: no interface layer; Prisma/fetch direct — acceptable until monorepo packages
