/** Сервер: каталог предметов из shared JSON. */
import { readFileSync } from 'fs';
import { resolveSharedJsonPath } from '../sharedDataPath.js';
let cache = null;
function loadCatalog() {
    if (!cache) {
        const p = resolveSharedJsonPath('nri-item-catalog.json');
        cache = JSON.parse(readFileSync(p, 'utf8'));
    }
    return cache;
}
export function getServerCatalogItem(id) {
    return loadCatalog().find((c) => c.id === id);
}
export function isPersonalServerCatalogItem(item) {
    return !!item?.tags?.includes('персональное');
}
export function canTransferServerItem(item) {
    if (!item)
        return false;
    if (item.transferLocked === true)
        return false;
    if (Array.isArray(item.tags) && item.tags.includes('персональное'))
        return false;
    const catalog = typeof item.catalogId === 'string' ? getServerCatalogItem(item.catalogId) : undefined;
    return !isPersonalServerCatalogItem(catalog);
}
export function catalogToServerInventoryItem(catalogId) {
    const c = getServerCatalogItem(catalogId);
    if (!c)
        return null;
    const id = `${catalogId}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    return {
        id,
        catalogId: c.id,
        name: c.name,
        baseName: c.name,
        blurb: c.blurb,
        kind: 'gear',
        slot: c.slot,
        equipped: false,
        c2185Mods: c.c2185Mods,
        acBonus: c.acBonus,
        attack: c.attack,
        priceWonlongs: c.priceWonlongs,
        tags: c.tags ? [...c.tags] : undefined,
        transferLocked: isPersonalServerCatalogItem(c),
        inscriptionLocked: false,
        qty: 1,
    };
}
//# sourceMappingURL=nriItemCatalogServer.js.map