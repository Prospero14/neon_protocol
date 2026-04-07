import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_crawler_dialogue: DialogueTree = new DialogueBuilder('npc_crawler')
  .withGreetings({
    neutral: ['intro', 'intro_v2'],
    friendly: ['intro_friendly', 'intro_friendly_v2'],
    hostile: ['intro_hostile'],
    stressed: ['intro_stressed'],
    repeat: ['intro_repeat']
  })

  // === NEUTRAL POOL ===
  .addNode('intro', 'КРОУЛЕР', 'Ищу заброшенные подсети. Слышишь? Этот шум — голос потерянных пакетов. Рискнем или побоишься?', [
    { text: 'Я помогу.', nextId: 'rank_check', requireMaxLevel: 1 },
    { text: 'Как там шум в подсетях?', nextId: 'active_status', requireActiveQuestId: 'q_bibirevo_combat_static_noise_bug_sweep' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v2', 'КРОУЛЕР', 'Намечается деликатный дамп в Северном Потоке. Твоя дека вытянет статическое напряжение? Или ты из тех, кто боится даже простых скриптов?', [
    { text: 'Вытянет.', nextId: 'rank_check' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === FRIENDLY POOL ===
  .addNode('intro_friendly', 'КРОУЛЕР', 'Лучший прозвонщик региона! Собираюсь вскрыть старый шлюз Silicon Hedge. Ты со мной? Пакеты там... древние, вкусные.', [
    { text: 'Всегда готов.', nextId: 'rank_check' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_friendly_v2', 'КРОУЛЕР', 'А, мой любимый исследователь! Помнишь те логи из Северного? Чистый дзен. Хочешь еще?', [
    { text: 'Конечно.', nextId: 'rank_check' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === HOSTILE POOL ===
  .addNode('intro_hostile', 'КРОУЛЕР', '*сканирует твои порты* Стой. В твоем логе следы Восхода. Порядок... Контроль... Ты пахнешь несвободой. Отойди, не мешай мне дефрагментировать пустоту.', [
    { text: 'Я сам по себе.', nextId: 'intro' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === STRESSED POOL ===
  .addNode('intro_stressed', 'КРОУЛЕР', '*глядит на твой интерфейс* Ого. Твоя дека дрожит. Это не перегрев, это душа Октября пытается вырваться. Садись, отдохни... Прежде чем Ядро тебя "оптимизирует".', [
    { text: 'Я в порядке.', nextId: 'intro' },
    { text: 'Пойду остыну.', nextId: 'LEAVE' }
  ])

  // === REPEAT POOL ===
  .addNode('intro_repeat', 'КРОУЛЕР', 'Снова в зоне шума? Пакеты никогда не спят, парень. Ты уже знаешь многое, но Ядро знает больше. Береги свой CRC.', [
    { text: 'Расскажи еще.', nextId: 'rank_check', requireCompletedQuestId: 'q_bibirevo_combat_static_noise_bug_sweep' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === RANK CHECK ===
  .addNode('rank_check', 'КРОУЛЕР', 'Ну-ка, дай гляну твой хеш-сумматор...', [
    { text: '[ Показать хеш ]', nextId: 'quest_reject', requireMaxLevel: 1, isTraineeOnly: true },
    { text: '[ Показать хеш ]', nextId: 'quest_accept', requireMinLevel: 2 },
    { text: '[ Показать хеш ]', nextId: 'quest_accept', isProOnly: true }
  ])

  // === QUEST NODES ===
  .addNode('quest_reject', 'КРОУЛЕР', 'Ой, парень... Твой буфер слишком мал для этого шума. Тебя перегрузит за пару тактов. Свободен.', [
    { text: 'Я еще вернусь.', nextId: 'LEAVE' }
  ])
  .addNode('quest_accept', 'КРОУЛЕР', 'Ого, нормальный девайс. Хорошо, контракт твой. Встретимся в зоне шума.', [
    { text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_bibirevo_combat_static_noise_bug_sweep' },
    { text: '[ НАЗАД ]', nextId: 'intro' }
  ])

  .addNode('active_status', 'КРОУЛЕР', 'Пакеты все еще вопят в Пустоте! Чего стоишь? "Восход" уже навел свои сканеры. Иди зачищай.', [
    { text: 'Ухожу.', nextId: 'LEAVE' }
  ])

  .build();
