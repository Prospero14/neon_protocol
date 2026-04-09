import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_basement_coder_dialogues = new DialogueBuilder('npc_basement_coder').withDistrict('perovo')
  .addNode('intro', 'ПОДВАЛЬНЫЙ_КОДЕР', 'Уже утро? Скрипт еще не доработал... Есть лазейки в Перово. Хочешь знать?', [
      { text: 'Покажи.', nextId: 'lore' },
      { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addLoreNode('lore', 'ПОДВАЛЬНЫЙ_КОДЕР', 'Через подсеть 14 можно обойти файрвол. Но там системные крысы... (+10 Репутации)', 'LEAVE', 'Void', { effect: 'GIVE_REPUTATION', amount: 10 })
  .build();
