/** Шкала отношения НПС к персонажу (−100…+100). */
import { parseSheetTattoos } from './tattoos.js';
import { getFactionRelation, isFactionRelationsActive, stanceLabel, } from './factionRelations.js';
const STANCE_TO_MODIFIER = {
    allied: 10,
    neutral: 0,
    wary: -10,
    hostile: -25,
};
export function clampDisposition(n) {
    return Math.max(-100, Math.min(100, n));
}
export function dispositionLabel(score) {
    if (score >= 60)
        return 'Дружелюбен';
    if (score >= 25)
        return 'Расположен';
    if (score >= -24)
        return 'Нейтрален';
    if (score >= -59)
        return 'Недоверчив';
    return 'Враждебен';
}
function readDispositionBase(sheet) {
    if (!sheet)
        return 0;
    const d = sheet.disposition;
    return typeof d === 'number' && Number.isFinite(d) ? clampDisposition(d) : 0;
}
function readFactionId(sheet) {
    if (!sheet)
        return undefined;
    return typeof sheet.factionId === 'string' && sheet.factionId.trim() ? sheet.factionId.trim() : undefined;
}
export function tattooRelationModifier(viewerSheet, npcFactionId, matrix, factions) {
    if (!isFactionRelationsActive(matrix) || !npcFactionId) {
        return { modifier: 0, notes: [] };
    }
    const tattoos = parseSheetTattoos(viewerSheet?.tattoos);
    const orgTattoos = tattoos.filter((t) => t.factionId);
    if (!orgTattoos.length)
        return { modifier: 0, notes: [] };
    let modifier = 0;
    const notes = [];
    for (const t of orgTattoos) {
        const stance = getFactionRelation(matrix, t.factionId, npcFactionId);
        if (stance === 'neutral' || stance === 'allied')
            continue;
        const delta = STANCE_TO_MODIFIER[stance];
        modifier += delta;
        const org = factions.find((f) => f.id === t.factionId);
        const orgName = org?.displayName?.trim() || org?.name || 'организация';
        notes.push(`Тату «${orgName}»: ${stanceLabel(stance)} к фракции НПС (${delta > 0 ? '+' : ''}${delta})`);
    }
    return { modifier: clampDisposition(modifier), notes };
}
export function computeNpcDispositionToViewer(npcSheet, viewerSheet, matrix, factions, situationalModifier = 0) {
    const base = readDispositionBase(npcSheet);
    const npcFactionId = readFactionId(npcSheet);
    const tattoo = tattooRelationModifier(viewerSheet, npcFactionId, matrix, factions);
    const active = isFactionRelationsActive(matrix);
    const total = clampDisposition(base + tattoo.modifier + situationalModifier);
    return {
        base,
        tattooModifier: tattoo.modifier,
        situationalModifier,
        total,
        active,
        notes: tattoo.notes,
    };
}
//# sourceMappingURL=disposition.js.map