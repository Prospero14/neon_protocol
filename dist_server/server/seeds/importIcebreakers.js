import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
function resolveSeedPath() {
    const candidates = [
        path.join(process.cwd(), 'shared', 'seeds', 'icebreakers-nri.json'),
        path.join(process.cwd(), 'dist_server', 'shared', 'seeds', 'icebreakers-nri.json'),
        path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'shared', 'seeds', 'icebreakers-nri.json'),
    ];
    for (const p of candidates) {
        if (fs.existsSync(p))
            return p;
    }
    return null;
}
function asJson(value) {
    if (value == null)
        return value;
    if (typeof value === 'string') {
        try {
            return JSON.parse(value);
        }
        catch {
            return value;
        }
    }
    return value;
}
function asDate(value) {
    if (value == null || value === '')
        return undefined;
    const d = new Date(String(value));
    return Number.isNaN(d.getTime()) ? undefined : d;
}
function asBool(value, fallback = false) {
    if (typeof value === 'boolean')
        return value;
    if (value === 1 || value === '1')
        return true;
    if (value === 0 || value === '0')
        return false;
    return fallback;
}
function mapId(map, id) {
    const key = String(id);
    return map.get(key) ?? key;
}
/**
 * Импорт заполненного стола ICEBREAKERS (NRI-2U5R) в текущую БД.
 * По умолчанию (auto): создать если нет; если стол «пустой» — перезалить.
 * NEON_IMPORT_ICEBREAKERS=0 — выключить.
 * NEON_IMPORT_ICEBREAKERS=force — всегда перезалить.
 */
