# Plan: NRI table

## Overview

Сессия стола Carbon 2185: `NriSession`, invite, host/admin; игроки `NriPlayer`; мастерские инструменты (пресеты, НПС, боевики, карта, сценарий, vault).

## Architecture anchors

| Зона | Путь |
|------|------|
| Mount | `server/services/nriService.ts` (mount-only) |
| Routes | `nri*Routes.ts` under `server/services/` |
| Client API | `src/logic/nriApi/*` |
| Rules | `nriCarbon2185.ts`, `NriRulesPanel` |
| Items | `shared/nri-item-catalog.json`, `shared/nri-consume-effects.json` |
| Domain | `shared/nri-domain/` |
| Lobby hook | `useNriSession` |
| Ops | [../001-platform-core/ops.md](../001-platform-core/ops.md) §7 |

## Constraints

- Prefix: `/neon_v1/services/nri/:code/...`
- Auto-join only after `hydrationReady` (constitution).
- Map drill-down: see [005](../005-nri-district-map/).

## Related

- Spec: [spec.md](./spec.md)
- Data model: [data-model.md](./data-model.md)
- Platform §4.3: [../001-platform-core/plan.md](../001-platform-core/plan.md)
