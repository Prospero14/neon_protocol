/** Киберпсихоз: стресс от BT + статусов + шрамов; энкаунтер мастера. */
import { getConditionDef } from './conditionDefs.js';
export const PSYCHOSIS_THRESHOLDS = {
    unstable: 20,
    critical: 40,
    episode: 60,
};
/** Вклад активного статуса в стресс (пока висит). */
export const CONDITION_PSYCHOSIS_STRESS = {
    intoxicated_mild: 4,
    intoxicated: 8,
    intoxicated_severe: 14,
    high: 10,
    boosted: 3,
    sedated: 2,
    exhausted_1: 6,
    exhausted_2: 12,
    bleeding: 8,
    poisoned: 7,
    frightened: 5,
    stunned: 4,
    blinded: 3,
    prone: 1,
    pain: 9,
    analgesia: -6,
    lukolite_buffer: -12,
};
/** Постоянные моды от шрамов психоза (после энкаунтеров). */
export const PSYCHOSIS_SCAR_MODS = [
    {},
    { PEO: -1 },
    { PEO: -1, INT: -1 },
    { PEO: -2, INT: -1 },
    { PEO: -2, INT: -1, TEC: -1 },
    { PEO: -2, INT: -2, TEC: -1, CON: -1 },
];
export const MAX_PSYCHOSIS_SCAR = PSYCHOSIS_SCAR_MODS.length - 1;
export function psychosisTier(score) {
    if (score >= PSYCHOSIS_THRESHOLDS.episode)
        return 'episode';
    if (score >= PSYCHOSIS_THRESHOLDS.critical)
        return 'critical';
    if (score >= PSYCHOSIS_THRESHOLDS.unstable)
        return 'unstable';
    return 'stable';
}
export function chromePsychosisFloor(bt, limit) {
    const safeBt = Math.max(0, bt);
    const safeLimit = Math.max(1, limit);
    const fromChrome = Math.round(safeBt * 1.5);
    const over = Math.max(0, safeBt - safeLimit);
    const fromOverage = over * 8;
    return { fromChrome, fromOverage };
}
export function conditionsPsychosisStress(conditions) {
    if (!Array.isArray(conditions))
        return 0;
    let sum = 0;
    for (const c of conditions) {
        const fromDef = getConditionDef(c.id)?.psychosisStress;
        sum += fromDef ?? CONDITION_PSYCHOSIS_STRESS[c.id] ?? 0;
    }
    return sum;
}
export function scarPsychosisStress(scarLevel) {
    const n = Math.max(0, Math.min(MAX_PSYCHOSIS_SCAR, Math.floor(scarLevel || 0)));
    return n * 5;
}
export function computePsychosis(sheet) {
    const bt = typeof sheet?.bloodToxCurrent === 'number' ? sheet.bloodToxCurrent : 0;
    const limit = typeof sheet?.bloodToxLimit === 'number'
        ? sheet.bloodToxLimit
        : 10 + Math.floor(((sheet?.abilities?.CON ?? 10) - 10) / 2);
    const { fromChrome, fromOverage } = chromePsychosisFloor(bt, limit);
    const fromConditions = conditionsPsychosisStress(sheet?.activeConditions);
    const fromRelief = fromConditions < 0 ? Math.abs(fromConditions) : 0;
    const scarLevel = Math.max(0, Math.min(MAX_PSYCHOSIS_SCAR, Math.floor(sheet?.psychosisScarLevel ?? 0)));
    const fromScars = scarPsychosisStress(scarLevel);
    const total = Math.max(0, fromChrome + fromOverage + fromConditions + fromScars);
    const history = Array.isArray(sheet?.psychosisHistory) ? sheet.psychosisHistory : [];
    const tier = psychosisTier(total);
    const encounterActive = !!sheet?.psychosisEncounter?.active;
    return {
        fromChrome,
        fromOverage,
        fromConditions,
        fromRelief,
        fromScars,
        total,
        tier,
        scarLevel,
        pending: encounterActive || tier === 'episode',
        encounterActive,
        history,
    };
}
export function applyPsychosisScarMods(sheet) {
    const level = Math.max(0, Math.min(MAX_PSYCHOSIS_SCAR, Math.floor(sheet.psychosisScarLevel ?? 0)));
    const mods = PSYCHOSIS_SCAR_MODS[level] ?? {};
    if (!Object.keys(mods).length)
        return sheet;
    const abilities = { ...sheet.abilities };
    for (const [k, v] of Object.entries(mods)) {
        if (typeof v === 'number')
            abilities[k] = (abilities[k] ?? 10) + v;
    }
    return { ...sheet, abilities };
}
/**
 * Синхронизация флагов: эпизод → pending;
 * купирование (лекарства / снятие имплантов / уход статусов) → сброс pending, если нет звонка.
 */
export function syncPsychosisFlags(sheet) {
    if (sheet.psychosisEncounter?.active) {
        return sheet.psychosisPending ? sheet : { ...sheet, psychosisPending: true };
    }
    const snap = computePsychosis(sheet);
    if (snap.tier === 'episode') {
        return sheet.psychosisPending ? sheet : { ...sheet, psychosisPending: true };
    }
    if (sheet.psychosisPending) {
        return { ...sheet, psychosisPending: false };
    }
    return sheet;
}
/** @deprecated use syncPsychosisFlags */
export function markPsychosisPendingIfNeeded(sheet) {
    return syncPsychosisFlags(sheet);
}
export function startPsychosisEncounter(sheet, opts) {
    const now = opts?.now ?? Date.now();
    return {
        ...sheet,
        psychosisPending: true,
        psychosisEncounter: {
            active: true,
            startedAt: now,
            peerUserId: opts?.peerUserId,
        },
    };
}
export function resolvePsychosisEncounter(sheet, opts) {
    const now = opts?.now ?? Date.now();
    const snap = computePsychosis(sheet);
    const scarAfter = Math.min(MAX_PSYCHOSIS_SCAR, snap.scarLevel + 1);
    const event = {
        id: `psy_${now.toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
        at: now,
        stressAtTrigger: snap.total,
        scarAfter,
        notes: opts?.notes,
    };
    const history = [...(Array.isArray(sheet.psychosisHistory) ? sheet.psychosisHistory : []), event];
    return {
        sheet: {
            ...sheet,
            psychosisScarLevel: scarAfter,
            psychosisHistory: history,
            psychosisPending: false,
            psychosisEncounter: null,
        },
        event,
    };
}
export function psychosisTierLabel(tier) {
    switch (tier) {
        case 'episode':
            return 'Эпизод';
        case 'critical':
            return 'Критичен';
        case 'unstable':
            return 'Нестабилен';
        default:
            return 'Стабилен';
    }
}
export function sanitizePsychosisHistory(raw) {
    if (!Array.isArray(raw))
        return [];
    const out = [];
    for (const row of raw) {
        if (!row || typeof row !== 'object')
            continue;
        const o = row;
        if (typeof o.id !== 'string' || typeof o.at !== 'number')
            continue;
        out.push({
            id: o.id,
            at: o.at,
            stressAtTrigger: typeof o.stressAtTrigger === 'number' ? o.stressAtTrigger : 0,
            scarAfter: typeof o.scarAfter === 'number' ? o.scarAfter : 0,
            notes: typeof o.notes === 'string' ? o.notes : undefined,
        });
    }
    return out;
}
//# sourceMappingURL=psychosisLogic.js.map