# Tasks: Coop mode

## Done

- [x] Coop live-матчи в SQLite (`CoopLiveMatch`)
- [x] `coopMatchStore` / `coopMatchEngine`
- [x] `mountCoopRoutes` — все `/neon_v1/coop/*` из `createApp`

## Open

- [ ] Coop **party** persist (опционально) — сейчас party из матча; invite после рестарта → heartbeat заново
- [ ] Coop **чат лобби** в Prisma или Redis (сейчас in-memory, ~120 сообщений)
- [ ] Горизонтальное масштабирование coop SSE (`matchSseByMatchId` привязан к инстансу)
- [ ] Свести sequential vs parallel action handlers в `mountCoopRoutes` к engine
