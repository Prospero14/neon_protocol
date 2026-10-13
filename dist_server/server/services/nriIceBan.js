/** Сервер: ICE fail streak + hardware ban / deck clearance. */
import { ICE_COUNTERHACK_THRESHOLD, inventoryHasDeck, readCounterHack, startCounterHack, } from '../../shared/nri-domain/iceCounterHack.js';
export const ICE_FAIL_STREAK_LIMIT = ICE_COUNTERHACK_THRESHOLD;
export const ICE_LEFT_DECK_CATALOG_ID = 'g_left_deck';
function sheetObj(sheet) {
    if (sheet && typeof sheet === 'object')
        return { ...sheet };
    return {};
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
    return inventoryHasDeck(inventory);
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
/**
 * Победа — сброс fails.
 * Провал — +1 fail; при достижении порога стартует counter-hack (бан железа — после проигрыша взлома).
 */
export function applyIceRunResult(sheet, won, meta) {
    const prev = readIceBan(sheet);
    if (won) {
        const ban = {
            consecutiveFails: 0,
            hardwareBanned: prev.hardwareBanned,
            bannedAt: prev.bannedAt,
            neuralSigAtBan: prev.neuralSigAtBan,
        };
        return { sheet: writeIceBan(sheet, ban), ban, counterHackStarted: false };
    }
    const nextFails = prev.consecutiveFails + 1;
    const ban = { ...prev, consecutiveFails: nextFails, hardwareBanned: prev.hardwareBanned };
    let nextSheet = writeIceBan(sheet, ban);
    let counterHackStarted = false;
    const existing = readCounterHack(nextSheet);
    if (nextFails >= ICE_FAIL_STREAK_LIMIT &&
        !prev.hardwareBanned &&
        !(existing?.active)) {
        nextSheet = startCounterHack(nextSheet, {
            targetUserId: meta?.userId ?? '',
            targetName: meta?.displayName ?? 'netrunner',
        });
        counterHackStarted = true;
    }
    return { sheet: nextSheet, ban: readIceBan(nextSheet), counterHackStarted };
}
export function buildIcePlayStatus(sheet, inventory, tableAllBanned) {
    const ban = readIceBan(sheet);
    const clearance = detectIceClearance(sheet, inventory);
    const ch = readCounterHack(sheet);
    const canPlay = (!ban.hardwareBanned || clearance.cleared) && !ch?.active;
    return {
        consecutiveFails: ban.consecutiveFails,
        hardwareBanned: ban.hardwareBanned,
        canPlay,
        clearanceVia: clearance.via,
        tableAllBanned,
        failsUntilBan: ban.hardwareBanned || ch?.active
            ? 0
            : Math.max(0, ICE_FAIL_STREAK_LIMIT - ban.consecutiveFails),
        counterHackActive: !!ch?.active,
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
export function applyHardwareBan(sheet) {
    const aug = parseAugSheet(sheet);
    return writeIceBan(sheet, {
        consecutiveFails: readIceBan(sheet).consecutiveFails,
        hardwareBanned: true,
        bannedAt: Date.now(),
        neuralSigAtBan: neuralAugSignature(aug.augmentations),
    });
}
//# sourceMappingURL=nriIceBan.js.map