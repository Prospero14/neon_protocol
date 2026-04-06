import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_bibirevo_coder_dialogue: DialogueTree = new DialogueBuilder('npc_bibirevo_coder')
  .withGreetings({
    neutral: ['intro', 'intro_v2'],
    friendly: ['intro_friendly', 'intro_friendly_v2'],
    hostile: ['intro_hostile'],
    stressed: ['intro_stressed'],
    repeat: ['intro_repeat']
  })

  // === NEUTRAL POOL ===
  .addNode('intro', 'СОННЫЙ КОДЕР', '...а? Баг в 312-й строке? Нет, это фича... *засыпает*', [
    { text: 'Эй, не спи! Тебе нужна энергия. (+Intel: Coder_Fatigue)', nextId: 'lore_sleep' },
    { text: 'Я принес Дзен-Лог от чаевода Олега.', nextId: 'quest_energy_finish', requireQuestId: 'q_bibirevo_energy' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v2', 'СОННЫЙ КОДЕР', '*бормочет сквозь сон* ...рекурсия бесконечна... Ядро не видит хвоста... Кто здесь? Опять тестеры?', [
    { text: 'Я принес Энергию.', nextId: 'quest_energy_finish' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === FRIENDLY POOL ===
  .addNode('intro_friendly', 'СОННЫЙ КОДЕР', '*медленно открывает один глаз* О, человек с чистым кодом... Твой Дзен-Лог до сих пор крутится в моем кэше. Хочешь услышать про бесконечный цикл?', [
    { text: 'Конечно.', nextId: 'lore' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_friendly_v2', 'СОННЫЙ КОДЕР', 'Ты принес... тишину. В твоих логах нет мусора. Хочешь, я покажу тебе, как Ядро скрывает баги в Ротонде?', [
    { text: 'Давай.', nextId: 'lore' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === HOSTILE POOL ===
  .addNode('intro_hostile', 'СОННЫЙ КОДЕР', '*отворачивается* Ты слишком громко думаешь. Твой хеш корявый. Иди... в пустой блок памяти.', [
    { text: 'Прости.', nextId: 'intro' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === STRESSED POOL ===
  .addNode('intro_stressed', 'СОННЫЙ КОДЕР', 'У тебя... пиксели в глазах дрожат... Иди поспи... или выпей охладу. Я и сам почти в оффлайне.', [
    { text: 'Остываю.', nextId: 'LEAVE' }
  ])

  // === REPEAT POOL ===
  .addNode('intro_repeat', 'СОННЫЙ КОДЕР', 'А, это ты. Спасибо за тот Дзен-Лог... Я наконец-то понял, почему Ядро боится пустых строк.', [
    { text: 'Расскажи.', nextId: 'lore' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ], { requireCompletedQuestId: 'q_bibirevo_energy' })

  // === LORE ===
  .addLoreNode('lore_sleep', 'СОННЫЙ КОДЕР', 'Я не сплю, я... дефрагментируюсь. Если принесешь что-то, что "будит" нейросети — я допишу твой скрипт.', 'intro')
  .addLoreNode('lore', 'СОННЫЙ КОДЕР', 'Бесконечный цикл — это не баг. Это способ заставить Ядро работать на нас. Главное — вовремя выйти из прерывания. (+10 Intel)', 'intro', 'Independent')

  // === QUEST NODES ===
  .addNode('quest_energy_finish', 'СОННЫЙ КОДЕР', 'Ох... это... это Дзен-Лог? Какая чистота кода... *пробуждается* Вижу! Вижу бесконечный цикл! Держи обещанное.', [
    { text: 'На здоровье.', nextId: 'intro', effect: 'GIVE_BITS', amount: 50, completeQuestId: 'q_bibirevo_energy' }
  ])

  .build();
