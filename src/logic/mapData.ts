export type CombatPack = 'java_core' | 'java_spring';

export type SubNodeType = 'npc' | 'shop' | 'terminal' | 'combat' | 'bar';

export interface DistrictSubNode {
  id: string;
  name: string;
  type: SubNodeType;
  description: string;
  x: number; // 0-100 local to district
  y: number; // 0-100 local to district
}

export interface MapNodeData {
  id: string;
  name: string;
  description: string;
  x: number; 
  y: number; 
  stability: number; 
  type: 'combat' | 'trade' | 'story' | 'hub' | 'bar';
  tier: number; // 1-5 Difficulty
  combatPack?: CombatPack;
  subNodes?: DistrictSubNode[];
  isUnlocked?: boolean;
}

export const MAP_NODES: MapNodeData[] = [
  { 
    id: 'altufyevo', 
    name: 'АЛТУФЬЕВО: NORTH_SILOS', 
    description: 'Северные промышленные силосы. Место сбора старого железа и остатков серверов.', 
    x: 52, y: 10, stability: 100, type: 'hub', tier: 1,
    subNodes: [
      { id: 'npc_petrovich', name: 'Петрович (Техник)', type: 'npc', description: 'Старый мастер по железу.', x: 10, y: 40 },
      { id: 'shop_scrap', name: 'Свалка деталей', type: 'shop', description: 'Рынок дешевых карт.', x: 40, y: 60 },
      { id: 'npc_varvar', name: 'ВАРВАР (Хакер-отшельник)', type: 'npc', description: 'Тяжело кибернезированный параноик. Мастер старого железа и низкоуровневого кода.', x: 80, y: 20 },
      { id: 'npc_nixanna', name: 'НИКСАННА (Геймдизайнер)', type: 'npc', description: 'Эксперт по игровому балансу Реальности. Видит мир как кривую бету.', x: 75, y: 30 },
      { id: 'combat_nixanna_ritual', name: 'Патч Визуализации', type: 'combat', description: 'Сложный узел рендеринга. Нужно подправить баланс и исправить баги сцены.', x: 70, y: 35 },
      { id: 'combat_magnus_toilet', name: 'Умная уборная №4', type: 'combat', description: 'Здесь заперся кот Магнус. Система защиты сошла с ума.', x: 85, y: 25 },
      { id: 'job_board_alt', name: 'Доска Объявлений', type: 'npc', description: 'Срочные контракты за Bits.', x: 20, y: 20 },
      { id: 'term_taxi_alt', name: 'Терминал Такси', type: 'terminal', description: 'Разблокировка города.', x: 50, y: 80 }
    ]
  },
  { 
    id: 'vykhino', 
    name: 'ВЫХИНО: TRADE_BRANCH', 
    description: 'Торговый хаб с бешеным трафиком. Центр незаконного обмена данными.', 
    x: 75, y: 70, stability: 85, type: 'trade', tier: 1,
    subNodes: [
      { id: 'npc_grey', name: 'Грей (Гоп-хакер)', type: 'npc', description: 'Знает все лазейки метро.', x: 40, y: 50 },
      { id: 'shop_metro', name: 'Радио-палатка', type: 'shop', description: 'Боевой софт.', x: 40, y: 30 },
      { id: 'npc_job_boss', name: 'Фиксер "Батя"', type: 'npc', description: 'Дает грязную работу за битсы.', x: 60, y: 20 },
      { id: 'term_taxi_unlock', name: 'Инфо-киоск Такси', type: 'terminal', description: 'Разблокировка города.', x: 80, y: 80 }
    ]
  },
  { 
    id: 'maryino', 
    name: 'МАРЬИНО: GRID_EXHAUST', 
    description: 'Гигантский жилой массив на юго-востоке. Перенаселенный, но богатый на дешевое железо.', 
    x: 80, y: 85, stability: 100, type: 'trade', tier: 1,
    subNodes: [
      { id: 'npc_tanya', name: 'Тетя Таня (QA)', type: 'npc', description: 'Бывший тестировщик из "старой" Москвы.', x: 20, y: 30 },
      { id: 'combat_local_lan', name: 'Местная локалка', type: 'combat', description: 'Проверка периметра.', x: 50, y: 70 },
      { id: 'job_delivery', name: 'Доставка данных', type: 'combat', description: 'Простая работа за 30 Bits.', x: 80, y: 20 },
      { id: 'term_taxi_maryino', name: 'Станция Такси', type: 'terminal', description: 'Выход в город.', x: 50, y: 90 }
    ]
  },
  { 
    id: 'chertanovo', 
    name: 'ЧЕРТАНОВО: GLITCH_GHETTO', 
    description: 'Мрачная жилая зона. Дом для многих радикальных фрилансеров (Null Pointers).', 
    x: 52, y: 80, stability: 40, type: 'bar', tier: 2,
    subNodes: [
      { id: 'npc_zero', name: 'Z3R0 (Анархист)', type: 'npc', description: 'Лидер Нулевых Указателей.', x: 50, y: 50 },
      { id: 'bar_null_pointer', name: 'Бар "Null Pointer"', type: 'bar', description: 'Где рождаются баги.', x: 30, y: 70 },
      { id: 'npc_ripper_jax', name: 'Риппердок Джакс', type: 'npc', description: 'Устанавливает импланты знаний задорого.', x: 70, y: 20 }
    ]
  },
  { 
    id: 'south_west', 
    name: 'ЮГО-ЗАПАДНАЯ: ACADEMIC_UPLINK', 
    description: 'Район институтов и наукоградов. Здесь витает дух старой академии и нелегальных серверов.', 
    x: 15, y: 65, stability: 95, type: 'hub', tier: 1,
    subNodes: [
        { id: 'npc_professor', name: 'Профессор Архипов', type: 'npc', description: 'Преподает фундаментальную Java.', x: 30, y: 20 },
        { id: 'uni_moscow', name: 'Университет Юго-Запада', type: 'shop', description: 'Легальное обучение (Cards).', x: 50, y: 40 },
        { id: 'term_library', name: 'Библиотека Кода', type: 'terminal', description: 'Доступ к архивам Java.', x: 70, y: 70 }
    ]
  },
  { 
    id: 'teply_stan', 
    name: 'ТЕПЛЫЙ СТАН: FOREST_EDGE', 
    description: 'Окраина Москвы, где город встречается с одичавшим лесом. Идеальное место для скрытых баз.', 
    x: 20, y: 90, stability: 88, type: 'combat', tier: 1,
    subNodes: [
        { id: 'npc_ranger', name: 'Егерь (SRE-патруль)', type: 'npc', description: 'Следит за стабильностью региона.', x: 50, y: 30 },
        { id: 'shop_forest', name: 'Лесная лавка', type: 'shop', description: 'Уникальные модули.', x: 20, y: 60 },
        { id: 'combat_forest_hunt', name: 'Охота на Баг-Тварей', type: 'combat', description: 'Очистка леса за награду.', x: 80, y: 40 }
    ]
  },
  { 
    id: 'izmailovo', 
    name: 'ИЗМАЙЛОВО: CRAFT_MARKET', 
    description: 'Культурный и торговый центр. Здесь делают лучшие кастомные импланты и деки.', 
    x: 90, y: 30, stability: 92, type: 'trade', tier: 1,
    subNodes: [
        { id: 'npc_master', name: 'Мастер Верстак', type: 'npc', description: 'Соберет что угодно из мусора.', x: 40, y: 40 },
        { id: 'job_craft_scrap', name: 'Сбор деталей', type: 'combat', description: 'Сбор лома за 45 Bits.', x: 80, y: 30 },
        { id: 'term_taxi_izmailovo', name: 'Такси: Измайлово', type: 'terminal', description: 'Выход в город.', x: 50, y: 90 },
        { id: 'bar_craft', name: 'Трактир "У Кода"', type: 'bar', description: 'Место встречи умельцев.', x: 70, y: 60 }
    ]
  },
  {
    id: 'bibirevo',
    name: 'БИБИРЕВО: NORTH_LINK',
    description: 'Северный жилой массив. Сплетение старых линий связи и новых оптоволоконных жил.',
    x: 45, y: 5, stability: 90, type: 'hub', tier: 1,
    subNodes: [
      { id: 'npc_signalman', name: 'Связист Моня', type: 'npc', description: 'Ремонтирует обрывы нейросети.', x: 20, y: 30 },
      { id: 'shop_north_link', name: 'Узел: Северный Поток', type: 'shop', description: 'Компоненты связи.', x: 50, y: 50 },
      { id: 'job_board_bibi', name: 'Инфо-панель: Бибирево', type: 'npc', description: 'Мелкие подработки.', x: 40, y: 70 },
      { id: 'term_taxi_bibi', name: 'Такси: Бибирево', type: 'terminal', description: 'Вылет в центр.', x: 80, y: 85 }
    ]
  },
  {
    id: 'tekstilschiki',
    name: 'ТЕКСТИЛЬЩИКИ: TEXTILE_GRID',
    description: 'Старая промзона. Здесь "ткали" первые нейросети для госструктур.',
    x: 75, y: 60, stability: 85, type: 'combat', tier: 1,
    subNodes: [
      { id: 'npc_vlad', name: 'Влад-Ткач', type: 'npc', description: 'Мастер защитных плетений.', x: 30, y: 20 },
      { id: 'combat_textile_raid', name: 'Рейд на Промзону', type: 'combat', description: 'Зачистка от ботов-ревизоров.', x: 70, y: 50 },
      { id: 'job_board_tekstil', name: 'Узел: Текстильщики', type: 'npc', description: 'Контракты на чистку.', x: 50, y: 70 },
      { id: 'term_taxi_tekstil', name: 'Такси: Текстильщики', type: 'terminal', description: 'Выход на МКАД.', x: 80, y: 30 }
    ]
  },
  {
    id: 'perovo',
    name: 'ПЕРОВО: DATA_SLUMS',
    description: 'Тихий район, оккупированный нелегальными дата-центрами в подвалах панелек.',
    x: 85, y: 45, stability: 92, type: 'trade', tier: 1,
    subNodes: [
      { id: 'npc_marina', name: 'Марина (Архивариус)', type: 'npc', description: 'Хранительница забытых логов.', x: 25, y: 40 },
      { id: 'combat_data_mining', name: 'Дата-майнинг подвала', type: 'combat', description: 'Добыча зашифрованных Bits.', x: 65, y: 60 },
      { id: 'job_board_perovo', name: 'Столб объявлений: Перово', type: 'npc', description: 'Поиск серверов.', x: 50, y: 20 },
      { id: 'term_taxi_perovo', name: 'Такси: Перово', type: 'terminal', description: 'Связь с центром.', x: 85, y: 85 }
    ]
  },
  { 
    id: 'sokol', 
    name: 'СОКОЛ: TECH_HUB', 
    description: 'Центр авиационных и космических исследований. Место сосредоточения старой технической элиты.', 
    x: 30, y: 15, stability: 90, type: 'combat', tier: 3, combatPack: 'java_core',
    subNodes: [
      { id: 'npc_dean', name: 'Декан Техникума', type: 'npc', description: 'Выдает дипломы и базовые знания.', x: 40, y: 40 },
      { id: 'college_tech', name: 'Колледж Информатики', type: 'shop', description: 'Прикладное обучение.', x: 20, y: 60 },
      { id: 'term_blueprint', name: 'Архив чертежей', type: 'terminal', description: 'Данные об архитектуре.', x: 70, y: 20 }
    ]
  },
  { 
    id: 'vdnkh', 
    name: 'ВДНХ: PAVILION_ZERO', 
    description: 'Синтетические нейро-напитки и сборище легендарных хакеров в тени заброшенных павильонов.', 
    x: 52, y: 30, stability: 80, type: 'bar', tier: 3,
    subNodes: [
      { id: 'npc_besm', name: 'Генерал БЭСМ', type: 'npc', description: 'Цифровой призрак прошлого.', x: 10, y: 30 },
      { id: 'shop_vintage', name: 'Лавка "Ретро-Тех"', type: 'shop', description: 'Редкое Legacy.', x: 40, y: 60 },
      { id: 'bar_vostok', name: 'Бар "Восток-1"', type: 'bar', description: 'Напитки для космонавтов данных.', x: 80, y: 20 },
      { id: 'combat_pavilions', name: 'Зачистка Павильонов', type: 'combat', description: 'Бой с системными багами.', x: 60, y: 40 }
    ]
  },
  { 
    id: 'sokolniki', 
    name: 'СОКОЛЬНИКИ: SERVER_FOREST', 
    description: 'Бывший парк, превращенный в серверный лабиринт. Пристанище старых кодеров.', 
    x: 70, y: 20, stability: 65, type: 'bar', tier: 4,
    subNodes: [
      { id: 'npc_hermit', name: 'Отшельник Сокольников', type: 'npc', description: 'Живет в глубине темного оптоволокна.', x: 20, y: 50 },
      { id: 'combat_deep_tree', name: 'Глубинное Дерево', type: 'combat', description: 'Скрытый узел с опасным кодом.', x: 80, y: 40 },
      { id: 'bar_deep_root', name: 'Бар "Корень"', type: 'bar', description: 'Глубокое погружение.', x: 50, y: 80 }
    ]
  },
  { 
    id: 'fili', 
    name: 'ФИЛИ: SPACE_RUINS', 
    description: 'Заброшенные заводы космической промышленности, превращенные в нелегальные серверные фермы.', 
    x: 20, y: 45, stability: 75, type: 'combat', tier: 4, combatPack: 'java_spring',
    subNodes: [
      { id: 'npc_kosmos', name: 'Космос (SRE Nomad)', type: 'npc', description: 'Ищет запчасти для ракет.', x: 30, y: 40 },
      { id: 'shop_spacer', name: 'Запчасти "Буран"', type: 'shop', description: 'Высокотехнологичный лом.', x: 60, y: 70 },
      { id: 'term_launch_pad', name: 'Пусковая стойка', type: 'terminal', description: 'Древние протоколы запуска.', x: 80, y: 20 }
    ]
  },
  { 
    id: 'taganka', 
    name: 'ТАГАНСКАЯ: THE_BUNKER', 
    description: 'Древний узел связи, уходящий глубоко под землю. Идеальное место для скрытных операций.', 
    x: 60, y: 65, stability: 95, type: 'hub', tier: 5,
    subNodes: [
      { id: 'npc_auditor', name: 'Инквизитор (Дознаватель)', type: 'npc', description: 'Аудитор Ядра.', x: 30, y: 30 },
      { id: 'npc_informant', name: 'Информатор М.', type: 'npc', description: 'Продает тайны бункера.', x: 70, y: 50 },
      { id: 'term_deep_vault', name: 'Глубинное хранилище', type: 'terminal', description: 'Зашифрованные логи Октября.', x: 50, y: 85 }
    ]
  },
  { 
    id: 'mitino', 
    name: 'МИТИНО: RADIO_HEAVEN', 
    description: 'Легендарный радиорынок. Здесь можно найти любой протокол, если знать, у кого спрашивать.', 
    x: 20, y: 10, stability: 85, type: 'trade', tier: 5, combatPack: 'java_spring',
    subNodes: [
      { id: 'npc_mentor', name: 'Ментор курсов', type: 'npc', description: 'Мастер современных фреймворков.', x: 50, y: 20 },
      { id: 'courses_kotlin', name: 'Курсы "JetBrain-Zero"', type: 'shop', description: 'Быстрое обучение Kotlin.', x: 30, y: 40 },
      { id: 'shop_advanced', name: 'Бутик "Spring Boot"', type: 'shop', description: 'Топ-левел модули.', x: 85, y: 75 }
    ]
  }
];
