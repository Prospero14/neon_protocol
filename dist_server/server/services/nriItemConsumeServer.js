/** Сервер: использование расходников (shared domain). */
import { readFileSync } from 'fs';
import { applyConsumeEffects } from '../../shared/nri-domain/consumeApply.js';
import { takeOneInstanceItem } from './nriItemGrant.js';
import { getServerCatalogItem } from './nriItemCatalogServer.js';
import { resolveSharedJsonPath } from '../sharedDataPath.js';
let consumeCache = null;
function loadConsume() {
    if (!consumeCache) {
        const p = resolveSharedJsonPath('nri-consume-effects.json');
        consumeCache = JSON.parse(readFileSync(p, 'utf8'));
    }
    return consumeCache;
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
    const hpMax = typeof sheet.hpMax === 'number' ? sheet.hpMax : (sheet.hp ?? 20);
    const { sheet: next, applied } = applyConsumeEffects({
        abilities: sheet.abilities,
        hp: sheet.hp,
        hpMax,
        bloodToxCurrent: sheet.bloodToxCurrent,
        activeConditions: sheet.activeConditions,
    }, spec, taken.item.name);
    const merged = { ...sheet, ...next, hpMax };
    return { ok: true, inventory: taken.inventory, sheet: merged, applied };
}
//# sourceMappingURL=nriItemConsumeServer.js.map