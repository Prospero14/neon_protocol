import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_radio_ham_dialogues = new DialogueBuilder('npc_radio_ham').withDistrict('mitino')
  .withGreetings({
    neutral: ['intro'],
    friendly: ['intro_friendly'],
    repeat: ['intro_repeat']
  })
  .addNode('intro', 'ДЯДЯ ВАНЯ', 'Шшш... Ловлю частоту 404... О, новый юнит. Ты пришел за деталями или просто поглазеть на антиквариат?', [
    { text: 'Луна из Фили просила собрать релей.', nextId: 'quest_relay_start', requireQuestId: 'q_fili_satellite_interception' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_friendly', 'ДЯДЯ ВАНЯ', 'Мой лучший слушатель! Эфир сегодня чист. Есть пара интересных сигналов из Rust Valley.', [
    { text: 'СЛУШАЮ.', nextId: 'intro' }
  ])
  .addNode('intro_repeat', 'ДЯДЯ ВАНЯ', 'Снова за деталями? Флэш еще не сжег твою деку?', [
    { text: 'Пока держится.', nextId: 'intro' }
  ])
  .addNode('quest_relay_start', 'ДЯДЯ ВАНЯ', 'Луна? Смелая девчонка. Релей собрать можно, но мне нужны медные жилы и пара мощных транзисторов. Флэш может их достать, если договоришься.', [
    { text: 'Я найду Флэша.', nextId: 'quest_relay_accept' },
    { text: 'Это долго.', nextId: 'intro' }
  ])
  .addNode('quest_relay_accept', 'ДЯДЯ ВАНЯ', 'Иди, он обычно ошивается около свалки. Скажи, что от меня.', [
    { text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', awardQuestId: 'q_mitino_radio_relay' }
  ])
  .build();
