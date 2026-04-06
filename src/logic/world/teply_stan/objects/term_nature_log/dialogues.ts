import { DialogueBuilder } from '../../../../dialogueUtils';

export const term_nature_log_dialogues = new DialogueBuilder('term_nature_log')
  .addNode('intro', 'МОНИТОР_ЭКОСИСТЕМЫ', '[DATA_STREAM] Заражение леса: 45%. Рекомендуется зачистка сектора 5.', [
      { text: 'Запустить диагностику узла.', nextId: 'rank_check' },
      { text: '[Выход]', nextId: 'LEAVE' }
  ])
  .addNode('rank_check', 'МОНИТОР_ЭКОСИСТЕМЫ', '[SCANNING...] ТРЕБУЕТСЯ УРОВЕНЬ 1+.', [
      { text: '[ Ждать ]', nextId: 'access_denied', requireMaxLevel: 0, isTraineeOnly: true },
      { text: '[ Ждать ]', nextId: 'access_granted', requireMinLevel: 1 },
      { text: '[ Ждать ]', nextId: 'access_granted', isProOnly: true }
  ])
  .addNode('access_denied', 'МОНИТОР_ЭКОСИСТЕМЫ', '[ERROR] НИЗКИЙ ПРИОРИТЕТ ДОСТУПА. (ACCESS_DENIED)', [
      { text: 'Вернусь позже.', nextId: 'LEAVE' }
  ])
  .addNode('access_granted', 'МОНИТОР_ЭКОСИСТЕМЫ', '[SUCCESS] ДОПУСК РАЗРЕШЕН. БОНУС: 50 Bits.', [
      { text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', effect: 'GIVE_BITS', amount: 50, awardQuestId: 'q_teply_stan_combat_router_clash_bug_sweep' }
  ])
  .build();
