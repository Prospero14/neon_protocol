import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_link_manager_dialogues = new DialogueBuilder('npc_link_manager')
  .withGreetings({
    neutral: ['intro', 'intro_v2'],
    friendly: ['intro_friendly'],
    hostile: ['intro_hostile']
  })
  .addNode('intro', 'МЕНЕДЖЕР_КАНАЛОВ', 'Трафик 75.3%. Нарушаете протокол присутствия. Кому подчиняетесь, юнит?', [
      { text: 'Я вольный агент.', nextId: 'intro' },
      { text: 'Что ты здесь охраняешь?', nextId: 'lore' },
      { text: 'Система сигнализации сбоит, помочь?', nextId: 'quest_subway_accept' },
      { text: 'Я обновил прошивку реле.', nextId: 'quest_subway_finish', requireQuestId: 'q_vykhino_subway_leak' },
      { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v2', 'МЕНЕДЖЕР_КАНАЛОВ', '[ANALYZING] Аномалии в тени. Предъявите лицензию NET_DRIVERS или покиньте зону шлюза.', [
    { text: 'Я мимо проходил.', nextId: 'intro' }
  ])
  .addNode('intro_friendly', 'МЕНЕДЖЕР_КАНАЛОВ', '[RECOGNITION_SUCCESS] Статус: Надежный поставщик. Канал 404 требует калибровки.', [
     { text: 'Я займусь.', nextId: 'quest_subway_accept' }
  ])
  .addNode('intro_hostile', 'МЕНЕДЖЕР_КАНАЛОВ', '[ACCESS_DENIED] Вы в черном списке. Немедленно отключитесь от подсети.', [
     { text: 'Отключаюсь.', nextId: 'LEAVE' }
  ])
  .addLoreNode('lore', 'МЕНЕДЖЕР_КАНАЛОВ', 'Эту ветку метро. Она — основа Локального Облака Москвы. Упадет — 40% Ядра в оффлайн.', 'intro')
  .addNode('quest_subway_accept', 'МЕНЕДЖЕР_КАНАЛОВ', 'Узел 404 рассинхронизирован. Нужно залить патч. ОПЛАТА: 45 Bits.', [
    { text: 'Принимаю.', nextId: 'LEAVE', awardQuestId: 'q_vykhino_subway_leak' },
    { text: 'Нет.', nextId: 'intro' }
  ])
  .addNode('quest_subway_finish', 'МЕНЕДЖЕР_КАНАЛОВ', 'Синхронизация: 99.9%. Оптимально. Награда переведена.', [
     { text: 'Спасибо.', nextId: 'intro', effect: 'GIVE_BITS', amount: 45, completeQuestId: 'q_vykhino_subway_leak' }
  ])
  .build();
