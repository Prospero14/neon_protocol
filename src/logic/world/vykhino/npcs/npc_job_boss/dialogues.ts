import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_job_boss_dialogues = new DialogueBuilder('npc_job_boss')
  .withGreetings({
    neutral: ['intro', 'intro_v2', 'intro_v3'],
    friendly: ['intro_friendly'],
    hostile: ['intro_hostile'],
    stressed: ['intro_stressed']
  })
  .addNode('intro', 'БАТЯ', 'Ну и рожа... Если хочешь командовать — поднатаскаю по менеджменту. Или если ищешь Сержанта в Марьино — я дам наводку.', [
    { text: 'Разблокировать класс: PM (150 Bits)', nextId: 'pm_success', cost: 150, effect: 'SET_PROFESSION', cardRewardId: 'pm_jun' },
    { text: 'Кто ты такой?', nextId: 'lore' },
    { text: 'Мне нужен Сержант из Марьино.', nextId: 'job_start' },
    { text: 'Что сейчас в приоритете?', nextId: 'job_selection' },
    { text: 'Я собрал долю с бармена.', nextId: 'quest_tax_finish', requireQuestId: 'q_vykhino_transit_tax' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addLoreNode('lore', 'БАТЯ', 'Я — Батя. Фиксер. Решаю проблемы, которые не могут решить роботы Gigabank. Ты — либо инструмент, либо мусор. Выбирай.', 'intro')
  .addNode('job_selection', 'БАТЯ', 'Всегда есть задачи. Либо выбить долг, либо... серьезное дело в Марьино. Твой выбор?', [
    { text: 'Собрать долги (Quick Bits).', nextId: 'quest_tax_accept' },
    { text: 'Серьезный проект в Марьино (Combat).', nextId: 'job_start' },
    { text: 'Назад.', nextId: 'intro' }
  ])
  .addNode('intro_v2', 'БАТЯ', 'Выхино — одна большая горящая задача. Всё еще треплешься или готов взять проект?', [
    { text: 'Я готов.', nextId: 'intro' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v3', 'БАТЯ', 'Вижу потенциал. У нас наклевывается дельце с корпоратами. Интересует рост?', [
    { text: 'Что за дело?', nextId: 'job_start' }
  ])
  .addNode('intro_friendly', 'БАТЯ', 'О, лучший менеджер! Всё еще сжигаешь дедлайны или научился делегировать?', [
    { text: 'Давай задание.', nextId: 'job_start' }
  ])
  .addNode('intro_hostile', 'БАТЯ', 'Твоя репутация воняет. Проваливай с глаз, пока я не закрыл твой тикет навсегда.', [
    { text: 'Ухожу.', nextId: 'LEAVE' }
  ])
  .addNode('intro_stressed', 'БАТЯ', 'Парень, у тебя джиттер зашкаливает. Марш в бар, охладись!', [
    { text: 'Слушаюсь.', nextId: 'LEAVE' }
  ])
  .addNode('pm_success', 'БАТЯ', 'Держи методичку по Agile и иди разруливай хаос. Жду отчетов.', [
    { text: 'ОК, шеф.', nextId: 'LEAVE' }
  ])
  .addNode('job_start', 'БАТЯ', 'Сходи в Марьино, там "Локалка" барахлит. Помоги Трассировке (Trace). Скажи, что от Бати.', [
    { text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', awardQuestId: 'q_trace_stress_test' },
    { text: 'Позже.', nextId: 'LEAVE' }
  ])
  .addNode('quest_tax_accept', 'БАТЯ', 'Бармен в "Транзите" задолжал. Напомни ему, что долги — это плохо для процессора.', [
    { text: 'Я напомню.', nextId: 'LEAVE', awardQuestId: 'q_vykhino_transit_tax' },
    { text: 'Я не коллектор.', nextId: 'intro' }
  ])
  .addNode('quest_tax_finish', 'БАТЯ', 'Принес? Красавец. Держи свои 15 Bits. Заходи еще.', [
    { text: 'Спасибо.', nextId: 'intro', effect: 'GIVE_BITS', amount: 15, completeQuestId: 'q_vykhino_transit_tax' }
  ])
  .build();
