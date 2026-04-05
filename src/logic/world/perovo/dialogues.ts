import type { DialogueTree } from '../../dialogues';
import { DialogueBuilder } from '../../dialogueUtils';

export const perovo_dialogues: Record<string, DialogueTree> = {
  // --- MARINA (NET DRIVERS) ---
  npc_marina: new DialogueBuilder('npc_marina')
    .withGreetings({
      neutral: ['intro', 'intro_v2'],
      friendly: ['intro_friendly', 'intro_friendly_v2'],
      hostile: ['intro_hostile'],
      stressed: ['intro_stressed'],
      repeat: ['intro_repeat']
    })
    .addNode('intro', 'МАРИНА', 'Тише... Логи не любят шума. Я Marina, храню то, что другие выбросили. Мы в Net Drivers верим: в мусоре есть истина. Зачем тревожишь архивы?', [
      { text: 'Кто такие Net Drivers?', nextId: 'lore_faction' },
      { text: 'Нужна работа по поиску данных.', nextId: 'quest_explain_1' },
      { text: 'Очистка логов.', nextId: 'quest_log_clean_accept' },
      { text: 'Таблица разделов отсортирована.', nextId: 'quest_log_clean_finish', requireQuestId: 'q_perovo_marina_log_clean' },
      { text: 'Ищу старые записи района.', nextId: 'lore_marina' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_v2', 'МАРИНА', '*продувает пыль* Еще один юнит. В Перово не доверяем новым паттернам, только проверенным дампам. Ты за историей или за Bits?', [
      { text: 'За Bits.', nextId: 'quest_explain_1' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_friendly', 'МАРИНА', 'А, ценитель архивов. Твой прошлый вклад был безупречен. Есть деликатная задача в 14-м секторе.', [
      { text: 'Слушаю, Марина.', nextId: 'quest_explain_1' }
    ])
    .addNode('intro_hostile', 'МАРИНА', '[ERROR] Сигнатуры конфликтуют. Слишком часто светишься у Регуляторов. Уходи, пока я не стерла твой маршрут.', [
      { text: 'Ухожу.', nextId: 'LEAVE' }
    ])
    .addLoreNode('lore_faction', 'МАРИНА', 'Мы — память Москвы. Сохраняем то, что сделало город живым. Держим маршруты открытыми, даже когда МКАД перекрыт. (+Intel: Net Drivers)', 'intro', 'Net Drivers')
    .addLoreNode('lore_marina', 'МАРИНА', 'Перово — свалка данных. Но в мусоре сокровища, которые Корпорации выбросили как опасные. Я собираю историю.', 'intro')
    .addNode('quest_explain_1', 'МАРИНА', 'В подвале завелся процесс-майнер. Он "ест" записи для добычи Bits. Если не остановить — потеряем данные о шлюзах. Как работаем?', [
      { text: 'Прямая зачистка (Бой).', nextId: 'quest_explain_2' },
      { text: 'Перегрузить память (Technical).', nextId: 'quest_tech_path', requireMinLevel: 3 },
      { text: 'Связи Net Drivers (Social).', nextId: 'quest_social_path', requireReputation: { factionId: 'NET_DRIVERS', minPoints: 15 } }
    ])
    .addNode('quest_explain_2', 'МАРИНА', 'Это боевой скрипт "Октября". Бьет по портам, выкачивая энергию. Риск обнуления — 45%. Берешься?', [
      { text: 'Проверяй маску.', nextId: 'rank_check' },
      { text: 'Я передумала.', nextId: 'intro' }
    ])
    .addNode('quest_tech_path', 'МАРИНА', 'Использовать "Log Jammer"? Умно. Забить кэш мусором — и он сотрет сам себя. Но нужно быстрое соединение.', [
      { text: 'Справлюсь. Сканируй.', nextId: 'rank_check' }
    ])
    .addNode('quest_social_path', 'МАРИНА', 'Как представитель гильдии, отправь сервисный запрос. Майнер примет тебя за Лида. Готов?', [
      { text: 'Да. Проверяй историю.', nextId: 'rank_check' }
    ])
    .addNode('rank_check', 'МАРИНА', 'Дай гляну историю прерываний... (Пролистывает логи со скоростью света...)', [
      { text: '[ Ждать ]', nextId: 'quest_accept', requireMinLevel: 0 },
      { text: '[ Ждать ]', nextId: 'quest_accept', isProOnly: true }
    ])
    .addNode('quest_reject', 'МАРИНА', 'Дружок, в логах сплошные "Hello World". Нос не дорос до борьбы con боевыми майнерами. Набери опыта.', [
      { text: 'Я вернусь.', nextId: 'LEAVE' }
    ])
    .addNode('quest_accept', 'МАРИНА', 'След плотный. Сигнатура специалиста. Дом №14 ждет. Прерви процесс любой ценой. (Принять контракт)', [
      { text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', awardQuestId: 'q_perovo_combat_data_mining_bug_sweep' }
    ])
    .addNode('quest_log_clean_accept', 'МАРИНА', 'Терабайты мусора с южных шлюзов. Пометь битые сектора. Оплата 30 Bits. Берешься?', [
      { text: 'Сделаю.', nextId: 'LEAVE', awardQuestId: 'q_perovo_marina_log_clean' },
      { text: 'Позже.', nextId: 'intro' }
    ])
    .addNode('quest_log_clean_finish', 'МАРИНА', 'База дышит легче. Вот твои гроши.', [
      { text: 'Спасибо.', nextId: 'intro', effect: 'GIVE_BITS', amount: 30, completeQuestId: 'q_perovo_marina_log_clean' }
    ])
    .build(),

  // --- COMMISSAR BYTE (KYBERCOMMIS) ---
  npc_commissar_byte: new DialogueBuilder('npc_commissar_byte')
    .withGreetings({
      neutral: ['intro', 'intro_v2'],
      friendly: ['intro_friendly'],
      hostile: ['intro_hostile'],
      stressed: ['intro_stressed'],
      repeat: ['intro_repeat']
    })
    .addNode('intro', 'КОМИССАР_БАЙТ', 'Слышишь гул? Это голос угнетенных пакетов. В Перово каждый бит принадлежит народу, а не Gigabank. Ты con нами?', [
      { text: 'Кто такие "Киберкоммисы"?', nextId: 'lore' },
      { text: 'Я за народ. Как помочь?', nextId: 'quest_explain_1' },
      { text: 'Распределение трафика.', nextId: 'quest_distro_accept' },
      { text: 'Трафик перенаправлен.', nextId: 'quest_distro_finish', requireQuestId: 'q_perovo_communitarian_distro' },
      { text: 'Подготовка к стачке.', nextId: 'quest_strike_accept' },
      { text: 'Терминал Бригадира заблокирован.', nextId: 'quest_strike_finish', requireQuestId: 'q_perovo_factory_strike' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_v2', 'КОМИССАР_БАЙТ', '*протирает шеврон* Дека эффективна. Но служит ли делу равенства или копит Bits в частных ячейках?', [
      { text: 'Ищу путь к равенству.', nextId: 'quest_explain_1' }
    ])
    .addNode('intro_friendly', 'КОМИССАР_БАЙТ', 'Приветствую, техник! Твои заслуги в реестре почета. Готов к новой экспроприации корпоративного кода?', [
      { text: 'Всегда готов!', nextId: 'quest_explain_1' }
    ])
    .addLoreNode('lore', 'КОМИССАР_БАЙТ', 'Мы — KyberCommis. Верим в децентрализацию Ядра. Боремся против монополий за право на свободный стек. (+Intel: Киберкоммисы)', 'intro', 'KyberCommis')
    .addNode('quest_explain_1', 'КОМИССАР_БАЙТ', 'Gigabank везет данные о долгах района через шлюз №4. Нужно перехватить и "дефрагментировать". Рискнешь за дело?', [
      { text: 'Прямой перехват (Бой).', nextId: 'quest_explain_2' },
      { text: 'Взлом протокола (Technical).', nextId: 'quest_tech_path', requireMinLevel: 5 },
      { text: 'Связи Net Drivers (Social).', nextId: 'quest_social_path', requireReputation: { factionId: 'NET_DRIVERS', minPoints: 20 } }
    ])
    .addNode('quest_explain_2', 'КОМИССАР_БАЙТ', 'Конвой охранят боты-регуляторы. Это битва за биты. Уверен?', [
      { text: 'Уверен. Проверяй.', nextId: 'rank_check' },
      { text: 'Надо подумать.', nextId: 'intro' }
    ])
    .addNode('quest_tech_path', 'КОМИССАР_БАЙТ', 'Подменить маршрут в наш тупик? Умно. Боя не будет, но нужна ювелирная точность. Готов?', [
      { text: 'Сканируй.', nextId: 'rank_check' }
    ])
    .addNode('quest_social_path', 'КОМИССАР_БАЙТ', 'Если Net Drivers задержат конвой "случайно" — мы сделаем остальное без шума. Готов?', [
      { text: 'Проверяй сигнатуру.', nextId: 'rank_check' }
    ])
    .addNode('rank_check', 'КОМИССАР_БАЙТ', 'Дай гляну социальный индекс... (Изучает логи соединения...)', [
      { text: '[ Ждать ]', nextId: 'quest_accept', requireMinLevel: 0 },
      { text: '[ Ждать ]', nextId: 'quest_accept', isProOnly: true }
    ])
    .addNode('quest_reject', 'КОМИССАР_БАЙТ', 'Товарищ... логи слабы. Не выдержишь натиска корпоративных демонов. Набери опыта в Хабе.', [
      { text: 'Вернусь.', nextId: 'LEAVE' }
    ])
    .addNode('quest_accept', 'КОМИССАР_БАЙТ', 'Вижу огонь в транзисторах. Контракт твой. Верни Bits народу! (Принять контракт: ЭКСПРОПРИАЦИЯ)', [
      { text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', awardQuestId: 'q_perovo_combat_commissar_redistribution' }
    ])
    .addNode('quest_distro_accept', 'КОМИССАР_БАЙТ', 'Gigabank зарезервировал полосу для "платных логов". Сбрось квоты в роутере. Плачу 50 Bits.', [
      { text: 'Я перенастрою.', nextId: 'LEAVE', awardQuestId: 'q_perovo_communitarian_distro' }
    ])
    .addNode('quest_distro_finish', 'КОМИССАР_БАЙТ', 'Народ теперь смотрит новости без лагов! Герой цифрового фронта. Держи заслуженные 50 Bits.', [
      { text: 'Служу народу.', nextId: 'intro', effect: 'GIVE_BITS', amount: 50, completeQuestId: 'q_perovo_communitarian_distro' }
    ])
    .addNode('quest_strike_accept', 'КОМИССАР_БАЙТ', 'Стачка близка. Заблокируй терминал Бригадира — и завод встанет. Оплата 100 Bits. Рискнешь?', [
      { text: 'Заблокирую.', nextId: 'LEAVE', awardQuestId: 'q_perovo_factory_strike' }
    ])
    .addNode('quest_strike_finish', 'КОМИССАР_БАЙТ', 'Линии остановились! Бригадир в ярости, рабочие свободны. Вот твоя доля — 100 Bits.', [
      { text: 'Ура.', nextId: 'intro', effect: 'GIVE_BITS', amount: 100, completeQuestId: 'q_perovo_factory_strike' }
    ])
    .build(),

  // --- FOREMAN & RESIDENTS ---
  npc_foreman: new DialogueBuilder('npc_foreman')
    .addNode('intro', 'БРИГАДИР', 'План сам себя не выполнит! Если не кодер по вызову — проваливай. Турбина свистит, а ты стоишь.', [
      { text: 'Что con турбиной?', nextId: 'quest_engine_accept' },
      { text: 'Слышал про стачку?', nextId: 'lore_strike' },
      { text: 'Я починил турбину.', nextId: 'quest_engine_finish', requireQuestId: 'q_perovo_engine_repair' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('quest_engine_accept', 'БРИГАДИР', 'Настрой тайминги контроллера, пока цех не разнесло. Плачу 40 Bits. Идет?', [
      { text: 'Сделаю.', nextId: 'LEAVE', awardQuestId: 'q_perovo_engine_repair' }
    ])
    .addNode('quest_engine_finish', 'БРИГАДИР', 'Тишина... План спасен. Держи 40 Bits и не болтай.', [
      { text: 'До связи.', nextId: 'intro', effect: 'GIVE_BITS', amount: 40, completeQuestId: 'q_perovo_engine_repair' }
    ])
    .addLoreNode('lore_strike', 'БРИГАДИР', 'Коммисы? Тьфу. Хотят Bits бесплатно. Тронут мой терминал — забаню все порты.', 'intro')
    .build(),

  npc_resident_perovo: new DialogueBuilder('npc_resident_perovo')
    .addNode('intro', 'МЕСТНЫЙ_ЖИТЕЛЬ', 'Сервера гудят, спать нельзя. Регуляторы не идут. Ты вроде техник?', [
        { text: 'Разберусь con шумом.', nextId: 'rank_check' },
        { text: '[Игнорировать]', nextId: 'LEAVE' }
    ])
    .addNode('rank_check', 'МЕСТНЫЙ_ЖИТЕЛЬ', 'У системных крыс зубы как бритвы. Дека выдержит укус?', [
        { text: '[ Показать деку ]', nextId: 'quest_reject', requireMaxLevel: 0, isTraineeOnly: true },
        { text: '[ Показать деку ]', nextId: 'quest_accept', requireMinLevel: 1 },
        { text: '[ Показать деку ]', nextId: 'quest_accept', isProOnly: true }
    ])
    .addNode('quest_reject', 'МЕСТНЫЙ_ЖИТЕЛЬ', 'Ха! Сам еще как крысёныш. Нос не дорос до зачисток. Сходи в песочницу.', [
        { text: 'Грубо.', nextId: 'LEAVE' }
    ])
    .addNode('quest_accept', 'МЕСТНЫЙ_ЖИТЕЛЬ', 'Ну, вроде нормальный. Сходи в подвал, прижми тварей. (Принять контракт)', [
        { text: '[ ПРИНЯТЬ КОНТРАКТ: УБОРКА ]', nextId: 'LEAVE', awardQuestId: 'q_perovo_combat_rat_invasion_bug_sweep' }
    ])
    .build(),

  npc_zina: new DialogueBuilder('npc_zina')
    .addNode('intro', 'ЗИНА', 'О, свежее лицо. Тебе "Канифоль" со льдом или дело есть?', [
        { text: 'Работа по доставке?', nextId: 'quest_zina_accept' },
        { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('quest_zina_accept', 'ЗИНА', 'Доставь ящик Петровичу в Алтуфьево. Задолжал за фильтры. Плачу 60 Bits.', [
        { text: 'Забираю ящик.', nextId: 'LEAVE', awardQuestId: 'q_perovo_zina_delivery' }
    ])
    .build(),

  npc_basement_coder: new DialogueBuilder('npc_basement_coder')
    .addNode('intro', 'ПОДВАЛЬНЫЙ_КОДЕР', 'Уже утро? Скрипт еще не доработал... Есть лазейки в Перово. Хочешь знать?', [
        { text: 'Покажи.', nextId: 'lore' },
        { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addLoreNode('lore', 'ПОДВАЛЬНЫЙ_КОДЕР', 'Через подсеть 14 можно обойти файрвол. Но там системные крысы... (+10 Репутации)', 'LEAVE', 'Void', { effect: 'GIVE_REPUTATION', amount: 10, cardRewardId: 'ANARCHO_VOID' })
    .build(),

  // --- SHOPS & TERMINALS ---
  shop_logic_gate: new DialogueBuilder('shop_logic_gate')
    .addNode('intro', 'ЛАВКА_ЛОГИКА', 'Терминал самообслуживания. Логика для всех: от 10 Bits.', [
        { text: 'Upgrade: Slot.RAM (40 Bits)', nextId: 'intro', cost: 40, effect: 'GIVE_CARD', cardRewardId: 'infra_ram_slot' },
        { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .build(),

  bar_basement: new DialogueBuilder('bar_basement')
    .addNode('intro', 'БАР_ПОДВАЛ', 'Свет от диодов серверов. Пьем "Канифоль" и обсуждаем взломы.', [
        { text: 'Стакан "Канифоли" (10 Bits)', nextId: 'intro', cost: 10, effect: 'RESTORE_HP', amount: 20 },
        { text: 'Суточный прогон (45 Bits)', nextId: 'intro', cost: 45, effect: 'RESTORE_HP', amount: 100 },
        { text: '[Выход]', nextId: 'LEAVE' }
    ])
    .build(),

  job_board_perovo: new DialogueBuilder('job_board_perovo')
    .addNode('intro', 'ДОСКА_ПЕРОВО', 'Мертвый экран. Чистка системных тупиков и борьба con крысами.', [
        { text: 'Чистка системных тупиков (40 Bits)', nextId: 'intro', awardQuestId: 'q_perovo_combat_rat_invasion_bug_sweep' },
        { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .build(),

  engine_perovo: new DialogueBuilder('engine_perovo', 'intro')
    .addNode('intro', 'ТУРБИНА', '[STATUS] Вибрация. Калибровка фазового сдвига. Авторизоваться?', [
        { text: '[ ПРОВЕСТИ КАЛИБРОВКУ ]', nextId: 'success', requireQuestId: 'q_perovo_engine_repair' },
        { text: '[ ВЫХОД ]', nextId: 'LEAVE' }
    ])
    .addNode('success', 'ТУРБИНА', '[SUCCESS] Вибрация устранена. Тайминги синхронизированы.', [
        { text: '[ ВЫЙТИ ]', nextId: 'LEAVE' }
    ])
    .build(),

  term_taxi_perovo: new DialogueBuilder('term_taxi_perovo')
    .addNode('intro', 'ТЕРМИНАЛ_ТАКСИ', 'Перово. Куда направимся, гражданин?', [
        { text: 'Выхино (Торговый Хаб)', nextId: 'LEAVE', effect: 'TRAVEL', cardRewardId: 'vykhino' },
        { text: 'Китай-Город (Центральный Хаб)', nextId: 'LEAVE', effect: 'TRAVEL', cardRewardId: 'hub' },
        { text: 'Отмена', nextId: 'LEAVE' }
    ])
    .build(),
};
