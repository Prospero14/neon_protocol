import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_safety_auditor_dialogues = new DialogueBuilder('npc_safety_auditor')
  .withGreetings({
    neutral: ['intro'],
    friendly: ['intro_friendly'],
    hostile: ['intro_hostile'],
    stressed: ['intro_stressed'],
    repeat: ['intro_repeat']
  })
  .addNode('intro', 'АУДИТОР', 'Ваш ID не числится в белом списке GigaBank для этой зоны. Текстильщики — зона повышенного риска. Цель вашего пребывания?', [
    { text: 'Я провожу аудит (Technical).', nextId: 'quest_audit_start' },
    { text: 'Просто прохожу мимо (Social).', nextId: 'lore' },
    { text: 'Я работаю на Redundants.', nextId: 'intro_hostile', requireReputation: { factionId: 'REDUNDANTS', minPoints: 10 } },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_friendly', 'АУДИТОР', 'Ваши показатели соответствуют корпоративным стандартам. Доступ разрешен. Что-то еще?', [
    { text: 'Какие новости от GigaBank?', nextId: 'lore' }
  ])
  .addNode('intro_hostile', 'АУДИТОР', 'Сотрудничество с несанкционированными группами ведет к аннулированию страховки. Покиньте сектор.', [
    { text: 'Я ухожу.', nextId: 'LEAVE' }
  ])
  .addNode('intro_stressed', 'АУДИТОР', 'Ваш уровень кортизола мешает считыванию биометрии. Успокойтесь или будете удалены.', [
    { text: 'Я спокоен.', nextId: 'intro' }
  ])
  .addNode('intro_repeat', 'АУДИТОР', 'Ожидаю ввода данных. Слушаю.', [
    { text: 'Вернемся к вопросам.', nextId: 'intro' }
  ])
  .addLoreNode('lore', 'АУДИТОР', 'GigaBank гарантирует стабильность, пока вы соблюдаете протоколы. Любое отклонение — это риск для всей сети. (+Intel: Corporate_Safety)', 'intro')
  .addNode('quest_audit_start', 'АУДИТОР', 'Аудит? Хм. Нам нужно проверить логи безопасности на терминале управления станками. У вас есть допуск?', [
    { text: 'Я взломаю его (Combat).', nextId: 'quest_reject' },
    { text: 'У меня есть сертификат (Technical).', nextId: 'rank_check' }
  ])
  .addNode('rank_check', 'АУДИТОР', 'Предоставьте ваш цифровой сертификат для верификации...', [
    { text: '[ Предъявить ]', nextId: 'quest_reject', requireMaxLevel: 2, isTraineeOnly: true },
    { text: '[ Предъявить ]', nextId: 'quest_accept', requireMinLevel: 3 },
    { text: '[ Предъявить ]', nextId: 'quest_accept', isProOnly: true }
  ])
  .addNode('quest_reject', 'АУДИТОР', 'Сертификат просрочен или подделан. Вы некомпетентны для такой задачи. Свободны.', [
    { text: 'Я вернусь с актуальным.', nextId: 'LEAVE' }
  ])
  .addNode('quest_accept', 'АУДИТОР', 'Верификация пройдена. Получите доступ к терминалу 7-й линии. Исправьте ошибки в логах. Bits будут переведены по завершении.', [
    { text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', awardQuestId: 'q_safety_audit' }
  ])
  .build();
