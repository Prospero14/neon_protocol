/** CRUD боевиков стола НРИ (мастер). */
function serializeCombatant(c) {
    return {
        id: c.id,
        name: c.name,
        classId: c.classId,
        archetypeId: c.archetypeId,
        threatTier: c.threatTier,
        imageUrl: c.imageUrl,
        inventory: Array.isArray(c.inventory) ? c.inventory : [],
        sheet: c.sheet ?? null,
        notes: c.notes,
        createdAt: c.createdAt.getTime(),
        updatedAt: c.updatedAt.getTime(),
    };
}
export function mountNriCombatantRoutes(app, deps) {
    const { prisma, jwtAuth, sendApiError, resolveSession, resolveUser, requireHost, parseJsonField } = deps;
    app.get('/neon_v1/services/nri/:code/combatants', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        try {
            const session = await resolveSession(code);
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            const me = await resolveUser(auth);
            if (!me || !(await requireHost(session, auth, me))) {
                return sendApiError(res, 403, 'NRI_NOT_HOST', 'Боевики доступны только мастеру.');
            }
            const combatants = await prisma.nriCombatant.findMany({
                where: { sessionId: session.id },
                orderBy: [{ threatTier: 'desc' }, { name: 'asc' }],
            });
            res.json({ combatants: combatants.map(serializeCombatant) });
        }
        catch (error) {
            console.error('nri/combatants get:', error);
            return sendApiError(res, 500, 'NRI_COMBATANTS_GET_FAILED', 'Не удалось загрузить боевиков.');
        }
    });
    app.post('/neon_v1/services/nri/:code/combatants', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const { name, classId, archetypeId, threatTier, imageUrl, inventory, sheet, notes } = req.body;
        if (typeof name !== 'string' || !name.trim()) {
            return sendApiError(res, 400, 'NRI_COMBATANT_NAME', 'Укажите имя противника.');
        }
        const tier = threatTier === 'pro' || threatTier === 'max' || threatTier === 'street' ? threatTier : 'street';
        try {
            const session = await resolveSession(code);
            if (!session || session.status !== 'open') {
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден или закрыт.');
            }
            const me = await resolveUser(auth);
            if (!me || !(await requireHost(session, auth, me))) {
                return sendApiError(res, 403, 'NRI_NOT_HOST', 'Боевиков создаёт только мастер.');
            }
            const combatant = await prisma.nriCombatant.create({
                data: {
                    sessionId: session.id,
                    name: name.trim().slice(0, 60),
                    classId: typeof classId === 'string' && classId.trim() ? classId.trim() : null,
                    archetypeId: typeof archetypeId === 'string' && archetypeId.trim() ? archetypeId.trim() : null,
                    threatTier: tier,
                    imageUrl: typeof imageUrl === 'string' && imageUrl.trim() ? imageUrl.trim().slice(0, 2000) : null,
                    inventory: Array.isArray(inventory) ? inventory : [],
                    sheet: parseJsonField(sheet) ?? undefined,
                    notes: typeof notes === 'string' ? notes.slice(0, 2000) : null,
                },
            });
            res.status(201).json({ combatant: serializeCombatant(combatant) });
        }
        catch (error) {
            console.error('nri/combatants post:', error);
            return sendApiError(res, 500, 'NRI_COMBATANT_CREATE_FAILED', 'Не удалось создать боевика.');
        }
    });
    app.delete('/neon_v1/services/nri/:code/combatants/:combatantId', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const combatantId = req.params.combatantId;
        try {
            const session = await resolveSession(code);
            if (!session)
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            const me = await resolveUser(auth);
            if (!me || !(await requireHost(session, auth, me))) {
                return sendApiError(res, 403, 'NRI_NOT_HOST', 'Удаляет только мастер.');
            }
            const existing = await prisma.nriCombatant.findFirst({
                where: { id: combatantId, sessionId: session.id },
            });
            if (!existing)
                return sendApiError(res, 404, 'NRI_COMBATANT_NOT_FOUND', 'Боевик не найден.');
            await prisma.nriCombatant.delete({ where: { id: combatantId } });
            res.json({ ok: true });
        }
        catch (error) {
            console.error('nri/combatants delete:', error);
            return sendApiError(res, 500, 'NRI_COMBATANT_DELETE_FAILED', 'Не удалось удалить боевика.');
        }
    });
}
//# sourceMappingURL=nriCombatantRoutes.js.map