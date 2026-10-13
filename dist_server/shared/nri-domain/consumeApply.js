import { CONDITION_LABELS } from './conditionDefs.js';
import { applyConditionStack, conditionFromDef, pruneExpiredConditions } from './conditionLogic.js';
import { computePsychosis, syncPsychosisFlags } from './psychosisLogic.js';
export function applyConsumeEffects(sheet, spec, sourceName) {
    const applied = [];
    const next = { ...sheet };
    let conditions = pruneExpiredConditions([...(sheet.activeConditions ?? [])]);
    const beforePs = computePsychosis(sheet).total;
    for (const id of spec.removeConditions ?? []) {
        const had = conditions.some((c) => c.id === id);
        if (!had)
            continue;
        conditions = conditions.filter((c) => c.id !== id);
        applied.push(`снят: ${CONDITION_LABELS[id] ?? id}`);
    }
    for (const id of spec.conditions ?? []) {
        const cond = conditionFromDef(id, {
            source: sourceName,
            rounds: spec.conditionRounds,
            minutes: spec.conditionMinutes,
        });
        conditions = applyConditionStack(conditions, cond);
        applied.push(CONDITION_LABELS[id] ?? cond.label);
    }
    if (spec.hpHeal) {
        const hpMax = next.hpMax;
        next.hp = Math.min(hpMax, (next.hp ?? hpMax) + spec.hpHeal);
        applied.push(`+${spec.hpHeal} HP`);
    }
    if (spec.hpDamage) {
        next.hp = Math.max(0, (next.hp ?? next.hpMax) - spec.hpDamage);
        applied.push(`−${spec.hpDamage} HP`);
    }
    if (spec.bloodToxDelta) {
        next.bloodToxCurrent = Math.max(0, (next.bloodToxCurrent ?? 0) + spec.bloodToxDelta);
        const sign = spec.bloodToxDelta > 0 ? '+' : '';
        applied.push(`Blood Tox ${sign}${spec.bloodToxDelta}`);
    }
    next.activeConditions = conditions;
    const withPsychosis = syncPsychosisFlags(next);
    const afterPs = computePsychosis(withPsychosis).total;
    if (withPsychosis.psychosisPending && !sheet.psychosisPending) {
        applied.push('киберпсихоз: порог эпизода');
    }
    else if (afterPs < beforePs) {
        applied.push(`психоз ${beforePs}→${afterPs}`);
    }
    return { sheet: withPsychosis, applied };
}
//# sourceMappingURL=consumeApply.js.map