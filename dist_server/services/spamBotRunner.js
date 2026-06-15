import { pickRandomSpamLine, SPAM_BOT_USERNAME } from './messengerSpamPool.js';
const timers = new Map();
let spamBotUserId = null;
export async function ensureSpamBotUser(prisma) {
    if (spamBotUserId)
        return spamBotUserId;
    let user = await prisma.user.findUnique({ where: { username: SPAM_BOT_USERNAME } });
    if (!user) {
        user = await prisma.user.create({
            data: {
                username: SPAM_BOT_USERNAME,
                passwordHash: '!',
            },
        });
    }
    spamBotUserId = user.id;
    return user.id;
}
async function postSpam(prisma, roomId, botUserId) {
    await prisma.chatMessage.create({
        data: {
            roomId,
            userId: botUserId,
            text: pickRandomSpamLine(),
        },
    });
}
export async function startRoomSpamBot(prisma, key, roomId, guard) {
    stopRoomSpamBot(key);
    const botUserId = await ensureSpamBotUser(prisma);
    const tick = async () => {
        const ok = await guard();
        if (!ok) {
            stopRoomSpamBot(key);
            return;
        }
        await postSpam(prisma, roomId, botUserId);
    };
    void tick();
    const intervalMs = 18000 + Math.floor(Math.random() * 12000);
    timers.set(key, setInterval(() => void tick(), intervalMs));
}
export function stopRoomSpamBot(key) {
    const t = timers.get(key);
    if (t)
        clearInterval(t);
    timers.delete(key);
}
export function spamBotKeyForNri(inviteCode) {
    return `nri:${inviteCode}`;
}
export function spamBotKeyForGeneral() {
    return 'general';
}
//# sourceMappingURL=spamBotRunner.js.map