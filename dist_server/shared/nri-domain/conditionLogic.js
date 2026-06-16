import { getConditionDef } from './conditionDefs.js';
export function conditionFromDef(id, opts) {
    const def = getConditionDef(id);
    const now = Date.now();
    const rounds = opts?.rounds ?? def.defaultRounds;
    const minutes = opts?.minutes ?? def.defaultMinutes;
    return {
        id,
        label: def.label,
        source: opts?.source,
        appliedAt: now,
        expiresAt: minutes ? now + minutes * 60_000 : undefined,
        roundsLeft: rounds,
        abilityMods: def.abilityMods ? { ...def.abilityMods } : undefined,
        acMod: def.acMod,
        notes: def.blurb,
    };
}
export function pruneExpiredConditions(conditions, now = Date.now()) {
    return conditions.filter((c) => !c.expiresAt || c.expiresAt > now);
}
export function applyConditionStack(existing, incoming) {
    const def = getConditionDef(incoming.id);
    const same = existing.find((c) => c.id === incoming.id);
    if (same && def?.escalateTo) {
        const next = conditionFromDef(def.escalateTo, {
            source: incoming.source,
            rounds: incoming.roundsLeft,
        });
        return [...existing.filter((c) => c.id !== incoming.id && c.id !== def.escalateTo), next];
    }
    return [...existing.filter((c) => c.id !== incoming.id), incoming];
}
export function mergeConditionMods(conditions) {
    const out = {};
    for (const c of conditions) {
        if (!c.abilityMods)
            continue;
        for (const [k, v] of Object.entries(c.abilityMods)) {
            const key = k;
            if (typeof v === 'number')
                out[key] = (out[key] ?? 0) + v;
        }
    }
    return out;
}
export function mergeConditionAcMod(conditions) {
    return conditions.reduce((s, c) => s + (c.acMod ?? 0), 0);
}
export function tickConditionRoundsList(conditions, delta = 1) {
    return pruneExpiredConditions(conditions
        .map((c) => {
        if (c.roundsLeft == null)
            return c;
        return { ...c, roundsLeft: c.roundsLeft - delta };
    })
        .filter((c) => c.roundsLeft == null || c.roundsLeft > 0));
}
//# sourceMappingURL=conditionLogic.js.map