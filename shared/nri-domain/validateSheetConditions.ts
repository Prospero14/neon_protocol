import { getConditionDef } from './conditionDefs.js';
import type { ConditionId } from './types.js';

export type SheetConditionsValidation =
  | { ok: true }
  | { ok: false; code: 'INVALID_CONDITION_ID'; invalidIds: string[]; message: string };

/** Проверяет `sheet.activeConditions` по канону `CONDITION_DEFS`. */
export function validateSheetActiveConditions(sheet: unknown): SheetConditionsValidation {
  if (!sheet || typeof sheet !== 'object') return { ok: true };
  const raw = (sheet as { activeConditions?: unknown }).activeConditions;
  if (raw === undefined) return { ok: true };
  if (!Array.isArray(raw)) {
    return {
      ok: false,
      code: 'INVALID_CONDITION_ID',
      invalidIds: [],
      message: 'activeConditions должен быть массивом.',
    };
  }
  const invalidIds: string[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') {
      invalidIds.push('?');
      continue;
    }
    const id = (entry as { id?: unknown }).id;
    if (typeof id !== 'string' || !id.trim()) {
      invalidIds.push(String(id ?? '?'));
      continue;
    }
    if (!getConditionDef(id as ConditionId)) invalidIds.push(id);
  }
  if (invalidIds.length === 0) return { ok: true };
  const unique = [...new Set(invalidIds)];
  return {
    ok: false,
    code: 'INVALID_CONDITION_ID',
    invalidIds: unique,
    message: `Неизвестные статусы: ${unique.join(', ')}`,
  };
}
