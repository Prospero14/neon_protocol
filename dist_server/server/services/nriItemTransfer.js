/** Передача предметов через личку + показ за столом. */
import { isAdminUsername } from './auth.js';
import { mergeInventoryItem, takeOneInstanceItem, } from './nriItemGrant.js';
import { catalogToServerInventoryItem } from './nriItemCatalogServer.js';
function dmKeyFor(a, b) {
    return [a, b].sort().join(':');
}
async function findOrCreateDmRoom(prisma, userA, userB) {
    const dmKey = dmKeyFor(userA, userB);
    let room = await prisma.chatRoom.findUnique({ where: { dmKey } });
    if (!room) {
        room = await prisma.chatRoom.create({ data: { kind: 'dm', dmKey } });
    }
    return room;
}
function itemStatsLine(item) {
    const parts = [];
    const mods = item.c2185Mods;
    if (mods) {
        for (const [k, v] of Object.entries(mods)) {
            if (typeof v === 'number')
                parts.push(`${k} ${v >= 0 ? '+' : ''}${v}`);
        }
    }
    if (typeof item.acBonus === 'number')
        parts.push(`AC +${item.acBonus}`);
    const atk = item.attack;
    if (atk?.damageDice)
        parts.push(`${atk.damageDice} ${atk.damageType ?? ''}`.trim());
    return parts.join(' · ') || 'без боевых бонусов';
}
function transferText(fromName, toName, itemName) {
    return `${fromName} передаёт ${toName}: «${itemName}».`.slice(0, 2000);
}
export function mountNriItemTransferRoutes(app, deps) {
    const { prisma, jwtAuth, sendApiError, resolveSession, resolveUser } = deps;
    app.post('/neon_v1/services/nri/:code/items/transfer', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const { toUserId, itemId, fromNpcId, asNpcId, catalogId, qty } = req.body;
        if (typeof toUserId !== 'string' || !toUserId.trim()) {
            return sendApiError(res, 400, 'NRI_TRANSFER_TO', 'Укажите получателя.');
        }
        try {
            const session = await resolveSession(code);
            if (!session || session.status !== 'open') {
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден или закрыт.');
            }
            const me = await resolveUser(auth);
            if (!me)
                return sendApiError(res, 401, 'NRI_USER', 'Пользователь не найден.');
            const isHost = session.hostUserId === auth.userId;
            const platformAdmin = isAdminUsername(me.username);
            const recipient = await prisma.nriPlayer.findUnique({
                where: { sessionId_userId: { sessionId: session.id, userId: toUserId.trim() } },
            });
            if (!recipient) {
                return sendApiError(res, 404, 'NRI_PLAYER_NOT_FOUND', 'Получатель не найден на столе.');
            }
            let item = null;
            let fromDisplayName = me.username;
            let fromNpcIdOut = null;
            let fromNpcImage = null;
            let fromNpcArchetype;
            let senderInventory;
            if (typeof catalogId === 'string' && catalogId.trim()) {
                if (!isHost && !platformAdmin) {
                    return sendApiError(res, 403, 'NRI_HOST_ONLY', 'Выдача из каталога — только мастер.');
                }
                item = catalogToServerInventoryItem(catalogId.trim());
                if (!item)
                    return sendApiError(res, 400, 'NRI_CATALOG_UNKNOWN', 'Неизвестный предмет.');
                if (typeof qty === 'number' && qty > 1)
                    item.qty = qty;
                fromDisplayName = isHost ? 'Мастер' : me.username;
            }
            else if (typeof fromNpcId === 'string' && fromNpcId.trim()) {
                if (!isHost && !platformAdmin) {
                    return sendApiError(res, 403, 'NRI_HOST_ONLY', 'Передача от НПС — только мастер.');
                }
                const npc = await prisma.nriNpc.findFirst({
                    where: { id: fromNpcId.trim(), sessionId: session.id },
                });
                if (!npc)
                    return sendApiError(res, 404, 'NRI_NPC_NOT_FOUND', 'НПС не найден.');
                if (typeof itemId !== 'string' || !itemId.trim()) {
                    return sendApiError(res, 400, 'NRI_ITEM_ID', 'Укажите предмет НПС.');
                }
                const npcInv = Array.isArray(npc.inventory) ? [...npc.inventory] : [];
                const taken = takeOneInstanceItem(npcInv, itemId.trim());
                if (!taken.item) {
                    return sendApiError(res, 404, 'NRI_ITEM_NOT_FOUND', 'Предмет не найден у НПС.');
                }
                await prisma.nriNpc.update({
                    where: { id: npc.id },
                    data: { inventory: taken.inventory },
                });
                item = taken.item;
                fromDisplayName = npc.name;
                fromNpcIdOut = npc.id;
                fromNpcImage = npc.imageUrl;
                const sheet = npc.sheet && typeof npc.sheet === 'object'
                    ? npc.sheet
                    : null;
                if (typeof sheet?.npcArchetype === 'string')
                    fromNpcArchetype = sheet.npcArchetype;
            }
            else {
                if (typeof itemId !== 'string' || !itemId.trim()) {
                    return sendApiError(res, 400, 'NRI_ITEM_ID', 'Укажите предмет.');
                }
                const sender = await prisma.nriPlayer.findUnique({
                    where: { sessionId_userId: { sessionId: session.id, userId: auth.userId } },
                });
                if (!sender) {
                    return sendApiError(res, 404, 'NRI_PLAYER_NOT_FOUND', 'Сначала создайте персонажа.');
                }
                const inv = Array.isArray(sender.inventory) ? [...sender.inventory] : [];
                const taken = takeOneInstanceItem(inv, itemId.trim());
                if (!taken.item) {
                    return sendApiError(res, 404, 'NRI_ITEM_NOT_FOUND', 'Предмет не найден в инвентаре.');
                }
                if (taken.item.equipped) {
                    return sendApiError(res, 400, 'NRI_ITEM_EQUIPPED', 'Снимите предмет перед передачей.');
                }
                await prisma.nriPlayer.update({
                    where: { id: sender.id },
                    data: { inventory: taken.inventory },
                });
                item = taken.item;
                fromDisplayName = sender.displayName;
                senderInventory = taken.inventory;
            }
            const npcForDisplay = typeof asNpcId === 'string' && asNpcId.trim()
                ? await prisma.nriNpc.findFirst({ where: { id: asNpcId.trim(), sessionId: session.id } })
                : null;
            if (npcForDisplay && isHost) {
                fromDisplayName = npcForDisplay.name;
                fromNpcIdOut = npcForDisplay.id;
                fromNpcImage = npcForDisplay.imageUrl;
            }
            const recvInv = Array.isArray(recipient.inventory)
                ? [...recipient.inventory]
                : [];
            const nextInv = mergeInventoryItem(recvInv, item);
            await prisma.nriPlayer.update({
                where: { id: recipient.id },
                data: { inventory: nextInv },
            });
            const dmRoom = await findOrCreateDmRoom(prisma, auth.userId, toUserId.trim());
            const payload = {
                type: 'item_transfer',
                sessionId: session.id,
                fromDisplayName,
                fromNpcId: fromNpcIdOut,
                fromNpcImageUrl: fromNpcImage,
                fromNpcArchetype,
                toDisplayName: recipient.displayName,
                toUserId: recipient.userId,
                item,
                statsLine: itemStatsLine(item),
                broadcasted: false,
            };
            const text = transferText(fromDisplayName, recipient.displayName, item.name);
            const msg = await prisma.chatMessage.create({
                data: {
                    roomId: dmRoom.id,
                    userId: auth.userId,
                    text,
                    payload: JSON.stringify(payload),
                },
            });
            res.json({
                ok: true,
                messageId: msg.id,
                dmRoomId: dmRoom.id,
                inventory: auth.userId === toUserId.trim() ? nextInv : senderInventory,
                recipientInventory: nextInv,
                text,
            });
        }
        catch (error) {
            console.error('nri/items transfer:', error);
            return sendApiError(res, 500, 'NRI_TRANSFER_FAILED', 'Не удалось передать предмет.');
        }
    });
    app.post('/neon_v1/services/nri/:code/items/transfer/broadcast', async (req, res) => {
        const auth = jwtAuth(req);
        if (!auth)
            return sendApiError(res, 401, 'NRI_NO_TOKEN', 'Нет токена авторизации.');
        const code = String(req.params.code ?? '').trim().toUpperCase();
        const { messageId } = req.body;
        if (typeof messageId !== 'string' || !messageId.trim()) {
            return sendApiError(res, 400, 'NRI_MSG_ID', 'Укажите messageId.');
        }
        try {
            const session = await resolveSession(code);
            if (!session || session.status !== 'open') {
                return sendApiError(res, 404, 'NRI_NOT_FOUND', 'Стол не найден.');
            }
            const msg = await prisma.chatMessage.findUnique({ where: { id: messageId.trim() } });
            if (!msg?.payload)
                return sendApiError(res, 404, 'NRI_MSG_NOT_FOUND', 'Сообщение не найдено.');
            let payload;
            try {
                payload = JSON.parse(msg.payload);
            }
            catch {
                return sendApiError(res, 400, 'NRI_MSG_PAYLOAD', 'Неверный payload.');
            }
            if (payload.type !== 'item_transfer') {
                return sendApiError(res, 400, 'NRI_MSG_TYPE', 'Это не передача предмета.');
            }
            const room = await prisma.chatRoom.findUnique({ where: { id: msg.roomId } });
            if (!room || room.kind !== 'dm' || !room.dmKey) {
                return sendApiError(res, 400, 'NRI_MSG_ROOM', 'Передача не из лички.');
            }
            const [a, b] = room.dmKey.split(':');
            if (auth.userId !== a && auth.userId !== b) {
                return sendApiError(res, 403, 'NRI_TRANSFER_FORBIDDEN', 'Нет доступа к этой передаче.');
            }
            const isHost = session.hostUserId === auth.userId;
            const me = await resolveUser(auth);
            const platformAdmin = me ? isAdminUsername(me.username) : false;
            if (!isHost && !platformAdmin && msg.userId !== auth.userId) {
                return sendApiError(res, 403, 'NRI_BROADCAST_FORBIDDEN', 'Показать может участник передачи или мастер.');
            }
            const fromName = typeof payload.fromDisplayName === 'string' ? payload.fromDisplayName : 'Кто-то';
            const item = payload.item;
            const itemName = item?.name ?? 'предмет';
            const stats = typeof payload.statsLine === 'string' ? payload.statsLine : itemStatsLine(item ?? { id: '', name: itemName });
            const tableText = `${fromName} показал за столом: «${itemName}» · ${stats}`.slice(0, 2000);
            await prisma.chatMessage.create({
                data: {
                    roomId: session.chatRoomId,
                    userId: auth.userId,
                    text: tableText,
                    payload: JSON.stringify({
                        type: 'item_show',
                        sourceMessageId: msg.id,
                        item,
                        fromDisplayName: fromName,
                    }),
                },
            });
            await prisma.chatMessage.update({
                where: { id: msg.id },
                data: {
                    payload: JSON.stringify({ ...payload, broadcasted: true }),
                },
            });
            res.json({ ok: true, text: tableText });
        }
        catch (error) {
            console.error('nri/items broadcast:', error);
            return sendApiError(res, 500, 'NRI_BROADCAST_FAILED', 'Не удалось показать предмет.');
        }
    });
}
//# sourceMappingURL=nriItemTransfer.js.map