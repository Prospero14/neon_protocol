import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_resident_perovo_dialogues = new DialogueBuilder('npc_resident_perovo')
  .addNode('intro', 'МЕСТНЫЙ_ЖИТЕЛЬ', 'Сервера гудят, спать нельзя. Регуляторы не идут. Ты вроде техник?', [
      { text: 'Разберусь с шумом.', nextId: 'rank_check' },
      { text: '[Игнорировать]', nextId: 'LEAVE' }
  ])
  .addNode('rank_check', 'МЕСТНЫЙ_ЖИТЕЛЬ', 'У системных крыс зубы как бритвы. Дека выдержит укус?', [
      { text: '[ Показать деку ]', nextId: 'quest_reject', requireMaxLevel: 0, isTraineeOnly: true },
      { text: '[ Показать деку ]', nextId: 'quest_accept', requireMinLevel: 1 },
      { text: '[ Показать деку ]', nextId: 'quest_accept', isProOnly: true }
  ])
  .addNode('quest_reject', 'МЕСТНЫЙ_ЖИТЕЛЬ', 'Ха! Сам еще как крысёныш. Нос не дорос до зачисток. Сходи в песочницу.', [
      { text: 'Грубо.', nextId: 'LEAVE' }
  ])
  .addNode('quest_accept', 'МЕСТНЫЙ_ЖИТЕЛЬ', 'Ну, вроде нормальный. Сходи в подвал, прижми тварей. (Принять контракт)', [
      { text: '[ ПРИНЯТЬ КОНТРАКТ: УБОРКА ]', nextId: 'LEAVE', awardQuestId: 'q_perovo_combat_rat_invasion_bug_sweep' }
  ])
  .build();
