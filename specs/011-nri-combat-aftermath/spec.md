# 011 — Combat aftermath: урон, статусы, расходники

## Problem

После боя нужно переносить на лист и инвентарь: HP, криты/станы/кровотечение/яды, жив/мёртв, потраченные предметы. Сейчас бой и лист слабо связаны во времени.

## Principles

1. **Один снимок исхода** (`CombatAftermathPatch`) мержится в `sheet` + `inventory` через sanitize/merge (constitution: merge, не replace).
2. **Статусы** живут в `sheet.activeConditions` с `roundsLeft` (бой) и/или `expiresAt` (стена часов / сцена).
3. **Расходники** уменьшают `qty` или удаляют слот при использовании (уже `tryUseInventoryItem`).
4. **Экип** даёт моды только пока `equipped` (уже `applyEquippedToSheet`).
5. **Не дублировать** лог боя как единственный источник правды — патч явный.

## CombatAftermathPatch (черновик контракта)

```ts
{
  hp?: number;              // итоговое HP
  hpMax?: number;
  dead?: boolean;           // → condition или flag на листе
  conditionsApply?: { id: ConditionId; rounds?: number; minutes?: number; source?: string }[];
  conditionsRemove?: ConditionId[];
  inventoryConsume?: { itemId: string; qty?: number }[];  // доп. траты в бою
  notes?: string;           // для чата мастера
}
```

Применение: prune expired → apply conditions → set HP → consume inventory → sync через `game/sync` / NRI profile patch.

## Status lifecycle (алкоголь и т.п.)

| Этап | Где |
|------|-----|
| Запись | `use item` → `applyConsumeEffects` → `activeConditions` |
| Применение к статам | `applyConditionsToSheet` (DEX и пр.) |
| Тик в бою | `tickConditionRounds` (мастер / конец раунда) |
| Тик по времени | `expiresAt` + `pruneExpiredConditions` при чтении листа |
| Конец | prune / remove / escalate |

## Out of scope v1 (эта итерация)

Полный авто-патч из CombatBridge. Сейчас: UI инвентаря, таймеры статусов, тесты consume/expire, спека контракта.

## Related

- `010-nri-ui-comfort` — плотность UI
- `conditionLogic.ts`, `consumeApply.ts`, `nriItemConsume.ts`
