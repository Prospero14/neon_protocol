import type { PrismaClient } from '@prisma/client';
import { pickRandomSpamLine, SPAM_BOT_USERNAME } from './messengerSpamPool.js';

const timers = new Map<string, ReturnType<typeof setInterval>>();
let spamBotUserId: string | null = null;

export async function ensureSpamBotUser(prisma: PrismaClient): Promise<string> {
  if (spamBotUserId) return spamBotUserId;
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

export type SpamBotGuard = () => Promise<boolean>;

async function postSpam(prisma: PrismaClient, roomId: string, botUserId: string) {
  await prisma.chatMessage.create({
    data: {
      roomId,
      userId: botUserId,
      text: pickRandomSpamLine(),
    },
  });
}

export async function startRoomSpamBot(
  prisma: PrismaClient,
  key: string,
  roomId: string,
  guard: SpamBotGuard
): Promise<void> {
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

export function stopRoomSpamBot(key: string) {
  const t = timers.get(key);
  if (t) clearInterval(t);
  timers.delete(key);
}

export function spamBotKeyForNri(inviteCode: string): string {
  return `nri:${inviteCode}`;
}

export function spamBotKeyForGeneral(): string {
  return 'general';
}
