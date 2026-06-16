/** Состояния (conditions) — re-export shared domain + UI helpers. */

import type { NriC2185Mods } from './nriInventory';
import type { NriSheetData } from './nriNpcGenerator';
import {
  CONDITION_DEFS,
  CONDITION_IDS,
  CONDITION_LABELS,
  getConditionDef,
} from '../../shared/nri-domain/conditionDefs';
import {
  applyConditionStack,
  conditionFromDef,
  mergeConditionAcMod,
  mergeConditionMods,
  pruneExpiredConditions,
  tickConditionRoundsList,
} from '../../shared/nri-domain/conditionLogic';
import type { ConditionId, SheetCondition } from '../../shared/nri-domain/types';

export type { ConditionId, SheetCondition };
export type ConditionDef = (typeof CONDITION_DEFS)[number];

export {
  CONDITION_DEFS,
  CONDITION_IDS,
  CONDITION_LABELS,
  getConditionDef,
  applyConditionStack,
  conditionFromDef,
  mergeConditionMods,
  mergeConditionAcMod,
  pruneExpiredConditions,
};

export function formatConditionChatLine(who: string, cond: SheetCondition, action: 'apply' | 'remove'): string {
  const icon = action === 'apply' ? '⚠️' : '✅';
  const dur =
    cond.roundsLeft != null
      ? ` · ~${cond.roundsLeft} раунд(ов)`
      : cond.expiresAt
        ? ` · до ${new Date(cond.expiresAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`
        : '';
  return action === 'apply'
    ? `${icon} Статус · ${who}: ${cond.label}${dur}${cond.source ? ` (${cond.source})` : ''}`
    : `${icon} Статус снят · ${who}: ${cond.label}`;
}

export function formatConditionsSummary(conditions: SheetCondition[]): string {
  if (!conditions.length) return 'нет активных';
  return conditions.map((c) => c.label).join(', ');
}

export function applyConditionsToSheet(sheet: NriSheetData): NriSheetData {
  const conditions = pruneExpiredConditions(sheet.activeConditions ?? []);
  const mods = mergeConditionMods(conditions) as NriC2185Mods;
  const abilities = { ...sheet.abilities };
  for (const [k, v] of Object.entries(mods)) {
    const key = k as keyof typeof abilities;
    if (typeof v === 'number') abilities[key] = (abilities[key] ?? 10) + v;
  }
  const ac = (sheet.ac ?? 10) + mergeConditionAcMod(conditions);
  return { ...sheet, abilities, ac, activeConditions: conditions };
}

export function tickConditionRounds(sheet: NriSheetData, delta = 1): NriSheetData {
  return {
    ...sheet,
    activeConditions: tickConditionRoundsList(sheet.activeConditions ?? [], delta),
  };
}
