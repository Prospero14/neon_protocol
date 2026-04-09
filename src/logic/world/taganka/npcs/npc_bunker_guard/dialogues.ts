import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_bunker_guard_dialogues = new DialogueBuilder('npc_bunker_guard').withDistrict('taganka')
  .addNode('intro', 'СЕРЖАНТ ГЛУХОВ', 'Гражданским вход в нижние уровни запрещен. Предъявите жетон Federal Oversight или покиньте зону шлюза. У меня приказ на немедленное обнуление нарушителей.', [
    { text: 'Я здесь по делу Инквизитора.', nextId: 'check_auditor' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('check_auditor', 'СЕРЖАНТ ГЛУХОВ', 'Инквизитор... *сканирует сигнатуру* Вижу отметку в реестре. Проходи, но не делай резких прерываний. Моя турель на автопилоте.', [
    { text: 'СЛУЖУ ЯДРУ.', nextId: 'LEAVE' }
  ])
  .build();
