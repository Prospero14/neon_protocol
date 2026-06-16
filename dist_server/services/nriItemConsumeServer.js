/** Сервер: использование расходников. */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { takeOneInstanceItem } from './nriItemGrant.js';
import { getServerCatalogItem } from './nriItemCatalogServer.js';
const CONDITION_LABELS = {
    intoxicated_mild: 'Лёгкое опьянение',
    intoxicated: 'Опьянение',
    intoxicated_severe: 'Сильное опьянение',
    poisoned: 'Отравление',
    stunned: 'Оглушение',
    frightened: 'Страх',
    exhausted_1: 'Усталость 1',
    exhausted_2: 'Усталость 2',
    boosted: 'Стим-буст',
    sedated: 'Седатив',
    bleeding: 'Кровотечение',
    prone: 'Сбит с ног',
    blinded: 'Ослепление',
    high: 'Кайф',
};
let consumeCache = null;
function loadConsume() {
    if (!consumeCache) {
        const p = join(dirname(fileURLToPath(import.meta.url)), '../../shared/nri-consume-effects.json');
        consumeCache = JSON.parse(readFileSync(p, 'utf8'));
    }
    return consumeCache;
}
const ESCALATE = {
    intoxicated_mild: 'intoxicated',
    intoxicated: 'intoxicated_severe',
    exhausted_1: 'exhausted_2',
};
function applyConditionStack(existing, incoming) {
    const id = String(incoming.id);
    const same = existing.find((c) => c.id === id);
    const nextId = ESCALATE[id];
    if (same && nextId) {
        const next = conditionEntry(nextId, String(incoming.source ?? ''), incoming.roundsLeft);
        return [...existing.filter((c) => c.id !== id && c.id !== nextId), next];
    }
    return [...existing.filter((c) => c.id !== id), incoming];
}
function conditionEntry(id, source, rounds) {
    return {
        id,
        label: CONDITION_LABELS[id] ?? id,
        source,
        appliedAt: Date.now(),
        roundsLeft: rounds,
    };
}
export function tryUseItemServer(sheetRaw, inventory, itemId) {
    const sheet = (sheetRaw && typeof sheetRaw === 'object' ? { ...sheetRaw } : null);
    if (!sheet?.abilities)
        return { ok: false, reason: 'Лист персонажа не найден.' };
    const taken = takeOneInstanceItem(inventory, itemId);
    if (!taken.item)
        return { ok: false, reason: 'Предмет не найден в инвентаре.' };
    const catalogId = taken.item.catalogId;
    const spec = catalogId ? loadConsume()[catalogId] : undefined;
    if (!spec) {
        const catalogItem = catalogId ? getServerCatalogItem(catalogId) : undefined;
        const category = catalogItem?.category;
        if (category === 'consumable' || category === 'drug' || taken.item.slot === 'quick') {
            return { ok: false, reason: 'У предмета нет игрового эффекта — уточните у мастера.' };
        }
        return { ok: false, reason: 'Этот предмет нельзя использовать — только экипировать.' };
    }
    const applied = [];
    const conditions = Array.isArray(sheet.activeConditions) ? [...sheet.activeConditions] : [];
    for (const id of spec.conditions ?? []) {
        const label = CONDITION_LABELS[id] ?? id;
        const entry = conditionEntry(id, taken.item.name, spec.conditionRounds);
        const stacked = applyConditionStack(conditions, entry);
        conditions.length = 0;
        conditions.push(...stacked);
        applied.push(label);
    }
    if (spec.hpHeal) {
        const hpMax = typeof sheet.hpMax === 'number' ? sheet.hpMax : sheet.hp ?? 0;
        const hp = Math.min(hpMax, (typeof sheet.hp === 'number' ? sheet.hp : hpMax) + spec.hpHeal);
        sheet.hp = hp;
        applied.push(`+${spec.hpHeal} HP`);
    }
    if (spec.hpDamage) {
        sheet.hp = Math.max(0, (typeof sheet.hp === 'number' ? sheet.hp : 0) - spec.hpDamage);
        applied.push(`−${spec.hpDamage} HP`);
    }
    if (spec.bloodToxDelta) {
        sheet.bloodToxCurrent = (typeof sheet.bloodToxCurrent === 'number' ? sheet.bloodToxCurrent : 0) + spec.bloodToxDelta;
        applied.push(`Blood Tox +${spec.bloodToxDelta}`);
    }
    sheet.activeConditions = conditions;
    return { ok: true, inventory: taken.inventory, sheet, applied };
}
//# sourceMappingURL=nriItemConsumeServer.js.map