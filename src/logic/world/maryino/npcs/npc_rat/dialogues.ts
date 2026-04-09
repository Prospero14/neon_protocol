import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_rat_dialogue: DialogueTree = new DialogueBuilder('npc_rat').withDistrict('maryino')
  .withGreetings({
    neutral: ['intro', 'intro_v2', 'intro_v3'],
    friendly: ['intro_friendly', 'intro_friendly_v2'],
    hostile: ['intro_hostile'],
    stressed: ['intro_stressed'],
    repeat: ['intro_repeat', 'intro_repeat_v2']
  })

  // === NEUTRAL POOL ===
  .addNode('intro', 'КРЫСА_КУРЬЕР', 'Пи-пи... Вижу тебя. Твоя дека фонит или мне кажется? В Марьино у всех фонит, но у тебя... по-особенному.', [
    { text: 'Что за шум в Марьино?', nextId: 'lore_district' },
    { text: 'Кто такие Nullpointers?', nextId: 'lore_faction' },
    { text: 'Мне нужен хладагент для Мастера Верстака.', nextId: 'quest_cooling_finish', requireQuestId: 'q_verstak_cooling' },
    { text: 'Петрович просил вернуть "Zero-Point" чип...', nextId: 'quest_rogue_module_rat', requireQuestId: 'q_petrovich_rogue_module' },
    { text: 'Нужны Bits. Есть работа?', nextId: 'job_selection' },
    { text: 'Я "приватизировал" детали для склада.', nextId: 'quest_scrap_raid_finish', requireQuestId: 'q_maryino_scrap_raid' },
    { text: 'Я готов помочь с проходом через шлюзы.', nextId: 'passage_lead', requireQuestId: 'q_maryino_passage' },
    { text: '[Прогнать]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v2', 'КРЫСА_КУРЬЕР', 'Пи! Пахнешь озоном. В Overflow сегодня жарко. Хочешь Bits или будешь ждать, пока всё сгорит?', [
    { text: 'Что за дело?', nextId: 'job_selection' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v3', 'КРЫСА_КУРЬЕР', 'Стой! Пи-пи... Твоя дека — не просто кусок пластика. Есть узел с данными, который надо обнулить.', [
    { text: 'Показывай координаты.', nextId: 'job_selection' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === FRIENDLY POOL ===
  .addNode('intro_friendly', 'КРЫСА_КУРЬЕР', 'Пи! Брат по Пустоте! Вижу, ты не попался Federal Oversight. У нас "жирный" заказ для тех, кто не боится грязных логов.', [
    { text: 'Я в деле.', nextId: 'job_selection' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_friendly_v2', 'КРЫСА_КУРЬЕР', 'Твой хеш... он пахнет свободой! Мастер Верстак передавал привет. Говорит, ты надежный юнит. Поработаем?', [
    { text: 'Поработаем.', nextId: 'job_selection' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === HOSTILE POOL ===
  .addNode('intro_hostile', 'КРЫСА_КУРЬЕР', 'Пиии! Уходи! Твой ID светится в ориентировках Сержанта. Ты привел "Восход"? Сгинь в пустой блок!', [
    { text: 'Я один.', nextId: 'intro' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === STRESSED POOL ===
  .addNode('intro_stressed', 'КРЫСА_КУРЬЕР', 'Пи! Твоя дека дрожит громче моего хвоста. Слишком много джиттера. Сначала в бар — остуди кэш, потом — дела.', [
    { text: 'Мне нужен контракт.', nextId: 'job_selection' },
    { text: 'Ладно.', nextId: 'LEAVE' }
  ])

  // === REPEAT POOL ===
  .addNode('intro_repeat', 'КРЫСА_КУРЬЕР', 'Пии! Мой лучший налетчик! После того рейда на склад — у нас деталей на неделю вперед. Есть еще?', [
    { text: 'Давай.', nextId: 'job_selection' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ], { requireCompletedQuestId: 'q_maryino_scrap_raid' })
  .addNode('intro_repeat_v2', 'КРЫСА_КУРЬЕР', 'Слышал, Петрович доволен тем чипом. Справедливая сделка. Хочешь еще Bits?', [
    { text: 'Хочу.', nextId: 'job_selection' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === LORE ===
  .addLoreNode('lore_district', 'КРЫСА_КУРЬЕР', 'Пи! Марьино — цифровое кладбище. Тут дампы, тут призраки, тут... мы. Nullpointers.', 'intro')
  .addLoreNode('lore_faction', 'КРЫСА_КУРЬЕР', 'Пи! Мы — серые зоны. Мы то, что они называют "ошибкой". Свободны от налогов и лицензий.', 'intro', 'Nullpointers')

  // === JOB SELECTION ===
  .addNode('job_selection', 'КРЫСА_КУРЬЕР', 'Есть пара вариантов: либо отбить ферму в Overflow, либо навести шороху на складе. Что выберешь?', [
    { text: 'Отбить ферму (Combat).', nextId: 'quest_explain_1', requireMinLevel: 5 },
    { text: 'Взлом склада (Stealth/Combat).', nextId: 'quest_scrap_raid_accept' },
    { text: 'Назад.', nextId: 'intro' }
  ])

  // === QUEST NODES ===
  .addNode('quest_explain_1', 'КРЫСА_КУРЬЕР', 'В Overflow лежит жирный архив логов — ядро данных. Не геройствуй: сначала ls, что бы там ни значило в твоей голове, потом grep по сигнатуре, потом scp наружу. Иначе вытащишь мусор и накормишь охрану.', [
    { text: 'А если боты меня заметят?', nextId: 'quest_explain_2' },
    { text: 'Понял порядок. Готов.', nextId: 'rank_check' }
  ])
  .addNode('quest_explain_2', 'КРЫСА_КУРЬЕР', 'Пи! Тогда беги или бей первым — в Overflow закон один: кто успел вытащить, тот и прав. Пайплайн тот же: глаза (ls), сито (grep), вынос (scp). Рискнёшь?', [
    { text: 'Погнали.', nextId: 'rank_check' },
    { text: 'Нет, опасно.', nextId: 'intro' }
  ])
  .addNode('rank_check', 'КРЫСА_КУРЬЕР', 'Так-так... Дай просканирую твой нейро-порт... (Бипы-бупы...)', [
    { text: '[ Ждать ]', nextId: 'quest_accept', requireMinLevel: 0 },
    { text: '[ Ждать ]', nextId: 'quest_accept', isProOnly: true }
  ])
  .addNode('quest_accept', 'КРЫСА_КУРЬЕР', 'О, сигнатура взрослая. Контракт твой. Overflow Zone ждет.', [
    { text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', awardQuestId: 'q_rat_data_dump' }
  ])

  // === SCRAP RAID ===
  .addNode('quest_scrap_raid_accept', 'КРЫСА_КУРЬЕР', 'На складе Fed-Over лежат модули "Arctic-9". Обнули охрану. Плачу 100 Bits.', [
    { text: 'В деле.', nextId: 'LEAVE', awardQuestId: 'q_maryino_scrap_raid' },
    { text: 'Нет.', nextId: 'intro' }
  ])
  .addNode('quest_scrap_raid_finish', 'КРЫСА_КУРЬЕР', 'Пии! Модули наши. Держи соточку, заработал.', [
    { text: 'Честная сделка.', nextId: 'intro', effect: 'GIVE_BITS', amount: 100, completeQuestId: 'q_maryino_scrap_raid' }
  ])

  // === OTHER QUESTS ===
  .addNode('quest_cooling_finish', 'КРЫСА_КУРЬЕР', 'Хладагент? "Buffer Liquid"? Отдам за 20 Bits. Скажи Верстаку, я помню долги.', [
    { text: 'Плачу 20 Bits.', nextId: 'intro', cost: 20, completeQuestId: 'q_verstak_cooling' },
    { text: 'Позже.', nextId: 'intro' }
  ])
  .addNode('passage_lead', 'КРЫСА_КУРЬЕР', 'Пи! Сержант из "Восхода" иногда закрывает глаза... Найди его на юге.', [
    { text: 'Найду.', nextId: 'intro', effect: 'GIVE_TRAIT', cardRewardId: 'trait_maryino_gang_lead' }
  ])

  // === ROGUE MODULE (PETROVICH) ===
  .addNode('quest_rogue_module_rat', 'КРЫСА_КУРЬЕР', 'Чип "Zero-Point" — моё сокровище. Держит тайминги фермы. С чего мне его отдавать?', [
    { text: 'Там нет защиты от обратного тока. Он выгорит.', nextId: 'quest_rogue_module_tech_1' },
    { text: 'Петрович единственный, кто его не угробит.', nextId: 'quest_rogue_module_social_1' },
    { text: 'Отдай чип или устрою "kernel panic".', nextId: 'quest_rogue_module_scare' },
    { text: 'Я заплачу (50 Bits).', nextId: 'quest_rogue_module_bribe', cost: 50 }
  ])
  .addNode('quest_rogue_module_tech_1', 'КРЫСА_КУРЬЕР', 'Пи! "Не проживёт"? Моя ферма на нем летает! Что с ним случится при нагрузке L3?', [
    { text: 'Выгорит без защиты от обратного тока.', nextId: 'quest_rogue_module_tech_2' },
    { text: 'Тайминги поплывут через 48 часов.', nextId: 'quest_rogue_module_tech_2' }
  ])
  .addNode('quest_rogue_module_tech_2', 'КРЫСА_КУРЬЕР', 'Пи-пи... Видел всплески в логах... Но чем ты его заменишь?', [
    { text: 'Залью патч-эмулятор. Не греется.', nextId: 'quest_rogue_module_negotiate' },
    { text: 'Просто верни его Петровичу.', nextId: 'quest_rogue_module_negotiate' }
  ])
  .addNode('quest_rogue_module_social_1', 'КРЫСА_КУРЬЕР', 'Петрович должен мне с 2098-го! Прислал битые кондеры!', [
    { text: 'Он соберёт тебе БП, если вернёшь модуль.', nextId: 'quest_rogue_module_social_2' }
  ])
  .addNode('quest_rogue_module_social_2', 'КРЫСА_КУРЬЕР', 'Соберет? Ладно, рискнем. Его репутация стоит того. Это в последний раз!', [
    { text: 'Забираю чип.', nextId: 'LEAVE', effect: 'GIVE_ITEM', cardRewardId: 'item_zero_point_chip' }
  ])
  .addNode('quest_rogue_module_scare', 'КРЫСА_КУРЬЕР', 'Пиии! Угрожаешь курьеру? Ладно-ладно, забирай железку.', [
    { text: 'Давно бы так.', nextId: 'LEAVE', effect: 'GIVE_ITEM', cardRewardId: 'item_zero_point_chip' }
  ])
  .addNode('quest_rogue_module_negotiate', 'КРЫСА_КУРЬЕР', 'Убедил. Не хочу пожара. Скажи Петровичу — жду блок питания!', [
    { text: 'Передам. Забираю чип.', nextId: 'LEAVE', effect: 'GIVE_ITEM', cardRewardId: 'item_zero_point_chip' }
  ])
  .addNode('quest_rogue_module_bribe', 'КРЫСА_КУРЬЕР', 'Bits! Это я люблю. Куплю новые процессоры. Держи раритет.', [
    { text: 'Сделка.', nextId: 'LEAVE', effect: 'GIVE_ITEM', cardRewardId: 'item_zero_point_chip' }
  ])

  .build();
