/** Мета SPAM-бота в чате (синхрон с server/services/messengerSpamPool.ts). */

export const SPAM_BOT_USERNAME = 'SPAM_RELAY';
export const SPAM_BOT_LABEL = 'рекламный бот';

export type ChatParticipant = {
  userId: string;
  username: string;
  isAdmin?: boolean;
  isBot?: boolean;
  isHost?: boolean;
};

export function spamBotParticipant(userId = 'spam-bot'): ChatParticipant {
  return {
    userId,
    username: SPAM_BOT_USERNAME,
    isBot: true,
  };
}
