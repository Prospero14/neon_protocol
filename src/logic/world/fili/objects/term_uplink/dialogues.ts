import { DialogueBuilder } from '../../../../dialogueUtils';

export const term_uplink_dialogues = new DialogueBuilder('term_uplink')
  .addNode('intro', 'ТЕРМИНАЛ АПЛИНКА', '[SYSTEM_LOGS] Связь с орбитой установлена. Доступ: ОГРАНИЧЕН. Требуется авторизация Redundants или SRE.', [
    { text: 'Использовать допуск Redundants.', nextId: 'access_granted', requireReputation: { factionId: 'REDUNDANTS', minPoints: 20 } },
    { text: 'Силовой взлом (SSH Brute Force).', nextId: 'rank_check' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('rank_check', 'ТЕРМИНАЛ АПЛИНКА', '[SCANNING...] Уровень сигнала: 6+. НУЖНА МОЩНАЯ ДЕКА.', [
    { text: '[ Ждать ]', nextId: 'access_denied', requireMaxLevel: 5, isTraineeOnly: true },
    { text: '[ Ждать ]', nextId: 'access_granted', requireMinLevel: 6 },
    { text: '[ Ждать ]', nextId: 'access_granted', isProOnly: true }
  ])
  .addNode('access_denied', 'ТЕРМИНАЛ АПЛИНКА', '[ERROR] ПРЕРЫВАНИЕ ПОТОКА. СИСТЕМА ЗАБЛОКИРОВАНА.', [
    { text: 'Черт.', nextId: 'LEAVE' }
  ])
  .addNode('access_granted', 'ТЕРМИНАЛ АПЛИНКА', '[SUCCESS] КАНАЛ ОТКРЫТ. ВЫ В ОБЛАКЕ. БОНУС: 50 Bits.', [
    { text: '[ ЗАВЕРШИТЬ СЕССИЮ ]', nextId: 'LEAVE', effect: 'GIVE_BITS', amount: 50 }
  ])
  .build();
