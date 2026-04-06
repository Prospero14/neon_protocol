import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_lab_assistant_dialogue: DialogueTree = new DialogueBuilder('npc_lab_assistant')
  .withGreetings({
    neutral: ['intro', 'intro_v2'],
    friendly: ['intro_friendly'],
    hostile: ['intro_hostile'],
    stressed: ['intro_stressed'],
    repeat: ['intro_repeat']
  })

  // === NEUTRAL POOL ===
  .addNode('intro', 'ЛАБОРАНТ ИЛЬЯ', 'Осторожно! Не наступай на оптоволокно... Ты абитуриент или аноним? Здесь высокое напряжение в логах и очень нервный декан.', [
    { text: 'Я ищу практику.', nextId: 'quest_start' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v2', 'ЛАБОРАНТ ИЛЬЯ', '*копается в распределительном щите* Опять скачок... Эти дроны скоро выжгут нам всю подсеть. Хочешь помочь с инвентаризацией или просто шумишь?', [
    { text: 'Помогу.', nextId: 'quest_start' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === FRIENDLY POOL ===
  .addNode('intro_friendly', 'ЛАБОРАНТ ИЛЬЯ', 'А, лучший практикант семестра! Твои отчеты по авионике спасли меня от выговора. Есть одна "горячая" задачка для профи.', [
    { text: 'Я готов.', nextId: 'quest_start' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === HOSTILE POOL ===
  .addNode('intro_hostile', 'ЛАБОРАНТ ИЛЬЯ', 'Уходи! Твой ID помечен как "Деструктивный". Если ты что-то здесь закоротишь, Декан меня сотрет. Сгинь!', [
    { text: 'Я остыну.', nextId: 'LEAVE' }
  ])

  // === STRESSED POOL ===
  .addNode('intro_stressed', 'ЛАБОРАНТ ИЛЬЯ', 'Слушай, ты греешься сильнее, чем наш главный сервер в час пик. Сходи в "Пропеллер", промой соты охлаждения. Мне здесь пожары не нужны.', [
    { text: 'Хорошо.', nextId: 'LEAVE' }
  ])

  // === REPEAT POOL ===
  .addNode('intro_repeat', 'ЛАБОРАНТ ИЛЬЯ', 'Архипов получил методички? Отлично. Рекурсия в обучении — залог стабильности. Готов к новым лабораторным?', [
    { text: 'Готов.', nextId: 'quest_start' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ], { requireCompletedQuestId: 'q_sokol_talk_lab_delivery' })

  // === QUESTS ===
  .addNode('quest_start', 'ЛАБОРАНТ ИЛЬЯ', 'Нужно доставить "Методички по Ассемблеру" Профессору Архипову в Академию (Юго-Западный округ). Справишься, "Стажер"? Он ценит пунктуальность и отсутствие Null-поинтеров.', [
    { text: '[ ПРИНЯТЬ: ДОСТАВКА МЕТОДИЧЕК ]', nextId: 'rank_check' },
    { text: 'Мне некогда.', nextId: 'intro' }
  ])

  // === RANK CHECK ===
  .addNode('rank_check', 'ЛАБОРАНТ ИЛЬЯ', 'Так, дай гляну твое расписание... Хм, сигнатура должна быть... академической.', [
    { text: '[ Ждать ]', nextId: 'quest_reject', requireMaxLevel: 1, isTraineeOnly: true },
    { text: '[ Ждать ]', nextId: 'quest_accept', requireMinLevel: 2 },
    { text: '[ Ждать ]', nextId: 'quest_accept', isProOnly: true }
  ])
  .addNode('quest_reject', 'ЛАБОРАНТ ИЛЬЯ', 'Слушай, ты еще совсем "пустой". Твой стек не выдержит дороги в Академию. Поработай в других округах, потом приходи.', [
    { text: 'Ладно.', nextId: 'LEAVE' }
  ])
  .addNode('quest_accept', 'ЛАБОРАНТ ИЛЬЯ', 'Сигнатура подходит. Вот тебе методички, не потеряй по дороге. Архипов ждёт их к следующему такту.', [
    { text: '[ ВЗЯТЬ МЕШОК ]', nextId: 'LEAVE', awardQuestId: 'q_sokol_talk_lab_delivery' }
  ])

  .build();
