/** Пресеты персонажей */
import { isAdminUsername } from './auth.js';
import { parseNriJsonField, serializeNriPreset } from './nriSessionHelpers.js';
import { rejectIfInvalidSheetConditions } from './sheetConditionGate.js';
import { parseRequestBody } from '../../shared/api-schemas/parseBody.js';
import { nriPresetCreateSchema, nriPresetPatchSchema } from '../../shared/api-schemas/nri.js';
export function mountNriPresetRoutes(app, ctx) {
    const { prisma, jwtAuth, sendApiError, resolveUser, resolveSession, requireHost } = ctx;
    app.get('/neon_v1/services/nri/:code/presets', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        try {
            const session = await resolveSession(code);
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            const me = await resolveUser(auth);
            const isHost = session.hostUserId === auth.userId;
            const platformAdmin = me ? isAdminUsername(me.username) : false;
            const presets = await prisma.nriPresetCharacter.findMany({
                where: {
                    sessionId: session.id,
                    ...(isHost || platformAdmin
                        ? {}
                        : { publishedToPlayers: true, claimedByUserId: null }),
                },
                orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
            });
            const unclaimed = await prisma.nriPresetCharacter.count({
                where: { sessionId: session.id, claimedByUserId: null },
            });
            const publishedUnclaimed = await prisma.nriPresetCharacter.count({
                where: { sessionId: session.id, claimedByUserId: null, publishedToPlayers: true },
            });
            res.json({
                presets: presets.map(serializeNriPreset),
                meta: { unclaimed, publishedUnclaimed, selectionRequired: unclaimed > 0 },
            });
        }
        catch (error) {
            console.error('nri/presets get:', error);
            return sendApiError(res, 500, 'NRI_PRESETS_GET_FAILED', 'Не удалось загрузить персонажей.');
        }
    });
    app.post('/neon_v1/services/nri/:code/presets', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const parsed = parseRequestBody(nriPresetCreateSchema, req.body);
        if (!parsed.ok)
            return sendApiError(res, 400, 'NRI_PRESET_LABEL', parsed.message);
        const { label, classId, inventory, sheet, portraitUrl, sortOrder, publishedToPlayers } = parsed.data;
        try {
            const session = await resolveSession(code);
            if (!session || session.status !== 'open') {
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден или закрыт.');
            }
            const me = await resolveUser(auth);
            if (!me || !(await requireHost(session, auth, me))) {
                return sendApiError(res, 403, 'NRI_NOT_HOST', 'Персонажей создаёт только мастер.');
            }
            const parsedPresetSheet = parseNriJsonField(sheet);
            if (parsedPresetSheet !== null && rejectIfInvalidSheetConditions(res, parsedPresetSheet, sendApiError)) {
                return;
            }
            const preset = await prisma.nriPresetCharacter.create({
                data: {
                    sessionId: session.id,
                    label: label.trim().slice(0, 60),
                    classId: classId.trim(),
                    inventory: (Array.isArray(inventory) ? inventory : []),
                    sheet: parsedPresetSheet ?? undefined,
                    portraitUrl: typeof portraitUrl === 'string' && portraitUrl.trim() ? portraitUrl.trim().slice(0, 2000) : null,
                    sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
                    publishedToPlayers: publishedToPlayers !== false,
                },
            });
            res.status(201).json({ preset: serializeNriPreset(preset) });
        }
        catch (error) {
            console.error('nri/presets post:', error);
            return sendApiError(res, 500, 'NRI_PRESET_CREATE_FAILED', 'Не удалось создать персонажа.');
        }
    });
    app.patch('/neon_v1/services/nri/:code/presets/:presetId', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const presetId = req.params.presetId;
        const parsed = parseRequestBody(nriPresetPatchSchema, req.body);
        if (!parsed.ok)
            return sendApiError(res, 400, 'NRI_PRESET_PATCH_INVALID', parsed.message);
        const { label, classId, inventory, sheet, portraitUrl, sortOrder, publishedToPlayers } = parsed.data;
        try {
            const session = await resolveSession(code);
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            const me = await resolveUser(auth);
            if (!me || !(await requireHost(session, auth, me))) {
                return sendApiError(res, 403, 'NRI_NOT_HOST', 'Редактирует только мастер.');
            }
            const existing = await prisma.nriPresetCharacter.findFirst({
                where: { id: presetId, sessionId: session.id },
            });
            if (!existing)
                return sendApiError(res, 404, 'NRI_PRESET_NOT_FOUND', 'Персонаж не найден.');
            if (existing.claimedByUserId) {
                const changingStructure = (typeof classId === 'string' && classId.trim() && classId.trim() !== existing.classId) ||
                    inventory !== undefined;
                if (changingStructure) {
                    return sendApiError(res, 409, 'NRI_PRESET_CLAIMED', 'Персонаж уже закреплён — меняйте только имя и бэкстори.');
                }
            }
            const nextSheet = sheet !== undefined ? parseNriJsonField(sheet) ?? undefined : undefined;
            if (nextSheet !== undefined && rejectIfInvalidSheetConditions(res, nextSheet, sendApiError))
                return;
            const preset = await prisma.nriPresetCharacter.update({
                where: { id: presetId },
                data: {
                    ...(typeof label === 'string' && label.trim() ? { label: label.trim().slice(0, 60) } : {}),
                    ...(typeof classId === 'string' && classId.trim() ? { classId: classId.trim() } : {}),
                    ...(inventory !== undefined ? { inventory: (Array.isArray(inventory) ? inventory : []) } : {}),
                    ...(sheet !== undefined ? { sheet: nextSheet } : {}),
                    ...(portraitUrl !== undefined
                        ? {
                            portraitUrl: typeof portraitUrl === 'string' && portraitUrl.trim()
                                ? portraitUrl.trim().slice(0, 2000)
                                : null,
                        }
                        : {}),
                    ...(typeof sortOrder === 'number' ? { sortOrder } : {}),
                    ...(typeof publishedToPlayers === 'boolean' ? { publishedToPlayers } : {}),
                },
            });
            if (existing.claimedByUserId && (nextSheet || (typeof label === 'string' && label.trim()))) {
                const player = await prisma.nriPlayer.findFirst({
                    where: { sessionId: session.id, presetId: preset.id },
                });
                if (player) {
                    const prevSheet = player.sheet && typeof player.sheet === 'object'
                        ? { ...player.sheet }
                        : {};
                    const mergedPlayerSheet = nextSheet ? { ...prevSheet, ...nextSheet } : null;
                    if (mergedPlayerSheet && rejectIfInvalidSheetConditions(res, mergedPlayerSheet, sendApiError)) {
                        return;
                    }
                    await prisma.nriPlayer.update({
                        where: { id: player.id },
                        data: {
                            ...(typeof label === 'string' && label.trim()
                                ? { displayName: label.trim().slice(0, 40) }
                                : {}),
                            ...(mergedPlayerSheet ? { sheet: mergedPlayerSheet } : {}),
                        },
                    });
                }
            }
            res.json({ preset: serializeNriPreset(preset) });
        }
        catch (error) {
            console.error('nri/presets patch:', error);
            return sendApiError(res, 500, 'NRI_PRESET_UPDATE_FAILED', 'Не удалось обновить персонажа.');
        }
    });
    app.delete('/neon_v1/services/nri/:code/presets/:presetId', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const presetId = req.params.presetId;
        try {
            const session = await resolveSession(code);
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            const me = await resolveUser(auth);
            if (!me || !(await requireHost(session, auth, me))) {
                return sendApiError(res, 403, 'NRI_NOT_HOST', 'Удаляет только мастер.');
            }
            const existing = await prisma.nriPresetCharacter.findFirst({
                where: { id: presetId, sessionId: session.id },
            });
            if (!existing)
                return sendApiError(res, 404, 'NRI_PRESET_NOT_FOUND', 'Персонаж не найден.');
            if (existing.claimedByUserId) {
                return sendApiError(res, 409, 'NRI_PRESET_CLAIMED', 'Нельзя удалить закреплённого персонажа.');
            }
            await prisma.nriPresetCharacter.delete({ where: { id: presetId } });
            res.json({ ok: true });
        }
        catch (error) {
            console.error('nri/presets delete:', error);
            return sendApiError(res, 500, 'NRI_PRESET_DELETE_FAILED', 'Не удалось удалить персонажа.');
        }
    });
}
//# sourceMappingURL=nriPresetRoutes.js.map