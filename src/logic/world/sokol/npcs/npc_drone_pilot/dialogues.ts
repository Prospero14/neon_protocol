import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_drone_pilot_dialogue: DialogueTree = new DialogueBuilder('npc_drone_pilot')
  .withGreetings({
    neutral: ['intro', 'intro_v2'],
    friendly: ['intro_friendly'],
    hostile: ['intro_hostile'],
    stressed: ['intro_stressed'],
    repeat: ['intro_repeat']
  })

  // === NEUTRAL POOL ===
  .addNode('intro', 'ПИЛОТ ДРОНОВ', '*проверяет линзы шлема* Воздух Сокола чист... Хочешь поуправлять облаком из ста ботов или ты просто прохожий с "битым" ID?', [
    { text: 'Хочу пройти обучение.', nextId: 'quest_combat_start' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v2', 'ПИЛОТ ДРОНОВ', 'Тебе нужно больше высоты в коде, малец... Устроим тренировочный полет роя? Обещаю, будет больно, но полезно для твоего стека.', [
    { text: 'Я не боюсь.', nextId: 'quest_combat_start' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === FRIENDLY POOL ===
  .addNode('intro_friendly', 'ПИЛОТ ДРОНОВ', 'А, мой лучший кадет! Рой Сокола тебя уже узнает. Твои маневры в последнем тесте были... вдохновляющими. Повторим на бис?', [
    { text: 'Взлетаем.', nextId: 'quest_combat_start' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === HOSTILE POOL ===
  .addNode('intro_hostile', 'ПИЛОТ ДРОНОВ', 'Уходи. Мои дроны чуют Null-поинтеры за милю, и им не нравится твой паттерн. Если не исчезнешь, я активирую протокол "Collision".', [
    { text: 'Ухожу.', nextId: 'LEAVE' }
  ])

  // === STRESSED POOL ===
  .addNode('intro_stressed', 'ПИЛОТ ДРОНОВ', 'У тебя... джиттер в интерфейсе. Ты сейчас сорвешься в штопор. Сходи в "Пропеллер", залей охлаждайки, потом — полеты.', [
    { text: 'Я в порядке.', nextId: 'intro' },
    { text: 'Остываю.', nextId: 'LEAVE' }
  ])

  // === REPEAT POOL ===
  .addNode('intro_repeat', 'ПИЛОТ ДРОНОВ', 'Снова на взлетной полосе? Готов к новой калибровке роя? Тот PING-тест был неплох, но бэклог никогда не пустует.', [
    { text: 'Взлетаем.', nextId: 'quest_combat_start' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ], { requireCompletedQuestId: 'q_sokol_combat_drone_training' })

  // === QUESTS ===
  .addNode('quest_combat_start', 'ПИЛОТ ДРОНОВ', 'Это будет "легкий" PING-тест... продержись три цикла против моих ботов. Если сигнатура выживет — Bits будут на счету. Погнали?', [
    { text: '[ ПРИНЯТЬ: ТРЕНИРОВКА РОЯ ]', nextId: 'LEAVE', awardQuestId: 'q_sokol_combat_drone_training' },
    { text: 'Позже.', nextId: 'intro' }
  ])

  .build();
