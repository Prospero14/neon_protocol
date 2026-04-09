import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_midnight_runner_dialogues = new DialogueBuilder('npc_midnight_runner').withDistrict('kitay_gorod')
  .withGreetings({
    neutral: ['intro'],
    friendly: ['intro_friendly'],
    hostile: ['intro_hostile'],
    stressed: ['intro_stressed'],
    repeat: ['intro_repeat']
  })
  .addNode('intro', 'MIDNIGHT RUNNER', 'После полуночи улицы честнее дневных офисов. Я вожу только то, что не проходит через дневные фильтры. Нужен контракт?', [
    { text: 'Что у тебя за поток?', nextId: 'lore_stream' },
    { text: '[КОНТРАКТ] Взять ночной заказ.', nextId: 'intro', awardQuestId: 'q_kg_midnight_drop' },
    { text: '[КОНТРАКТ] Запустить ложный след.', nextId: 'intro', awardQuestId: 'q_kg_false_trail' },
    { text: '[ Уйти ]', nextId: 'LEAVE' }
  ])
  .addNode('intro_friendly', 'MIDNIGHT RUNNER', 'Ты уже работал чисто. У меня есть тихий маршрут без засветки. Берешь?', [
    { text: '[КОНТРАКТ] Ночной дроп.', nextId: 'intro', awardQuestId: 'q_kg_midnight_drop' },
    { text: '[ Уйти ]', nextId: 'LEAVE' }
  ])
  .addNode('intro_hostile', 'MIDNIGHT RUNNER', 'Я не таскаю пакеты для тех, за кем хвост регуляторов.', [
    { text: '[ Уйти ]', nextId: 'LEAVE' }
  ])
  .addNode('intro_stressed', 'MIDNIGHT RUNNER', 'Ты слишком шумный для тихой логистики. Приведи пульс в порядок и вернись.', [
    { text: '[ Уйти ]', nextId: 'LEAVE' }
  ])
  .addNode('intro_repeat', 'MIDNIGHT RUNNER', 'Ночь короткая. Или берешь груз, или освобождаешь канал.', [
    { text: '[КОНТРАКТ] Ночной дроп.', nextId: 'intro', awardQuestId: 'q_kg_midnight_drop' },
    { text: '[ Уйти ]', nextId: 'LEAVE' }
  ])
  .addLoreNode(
    'lore_stream',
    'MIDNIGHT RUNNER',
    'Днем город живет по SLA. Ночью работает по договоренностям. Я продаю второе. (+Intel: Night Channels)',
    'intro',
    'Night Channels'
  )
  .build();
