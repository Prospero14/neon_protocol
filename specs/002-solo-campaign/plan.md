# Plan: Solo campaign

## Overview

Клиентский мир + sync. Состояние: `useGameState` + `AuthContext` → `POST /neon_v1/game/sync`.

## Architecture anchors

| Зона | Путь |
|------|------|
| Мир / NPC / диалоги | `src/logic/world/<district>/` |
| Квесты | `QUEST_LIBRARY`, `districtId`, `completeQuestId` |
| Бой | `useCombatLogic`, `combatEnemies.ts` (не NRI-боевики) |
| Режим | `sessionMode: 'solo'` |
| UI вход | `SESSION_GATE` → `HUB` |

## Constraints

- Id квестов и NPC не ломать без миграции контента и сейвов (constitution).
- `useNpcDialogue`: gate `requireCompletedQuestId` уже в данных; UI должен фильтровать repeat-пул.

## Related

- Spec: [spec.md](./spec.md)
- Platform: [../001-platform-core/plan.md](../001-platform-core/plan.md) §4.1
