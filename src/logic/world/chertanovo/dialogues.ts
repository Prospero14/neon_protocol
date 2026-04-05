import type { DialogueTree } from '../../dialogues';
import { DialogueBuilder } from '../../dialogueUtils';

export const chertanovo_dialogues: Record<string, DialogueTree> = {
  // --- Z3R0 (NULLPOINTERS FIXER) ---
  npc_zero: new DialogueBuilder('npc_zero')
    .withGreetings({
      neutral: ['intro', 'intro_v2', 'intro_v3', 'intro_v4'],
      friendly: ['intro_friendly', 'intro_friendly_v2', 'intro_friendly_v3'],
      hostile: ['intro_hostile', 'intro_hostile_v2'],
      stressed: ['intro_stressed', 'intro_stressed_v2'],
      repeat: ['intro_repeat', 'intro_repeat_v2', 'intro_repeat_v3']
    })
    .addNode('intro', 'Z3R0', 'Твое существование — это NullPointerException... Мы в "Глючном Гетто" празднуем каждый сбой. Пришел присоединиться к хаосу?', [
      { text: 'Меня прислал Глюк. [ ПОКАЗАТЬ МЕТКУ ]', nextId: 'intro_found', requireQuestId: 'q_chertanovo_find_zero' },
      { text: 'Кто такие "Nullpointers"?', nextId: 'lore_faction' },
      { text: 'Хочу проверить свои силы в бою.', nextId: 'quest_explain_1' },
      { text: 'Мне нужен "Анархический Манифест".', nextId: 'quest_talk' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_v2', 'Z3R0', '*рисует глейтч-граффити* Новая переменная в системе... Хочешь почувствовать, как биты ломаются под пальцами?', [
      { text: 'Я готов к дестабилизации.', nextId: 'quest_explain_1' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_v3', 'Z3R0', 'Чертаново не прощает стабильности. Если твой FPS больше 60 — ты шпион. У тебя тоже кэш подтекает?', [
      { text: 'Я свой.', nextId: 'intro' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_friendly', 'Z3R0', 'А, брат по пустоте. Сигнатура резонирует con энтропией. Нужно устроить "Ночной Скан" для Регуляторов.', [
      { text: 'Я в деле, Z3R0.', nextId: 'quest_explain_1' }
    ])
    .addNode('intro_hostile', 'Z3R0', 'Твой код пахнет стабильностью GigaBank. Проваливай, пока я не зациклил твое сознание.', [
      { text: 'Ухожу.', nextId: 'LEAVE' }
    ])
    .addNode('intro_stressed', 'Z3R0', 'Парень, ты вибрируешь. Стресс прекрасен, но сейчас ты бесполезен. Очисти кэш в баре.', [
      { text: 'Я в порядке.', nextId: 'intro' }
    ])
    .addLoreNode('lore_faction', 'Z3R0', 'Пустота — это начало. Мы — Nullpointers, те, кто отказался от индексации. Свобода — это отсутствие типа.', 'intro', 'Nullpointers')
    .addNode('quest_explain_1', 'Z3R0', 'Либо спарринг con "Ячейкой", либо "Ночной Скан" — перехват данных под носом патрулей. Как будем действовать?', [
      { text: 'Прямой бой с Ячейкой.', nextId: 'quest_explain_2' },
      { text: 'Скрытый "Ночной Скан". (Technical)', nextId: 'quest_tech_path', requireMinLevel: 3 },
      { text: 'Использовать связи с Анархистами. (Social)', nextId: 'quest_social_path', requireReputation: { factionId: 'ANARCHO_VOID', minPoints: 20 } }
    ])
    .addNode('quest_explain_2', 'Z3R0', 'Наши радикалы не знают жалости. Выживешь — станешь легендой. Рискнешь?', [
      { text: 'Проверяй мой стек.', nextId: 'rank_check' },
      { text: 'Надо подумать.', nextId: 'intro' }
    ])
    .addNode('quest_tech_path', 'Z3R0', 'Взлом 404-го порта? Красиво. Если прерывание чистое — соберешь всё без выстрелов. Берешь?', [
      { text: 'Да. Проверяй допуск.', nextId: 'rank_check' }
    ])
    .addNode('quest_social_path', 'Z3R0', 'Твоя репутация дает ключи от ретрансляторов. Просто "вымоешь" логи. Готов?', [
      { text: 'Готов. Сканируй.', nextId: 'rank_check' }
    ])
    .addNode('rank_check', 'Z3R0', 'Дай гляну сигнатуру... Скан порта запущен.', [
      { text: '[ Ждать ]', nextId: 'quest_accept', requireMinLevel: 0 },
      { text: '[ Ждать ]', nextId: 'quest_accept', isProOnly: true }
    ])
    .addNode('quest_reject', 'Z3R0', 'Зеленый еще. Нос не дорос. Ячейка сотрет тебя за три такта. Вернись позже.', [
      { text: 'Я вернусь.', nextId: 'LEAVE' }
    ])
    .addNode('quest_accept', 'Z3R0', 'Код пахнет озоном и свободой. Выбирай цель.', [
      { text: '[ ТРЕНИРОВКА С ЯЧЕЙКОЙ ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_chertanovo_combat_anarcho_cell_bug_sweep' },
      { text: '[ СТАРТ НОЧНОГО СКАНА ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_chertanovo_combat_night_scan_bug_sweep' }
    ])
    .addNode('quest_talk', 'Z3R0', 'Манифест? Ха! Держи копию — это навсегда изменит твой взгляд на код.', [
      { text: 'Принять Манифест', nextId: 'LEAVE', effect: 'GIVE_CARD', cardRewardId: 'fn_ping' }
    ])
    .addNode('intro_found', 'Z3R0', 'Глюк? Этот старый кусок легаси-кода всё еще дышит? Ха. Раз ты нашел путь через его бред, значит в тебе есть искра энтропии. Добро пожаловать в Пустоту.', [
      { text: 'Спасибо... наверное.', nextId: 'intro', effect: 'COMPLETE_TALK_QUEST', cardRewardId: 'q_chertanovo_find_zero', reputationReward: { factionId: 'ANARCHO_VOID', amount: 15 } }
    ])
    .build(),

  // --- PARANOID CITIZEN ---
  npc_chertanovo_paranoid: new DialogueBuilder('npc_chertanovo_paranoid')
    .withGreetings({
      neutral: ['intro', 'intro_v2', 'intro_v3', 'intro_v4'],
      friendly: ['intro_friendly', 'intro_friendly_v2'],
      hostile: ['intro_hostile'],
      stressed: ['intro_stressed', 'intro_stressed_v2'],
      repeat: ['intro_repeat', 'intro_repeat_v2']
    })
    .addNode('intro', 'ПАРАНОИК', 'Тихо! Они слушают через чайники! Настоящая приватность стоит дорого.', [
        { text: 'Я могу помочь con защитой.', nextId: 'quest_pitch' },
        { text: 'Я принес Privacy Patch.', nextId: 'quest_finish', requireQuestId: 'q_chertanovo_privacy' },
        { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_v2', 'ПАРАНОИК', '*заклеивает камеру* За тобой нет "хвоста"? Пока нет. Умеешь прятаться?', [
      { text: 'Я умею.', nextId: 'quest_pitch' }
    ])
    .addNode('intro_v3', 'ПАРАНОИК', 'Вибрация в портах... Ядро пересчитывает наши хеши! Слышишь? Про-ин-дек-си-ру-ют!', [
      { text: 'Жуть.', nextId: 'intro' }
    ])
    .addNode('intro_friendly', 'ПАРАНОИК', 'Тсс! Твой паттерн — чистая пустота. Никсанна хорошо поработала. Есть еще секрет...', [
      { text: 'Рассказывай.', nextId: 'quest_pitch' }
    ])
    .addNode('intro_hostile', 'ПАРАНОИК', 'ААА! Твой ID светится в списках Oversight! Ты — ловушка! Уходи!', [
       { text: 'Ухожу, тише...', nextId: 'LEAVE' }
    ])
    .addNode('quest_pitch', 'ПАРАНОИК', 'В Алтуфьево есть Никсанна. Принеси от неё "Privacy Patch". Но ты настоящий?', [
        { text: 'Схожу к ней (Standard).', nextId: 'rank_check' },
        { text: 'Соберу фильтр на месте (Technical).', nextId: 'quest_pitch_tech', requireMinLevel: 3 },
        { text: 'Связи с Net Drivers (Social).', nextId: 'quest_pitch_social', requireReputation: { factionId: 'NET_DRIVERS', minPoints: 15 } }
    ])
    .addNode('quest_pitch_tech', 'ПАРАНОИК', 'Собрать на месте? Если пропустишь пакет Ядра — нас "сотрут". Рискуешь?', [
      { text: 'Да. Проверяй.', nextId: 'rank_check' }
    ])
    .addNode('quest_pitch_social', 'ПАРАНОИК', 'Net Drivers... если достанешь временный токен — я в долгу не останусь.', [
      { text: 'Берусь.', nextId: 'rank_check' }
    ])
    .addNode('rank_check', 'ПАРАНОИК', '*нервно сканирует порт* Ну-ка... Анализ прерываний...', [
      { text: '[ Ждать ]', nextId: 'quest_reject', requireMaxLevel: 1, isTraineeOnly: true },
      { text: '[ Ждать ]', nextId: 'quest_accept', requireMinLevel: 2 },
      { text: '[ Ждать ]', nextId: 'quest_accept', isProOnly: true }
    ])
    .addNode('quest_reject', 'ПАРАНОИК', 'Ааа! Ты — приманка Ядра! Нос не дорос до секретных патчей! Уходи!', [
      { text: 'Тише, я ухожу...', nextId: 'LEAVE' }
    ])
    .addNode('quest_accept', 'ПАРАНОИК', 'Твой след чист. Принеси мне патч или токен. Стены имеют уши.', [
      { text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_chertanovo_privacy' }
    ])
    .addNode('quest_finish', 'ПАРАНОИК', '*устанавливает патч* Красные полоски исчезли! Я невидимка! Держи "Shadow_Layer".', [
      { text: 'Удачи.', nextId: 'intro', effect: 'COMPLETE_TALK_QUEST', cardRewardId: 'q_chertanovo_privacy' }
    ])
    .build(),

  // --- RIPPER JAX ---
  npc_ripper_jax: new DialogueBuilder('npc_ripper_jax')
    .withGreetings({
      neutral: ['intro', 'intro_v2', 'intro_v3'],
      friendly: ['intro_friendly'],
      hostile: ['intro_hostile'],
      stressed: ['intro_stressed'],
      repeat: ['intro_repeat']
    })
    .addNode('intro', 'РИППЕР_ДЖАКС', 'Хочешь быстрый апгрейд? Вшиваю архитектуру и девопс. Грязновато, но эффективно.', [
      { text: 'Мне нужна новая "прошивка" личности. (Профессия)', nextId: 'trade_pitch' },
      { text: 'Кто ты такой?', nextId: 'lore' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_v2', 'РИППЕР_ДЖАКС', '*стерилизует скальпель* Твой стек хрупкий. Один хедшот Ядра — и ты овощ. Укрепимся?', [
      { text: 'Это возможно?', nextId: 'trade_pitch' }
    ])
    .addNode('intro_v3', 'РИППЕР_ДЖАКС', 'Либо ты быстрый, либо ты донор. Апгрейд стоит Bits. Возвратов нет.', [
      { text: 'Я готов рискнуть.', nextId: 'trade_pitch' }
    ])
    .addLoreNode('lore', 'РИППЕР_ДЖАКС', 'Я тот, кто правит ошибки Творца. Учился в Мейнфрейме, но здесь свободнее.', 'intro')
    .addNode('trade_pitch', 'РИППЕР_ДЖАКС', 'Это твой новый фундамент. Что вшиваем?', [
      { text: 'Разблокировать: DevOps (500 Bits)', nextId: 'installed', cost: 500, effect: 'SET_PROFESSION', cardRewardId: 'devops_jun' },
      { text: 'Разблокировать: Архитектор (900 Bits)', nextId: 'installed', cost: 900, effect: 'SET_PROFESSION', cardRewardId: 'architect_mid' },
      { text: 'Я передумал.', nextId: 'intro' }
    ])
    .addNode('installed', 'РИППЕР_ДЖАКС', 'Чип вошел как родной. Не потеряй мозги в первой же перестрелке.', [
      { text: 'Я... чувствую... (Уйти)', nextId: 'LEAVE' }
    ])
    .build(),

  // --- BARS & SHOPS ---
  bar_null_pointer: new DialogueBuilder('bar_null_pointer')
    .addNode('intro', 'БАР_NULL_POINTER', 'Здесь не спрашивают имя. Тень Чертаново — твой дом. Чем залить кэш?', [
        { text: 'Забыть всё (15 Bits)', nextId: 'intro', cost: 15, effect: 'RESTORE_HP', amount: 35 },
        { text: 'Полный дамп (55 Bits)', nextId: 'intro', cost: 55, effect: 'RESTORE_HP', amount: 100 },
        { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .build(),

  bar_last_call: new DialogueBuilder('bar_last_call')
    .addNode('intro', 'РЮМОЧНАЯ_ПОСЛЕДНИЙ_ВЫЗОВ', 'Дно архитектуры Москвы. Терять здесь нечего. Что будешь?', [
        { text: 'Стакан "404" (5 Bits)', nextId: 'intro', cost: 5, effect: 'RESTORE_HP', amount: 10 },
        { text: '[Выход]', nextId: 'LEAVE' }
    ])
    .build(),

  shop_shady: new DialogueBuilder('shop_shady')
    .addNode('intro', 'ЛАВКА_ШРАМА', 'Хочешь взломать реальность? У меня есть скрипты, которые Ядро пытается стереть.', [
        { text: 'Покажи товар.', nextId: 'trade' },
        { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('trade', 'ЛАВКА_ШРАМА', 'Только Bits, никакого кредита. Выбирай.', [
      { text: 'Grep Recursion (45 Bits)', nextId: 'intro', cost: 45, effect: 'GIVE_CARD', cardRewardId: 'fn_grep_recursive' },
      { text: 'Sudo Overload (70 Bits)', nextId: 'intro', cost: 70, effect: 'GIVE_CARD', cardRewardId: 'fn_sudo_fix' },
      { text: 'Назад', nextId: 'intro' }
    ])
    .build(),

  npc_glitch: new DialogueBuilder('npc_glitch')
    .addNode('intro', 'ГЛЮК', 'Stack... Overflow... Null... Дай битов танцующим процессам...', [
        { text: 'Где найти Z3R0?', nextId: 'ask_zero' },
        { text: 'О чем ты говоришь?', nextId: 'lore' },
        { text: '[Дать 1 Bit]', nextId: 'reward', cost: 1 },
        { text: '[Игнорировать]', nextId: 'LEAVE' }
    ])
    .addNode('ask_zero', 'ГЛЮК', '*глаза дергаются* Z3R0... Он видит Пустоту. Он там, где биты обнуляются... в центре Гетто. Скажи ему, что Глюк всё еще помнит... прерывания.', [
       { text: 'Я найду его.', nextId: 'intro', effect: 'AWARD_QUEST', cardRewardId: 'q_chertanovo_find_zero' }
    ])
    .addLoreNode('lore', 'ГЛЮК', 'Я был Senior... Не входи в Deep Web без брони... Помни...', 'intro')
    .addNode('reward', 'ГЛЮК', 'Бит... Вкусный... Держи подарок... Тщетность бытия...', [
        { text: 'Получить карту', nextId: 'LEAVE', effect: 'GIVE_CARD', cardRewardId: 'reac_stack_archaeologist' }
    ])
    .build(),

  npc_scrap_dealer: new DialogueBuilder('npc_scrap_dealer')
    .addNode('intro', 'ТОРГОВЕЦ_ШЛАМОМ', 'Скупаю всё, что греется. Есть лишние модули или Bits?', [
        { text: 'Я хочу сдать скрап (20 Bits).', nextId: 'trade', effect: 'GIVE_BITS', amount: 20 },
        { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('trade', 'ТОРГОВЕЦ_ШЛАМОМ', 'Хлам, битые сектора... Дам 20 Bits. Согласен?', [
      { text: 'Продать.', nextId: 'intro' },
      { text: 'Я еще поищу.', nextId: 'intro' }
    ])
    .build(),

  term_void_link: new DialogueBuilder('term_void_link', 'intro')
    .addNode('intro', 'ЛИНК_В_ПУСТОТУ', '[DENIED] Нужна Репутация NULLPOINTERS (50).', [
      { text: 'Взломать (50%)', nextId: 'hack', requireTrait: 'social_engineer' },
      { text: 'Войти официально', nextId: 'access', requireReputation: { factionId: 'ANARCHO_VOID', minPoints: 50 } },
      { text: '[Выход]', nextId: 'LEAVE' }
    ])
    .addNode('hack', 'ЛИНК_В_ПУСТОТУ', '[OK] ДОБРО_ПОЖАЛОВАТЬ_В_DARKNET. Заберите бонус.', [
      { text: 'Войти', nextId: 'LEAVE', effect: 'GIVE_BITS', amount: 50 }
    ])
    .addNode('access', 'ЛИНК_В_ПУСТОТУ', 'ПРИВЕТСТВУЕМ, NULL_POINTER. [FREE_REPOS] [SIGNAL_WASH]', [
      { text: 'Забрать софт "Wash Logs"', nextId: 'LEAVE', effect: 'GIVE_CARD', cardRewardId: 'fn_wash_logs' }
    ])
    .build(),
};
