/** Сервер: ICE hardware ban. */
export const ICE_FAIL_STREAK_LIMIT = 3;
export const ICE_LEFT_DECK_CATALOG_ID = 'g_left_deck';
function sheetObj(sheet) {
    if (sheet && typeof sheet === 'object')
        return { ...sheet };
    return {};
}
function parseInventory(raw) {
    if (!Array.isArray(raw))
        return [];
    return raw.filter((x) => x && typeof x === 'object');
}
function parseAugSheet(raw) {
    if (!raw || typeof raw !== 'object')
        return { augmentations: [] };
    const o = raw;
    return { augmentations: Array.isArray(o.augmentations) ? o.augmentations : [] };
}
export function neuralAugSignature(augmentations) {
    const neural = (augmentations ?? []).find((a) => a.slot === 'neural');
    if (!neural)
        return null;
    return `${neural.itemId}|${neural.installedAt}`;
}
export function readIceBan(sheet) {
    const o = sheetObj(sheet);
    const raw = o.iceBan;
    if (!raw || typeof raw !== 'object') {
        return { consecutiveFails: 0, hardwareBanned: false };
    }
    const b = raw;
    return {
        consecutiveFails: typeof b.consecutiveFails === 'number' && Number.isFinite(b.consecutiveFails)
            ? Math.max(0, Math.floor(b.consecutiveFails))
            : 0,
        hardwareBanned: !!b.hardwareBanned,
        bannedAt: typeof b.bannedAt === 'number' ? b.bannedAt : undefined,
        neuralSigAtBan: typeof b.neuralSigAtBan === 'string' || b.neuralSigAtBan === null ? b.neuralSigAtBan : undefined,
    };
}
export function writeIceBan(sheet, ban) {
    const o = sheetObj(sheet);
    return { ...o, iceBan: ban };
}
export function hasLeftDeck(inventory) {
    return parseInventory(inventory).some((i) => i.catalogId === ICE_LEFT_DECK_CATALOG_ID);
}
export function detectIceClearance(sheet, inventory) {
    const ban = readIceBan(sheet);
    if (!ban.hardwareBanned)
        return { cleared: true };
    if (hasLeftDeck(inventory))
        return { cleared: true, via: 'deck' };
    const aug = parseAugSheet(sheet);
    const sig = neuralAugSignature(aug.augmentations);
    if (ban.bannedAt) {
        const neural = (aug.augmentations ?? []).find((a) => a.slot === 'neural');
        if (neural && neural.installedAt > ban.bannedAt) {
            return { cleared: true, via: 'neural' };
        }
    }
    if (ban.neuralSigAtBan !== undefined && sig !== ban.neuralSigAtBan) {
        return { cleared: true, via: 'neural' };
    }
    return { cleared: false };
}
export function clearIceBan(sheet) {
    return writeIceBan(sheet, { consecutiveFails: 0, hardwareBanned: false });
}
export function applyIceRunResult(sheet, won) {
    const aug = parseAugSheet(sheet);
    const prev = readIceBan(sheet);
    if (won) {
        const ban = { consecutiveFails: 0, hardwareBanned: false };
        return { sheet: writeIceBan(sheet, ban), ban };
    }
    const nextFails = prev.consecutiveFails + 1;
    if (nextFails >= ICE_FAIL_STREAK_LIMIT) {
        const ban = {
            consecutiveFails: nextFails,
            hardwareBanned: true,
            bannedAt: Date.now(),
            neuralSigAtBan: neuralAugSignature(aug.augmentations),
        };
        return { sheet: writeIceBan(sheet, ban), ban };
    }
    const ban = { ...prev, consecutiveFails: nextFails, hardwareBanned: false };
    return { sheet: writeIceBan(sheet, ban), ban };
}
export function buildIcePlayStatus(sheet, inventory, tableAllBanned) {
    const ban = readIceBan(sheet);
    const clearance = detectIceClearance(sheet, inventory);
    const canPlay = !ban.hardwareBanned || clearance.cleared;
    return {
        consecutiveFails: ban.consecutiveFails,
        hardwareBanned: ban.hardwareBanned,
        canPlay,
        clearanceVia: clearance.via,
        tableAllBanned,
        failsUntilBan: Math.max(0, ICE_FAIL_STREAK_LIMIT - ban.consecutiveFails),
    };
}
export function maybeAutoClearIceBan(sheet, inventory) {
    const ban = readIceBan(sheet);
    if (!ban.hardwareBanned)
        return null;
    const clearance = detectIceClearance(sheet, inventory);
    if (!clearance.cleared)
        return null;
    return clearIceBan(sheet);
}
//# sourceMappingURL=nriIceBan.js.map