export async function importIcebreakersSeed(prisma) {
    const flag = (process.env.NEON_IMPORT_ICEBREAKERS ?? 'auto').trim().toLowerCase();
    if (flag === '0' || flag === 'false' || flag === 'off') {
        console.log('[NEON_SEED] ICEBREAKERS import disabled');
        return;
    }
    const seedPath = resolveSeedPath();
    if (!seedPath) {
        console.warn('[NEON_SEED] icebreakers-nri.json not found — skip');
        return;
    }
    console.log(`[NEON_SEED] seed file: ${seedPath}`);
    const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
    const invite = seed.meta.inviteCode || seed.session.inviteCode;
    const existing = await prisma.nriSession.findUnique({ where: { inviteCode: invite } });
    let shouldImport = !existing || flag === 'force';
    if (existing && flag !== 'force' && flag !== '0') {
        const [npcCount, playerCount, factionCount] = await Promise.all([
            prisma.nriNpc.count({ where: { sessionId: existing.id } }),
            prisma.nriPlayer.count({ where: { sessionId: existing.id } }),
            prisma.nriFaction.count({ where: { sessionId: existing.id } }),
        ]);
        const thin = npcCount < 2 || playerCount < 1 || factionCount < 1;
        if (thin) {
            console.log(`[NEON_SEED] ${invite} exists but thin (npc=${npcCount}, players=${playerCount}, factions=${factionCount}) — re-import`);
            shouldImport = true;
        }
        else {
            console.log(`[NEON_SEED] ICEBREAKERS ${invite} already present — skip import`);
            await syncSeedPasswords(prisma, seed);
            await ensureSeedMemberships(prisma, seed, invite);
            return;
        }
    }
    if (!shouldImport)
        return;
    if (existing) {
        console.log(`[NEON_SEED] replacing session ${invite}`);
        await prisma.nriSession.delete({ where: { id: existing.id } });
        if (existing.chatRoomId) {
            await prisma.chatRoom.delete({ where: { id: existing.chatRoomId } }).catch(() => undefined);
        }
    }
    console.log(`[NEON_SEED] importing ICEBREAKERS from ${seedPath}`);
    const userIdMap = new Map();
    for (const u of seed.users) {
        const byName = await prisma.user.findUnique({ where: { username: u.username } });
        if (byName) {
            await prisma.user.update({
                where: { id: byName.id },
                data: { passwordHash: u.passwordHash },
            });
            userIdMap.set(u.id, byName.id);
            continue;
        }
        const byId = await prisma.user.findUnique({ where: { id: u.id } });
        if (byId) {
            await prisma.user.update({
                where: { id: byId.id },
                data: { passwordHash: u.passwordHash, username: u.username },
            });
            userIdMap.set(u.id, byId.id);
            continue;
        }
        await prisma.user.create({
            data: {
                id: u.id,
                username: u.username,
                passwordHash: u.passwordHash,
                createdAt: asDate(u.createdAt),
                updatedAt: asDate(u.updatedAt) ?? new Date(),
                gameState: {
                    create: {
                        bits: 150,
                        level: 1,
                        ramPool: 4,
                        stress: 0,
                        maxStress: 100,
                        activeDeck: [],
                        inventory: [],
                        artifacts: [],
                        completedQuests: [],
                        reputation: {},
                        intel: [],
                    },
                },
            },
        });
        userIdMap.set(u.id, u.id);
    }
    const hostUserId = mapId(userIdMap, seed.session.hostUserId);
    let chatRoomId = seed.chatRoom.id;
    const roomBySlug = seed.chatRoom.slug
        ? await prisma.chatRoom.findUnique({ where: { slug: seed.chatRoom.slug } })
        : null;
    if (roomBySlug) {
        chatRoomId = roomBySlug.id;
    }
    else {
        const roomById = await prisma.chatRoom.findUnique({ where: { id: seed.chatRoom.id } });
        if (!roomById) {
            await prisma.chatRoom.create({
                data: {
                    id: seed.chatRoom.id,
                    kind: seed.chatRoom.kind || 'nri',
                    slug: seed.chatRoom.slug,
                    dmKey: seed.chatRoom.dmKey,
                    createdAt: asDate(seed.chatRoom.createdAt),
                },
            });
        }
        chatRoomId = seed.chatRoom.id;
    }
    await prisma.nriSession.create({
        data: {
            id: seed.session.id,
            inviteCode: invite,
            hostUserId,
            title: String(seed.session.title || seed.meta.title || 'ICEBREAKERS'),
            chatRoomId,
            status: String(seed.session.status || 'open'),
            spamBotEnabled: asBool(seed.session.spamBotEnabled, false),
            liveDialogEnabled: asBool(seed.session.liveDialogEnabled, false),
            liveDialogEndedAt: asDate(seed.session.liveDialogEndedAt) ?? null,
            spamPausedUntil: asDate(seed.session.spamPausedUntil) ?? null,
            createdAt: asDate(seed.session.createdAt),
        },
    });
    const sessionId = seed.session.id;
    for (const m of seed.members) {
        await prisma.nriSessionMember.create({
            data: {
                id: String(m.id),
                sessionId,
                userId: mapId(userIdMap, m.userId),
                username: String(m.username),
                isHost: asBool(m.isHost, false),
                joinedAt: asDate(m.joinedAt),
                lastSeenAt: asDate(m.lastSeenAt) ?? new Date(),
            },
        });
    }
    for (const p of seed.presets) {
        await prisma.nriPresetCharacter.create({
            data: {
                id: String(p.id),
                sessionId,
                label: String(p.label),
                classId: String(p.classId),
                inventory: asJson(p.inventory),
                sheet: asJson(p.sheet),
                portraitUrl: p.portraitUrl ?? null,
                publishedToPlayers: asBool(p.publishedToPlayers, false),
                sortOrder: Number(p.sortOrder ?? 0),
                claimedByUserId: p.claimedByUserId ? mapId(userIdMap, p.claimedByUserId) : null,
                createdAt: asDate(p.createdAt),
            },
        });
    }
    for (const p of seed.players) {
        await prisma.nriPlayer.create({
            data: {
                id: String(p.id),
                sessionId,
                userId: mapId(userIdMap, p.userId),
                displayName: String(p.displayName),
                classId: String(p.classId),
                inventory: asJson(p.inventory),
                sheet: asJson(p.sheet),
                portraitUrl: p.portraitUrl ?? null,
                presetId: p.presetId ?? null,
                privateNotes: String(p.privateNotes ?? ''),
                createdAt: asDate(p.createdAt),
                updatedAt: asDate(p.updatedAt) ?? new Date(),
            },
        });
    }
    for (const n of seed.npcs) {
        await prisma.nriNpc.create({
            data: {
                id: String(n.id),
                sessionId,
                name: String(n.name),
                classId: n.classId ?? null,
                imageUrl: n.imageUrl ?? null,
                inventory: asJson(n.inventory),
                sheet: asJson(n.sheet),
                notes: n.notes ?? null,
                createdAt: asDate(n.createdAt),
                updatedAt: asDate(n.updatedAt) ?? new Date(),
            },
        });
    }
    for (const c of seed.cyberProducts ?? []) {
        await prisma.nriCyberProduct.create({
            data: {
                id: String(c.id),
                sessionId,
                name: String(c.name),
                slot: String(c.slot),
                blueprint: asJson(c.blueprint) ?? {},
                build: asJson(c.build) ?? {},
                priceWonlongs: Number(c.priceWonlongs ?? 0),
                inShop: asBool(c.inShop, true),
                vendorNpcId: c.vendorNpcId ?? null,
                createdAt: asDate(c.createdAt),
                updatedAt: asDate(c.updatedAt) ?? new Date(),
            },
        });
    }
    for (const v of seed.vehicles ?? []) {
        await prisma.nriSessionVehicle.create({
            data: {
                id: String(v.id),
                sessionId,
                catalogId: String(v.catalogId),
                label: v.label ?? null,
                assignedUserId: v.assignedUserId ? mapId(userIdMap, v.assignedUserId) : null,
                notes: v.notes ?? null,
                createdAt: asDate(v.createdAt),
            },
        });
    }
    for (const node of seed.scenarioNodes ?? []) {
        await prisma.nriScenarioNode.create({
            data: {
                id: String(node.id),
                sessionId,
                parentId: null,
                title: String(node.title ?? ''),
                summary: String(node.summary ?? ''),
                body: String(node.body ?? ''),
                sortOrder: Number(node.sortOrder ?? 0),
                links: asJson(node.links) ?? [],
                createdAt: asDate(node.createdAt),
                updatedAt: asDate(node.updatedAt) ?? new Date(),
            },
        });
    }
    for (const node of seed.scenarioNodes ?? []) {
        if (!node.parentId)
            continue;
        await prisma.nriScenarioNode.update({
            where: { id: String(node.id) },
            data: { parentId: String(node.parentId) },
        });
    }
    if (seed.loreWorld) {
        await prisma.nriLoreWorld.create({
            data: {
                sessionId,
                body: String(seed.loreWorld.body ?? ''),
                updatedAt: asDate(seed.loreWorld.updatedAt) ?? new Date(),
            },
        });
    }
    for (const e of seed.loreEntries ?? []) {
        await prisma.nriLoreEntry.create({
            data: {
                id: String(e.id),
                sessionId,
                title: String(e.title ?? ''),
                summary: String(e.summary ?? ''),
                body: String(e.body ?? ''),
                sortOrder: Number(e.sortOrder ?? 0),
                createdAt: asDate(e.createdAt),
                updatedAt: asDate(e.updatedAt) ?? new Date(),
            },
        });
    }
    for (const f of seed.factions ?? []) {
        await prisma.nriFaction.create({
            data: {
                id: String(f.id),
                sessionId,
                kind: String(f.kind ?? 'faction'),
                name: String(f.name),
                summary: String(f.summary ?? ''),
                description: String(f.description ?? ''),
                color: f.color ?? null,
                iconId: f.iconId ?? null,
                zoneKeys: asJson(f.zoneKeys) ?? [],
                memberPlayerIds: asJson(f.memberPlayerIds) ?? [],
                memberNpcIds: asJson(f.memberNpcIds) ?? [],
                createdAt: asDate(f.createdAt),
                updatedAt: asDate(f.updatedAt) ?? new Date(),
            },
        });
    }
    for (const pl of seed.places ?? []) {
        await prisma.nriLorePlace.create({
            data: {
                id: String(pl.id),
                sessionId,
                title: String(pl.title),
                summary: String(pl.summary ?? ''),
                body: String(pl.body ?? ''),
                zoneKey: pl.zoneKey ?? null,
                mapMarkerId: pl.mapMarkerId ?? null,
                x: pl.x == null ? null : Number(pl.x),
                y: pl.y == null ? null : Number(pl.y),
                sourceScenarioNodeId: pl.sourceScenarioNodeId ?? null,
                sourceFactionId: pl.sourceFactionId ?? null,
                entityTag: pl.entityTag ?? null,
                iconId: pl.iconId ?? null,
                createdAt: asDate(pl.createdAt),
                updatedAt: asDate(pl.updatedAt) ?? new Date(),
            },
        });
    }
    for (const m of seed.markers ?? []) {
        await prisma.nriMapMarker.create({
            data: {
                id: String(m.id),
                sessionId,
                ownerUserId: m.ownerUserId ? mapId(userIdMap, m.ownerUserId) : null,
                label: String(m.label ?? ''),
                blurb: String(m.blurb ?? ''),
                x: Number(m.x ?? 0),
                y: Number(m.y ?? 0),
                kind: String(m.kind ?? 'pin'),
                createdAt: asDate(m.createdAt),
            },
        });
    }
    for (const v of seed.vaultFiles ?? []) {
        await prisma.nriVaultFile.create({
            data: {
                id: String(v.id),
                sessionId,
                title: String(v.title),
                body: String(v.body ?? ''),
                protected: asBool(v.protected, false),
                passwordHash: v.passwordHash ?? null,
                iceRewardCode: v.iceRewardCode ?? null,
                gameId: v.gameId ?? null,
                difficulty: v.difficulty ?? null,
                createdById: mapId(userIdMap, v.createdById),
                createdAt: asDate(v.createdAt),
            },
        });
    }
    for (const u of seed.fileUnlocks ?? []) {
        await prisma.nriFileUnlock.create({
            data: {
                id: String(u.id),
                fileId: String(u.fileId),
                userId: mapId(userIdMap, u.userId),
                icePassedAt: asDate(u.icePassedAt) ?? null,
                unlockedAt: asDate(u.unlockedAt) ?? null,
            },
        });
    }
    for (const c of seed.combatants ?? []) {
        await prisma.nriCombatant.create({
            data: {
                id: String(c.id),
                sessionId,
                name: String(c.name),
                classId: c.classId ?? null,
                archetypeId: c.archetypeId ?? null,
                threatTier: String(c.threatTier ?? 'street'),
                imageUrl: c.imageUrl ?? null,
                inventory: asJson(c.inventory) ?? [],
                sheet: asJson(c.sheet),
                notes: c.notes ?? null,
                createdAt: asDate(c.createdAt),
                updatedAt: asDate(c.updatedAt) ?? new Date(),
            },
        });
    }
    for (const pos of seed.playerPositions ?? []) {
        await prisma.nriPlayerPosition.create({
            data: {
                id: String(pos.id),
                sessionId,
                userId: mapId(userIdMap, pos.userId),
                zoneKey: pos.zoneKey ?? null,
                x: pos.x == null ? null : Number(pos.x),
                y: pos.y == null ? null : Number(pos.y),
                vehicleId: pos.vehicleId ?? null,
                vehicleOverload: asBool(pos.vehicleOverload, false),
                updatedAt: asDate(pos.updatedAt) ?? new Date(),
            },
        });
    }
    for (const a of seed.hostAlerts ?? []) {
        await prisma.nriHostAlert.create({
            data: {
                id: String(a.id),
                sessionId,
                fromUserId: mapId(userIdMap, a.fromUserId),
                kind: String(a.kind),
                body: String(a.body ?? ''),
                read: asBool(a.read, false),
                createdAt: asDate(a.createdAt),
            },
        });
    }
    for (const s of seed.iceScores ?? []) {
        await prisma.nriIceScore.create({
            data: {
                id: String(s.id),
                sessionId,
                userId: mapId(userIdMap, s.userId),
                displayName: String(s.displayName ?? ''),
                gameId: String(s.gameId ?? 'gibson_ice'),
                difficulty: String(s.difficulty ?? 'medium'),
                score: Number(s.score ?? 0),
                exfilPct: Number(s.exfilPct ?? 0),
                tracePct: Number(s.tracePct ?? 0),
                won: asBool(s.won, false),
                createdAt: asDate(s.createdAt),
            },
        });
    }
    if (seed.scenarioProgress) {
        await prisma.nriScenarioProgress.create({
            data: {
                sessionId,
                currentScriptNodeId: seed.scenarioProgress.currentScriptNodeId ?? null,
                completedNodeIds: asJson(seed.scenarioProgress.completedNodeIds) ?? [],
                updatedAt: asDate(seed.scenarioProgress.updatedAt) ?? new Date(),
            },
        });
    }
    for (const msg of seed.chatMessages ?? []) {
        const exists = await prisma.chatMessage.findUnique({ where: { id: String(msg.id) } });
        if (exists)
            continue;
        await prisma.chatMessage.create({
            data: {
                id: String(msg.id),
                roomId: chatRoomId,
                userId: mapId(userIdMap, msg.userId),
                text: String(msg.text ?? ''),
                payload: msg.payload ?? null,
                createdAt: asDate(msg.createdAt),
            },
        });
    }
    console.log(`[NEON_SEED] ICEBREAKERS ${invite} imported (host test / test1234)`);
    await stampNriResumeSnapshot(prisma, userIdMap, seed, invite);
}
async function ensureSeedMemberships(prisma, seed, invite) {
    const session = await prisma.nriSession.findUnique({ where: { inviteCode: invite } });
    if (!session)
        return;
    for (const m of seed.members) {
        const user = await prisma.user.findUnique({ where: { username: String(m.username) } });
        if (!user)
            continue;
        await prisma.nriSessionMember.upsert({
            where: { sessionId_userId: { sessionId: session.id, userId: user.id } },
            create: {
                sessionId: session.id,
                userId: user.id,
                username: user.username,
                isHost: asBool(m.isHost, false) || session.hostUserId === user.id,
            },
            update: {
                username: user.username,
                isHost: asBool(m.isHost, false) || session.hostUserId === user.id,
                lastSeenAt: new Date(),
            },
        });
    }
    const userIdMap = new Map();
    for (const u of seed.users) {
        const row = await prisma.user.findUnique({ where: { username: u.username } });
        if (row)
            userIdMap.set(u.id, row.id);
    }
    await stampNriResumeSnapshot(prisma, userIdMap, seed, invite);
}
async function stampNriResumeSnapshot(prisma, userIdMap, seed, invite) {
    for (const u of seed.users) {
        const userId = userIdMap.get(u.id) ?? (await prisma.user.findUnique({ where: { username: u.username } }))?.id;
        if (!userId)
            continue;
        const gs = await prisma.gameState.findUnique({ where: { userId } });
        const prev = gs?.clientSnapshot && typeof gs.clientSnapshot === 'object' && !Array.isArray(gs.clientSnapshot)
            ? gs.clientSnapshot
            : {};
        const next = {
            ...prev,
            sessionMode: 'nri',
            nriInviteCode: invite,
            currentView: 'NRI_LOBBY',
        };
        if (gs) {
            await prisma.gameState.update({
                where: { userId },
                data: { clientSnapshot: next },
            });
        }
        else {
            await prisma.gameState.create({
                data: {
                    userId,
                    bits: 150,
                    level: 1,
                    ramPool: 4,
                    stress: 0,
                    maxStress: 100,
                    activeDeck: [],
                    inventory: [],
                    artifacts: [],
                    completedQuests: [],
                    reputation: {},
                    intel: [],
                    clientSnapshot: next,
                },
            });
        }
    }
    console.log(`[NEON_SEED] stamped nriInviteCode=${invite} on seed user snapshots`);
}
async function syncSeedPasswords(prisma, seed) {
    for (const u of seed.users) {
        const row = await prisma.user.findUnique({ where: { username: u.username } });
        if (!row)
            continue;
        if (row.passwordHash === u.passwordHash)
            continue;
        await prisma.user.update({
            where: { id: row.id },
            data: { passwordHash: u.passwordHash },
        });
        console.log(`[NEON_SEED] synced password hash for ${u.username}`);
    }
}
//# sourceMappingURL=importIcebreakers.js.map