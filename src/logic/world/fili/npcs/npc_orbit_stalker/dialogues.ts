import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_orbit_stalker_dialogues = new DialogueBuilder('npc_orbit_stalker').withDistrict('fili')
  .withGreetings({
    neutral: ['intro', 'intro_v2'],
    friendly: ['intro_friendly'],
    repeat: ['intro_repeat']
  })
  .addNode('intro', 'ЛУНА', 'Слышишь этот шепот? Это старые спутники Telecon. Они падают, но их логи всё ещё в эфире. Поможешь перехватить поток?', [
    { text: 'Как это сделать?', nextId: 'quest_explain' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v2', 'ЛУНА', 'Орбитальные узлы сегодня шумят... Похоже на зашифрованный пакет от "Октября". Нужна мощная антенна.', [
    { text: 'Я готов помочь.', nextId: 'quest_explain' }
  ])
  .addNode('intro_friendly', 'ЛУНА', 'Мой лучший орбитальный искатель. Твои перехваты — золото в мире медного трафика. Есть новое задание.', [
    { text: 'СЛУШАЮ.', nextId: 'quest_explain' }
  ])
  .addNode('intro_repeat', 'ЛУНА', 'Спутники всё ещё шепчут. Сигнал слабый, но он есть. Сделаешь еще один проход по частотам?', [
    { text: 'Сделаю.', nextId: 'quest_explain' }
  ])
  .addNode('quest_explain', 'ЛУНА', 'Нужно релейное оборудование. Дядя Ваня в Митино — единственный, кто может его собрать. Сходишь?', [
    { text: 'Я помогу.', nextId: 'quest_accept' },
    { text: 'Мне это не интересно.', nextId: 'intro' }
  ])
  .addNode('quest_accept', 'ЛУНА', 'Отлично. Скажи ему, что Луна ждет сигнал. Награда тебя не разочарует.', [
    { text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', awardQuestId: 'q_fili_satellite_interception' }
  ])
  .build();
