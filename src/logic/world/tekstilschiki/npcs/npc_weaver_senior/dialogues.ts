import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_weaver_senior_dialogues = new DialogueBuilder('npc_weaver_senior').withDistrict('tekstilschiki')
  .withGreetings({
    neutral: ['intro'],
    friendly: ['intro_friendly'],
    hostile: ['intro_hostile'],
    stressed: ['intro_stressed'],
    repeat: ['intro_repeat']
  })
  .addNode('intro', 'СТАРШИЙ_ТКАЧ', 'Нити судьбы спутались... или это плохой код? Каждому паттерну нужен свой поток. Ты пришел за наукой или за работой?', [
    { text: 'Что за паттерны?', nextId: 'lore' },
    { text: 'Мне нужен "Промышленный Паттерн".', nextId: 'quest_pattern_start' },
    { text: 'Я принес Паттерн из Академии.', nextId: 'quest_pattern_finish', requireQuestId: 'q_weaver_pattern' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_friendly', 'СТАРШИЙ_ТКАЧ', 'Узор твоей личности проясняется. Редкий случай чистого исполнения. Рад видеть тебя снова.', [
    { text: 'Я тоже рад. К делам?', nextId: 'intro' }
  ])
  .addNode('intro_hostile', 'СТАРШИЙ_ТКАЧ', 'Твой код — это шум. Удали его отсюда, пока он не внес энтропию в мой узел.', [
    { text: 'Я ухожу.', nextId: 'LEAVE' }
  ])
  .addNode('intro_stressed', 'СТАРШИЙ_ТКАЧ', 'Слишком много прерываний... Система нестабильна. Возвращайся позже, когда твой поток выровняется.', [
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_repeat', 'СТАРШИЙ_ТКАЧ', 'Ткань бытия требует внимания. Что еще ты хочешь узнать?', [
    { text: 'Вернемся к обсуждению.', nextId: 'intro' }
  ])
  .addLoreNode('lore', 'СТАРШИЙ_ТКАЧ', 'Паттерн — это образ мысли Ядра. Если знаешь его, предскажешь любой баг. Но истинные узоры в архивах Академии. (+Intel: Grid_Looming)', 'intro')
  .addNode('quest_pattern_start', 'СТАРШИЙ_ТКАЧ', 'Нам нужен утерянный "Grid_Optimizer_v2" из Мейнфрейма Академии. Как планируешь его достать?', [
      { text: 'К Профессору Туранову (Standard).', nextId: 'rank_check' },
      { text: 'Извлеку из локальной ткани (Technical).', nextId: 'quest_pattern_tech', requireMinLevel: 4 },
      { text: 'Связи с Voskhod (Social).', nextId: 'quest_pattern_social', requireReputation: { factionId: 'VOSKHOD', minPoints: 20 } }
  ])
  .addNode('quest_pattern_tech', 'СТАРШИЙ_ТКАЧ', 'Извлечь из ткани? Если уровень декодирования позволит — соберешь по частям. Но это нагрузка на CPU.', [
    { text: 'Мой CPU готов. Сканируй.', nextId: 'rank_check' }
  ])
  .addNode('quest_pattern_social', 'СТАРШИЙ_ТКАЧ', 'Дружба с Генералом БЭСМ полезна. У них есть дампы. Это ускорит процесс. Готов?', [
    { text: 'Я договорюсь. Сканируй.', nextId: 'rank_check' }
  ])
  .addNode('rank_check', 'СТАРШИЙ_ТКАЧ', 'Смотри мне в объектив... (Анализирует нейронную структуру...)', [
    { text: '[ Ждать ]', nextId: 'quest_reject', requireMaxLevel: 3, isTraineeOnly: true },
    { text: '[ Ждать ]', nextId: 'quest_accept', requireMinLevel: 4 },
    { text: '[ Ждать ]', nextId: 'quest_accept', isProOnly: true }
  ])
  .addNode('quest_reject', 'СТАРШИЙ_ТКАЧ', 'Нет. Узор слишком прост. Ты — шум в системе. Прикоснешься к этому коду — он поглотит твою личность.', [
    { text: 'Я вернусь.', nextId: 'LEAVE' }
  ])
  .addNode('quest_accept', 'СТАРШИЙ_ТКАЧ', 'У тебя есть потенциал стать мастером. Контракт твой. Найди Профессора Туранова или свой путь.', [
    { text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', awardQuestId: 'q_weaver_pattern' }
  ])
  .addNode('quest_pattern_finish', 'СТАРШИЙ_ТКАЧ', '*рассматривает данные* Тончайшая работа, юнит. С этим Текстильщики станут неприступными. Спасибо.', [
    { text: 'Рад помочь.', nextId: 'intro', completeQuestId: 'q_weaver_pattern' }
  ])
  .build();
