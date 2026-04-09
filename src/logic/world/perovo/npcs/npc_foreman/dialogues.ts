import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_foreman_dialogues = new DialogueBuilder('npc_foreman').withDistrict('perovo')
  .addNode('intro', 'БРИГАДИР', 'План сам себя не выполнит! Если не кодер по вызову — проваливай. Турбина свистит, а ты стоишь.', [
    { text: 'Что с турбиной?', nextId: 'quest_engine_accept' },
    { text: 'Слышал про стачку?', nextId: 'lore_strike' },
    { text: 'Я починил турбину.', nextId: 'quest_engine_finish', requireQuestId: 'q_perovo_engine_repair' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('quest_engine_accept', 'БРИГАДИР', 'Настрой тайминги контроллера, пока цех не разнесло. Плачу 40 Bits. Идет?', [
    { text: 'Сделаю.', nextId: 'LEAVE', awardQuestId: 'q_perovo_engine_repair' }
  ])
  .addNode('quest_engine_finish', 'БРИГАДИР', 'Тишина... План спасен. Держи 40 Bits и не болтай.', [
    { text: 'До связи.', nextId: 'intro', effect: 'GIVE_BITS', amount: 40, completeQuestId: 'q_perovo_engine_repair' }
  ])
  .addLoreNode('lore_strike', 'БРИГАДИР', 'Коммисы? Тьфу. Хотят Bits бесплатно. Тронут мой терминал — забаню все порты.', 'intro')
  .build();
