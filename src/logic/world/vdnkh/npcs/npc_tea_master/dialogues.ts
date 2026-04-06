import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_tea_master_dialogue: DialogueTree = new DialogueBuilder('npc_tea_master')
  .withGreetings({
    neutral: ['intro', 'intro_v2'],
    friendly: ['intro_friendly', 'intro_friendly_v2'],
    hostile: ['intro_hostile'],
    stressed: ['intro_stressed'],
    repeat: ['intro_repeat']
  })

  // === NEUTRAL POOL ===
  .addNode('intro', 'МАСТЕР ЧАЯ ОЛЕГ', 'Сядь. Выпей чаю. CPU перегрет, стек забит... Дзен-ЦОД — это баланс между нулем и единицей. Дай своей системе отдохнуть от дедлайнов.', [
    { text: 'Сонный Кодер из Бибирево просил "Дзен-Лог".', nextId: 'quest_energy_give', requireQuestId: 'q_bibirevo_energy' },
    { text: 'Чашка чая (Бесплатно)', nextId: 'intro', effect: 'RESTORE_HP', amount: 10 },
    { text: 'Кто такие "Дзен-ЦОД"?', nextId: 'lore_faction' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v2', 'МАСТЕР ЧАЯ ОЛЕГ', 'Чай заваривается 256 секунд. Ни секундой больше. В этом мире, где пакеты летают со скоростью света, важно уметь замедляться. Чего ищешь в этом шуме?', [
    { text: 'Покоя.', nextId: 'intro' },
    { text: 'Bits.', nextId: 'intro' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === FRIENDLY POOL ===
  .addNode('intro_friendly', 'МАСТЕР ЧАЯ ОЛЕГ', 'А, мой любимый тестер протоколов спокойствия! Для тебя у меня есть особый сбор из подвалов МГУ. Садись, обсудим гармонию кода.', [
    { text: 'Наливай.', nextId: 'intro' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_friendly_v2', 'МАСТЕР ЧАЯ ОЛЕГ', 'Вижу, твоя сигнатура стала плавнее. Ты начинаешь понимать, что Пустота — это не ошибка, а чистое полотно. Хочешь чаю?', [
    { text: 'Да.', nextId: 'intro' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === HOSTILE POOL ===
  .addNode('intro_hostile', 'МАСТЕР ЧАЯ ОЛЕГ', 'В тебе слишком много агрессивного кода. Твой интерфейс режет пространство. Чай не поможет, пока ты не обнулишь свои фильтры. Уходи.', [
    { text: 'Я остыну.', nextId: 'LEAVE' }
  ])

  // === STRESSED POOL ===
  .addNode('intro_stressed', 'МАСТЕР ЧАЯ ОЛЕГ', 'Твой джиттер зашкаливает. Пей "Лунную Тень" немедленно. Не шевелись, пока кэш не стабилизируется. Ты на грани kernel panic.', [
    { text: 'Я остываю...', nextId: 'intro', effect: 'RESTORE_HP', amount: 50 },
    { text: 'Нет времени.', nextId: 'LEAVE' }
  ])

  // === REPEAT POOL ===
  .addNode('intro_repeat', 'МАСТЕР ЧАЯ ОЛЕГ', 'Снова гонка за Bits? Чай не любит суеты, и система тоже. Садись, кодер. Бибирево подождет, пока ты пьешь.', [
    { text: 'Давай чаю.', nextId: 'intro' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === LORE ===
  .addLoreNode('lore_faction', 'МАСТЕР ЧАЯ ОЛЕГ', 'Дзен-ЦОД — это те, кто устал от бесконечной гонки корпораций и радикалов. Мы верим: идеальный код — это его отсутствие. Баланс важнее релиза.', 'intro', 'Zen-DPC')

  // === QUESTS ===
  .addNode('quest_energy_give', 'МАСТЕР ЧАЯ ОЛЕГ', 'Сонный? Он совсем зациклился на дедлайнах GigaBank... На, держи настойку на старых логах "Buffer Calm". Пусть выпьет залпом. И скажи ему — пусть поспит, иначе кэш сгорит.', [
    { text: 'Спасибо, Олег. Передам.', nextId: 'intro', effect: 'GIVE_BITS', amount: 20 }
  ])

  .build();
