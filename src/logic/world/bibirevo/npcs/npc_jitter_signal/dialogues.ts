import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_jitter_signal_dialogue: DialogueTree = new DialogueBuilder('npc_jitter_signal')
  .withGreetings({
    neutral: ['intro', 'intro_v2'],
    friendly: ['intro_friendly', 'intro_friendly_v2'],
    hostile: ['intro_hostile'],
    stressed: ['intro_stressed'],
    repeat: ['intro_repeat']
  })

  // === NEUTRAL POOL ===
  .addNode('intro', 'ДЖИТТЕР', 'Моня стар, Моня — это вчерашний день подсети. Хочешь реальный неограниченный трафик? У меня есть доступ к "теневым" реле.', [
    { text: 'Что за "теневые" реле?', nextId: 'lore_rogue' },
    { text: 'Нужна работа.', nextId: 'quest_pitch' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v2', 'ДЖИТТЕР', '*быстро печатает на пульте* Моня считает, что трафик должен быть чистым. Я считаю, что трафик должен быть СВОБОДНЫМ. Хочешь помочь?', [
    { text: 'Я готов.', nextId: 'quest_pitch' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === FRIENDLY POOL ===
  .addNode('intro_friendly', 'ДЖИТТЕР', 'А, мой любимый перехватчик! Твоя сигнатура теперь в моем "белом" списке. Есть одна задача... Магистральная. Садись.', [
    { text: 'Я слушаю.', nextId: 'quest_pitch' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_friendly_v2', 'ДЖИТТЕР', 'Ты доказал, что джиттер — это не шум, а стратегия. Хочешь вскрыть еще пару узлов Net Drivers?', [
    { text: 'Хочу.', nextId: 'quest_pitch' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === HOSTILE POOL ===
  .addNode('intro_hostile', 'ДЖИТТЕР', '*направляет джаммер* Слышь, ты, "правильный". Вижу по логам — ты Моню слушаешь? Порядок, лицензии... Проваливай, пока я не зациклил твой интерфейс.', [
    { text: 'Я не стукач.', nextId: 'intro' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === STRESSED POOL ===
  .addNode('intro_stressed', 'ДЖИТТЕР', '*смеется* Гляди на себя! Твоя дека дрожит громче, чем мои реле. Иди в бар, а то взорвешься прямо у меня в секторе. Это будет плохим дампом.', [
    { text: 'Мне нужна работа.', nextId: 'quest_pitch' },
    { text: 'Пойду остыну.', nextId: 'LEAVE' }
  ])

  // === REPEAT POOL ===
  .addNode('intro_repeat', 'ДЖИТТЕР', 'Снова в поисках теневого трафика? Моня до сих пор не понял, как мы это сделали. Есть еще пару идей по обходу аудита.', [
    { text: 'Давай координаты.', nextId: 'quest_pitch' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ], { requireCompletedQuestId: 'q_bibirevo_job_jitter' })

  // === LORE ===
  .addLoreNode('lore_rogue', 'ДЖИТТЕР', 'Это те линии, которые Ядро не видит. Идеально для перехвата данных без аудита. Но Моня постоянно их чинит. (+5 Репутации Redundants)', 'intro', 'Redundants')

  // === QUEST NODES ===
  .addNode('quest_pitch', 'ДЖИТТЕР', 'Нужно перехватить Link в Северном Потоке. Оплата чистыми битсами. Потянешь уровень опасности: MID?', [
    { text: 'Потяну.', nextId: 'rank_check' },
    { text: 'Нет.', nextId: 'intro' }
  ])
  .addNode('rank_check', 'ДЖИТТЕР', 'Дай гляну твою сигнатуру... Надеюсь, ты не "стукач" Net Drivers.', [
    { text: '[ Показать ]', nextId: 'quest_reject', requireMaxLevel: 1, isTraineeOnly: true },
    { text: '[ Показать ]', nextId: 'quest_accept', requireMinLevel: 2 },
    { text: '[ Показать ]', nextId: 'quest_accept', isProOnly: true }
  ])
  .addNode('quest_reject', 'ДЖИТТЕР', 'Ха! С такой сигнатурой ты только "Тетрис" в баре "Сигнал" ломать можешь. Свободен.', [
    { text: 'Я вернусь.', nextId: 'LEAVE' }
  ])
  .addNode('quest_accept', 'ДЖИТТЕР', 'Ладно, чист. Лови координаты. Если встретишь Моню — скажи, что он тормозит прогресс.', [
    { text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', awardQuestId: 'q_bibirevo_job_jitter' }
  ])

  .build();
