import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_zina_dialogues = new DialogueBuilder('npc_zina')
  .addNode('intro', 'ЗИНА', 'О, свежее лицо. Тебе "Канифоль" со льдом или дело есть?', [
      { text: 'Работа по доставке?', nextId: 'quest_zina_accept' },
      { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('quest_zina_accept', 'ЗИНА', 'Доставь ящик Петровичу в Алтуфьево. Задолжал за фильтры. Плачу 60 Bits.', [
      { text: 'Забираю ящик.', nextId: 'LEAVE', awardQuestId: 'q_perovo_zina_delivery' }
  ])
  .build();
