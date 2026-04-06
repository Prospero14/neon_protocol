import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_corp_scout_dialogues = new DialogueBuilder('npc_corp_scout')
  .withGreetings({
    neutral: ['intro', 'intro_v2'],
    friendly: ['intro_friendly'],
    hostile: ['intro_hostile']
  })
  .addNode('intro', 'СКАУТ_GIGA_BANK', 'Выглядишь перспективно. Хочешь зарплату в 1000 Bits и страховку? Gigabank ценит талант.', [
      { text: 'Я не продаюсь.', nextId: 'intro' },
      { text: 'Что за работа?', nextId: 'lore' },
      { text: 'Я могу просканировать частоты Redundants.', nextId: 'quest_scout_accept' },
      { text: 'Данные сканирования готовы.', nextId: 'quest_scout_finish', requireQuestId: 'q_vykhino_corp_favor' },
      { text: '[Прощай]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v2', 'СКАУТ_GIGA_BANK', 'Программа "Ликвидные Активы"... таланты для идеального бэкенда. Интересует?', [
    { text: 'Расскажите подробнее.', nextId: 'lore' }
  ])
  .addNode('intro_friendly', 'СКАУТ_GIGA_BANK', 'Коллега! Ваши данные были впечатляющими. Есть еще пара "инсайдов"?', [
     { text: 'Я поищу.', nextId: 'quest_scout_accept' }
  ])
  .addNode('intro_hostile', 'СКАУТ_GIGA_BANK', 'ID отмечен как "нестабильный". Мы не инвестируем в мусор. Уходите.', [
     { text: 'Ухожу.', nextId: 'LEAVE' }
  ])
  .addLoreNode('lore', 'СКАУТ_GIGA_BANK', 'Чистка транзакций в Сити. Платим в два раза больше, чем фиксеры трущоб.', 'intro')
  .addNode('quest_scout_accept', 'СКАУТ_GIGA_BANK', 'Нужны частоты Redundants in Vykhino. Найдешь "тихий" узел — получишь 70 Bits.', [
    { text: 'Дгововорились.', nextId: 'LEAVE', awardQuestId: 'q_vykhino_corp_favor' },
    { text: 'Не работаю на GigaBank.', nextId: 'intro' }
  ])
  .addNode('quest_scout_finish', 'СКАУТ_GIGA_BANK', '*загружает данные* 2.4ГГц с фазовым сдвигом... Остроумно. Бонус на счету.', [
     { text: 'До встречи.', nextId: 'intro', effect: 'GIVE_BITS', amount: 70, completeQuestId: 'q_vykhino_corp_favor' }
  ])
  .build();
