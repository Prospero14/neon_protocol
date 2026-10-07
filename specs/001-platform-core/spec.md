# Spec: Platform core

## Overview

Единая fullstack-платформа Neon Protocol: JWT auth, `game/sync`, Express API `/neon_v1`, React SPA, SQLite. Три режима (Solo / Coop / NRI) делят аккаунт и сохранение.

## User stories

- As a player, I can register/login and have progress persist across sessions.
- As a developer, I can run client+server locally and deploy one Node process with static SPA.
- As an operator, I can rely on stable auth/sync contracts without breaking saves.

## Requirements

### MUST

1. `POST /neon_v1/auth/login`, `/register`, `/game/sync` remain compatible with `AuthForm` / `AuthContext`.
2. Sync patches **merge** into existing `gameState` / `clientSnapshot` (see constitution).
3. API error codes (`SYNC_*`, `NRI_*`) stay parseable by the client.
4. Quest/NPC/map node ids are stable across releases unless content is migrated.

### Out of scope

- Mode-specific gameplay (see 002 / 003 / 004).
- Tile art pipeline (006).

## Done (baseline)

- [x] JWT auth + Prisma User / GameState
- [x] Vite SPA + Express static in prod
- [x] `server/routes/auth.ts` extracted
- [x] Client `tsc` in `npm run build`
- [x] Amvera `/data` persistence path helpers

## Related

- Plan: [plan.md](./plan.md)
- Ops: [ops.md](./ops.md)
- Constitution: [../constitution.md](../constitution.md)
