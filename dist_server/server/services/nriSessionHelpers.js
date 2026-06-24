/** Общие хелперы NRI-сессии (serialize, resolve, host check). */
import { isAdminUsername } from './auth.js';
import { dossierFromSheet } from '../../shared/nri-domain/achievements.js';
import { serializeAchievementState } from './nriAchievementService.js';
export function mergePlayerSheetFromPreset(presetSheet, displayName, clientSheet) {
    if (!presetSheet || typeof presetSheet !== 'object')
        return undefined;
    const base = { ...presetSheet };
    const trimmed = displayName.trim().slice(0, 40);
    let characterName = trimmed;
    if (clientSheet && typeof clientSheet === 'object') {
        const cn = clientSheet.characterName;
        if (typeof cn === 'string' && cn.trim())
            characterName = cn.trim().slice(0, 40);
    }
    return { ...base, characterName };
}
export async function resolveNriSession(prisma, code) {
    return prisma.nriSession.findUnique({
        where: { inviteCode: code },
        include: { host: { select: { username: true } } },
    });
}
export function parseNriJsonField(raw) {
    if (raw === null || raw === undefined)
        return null;
    return raw;
}
export async function requireNriHost(session, auth, me) {
    const platformAdmin = me ? isAdminUsername(me.username) : false;
    if (session.hostUserId !== auth.userId && !platformAdmin)
        return false;
    return true;
}
export function serializeNriPlayer(p) {
    return {
        displayName: p.displayName,
        classId: p.classId,
        inventory: Array.isArray(p.inventory) ? p.inventory : [],
        sheet: p.sheet ?? null,
        portraitUrl: p.portraitUrl ?? null,
        presetId: p.presetId ?? null,
        privateNotes: p.privateNotes ?? '',
        achievements: serializeAchievementState(p.achievementState),
        dossier: dossierFromSheet(p.sheet),
    };
}
export function serializeNriPreset(p) {
    return {
        id: p.id,
        label: p.label,
        classId: p.classId,
        inventory: Array.isArray(p.inventory) ? p.inventory : [],
        sheet: p.sheet ?? null,
        portraitUrl: p.portraitUrl,
        publishedToPlayers: p.publishedToPlayers,
        sortOrder: p.sortOrder,
        claimed: !!p.claimedByUserId,
        claimedByUserId: p.claimedByUserId,
        createdAt: p.createdAt.getTime(),
    };
}
//# sourceMappingURL=nriSessionHelpers.js.map