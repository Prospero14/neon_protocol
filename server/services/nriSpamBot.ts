import type { PrismaClient } from '@prisma/client';
import {
  spamBotKeyForNri,
  startRoomSpamBot,
  stopRoomSpamBot,
} from './spamBotRunner.js';

export { ensureSpamBotUser } from './spamBotRunner.js';

export async function startNriSpamBot(
  prisma: PrismaClient,
  inviteCode: string,
  roomId: string
): Promise<void> {
  await startRoomSpamBot(prisma, spamBotKeyForNri(inviteCode), roomId, async () => {
    const session = await prisma.nriSession.findUnique({ where: { inviteCode } });
    return !!(session?.spamBotEnabled && session.status === 'open');
  });
}

export function stopNriSpamBot(inviteCode: string) {
  stopRoomSpamBot(spamBotKeyForNri(inviteCode));
}
