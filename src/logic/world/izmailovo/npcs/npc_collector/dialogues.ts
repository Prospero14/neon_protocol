import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_collector_dialogues = new DialogueBuilder('npc_collector').withDistrict('izmailovo')
  .addNode('intro', 'КОЛЛЕКЦИОНЕР', 'Ищу нетронутые дампы v0.04. Плачу за "чистый" код без подписи Ядра.', [
      { text: 'Продать старый лог (25 Bits)', nextId: 'intro', effect: 'GIVE_BITS', amount: 25 },
      { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .build();
