import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_vlad_dialogues = new DialogueBuilder('npc_vlad').withDistrict('tekstilschiki')
  .withGreetings({
    neutral: ['intro', 'intro_v2'],
    friendly: ['intro_friendly'],
    hostile: ['intro_hostile'],
    stressed: ['intro_stressed'],
    repeat: ['intro_repeat']
  })
  .addNode('intro', 'ВЛАД_ТКАЧ', 'Смотри под ноги, хакер. Тут везде оптоволоконные нити. Я Влад, слежу, чтобы Текстильщики не расплелись. Твой стек выглядит... неподготовленным.', [
    { text: 'Кто такие Redundants?', nextId: 'lore_faction' },
    { text: 'Я принес детали от Мастера Верстака.', nextId: 'quest_verstak_finish', requireQuestId: 'q_izmailovo_master_verstak_parts' },
    { text: 'Нужна работа по зачистке.', nextId: 'quest_explain_1' },
    { text: 'Расскажи про Старшего Ткача.', nextId: 'lore_vlad' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('quest_verstak_finish', 'ВЛАД_ТКАЧ', 'Детали от Верстака? Наконец-то. Наш станок уже начал сбоить. Вот, забирай свою долю Bits за доставку.', [
    { text: 'Спасибо, Влад.', nextId: 'intro', completeQuestId: 'q_izmailovo_master_verstak_parts' }
  ])
  .addNode('intro_v2', 'ВЛАД_ТКАЧ', '*поправляет кабель* Еще один юнит. В Текстильщиках мы ценим плотность плетения. Ты пришел за наукой или за Bits?', [
    { text: 'Заработать Bits.', nextId: 'quest_explain_1' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_friendly', 'ВЛАД_ТКАЧ', 'А, ценитель! Твои логи сплетены грамотно, без лишних "гоуто". Есть дыра в 7-й линии. Поможешь?', [
    { text: 'Готов шить.', nextId: 'quest_explain_1' }
  ])
  .addNode('intro_hostile', 'ВЛАД_ТКАЧ', 'Везде корпоративный дешевый пластик. Проваливай из зоны, пока я не зациклил твой порт.', [
    { text: 'Я ухожу.', nextId: 'LEAVE' }
  ])
  .addNode('intro_stressed', 'ВЛАД_ТКАЧ', 'Парень, ты вибрируешь. Стресс прекрасен, но сейчас ты бесполезен. Очисти кэш в баре.', [
    { text: 'Я в порядке.', nextId: 'intro' }
  ])
  .addNode('intro_repeat', 'ВЛАД_ТКАЧ', 'Нить должна быть непрерывной. Есть еще вопросы?', [
    { text: 'Вернемся к делу.', nextId: 'intro' }
  ])
  .addLoreNode('lore_faction', 'ВЛАД_ТКАЧ', 'Redundants — те, кто помнит. Мы не пишем код, мы его плетем. Храним традиции физического уровня. (+10 Репутации)', 'intro', 'Redundants', { effect: 'GIVE_REPUTATION', amount: 10, cardRewardId: 'VOSKHOD_OFFICE' })
  .addLoreNode('lore_vlad', 'ВЛАД_ТКАЧ', 'Старший сидит в центре узла. Держит в голове паттерны, которые писали до твоего рождения. Без него тут всё развалится.', 'intro')
  .addNode('quest_explain_1', 'ВЛАД_ТКАЧ', 'На 7-й линии боты-ткачи словили "Null". Теперь они видят угрозу в любом движении. Как будешь работать?', [
    { text: 'Прямая зачистка (Бой).', nextId: 'quest_explain_2' },
    { text: 'Удаленный обход (Technical).', nextId: 'quest_tech_path', requireMinLevel: 3 },
    { text: 'Договориться (Social).', nextId: 'quest_social_path', requireReputation: { factionId: 'REDUNDANTS', minPoints: 15 } }
  ])
  .addNode('quest_explain_2', 'ВЛАД_ТКАЧ', 'Десятки запросов в секунду. Если дека не умеет в многопоточность — задавит объемом. Рискнешь?', [
    { text: 'Проверяй паттерн.', nextId: 'rank_check' },
    { text: 'Надо подумать.', nextId: 'intro' }
  ])
  .addNode('quest_tech_path', 'ВЛАД_ТКАЧ', 'Перехват через отладочный порт? Смело. Если прерывание чистое — перезагрузятся без боя. Берешься?', [
    { text: 'Да. Проверяй.', nextId: 'rank_check' }
  ])
  .addNode('quest_social_path', 'ВЛАД_ТКАЧ', 'Репутация дает сервисные ключи. Убеди контроллер, что ты техник. Готов?', [
    { text: 'Готов. Сканируй.', nextId: 'rank_check' }
  ])
  .addNode('rank_check', 'ВЛАД_ТКАЧ', 'Дай гляну паттерн... (Проводит щупом по порту...)', [
    { text: '[ Ждать ]', nextId: 'quest_reject', requireMaxLevel: 0, isTraineeOnly: true },
    { text: '[ Ждать ]', nextId: 'quest_accept', requireMinLevel: 1 },
    { text: '[ Ждать ]', nextId: 'quest_accept', isProOnly: true }
  ])
  .addNode('quest_reject', 'ВЛАД_ТКАЧ', 'Ха! На деке еще нет защитного плетения. Нос не дорос до промышленных ботов. Иди тренируйся.', [
    { text: 'Я вернусь.', nextId: 'LEAVE' }
  ])
  .addNode('quest_accept', 'ВЛАД_ТКАЧ', 'Сигнатура плотная. Контракт твой. 7-я линия ждет. Приступай к плетению реальности.', [
    { text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', awardQuestId: 'q_tekstilschiki_combat_textile_raid_bug_sweep' }
  ])
  .build();
