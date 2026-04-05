import type { DialogueTree } from '../../dialogues';
import { DialogueBuilder } from '../../dialogueUtils';

export const mitino_dialogues: Record<string, DialogueTree> = {
  // --- MENTOR (PROFESSION UPGRADES) ---
  npc_mentor: new DialogueBuilder('npc_mentor')
    .addNode('intro', 'МЕНТОР_КУРСОВ', 'Времени мало, кода много. Интенсивы "JetBrain-Zero" — твой единственный шанс не сгнить стажером. Какой стек прошиваем?', [
      { text: 'Проверить мои допуски на обучение.', nextId: 'rank_check' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('rank_check', 'МЕНТОР_КУРСОВ', 'Дай гляну базу... Мы не учим тех, кто не умеет пинговать реальность. (Ментор сканирует твой опыт...)', [
      { text: '[ Ждать ]', nextId: 'reject', requireMaxLevel: 4, isTraineeOnly: true },
      { text: '[ Ждать ]', nextId: 'ok_to_learn', requireMinLevel: 5 },
      { text: '[ Ждать ]', nextId: 'ok_to_learn', isProOnly: true }
    ])
    .addNode('reject', 'МЕНТОР_КУРСОВ', 'Малец, ты серьезно? Тебе еще в Академии парты протирать. Нос не дорос до интенсивов! Набей 5-й уровень, тогда и поговорим.', [
      { text: 'Я вернусь.', nextId: 'LEAVE' }
    ])
    .addNode('ok_to_learn', 'МЕНТОР_КУРСОВ', 'База есть. Можем начинать. Выбирай направление:', [
      { text: 'Класс: Kotlin Developer (350 Bits)', nextId: 'bought', cost: 350, effect: 'SET_PROFESSION', cardRewardId: 'kotlin_jun' },
      { text: 'Класс: Go Developer (400 Bits)', nextId: 'bought', cost: 400, effect: 'SET_PROFESSION', cardRewardId: 'go_jun' },
      { text: 'Класс: JS Developer (250 Bits)', nextId: 'bought', cost: 250, effect: 'SET_PROFESSION', cardRewardId: 'js_jun' },
      { text: 'Назад', nextId: 'intro' }
    ])
    .addNode('bought', 'МЕНТОР_КУРСОВ', 'Теперь ты в элите. Иди и пиши так, чтобы Ядро лагало от зависти.', [
      { text: 'Лечу!', nextId: 'LEAVE' }
    ])
    .build(),

  // --- SLICK (BLACK MARKET) ---
  npc_slick_shady: new DialogueBuilder('npc_slick_shady')
    .addNode('intro', 'СЛИК (СКУПЩИК)', 'Тсс... Не шуми. Стены имеют уши. Сделка через теневой шлюз, но линии "барахлят". Нужен проверочный пинг без ведома Регуляторов.', [
      { text: 'Кто такие Регуляторы?', nextId: 'lore_market' },
      { text: 'Откалибровать частоты (Technical).', nextId: 'branch_tech_1' },
      { text: 'Дать взятку Инспектору (Social: 120 Bits).', nextId: 'branch_social_1', cost: 120 },
      { text: 'Встречу их силой (Combat).', nextId: 'branch_combat_start' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addLoreNode('lore_market', 'СЛИК (СКУПЩИК)', 'Регуляторы — цепные псы GigaBank. Следят за чистотой эфира. Если поймают — дека превратится в кирпич раньше, чем скажешь "Hello World". (+Intel: Регуляторы)', 'intro', 'Regulators')
    .addNode('branch_tech_1', 'СЛИК (СКУПЩИК)', 'Тонко. Нужно подменить заголовки так, чтобы выглядели как шум атмосферы. Твои логи чистые для такого маневра?', [
      { text: '[ НАЧАТЬ КАЛИБРОВКУ ]', nextId: 'branch_tech_check', requireMinLevel: 4 },
      { text: 'Нет, это слишком сложно.', nextId: 'intro' }
    ])
    .addNode('branch_tech_check', 'СЛИК (СКУПЩИК)', '[SUCCESS] Пи-и-ип... Слышишь? Совершенно чистый сигнал. Регуляторы даже не заметят терабайты данных. Держи долю.', [
      { text: 'Рад помочь. (Завершен)', nextId: 'LEAVE', completeQuestId: 'q_mitino_black_market_ping', effect: 'GIVE_CARD', cardRewardId: 'fn_ping_stealth' }
    ])
    .addNode('branch_social_1', 'СЛИК (СКУПЩИК)', 'Bits решают проблемы. Инспектор прошел мимо узла, "не заметив" активности. Линия проверена, забирай бонусы.', [
      { text: 'Сотрудничество — сила. (Завершен)', nextId: 'LEAVE', completeQuestId: 'q_mitino_black_market_ping' }
    ])
    .addNode('branch_combat_start', 'СЛИК (СКУПЩИК)', 'Агрессивно. Регуляторы уже выслали дронов-глушилок. Если разберешь их — сможем гнать сигнал в открытую.', [
      { text: '[ ВСТРЕТИТЬ РЕГУЛЯТОРОВ: БОЙ ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_mitino_combat_freq_jam_bug_sweep' }
    ])
    .build(),

  // --- UNCLE VANYA (RADIO HAM) ---
  npc_radio_ham: new DialogueBuilder('npc_radio_ham')
    .withGreetings({
      neutral: ['intro'],
      friendly: ['intro_friendly'],
      repeat: ['intro_repeat']
    })
    .addNode('intro', 'ДЯДЯ ВАНЯ', 'Шшш... Ловлю частоту 404... О, новый юнит. Ты пришел за деталями или просто поглазеть на антиквариат?', [
      { text: 'Луна из Фили просила собрать релей.', nextId: 'quest_relay_start', requireQuestId: 'q_fili_satellite_interception' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('quest_relay_start', 'ДЯДЯ ВАНЯ', 'Луна? Смелая девчонка. Релей собрать можно, но мне нужны медные жилы и пара мощных транзисторов. Флэш может их достать, если договоришься.', [
      { text: 'Я найду Флэша.', nextId: 'quest_relay_accept' },
      { text: 'Это долго.', nextId: 'intro' }
    ])
    .addNode('quest_relay_accept', 'ДЯДЯ ВАНЯ', 'Иди, он обычно ошивается около свалки. Скажи, что от меня.', [
      { text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_mitino_radio_relay' }
    ])
    .build(),

  // --- FLASH (HARDWARE MODDER) ---
  npc_hardware_modder: new DialogueBuilder('npc_hardware_modder')
    .withGreetings({
      neutral: ['intro'],
      friendly: ['intro_friendly'],
      repeat: ['intro_repeat']
    })
    .addNode('intro', 'ФЛЭШ', 'Разрыв! Твой кулер захлебывается! Хочешь разогнать деку до предела или просто греешь воздух?', [
      { text: 'Дядя Ваня просил детали для реле.', nextId: 'quest_mod_start', requireQuestId: 'q_mitino_radio_relay' },
      { text: 'Мне нужны Bits.', nextId: 'quest_debt_start' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('quest_mod_start', 'ФЛЭШ', 'Ваня... Ладно. Но модули "Turbo-X" просто так не валяются. Нужно протестировать мой новый патч на свалке. Продержишься 3 цикла?', [
      { text: 'Легко. Давай патч.', nextId: 'quest_mod_accept' },
      { text: 'Я подумаю.', nextId: 'intro' }
    ])
    .addNode('quest_mod_accept', 'ФЛЭШ', 'Держи. Если дека не сгорит — детали твои. Встретимся в зоне "Скрап".', [
      { text: '[ ПРИНЯТЬ ТЕСТЫ ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_mitino_hardware_mod' }
    ])
    .addNode('quest_debt_start', 'ФЛЭШ', 'Bits? Ха! У меня самого пустые логи. Я задолжал Барыге Мише 200 Bits. Помоги вернуть долг или отработай его на свалке.', [
      { text: 'Я поговорю с Мишей.', nextId: 'quest_debt_accept' },
      { text: 'Сам разбирайся.', nextId: 'intro' }
    ])
    .addNode('quest_debt_accept', 'ФЛЭШ', 'Удачи. Он не любит ждать. Если не договоришься — он спустит на меня утилизаторов.', [
      { text: '[ ПРИНЯТЬ: ДОЛГИ МИТИНО ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_mitino_debt' }
    ])
    .build(),

  // --- BARYGA MISHA ---
  npc_mitino_trader: new DialogueBuilder('npc_mitino_trader')
    .addNode('intro', 'БАРЫГА МИША', 'Bits вперед, товар потом. Никаких возвратов, никаких жалоб в Ядро. Что ищешь?', [
      { text: 'Я пришел по поводу долга Флэша.', nextId: 'quest_debt_check', requireQuestId: 'q_mitino_debt' },
      { text: 'Купить ключ (60 Bits)', nextId: 'LEAVE', cost: 60, effect: 'GIVE_CARD', cardRewardId: 'fn_ping' },
      { text: 'Уйти', nextId: 'LEAVE' }
    ])
    .addNode('quest_debt_check', 'БАРЫГА МИША', 'Флэш? Этот тормоз всё ещё должен мне. Либо гони 200 Bits прямо сейчас, либо добудь мне ядро с дрона-инспектора.', [
      { text: 'Плачу 200 Bits.', nextId: 'quest_debt_finish', cost: 200 },
      { text: 'Я добуду ядро. (Combat)', nextId: 'quest_debt_combat' },
      { text: 'Позже.', nextId: 'intro' }
    ])
    .addNode('quest_debt_finish', 'БАРЫГА МИША', 'Умный ход. Скажи Флэшу, что он чист... пока что.', [
      { text: 'Передам.', nextId: 'intro', effect: 'COMPLETE_TALK_QUEST', cardRewardId: 'q_mitino_debt' }
    ])
    .addNode('quest_debt_combat', 'БАРЫГА МИША', 'Смело. Охранный дрон в северном узле. Свалишь его — долг обнулим.', [
      { text: '[ В ПУТЬ ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_mitino_combat_drone_hunt_bug_sweep' }
    ])
    .build(),
};
