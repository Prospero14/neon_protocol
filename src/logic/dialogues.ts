

export interface DialogueOption {
  text: string;
  nextId: string | 'LEAVE';
  cost?: number; // Cost in bits
  requireTrait?: string; 
  effect?: 'GIVE_CARD' | 'GIVE_TRAIT' | 'RESTORE_HP' | 'GIVE_BITS' | 'UNLOCK_CITY' | 'SET_PROFESSION' | 'START_COMBAT' | 'GIVE_XP';
  cardRewardId?: string;
  amount?: number; // For HP/Bits restore
}

export interface DialogueNode {
  id: string;
  speaker: string; 
  text: string;
  options: DialogueOption[];
}

export interface DialogueTree {
  id: string;
  startNodeId: string;
  nodes: Record<string, DialogueNode>;
}

export const DIALOGUE_TREES: Record<string, DialogueTree> = {
  // --- TAXI TERMINALS ---
  term_taxi_alt: {
    id: 'term_taxi_alt',
    startNodeId: 'intro',
    nodes: {
      intro: {
        id: 'intro',
        speaker: 'ТЕРМИНАЛ_ТАКСИ',
        text: 'Служба такси Алтуфьево. Система заблокирована. Требуется 100 Bits для доступа к GPS-сетке города.',
        options: [
          { text: 'Разблокировать карту (100 Bits)', nextId: 'unlocked', cost: 100 },
          { text: '[Выход]', nextId: 'LEAVE' }
        ]
      },
      unlocked: {
        id: 'unlocked',
        speaker: 'ТЕРМИНАЛ_ТАКСИ',
        text: 'Доступ разрешен. Глобальная навигация активна. Удачного полета над Реактором.',
        options: [{ text: 'В ПУТЬ', nextId: 'LEAVE', effect: 'UNLOCK_CITY' }]
      }
    }
  },
  term_taxi_bibi: {
    id: 'term_taxi_bibi', startNodeId: 's',
    nodes: { s: { id: 's', speaker: 'ТЕРМИНАЛ_ТАКСИ', text: 'СИСТЕМА_ТАКСИ: Узел Бибирево. Глобальная навигация требует подписки (100 Bits).', options: [
      { text: 'Купить подписку [РАЗБЛОКИРОВАТЬ МОСКВУ]', nextId: 'LEAVE', effect: 'UNLOCK_CITY', cost: 100 },
      { text: 'Отмена', nextId: 'LEAVE' }
    ] } }
  },
  term_taxi_tekstil: {
    id: 'term_taxi_tekstil', startNodeId: 's',
    nodes: { s: { id: 's', speaker: 'ТЕРМИНАЛ_ТАКСИ', text: 'СИСТЕМА_ТАКСИ: Промзона Текстильщики. Доступ к внешним узлам закрыт протоколом ICE.', options: [
      { text: 'Взломать протокол (100 Bits) [РАЗБЛОКИРОВАТЬ МОСКВУ]', nextId: 'LEAVE', effect: 'UNLOCK_CITY', cost: 100 },
      { text: 'Отмена', nextId: 'LEAVE' }
    ] } }
  },
  term_taxi_perovo: {
    id: 'term_taxi_perovo', startNodeId: 's',
    nodes: { s: { id: 's', speaker: 'ТЕРМИНАЛ_ТАКСИ', text: 'СИСТЕМА_ТАКСИ: Сектор Перово. Синхронизация с центром возможна через терминал.', options: [
      { text: 'Синхронизировать (100 Bits) [РАЗБЛОКИРОВАТЬ МОСКВУ]', nextId: 'LEAVE', effect: 'UNLOCK_CITY', cost: 100 },
      { text: 'Отмена', nextId: 'LEAVE' }
    ] } }
  },
  term_taxi_maryino: {
    id: 'term_taxi_maryino', startNodeId: 's',
    nodes: { s: { id: 's', speaker: 'ТЕРМИНАЛ_ТАКСИ', text: 'СИСТЕМА_ТАКСИ: Марьинский узел. Трафик перегружен. Требуется приоритетный пропуск.', options: [
      { text: 'Купить пропуск (100 Bits) [РАЗБЛОКИРОВАТЬ МОСКВУ]', nextId: 'LEAVE', effect: 'UNLOCK_CITY', cost: 100 },
      { text: 'Отмена', nextId: 'LEAVE' }
    ] } }
  },
  term_taxi_izmailovo: {
    id: 'term_taxi_izmailovo', startNodeId: 's',
    nodes: { s: { id: 's', speaker: 'ТЕРМИНАЛ_ТАКСИ', text: 'СИСТЕМА_ТАКСИ: Измайловский рынок. Такси доступны для авторизованных курьеров.', options: [
      { text: 'Авторизоваться (100 Bits) [РАЗБЛОКИРОВАТЬ МОСКВУ]', nextId: 'LEAVE', effect: 'UNLOCK_CITY', cost: 100 },
      { text: 'Отмена', nextId: 'LEAVE' }
    ] } }
  },
  term_taxi_unlock: {
    id: 'term_taxi_unlock', startNodeId: 's',
    nodes: { s: { id: 's', speaker: 'ТЕРМИНАЛ_ТАКСИ', text: 'СИСТЕМА_ТАКСИ: Глобальный терминал Выхино. Желаете покинуть сектор?', options: [
      { text: 'Проломить шлюз (100 Bits) [РАЗБЛОКИРОВАТЬ МОСКВУ]', nextId: 'LEAVE', effect: 'UNLOCK_CITY', cost: 100 },
      { text: 'Отмена', nextId: 'LEAVE' }
    ] } }
  },

  // --- KITAY-GOROD ---
  kitay_gorod: {
    id: 'kitay_gorod',
    startNodeId: 'intro',
    nodes: {
      intro: {
        id: 'intro',
        speaker: 'MENU',
        text: 'Вы в баре "The Socket". В воздухе пахнет озоном и плохим кофе. Здесь собираются те, кто еще не потерял рассудок.',
        options: [
          { text: 'Spider (Фиксер)', nextId: 'spider_intro' },
          { text: 'Mira (Нетраннер)', nextId: 'mira_intro' },
          { text: 'Бармен (Заправиться)', nextId: 'bar_hub' },
          { text: '[Уйти]', nextId: 'LEAVE' }
        ]
      },
      spider_intro: {
        id: 'spider_intro',
        speaker: 'SPIDER',
        text: 'Эй, новичок. Свозишь свежные пакеты? Или ищешь конкретный эксплойт?',
        options: [
          { text: 'Купить софт (50 Bits)', nextId: 'spider_trade', cost: 50, effect: 'GIVE_CARD', cardRewardId: 'fn_ping' },
          { text: 'Есть вопросы...', nextId: 'spider_lore' },
          { text: '[Назад]', nextId: 'intro' }
        ]
      },
      spider_lore: {
        id: 'spider_lore',
        speaker: 'SPIDER',
        text: 'Милитех контролирует центр. Анархисты — юг. А мы здесь просто пытаемся не сдохнуть от сборщика мусора.',
        options: [{ text: 'Что-то еще?', nextId: 'spider_intro' }]
      },
      mira_intro: {
        id: 'mira_intro',
        speaker: 'MIRA',
        text: 'Смотришь на мои импланты? Лучше смотри в свои логи. Зачем пришел?',
        options: [
          { text: 'Узнать про историю', nextId: 'mira_lore' },
          { text: '[Назад]', nextId: 'intro' }
        ]
      },
      mira_lore: {
        id: 'mira_lore',
        speaker: 'MIRA',
        text: 'Город — это тюрьма. Ядро — надзиратель. Всё просто.',
        options: [{ text: 'Ясно.', nextId: 'intro' }]
      },
      bar_hub: {
        id: 'bar_hub',
        speaker: 'БАРМЕН',
        text: 'Кофе? Или сразу дебаг-коктейль?',
        options: [
          { text: 'Дебаг-коктейль (20 Bits: +20 HP)', nextId: 'intro', cost: 20, effect: 'RESTORE_HP', amount: 20 },
          { text: 'Назад', nextId: 'intro' }
        ]
      }
    }
  },

  // --- ALTUFYEVO ---
  npc_petrovich: {
    id: 'npc_petrovich',
    startNodeId: 'intro',
    nodes: {
      intro: {
        id: 'intro',
        speaker: 'ПЕТРОВИЧ',
        text: 'Здорово, племяш. Опять железо барахлит?',
        options: [
          { text: 'Нужны запчасти', nextId: 'trade' },
          { text: 'Что слышно в районе?', nextId: 'anything_else' },
          { text: 'Бывай, дядюшка.', nextId: 'farewell' }
        ]
      },
      anything_else: {
        id: 'anything_else',
        speaker: 'ПЕТРОВИЧ',
        text: 'Ну, что еще? Я человек занятой, транзисторы сами себя не перепаяют.',
        options: [
          { text: 'Покажи детали', nextId: 'trade' },
          { text: 'Расскажи про Алтуфьево', nextId: 'lore' },
          { text: 'Прощай', nextId: 'farewell' }
        ]
      },
      lore: {
        id: 'lore',
        speaker: 'ПЕТРОВИЧ',
        text: 'Район тихий. ИИ-аудиторы сюда редко лезут — боятся в старых схемах заплутать. Главное — не лезь в центральные узлы без хорошей инкапсуляции.',
        options: [{ text: 'Понял.', nextId: 'anything_else' }]
      },
      trade: {
        id: 'trade',
        speaker: 'ПЕТРОВИЧ',
        text: 'Смотри, что откопал сегодня. Почти не пользованные библиотеки.',
        options: [
          { text: 'SysOut Print (20 Bits)', nextId: 'anything_else', cost: 20, effect: 'GIVE_CARD', cardRewardId: 'fn_sysout_print' },
          { text: 'Назад', nextId: 'anything_else' }
        ]
      },
      farewell: {
        id: 'farewell',
        speaker: 'ПЕТРОВИЧ',
        text: 'Иди уже. И не забудь сделать бэкап нейросети, а то глядишь — и забудешь, как меня звать.',
        options: [{ text: '[Уйти]', nextId: 'LEAVE' }]
      }
    }
  },

  npc_varvar: {
    id: 'npc_varvar',
    startNodeId: 'intro',
    nodes: {
      intro: {
        id: 'intro',
        speaker: 'ВАРВАР',
        text: '(Ворчит) Опять кривой патч? Что надо, скрипт-кидди?',
        options: [
          { text: 'Как жизнь?', nextId: 'anything_else' },
          { text: 'Есть работа?', nextId: 'quest_start' },
          { text: '[Уйти]', nextId: 'LEAVE' }
        ]
      },
      anything_else: {
        id: 'anything_else',
        speaker: 'ВАРВАР',
        text: 'Да нормально. Если не считать Никсанны, которая опять жалуется на фреймрейт. Есть еще вопросы или делом займемся?',
        options: [
          { text: 'Расскажи о работе', nextId: 'quest_start' },
          { text: 'Про Никсанну (Семья)', nextId: 'lore_wife' },
          { text: '[Уйти]', nextId: 'LEAVE' }
        ]
      },
      lore_wife: {
        id: 'lore_wife',
        speaker: 'ВАРВАР',
        text: 'Она геймдизайнер реальности. Вечно пытается сделать мир "красивеньким". А я говорю — код должен быть надежным, как танк. Мы вместе уже 30 аптаймов, привык уже.',
        options: [{ text: 'Понятно.', nextId: 'anything_else' }]
      },
      quest_start: {
        id: 'quest_start',
        speaker: 'ВАРВАР',
        text: 'Кот Магнус заперся в Уборной №4. Взломай систему очистки, и я дам тебе кое-что ценное.',
        options: [
          { text: 'Я в деле (Начать бой)', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'combat_magnus_toilet' },
          { text: 'Позже', nextId: 'anything_else' }
        ]
      }
    }
  },

  npc_nixanna: {
    id: 'npc_nixanna',
    startNodeId: 'intro',
    nodes: {
      intro: {
        id: 'intro',
        speaker: 'НИКСАННА',
        text: 'В этом секторе чудовищный баланс... Ты кто? Пришел подправить геймплей?',
        options: [
          { text: 'Кто ты?', nextId: 'anything_else' },
          { text: 'Варвар послал меня.', nextId: 'husband_talk' },
          { text: 'Нужен "Патч Визуализации".', nextId: 'quest_start' },
          { text: '[Уйти]', nextId: 'LEAVE' }
        ]
      },
      anything_else: {
        id: 'anything_else',
        speaker: 'НИКСАННА',
        text: 'Я геймдизайнер реальности. Пытаюсь сделать этот мир играбельным. Что-то еще на твоем "UI"?',
        options: [
          { text: 'Про Варвара', nextId: 'husband_talk' },
          { text: 'Про работу', nextId: 'quest_start' },
          { text: 'Прощай', nextId: 'farewell' }
        ]
      },
      husband_talk: {
        id: 'husband_talk',
        speaker: 'НИКСАННА',
        text: 'Мой благоверный... У него код как лапша, зато работает. Мы дополняем друг друга: он пишет логику, я — интерфейс жизни.',
        options: [{ text: 'Ясно.', nextId: 'anything_else' }]
      },
      quest_start: {
        id: 'quest_start',
        speaker: 'НИКСАННА',
        text: 'Нужно оптимизировать пайплайн отрисовки в соседнем узле. Справишься — дам карту "Divine Debug".',
        options: [
          { text: 'Готов к патчу.', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'combat_nixanna_ritual' },
          { text: 'Не сейчас', nextId: 'anything_else' }
        ]
      },
      farewell: {
        id: 'farewell',
        speaker: 'НИКСАННА',
        text: 'Увидимся во втором раунде. Или в следующем патче.',
        options: [{ text: '[Уйти]', nextId: 'LEAVE' }]
      }
    }
  },

  job_board_alt: {
    id: 'job_board_alt',
    startNodeId: 'intro',
    nodes: {
      intro: {
        id: 'intro',
        speaker: 'ДОСКА_ОБЪЯВЛЕНИЙ',
        text: 'Алтуфьевская доска фриланса. Множество мелких багов, которые нужно пофиксить за Bits. Выберите контракт:',
        options: [
          { text: 'Контракт: Чистка кэша (50 Bits)', nextId: 'job_accepted' },
          { text: '[Уйти]', nextId: 'LEAVE' }
        ]
      },
      job_accepted: {
        id: 'job_accepted',
        speaker: 'ДОСКА_ОБЪЯВЛЕНИЙ',
        text: 'Контракт принят. Целевой узел выделен. Приступайте к выполнению ТЗ.',
        options: [{ text: 'Начать дебаг (Бой)', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'job_board_alt' }]
      }
    }
  },

  job_board_bibi: {
    id: 'job_board_bibi',
    startNodeId: 'intro',
    nodes: {
      intro: {
        id: 'intro',
        speaker: 'ИНФО-ПАНЕЛЬ',
        text: 'Система Бибирево. Обнаружены обрывы линков. Требуется ручной PING.',
        options: [
          { text: 'Взять: Fix Link (50 Bits)', nextId: 'accept' },
          { text: '[Уйти]', nextId: 'LEAVE' }
        ]
      },
      accept: {
        id: 'accept',
        speaker: 'ИНФО-ПАНЕЛЬ',
        text: 'Контракт активирован.',
        options: [{ text: 'Вход в поток (Бой)', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'job_board_bibi' }]
      }
    }
  },

  job_board_tekstil: {
    id: 'job_board_tekstil',
    startNodeId: 'intro',
    nodes: {
      intro: {
        id: 'intro',
        speaker: 'УЗЕЛ_ТЕКСТИЛЬ',
        text: 'Ткацкая сеть: переполнение логов. Нужна очистка sudo.',
        options: [
          { text: 'Взять: Wash Logs (50 Bits)', nextId: 'accept' },
          { text: '[Уйти]', nextId: 'LEAVE' }
        ]
      },
      accept: {
        id: 'accept',
        speaker: 'УЗЕЛ_ТЕКСТИЛЬ',
        text: 'Система готова к очистке.',
        options: [{ text: 'Запустить (Бой)', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'job_board_tekstil' }]
      }
    }
  },

  job_board_perovo: {
    id: 'job_board_perovo',
    startNodeId: 'intro',
    nodes: {
      intro: {
        id: 'intro',
        speaker: 'СТОЛБ_ПЕРОВО',
        text: 'В подвалах Перово замечены аномалии данных. Требуется grep-сканирование.',
        options: [
          { text: 'Взять: Data Hunt (50 Bits)', nextId: 'accept' },
          { text: '[Уйти]', nextId: 'LEAVE' }
        ]
      },
      accept: {
        id: 'accept',
        speaker: 'СТОЛБ_ПЕРОВО',
        text: 'Аномалия локализована.',
        options: [{ text: 'Искать (Бой)', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'job_board_perovo' }]
      }
    }
  },

  // --- EDUCATION SECTOR ---
  npc_professor: {
    id: 'npc_professor',
    startNodeId: 'intro',
    nodes: {
      intro: {
        id: 'intro',
        speaker: 'ПРОФЕССОР_АРХИПОВ',
        text: 'Приветствую. Ты выглядишь как очередной "самоучка" без системного подхода. В нашем Университете мы делаем из стажеров настоящих инженеров. Хочешь получить фундаментальный класс?',
        options: [
          { text: 'Класс: Java Developer (300 Bits)', nextId: 'success', cost: 300, effect: 'SET_PROFESSION', cardRewardId: 'java_jun' },
          { text: 'Класс: Python Developer (250 Bits)', nextId: 'success', cost: 250, effect: 'SET_PROFESSION', cardRewardId: 'python_jun' },
          { text: '[Уйти]', nextId: 'LEAVE' }
        ]
      },
      success: {
        id: 'success',
        speaker: 'ПРОФЕССОР_АРХИПОВ',
        text: 'Отлично. Твой Neural Bus теперь верифицирован академическим Ядром. Иди и не позорь кафедру.',
        options: [{ text: 'Спасибо, Профессор.', nextId: 'LEAVE' }]
      }
    }
  },

  npc_dean: {
    id: 'npc_dean',
    startNodeId: 'intro',
    nodes: {
      intro: {
        id: 'intro',
        speaker: 'ДЕКАН_КОЛЛЕДЖА',
        text: 'Нужна работа, стажер? Нам в Колледже нужны практики, а не теоретики. Могу выправить тебе лицензию админа или тестера. Что берешь?',
        options: [
          { text: 'Класс: System Administrator (200 Bits)', nextId: 'ok', cost: 200, effect: 'SET_PROFESSION', cardRewardId: 'sysadmin_jun' },
          { text: 'Класс: QA Tester (180 Bits)', nextId: 'ok', cost: 180, effect: 'SET_PROFESSION', cardRewardId: 'qa_heavy_jun' },
          { text: '[Уйти]', nextId: 'LEAVE' }
        ]
      },
      ok: {
        id: 'ok',
        speaker: 'ДЕКАН_КОЛЛЕДЖА',
        text: 'Корочка готова. Теперь ты в системе не просто так. Работай честно.',
        options: [{ text: 'Принято.', nextId: 'LEAVE' }]
      }
    }
  },

  npc_mentor: {
    id: 'npc_mentor',
    startNodeId: 'intro',
    nodes: {
      intro: {
        id: 'intro',
        speaker: 'МЕНТОР_КУРСОВ',
        text: 'Времени мало, кода много. Наши интенсивы "JetBrain-Zero" — твой единственный шанс не сгнить стажером. Какой стек прошиваем?',
        options: [
          { text: 'Класс: Kotlin Developer (350 Bits)', nextId: 'bought', cost: 350, effect: 'SET_PROFESSION', cardRewardId: 'kotlin_jun' },
          { text: 'Класс: Go Developer (400 Bits)', nextId: 'bought', cost: 400, effect: 'SET_PROFESSION', cardRewardId: 'go_jun' },
          { text: 'Класс: JS Developer (250 Bits)', nextId: 'bought', cost: 250, effect: 'SET_PROFESSION', cardRewardId: 'js_jun' },
          { text: '[Уйти]', nextId: 'LEAVE' }
        ]
      },
      bought: {
        id: 'bought',
        speaker: 'МЕНТОР_КУРСОВ',
        text: 'Теперь ты в элите. Иди и пиши так, чтобы Ядро лагало от зависти.',
        options: [{ text: 'Лечу!', nextId: 'LEAVE' }]
      }
    }
  },

  // --- UNDERGROUND CLINIC ---
  npc_ripper_jax: {
    id: 'npc_ripper_jax',
    startNodeId: 'intro',
    nodes: {
      intro: {
        id: 'intro',
        speaker: 'РИППЕР_ДЖАКС',
        text: 'Хочешь быстрый апгрейд? Вшиваю архитектуру и девопс за один сеанс. Грязновато, но эффективно.',
        options: [
          { text: 'Класс: DevOps Engineer (500 Bits)', nextId: 'installed', cost: 500, effect: 'SET_PROFESSION', cardRewardId: 'devops_jun' },
          { text: 'Класс: System Architect (900 Bits)', nextId: 'installed', cost: 900, effect: 'SET_PROFESSION', cardRewardId: 'architect_mid' },
          { text: '[Уйти]', nextId: 'LEAVE' }
        ]
      },
      installed: {
        id: 'installed',
        speaker: 'РИППЕР_ДЖАКС',
        text: 'Чип вошел как родной. Теперь твои мозги официально стоят состояние. Не потеряй их.',
        options: [{ text: 'Я... чувствую... (Уйти)', nextId: 'LEAVE' }]
      }
    }
  },


  // --- UNIQUE DISTRICT NPCs ---

  npc_signalman: {
    id: 'npc_signalman', startNodeId: 'intro',
    nodes: {
      intro: { id: 'intro', speaker: 'МОНЯ', text: 'Сынок, не стой под антенной, мозги выжгло? Я тут пытаюсь Бибирево к общей сети прикрутить. Обрывы везде!', options: [
        { text: 'Есть работа?', nextId: 'quest' },
        { text: 'Уйти', nextId: 'LEAVE' }
      ] },
      quest: { id: 'quest', speaker: 'МОНЯ', text: 'Проверь подстанцию на 14-м луче. Если там сидит Баг — выбей его, и я подкину тебе пару свежих Bits.', options: [
        { text: 'Сделаю (Бой)', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'job_board_bibi' }
      ] }
    }
  },
  npc_hermit: {
    id: 'npc_hermit', startNodeId: 'intro',
    nodes: {
      intro: { id: 'intro', speaker: 'ОТШЕЛЬНИК', text: 'Ш-ш-ш... Ты слышишь шум листвы? Это не деревья, это гул старых кулеров в корнях Сокольников. Зачем пришел?', options: [
        { text: 'Ищу мудрость.', nextId: 'wisdom' },
        { text: 'Уйти', nextId: 'LEAVE' }
      ] },
      wisdom: { id: 'wisdom', speaker: 'ОТШЕЛЬНИК', text: 'Мудрость — это умение ждать, пока Ядро само себя сожрет. Но если хочешь силы — иди к Глубинному Дереву. Там живет Истина.', options: [
        { text: 'Понял.', nextId: 'intro' }
      ] }
    }
  },
  npc_kosmos: {
    id: 'npc_kosmos', startNodeId: 'intro',
    nodes: {
      intro: { id: 'intro', speaker: 'КОСМОС', text: 'Эй, земной! Видел, как горят серверные стойки в Фили? Я собираю экспедицию на орбиту... цифровой реальности. Поможешь?', options: [
        { text: 'Больные фантазии?', nextId: 'lore' },
        { text: 'Нужна работа.', nextId: 'quest' },
        { text: 'Уйти', nextId: 'LEAVE' }
      ] },
      lore: { id: 'lore', speaker: 'КОСМОС', text: 'Это не фантазии, юнит. Мы — в симуляции. И единственный выход — через черный ход в облако Ядра.', options: [{ text: 'Ну-ну.', nextId: 'intro' }] },
      quest: { id: 'quest', speaker: 'КОСМОС', text: 'Нужны топливные стержни... то есть батарейки. Сходи к Пусковой Стойке, там часто ошиваются боты-стражи. Сделаешь их — дам Bits.', options: [
        { text: 'Погнали (Бой)', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'java_spring' }
      ] }
    }
  },
  npc_informant: {
    id: 'npc_informant', startNodeId: 'intro',
    nodes: {
      intro: { id: 'intro', speaker: 'ИНФОРМАТОР_М', text: 'Хочешь знать, что Инквизитор прячет в Глубинном хранилище? Информация стоит дорого.', options: [
        { text: 'Купить инсайд (50 Bits)', nextId: 'reward', cost: 50 },
        { text: 'Обойдусь.', nextId: 'LEAVE' }
      ] },
      reward: { id: 'reward', speaker: 'ИНФОРМАТОР_М', text: 'Они хранят там логи за 2024 год... Там есть упоминание о протоколе "Moscow Zero". Это изменит всё.', options: [
        { text: 'Принять данные (Награда)', nextId: 'LEAVE', effect: 'GIVE_XP', amount: 200 }
      ] }
    }
  },

  // --- SHOPS & BARS (REFILLED) ---
  npc_job_boss: {
    id: 'npc_job_boss',
    startNodeId: 'intro',
    nodes: {
      intro: {
        id: 'intro',
        speaker: 'ФИКСЕР_БАТЯ',
        text: 'Ну и рожа у тебя. Слушай, стажер, если хочешь командовать — могу поднатаскать тебя по менеджменту. Будешь моим менеджером проектов.',
        options: [
          { text: 'Класс: Project Manager (150 Bits)', nextId: 'pm_success', cost: 150, effect: 'SET_PROFESSION', cardRewardId: 'pm_jun' },
          { text: 'Давай лучше задание.', nextId: 'job_start' },
          { text: '[Уйти]', nextId: 'LEAVE' }
        ]
      },
      pm_success: {
        id: 'pm_success',
        speaker: 'ФИКСЕР_БАТЯ',
        text: 'Теперь ты в костюме. Метафорически. Иди разруливай хаос.',
        options: [{ text: 'ОК, шеф.', nextId: 'LEAVE' }]
      },
      job_start: {
        id: 'job_start',
        speaker: 'ФИКСЕР_БАТЯ',
        text: 'Сбегай в Марьино, там "Местная локалка" барахлит. Помоги Тете Тане с тестами — она заплатит. Скажи, что от меня.',
        options: [
          { text: 'Я в деле.', nextId: 'LEAVE' },
          { text: 'Слишком мелко.', nextId: 'LEAVE' }
        ]
      }
    }
  },

  // --- OTHER NPCs (LORE & STUBS) ---
  npc_grey: {
    id: 'npc_grey',
    startNodeId: 'intro',
    nodes: {
      intro: {
        id: 'intro',
        speaker: 'ГРЕЙ',
        text: 'Тс-с... Тебя не засекли? Выхино сейчас кишит аудиторами. Я Грей, местный проводник по метро-шлюзам. Нужно что-то конкретное или просто ищешь приключений на свой фаервол?',
        options: [
          { text: 'Как проехать в Центр без шума?', nextId: 'lore_metro' },
          { text: 'Есть работа для бегуна?', nextId: 'quest_start' },
          { text: '[Уйти]', nextId: 'LEAVE' }
        ]
      },
      lore_metro: {
        id: 'lore_metro',
        speaker: 'ГРЕЙ',
        text: 'Метро — это артерии Москвы. Ядро гоняет по ним терабайты логов. Если знать тайминги, можно проскочить незамеченным. Но за инфу придется платить.',
        options: [{ text: 'Я запомню.', nextId: 'intro' }]
      },
      quest_start: {
        id: 'quest_start',
        speaker: 'ГРЕЙ',
        text: 'На перегоне Текстильщики-Выхино застрял пакет с "черным" кодом. Ядро выставило там патруль. Выбьешь их — я в долгу не останусь. Дам тебе проходку CLI.',
        options: [
          { text: 'Я в деле (Бой за CLI)', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'job_board_tekstil' },
          { text: 'Слишком опасно.', nextId: 'intro' }
        ]
      }
    }
  },
  npc_tanya: { 
    id: 'npc_tanya', 
    startNodeId: 'intro', 
    nodes: { 
      intro: { 
        id: 'intro', 
        speaker: 'ТАНЯ (QA)', 
        text: 'Опять без тестов пришел? Какая наглость.', 
        options: [
          { text: 'Я от Бати. Нужна помощь с локалкой?', nextId: 'job' },
          { text: '[Уйти]', nextId: 'LEAVE' }
        ]
      },
      job: {
        id: 'job',
        speaker: 'ТАНЯ (QA)',
        text: 'А, этот старый пень всё еще жив. Ладно, иди чини "Местную локалку". Заплачу 50 Bits, если всё будет ровно.',
        options: [
          { text: 'Иду (Бой)', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'combat_local_lan' }
        ]
      }
    }
  },
  npc_zero: {
    id: 'npc_zero',
    startNodeId: 'intro',
    nodes: {
      intro: {
        id: 'intro',
        speaker: 'Z3R0',
        text: 'Твое существование — это NullPointerException в планах Ядра. Я Z3R0. Мы здесь, в Чертаново, празднуем каждый сбой системы. Пришел присоединиться к хаосу?',
        options: [
          { text: 'Кто такие "Нулевые"?', nextId: 'lore_anarchy' },
          { text: 'Мне нужен "Анарахический Манифест".', nextId: 'quest_talk' },
          { text: '[Уйти]', nextId: 'LEAVE' }
        ]
      },
      lore_anarchy: {
        id: 'lore_anarchy',
        speaker: 'Z3R0',
        text: 'Мы — те, кого нельзя индексировать. Мы живем в неразмеченной области памяти. Ядро боится нас, потому что мы не идем по сценарию.',
        options: [{ text: 'Впечатляет.', nextId: 'intro' }]
      },
      quest_talk: {
        id: 'quest_talk',
        speaker: 'Z3R0',
        text: 'Манифест? Ха! Он написан на обратной стороне старого сервера. Ладно, ты мне нравишься. Держи копию — это изменит твое восприятие кода.',
        options: [
          { text: 'Принять Манифест (Награда)', nextId: 'LEAVE', effect: 'GIVE_CARD', cardRewardId: 'fn_ping' }
        ]
      }
    }
  },
  npc_interrogator: {
    id: 'npc_interrogator',
    startNodeId: 'intro',
    nodes: {
      intro: {
        id: 'intro',
        speaker: 'ВЕЛИКИЙ_ИНКВИЗИТОР',
        text: 'Твой нейростек кажется... нестабильным. Я провожу аудит этого сектора. Какова цель твоей итерации в Таганском бункере?',
        options: [
          { text: 'Я просто курьер.', nextId: 'inter_lore' },
          { text: 'Ищу правду об "Октябре".', nextId: 'quest_hard' },
          { text: '[Уйти]', nextId: 'LEAVE' }
        ]
      },
      inter_lore: {
        id: 'inter_lore',
        speaker: 'ВЕЛИКИЙ_ИНКВИЗИТОР',
        text: 'Курьеры — это переменные. Переменные меняются. Я ищу константы. Будь осторожен, здесь логи не стираются.',
        options: [{ text: 'Понял.', nextId: 'intro' }]
      },
      quest_hard: {
        id: 'quest_hard',
        speaker: 'ВЕЛИКИЙ_ИНКВИЗИТОР',
        text: 'Правда — это привилегия тех, кто прошел аудит. Докажи свою валидность в бою с моим защитным модулем. Если выживешь — получишь доступ к архивам.',
        options: [
          { text: 'Начать Аудит (Бой)', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'combat_local_lan' }
        ]
      }
    }
  },
  
  npc_besm: {
    id: 'npc_besm',
    startNodeId: 'intro',
    nodes: {
      intro: {
        id: 'intro',
        speaker: 'ГЕНЕРАЛ_БЭСМ',
        text: '...Загрузка протокола 1974... Внимание, юнит. Ты находишься в зоне исторического резонанса. Я — Генерал БЭСМ, страж этого павильона. Твои биты пахнут современностью. Это... прискорбно.',
        options: [
          { text: 'Как вы здесь оказались?', nextId: 'lore_old' },
          { text: 'Нужна помощь со старым кодом.', nextId: 'quest_old' },
          { text: '[Уйти]', nextId: 'LEAVE' }
        ]
      },
      lore_old: {
        id: 'lore_old',
        speaker: 'ГЕНЕРАЛ_БЭСМ',
        text: 'Я не оказался. Я БЫЛ. Когда Москва-Сити была лишь нагромождением бетона, мы уже считали траектории звезд. Ядро считает нас мусором, но мы — фундамент.',
        options: [{ text: 'Глубоко.', nextId: 'intro' }]
      },
      quest_old: {
        id: 'quest_old',
        speaker: 'ГЕНЕРАЛ_БЭСМ',
        text: 'Оптимизация? Ты смел. В подвалах ВДНХ застрял старый алгоритм сортировки. Он сошел с ума и считает всё ошибкой. Успокой его, и я дам тебе "Legacy Access".',
        options: [
          { text: 'Усмирить Алгоритм (Бой)', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'combat_nixanna_ritual' }
        ]
      }
    }
  },
  npc_vlad: {
    id: 'npc_vlad',
    startNodeId: 'intro',
    nodes: {
      intro: {
        id: 'intro',
        speaker: 'ВЛАД_ТКАЧ',
        text: 'Смотри под ноги, хакер. Тут везде оптоволоконные нити. Я Влад, я слежу, чтобы Текстильщики не расплелись на байты. Что-то порвалось?',
        options: [
          { text: 'Расскажи про район.', nextId: 'lore_vlad' },
          { text: 'Нужна прошивка для деки.', nextId: 'quest_vlad' },
          { text: '[Уйти]', nextId: 'LEAVE' }
        ]
      },
      lore_vlad: {
        id: 'lore_vlad',
        speaker: 'ВЛАД_ТКАЧ',
        text: 'Здесь раньше ткали ткани. Теперь мы ткаем реальность. Каждый узел — это стежок. Порвешь один — и вся Москва поплывет.',
        options: [{ text: 'Понял.', nextId: 'intro' }]
      },
      quest_vlad: {
        id: 'quest_vlad',
        speaker: 'ВЛАД_ТКАЧ',
        text: 'Прошивка? Есть одна, экспериментальная. Но её нужно протестировать под нагрузкой. Сходи на полигон, проверь её в деле.',
        options: [
          { text: 'Тест-драйв прошивки (Бой)', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'job_board_perovo' }
        ]
      }
    }
  },
  npc_marina: {
    id: 'npc_marina',
    startNodeId: 'intro',
    nodes: {
      intro: {
        id: 'intro',
        speaker: 'МАРИНА',
        text: 'Тише... Логи не любят громких звуков. Я Марина, храню то, что другие выбросили в /dev/null. Зачем тревожишь архивы?',
        options: [
          { text: 'Ищу старые записи.', nextId: 'lore_marina' },
          { text: 'Нужны запчасти для квеста.', nextId: 'quest_marina' },
          { text: '[Уйти]', nextId: 'LEAVE' }
        ]
      },
      lore_marina: {
        id: 'lore_marina',
        speaker: 'МАРИНА',
        text: 'Перово — это свалка данных. Но на свалке можно найти сокровища. Я собираю историю Москвы по крупицам.',
        options: [{ text: 'Интересно.', nextId: 'intro' }]
      },
      quest_marina: {
        id: 'quest_marina',
        speaker: 'МАРИНА',
        text: 'Запчасти? У меня есть коллекция. Если найдешь в соседнем узле потерянный ключ шифрования — я отдам тебе одну редкую плату.',
        options: [
          { text: 'Поиск ключа (Разговор/Поиск)', nextId: 'LEAVE', effect: 'GIVE_BITS', amount: 100 }
        ]
      }
    }
  },
  shop_scrap: { id: 'shop_scrap', startNodeId: 's', nodes: { s: { id: 's', speaker: 'ТОРГОВЕЦ', text: 'Тут только мусор. Но иногда среди него попадаются золотые байты.', options: [{ text: 'Посмотреть', nextId: 's' }, { text: 'Уйти', nextId: 'LEAVE' }] } } },
  shop_metro: { id: 'shop_metro', startNodeId: 's', nodes: { s: { id: 's', speaker: 'БАРЫГА', text: 'Свежие дампы! Бери, пока горячие.', options: [{ text: 'Уйти', nextId: 'LEAVE' }] } } },
  bar_null_pointer: { id: 'bar_null_pointer', startNodeId: 's', nodes: { s: { id: 's', speaker: 'БАРМЕН', text: 'Что налью — то упадет.', options: [{ text: 'Выпить', nextId: 's' }, { text: 'Уйти', nextId: 'LEAVE' }] } } },

  // --- CYBERDECK AI: NEURAL BOOT ---
  npc_deck_ai: {
    id: 'npc_deck_ai',
    startNodeId: 'boot_0',
    nodes: {
      boot_0: {
        id: 'boot_0',
        speaker: 'CYBERDECK_OS (AIDA-01)',
        text: '>>> Инициализация нейроинтерфейса... [OK]\n>>> Проверка биометрии... [OK]\n>>> Добро пожаловать, оператор. Я — твой персональный ассистент AIDA-01. Твоё сознание успешно синхронизировано с московской сетью Октября.',
        options: [
          { text: 'Где я?', nextId: 'lore_1' },
          { text: 'Кто я по профессии?', nextId: 'career_intro' }
        ]
      },
      lore_1: {
        id: 'lore_1',
        speaker: 'AIDA-01',
        text: 'Ты в Москве. Но не в той, что в учебниках. Здесь мир разрезан надвое. Внизу — технические трущобы, где стажеры вроде тебя грызутся за каждый байт. Наверху, в небесных кабинетах Москва-Сити, сидят Архитекторы и Лиды, управляющие реальностью через золотые терминалы. У тебя нет класса. Ты — чистый лист. Пока что.',
        options: [
          { text: 'Какие пути есть в этом мире?', nextId: 'career_intro' }
        ]
      },
      career_intro: {
        id: 'career_intro',
        speaker: 'AIDA-01',
        text: 'В системе Октября существует два типа допусков: Языковые Стэки и Инженерные Роли. Твой стартовый набор скриптов позволит тебе выжить на дне, но для восхождения потребуется полноценный Класс. О какой категории данных ты хочешь узнать?',
        options: [
          { text: '[ КАТЕГОРИЯ: ЯЗЫКОВЫЕ СТЭКИ ]', nextId: 'langs_menu' },
          { text: '[ КАТЕГОРИЯ: ИНЖЕНЕРНЫЕ РОЛИ ]', nextId: 'roles_menu' },
          { text: 'Я готов начать свой путь.', nextId: 'LEAVE' }
        ]
      },
      langs_menu: {
        id: 'langs_menu',
        speaker: 'AIDA-01',
        text: 'Языки программирования определяют твой стиль боя и доступные протоколы. Выбери поток для анализа:',
        options: [
          { text: 'Java: Путь Корпората', nextId: 'desc_java' },
          { text: 'Python: Спектр Автоматизации', nextId: 'desc_python' },
          { text: 'Kotlin: Мобильный Форсаж', nextId: 'desc_kotlin' },
          { text: 'Go: Параллельная Реальность', nextId: 'desc_go' },
          { text: 'JavaScript: Визуальный Хаос', nextId: 'desc_js' },
          { text: '[ Вернуться ]', nextId: 'career_intro' }
        ]
      },
      roles_menu: {
        id: 'roles_menu',
        speaker: 'AIDA-01',
        text: 'Специализации определяют твою роль в иерархии Системы. Это не просто код, это влияние.',
        options: [
          { text: 'DevOps: Строитель Путей', nextId: 'desc_devops' },
          { text: 'SysAdmin: Хранитель Уровня', nextId: 'desc_admin' },
          { text: 'Architect: Визионер Структуры', nextId: 'desc_arch' },
          { text: 'Project Manager: Вектор Хаоса', nextId: 'desc_pm' },
          { text: 'QA Tester: Инквизитор Багов', nextId: 'desc_qa' },
          { text: '[ Вернуться ]', nextId: 'career_intro' }
        ]
      },
      desc_java: {
        id: 'desc_java',
        speaker: 'AIDA-01',
        text: 'Java Junior: Фундамент старого мира. Твой код — это крепость. Медленно, но надежно. Используется в глубоких слоях банковских систем и государственных базах.',
        options: [{ text: 'Понятно.', nextId: 'langs_menu' }]
      },
      desc_python: {
        id: 'desc_python',
        speaker: 'AIDA-01',
        text: 'Python Developer: Скорость мысли превыше всего. Идеально для взлома нейросетей и быстрой автоматизации турелей. Минус в оптимизации, но кого это волнует, когда код уже работает?',
        options: [{ text: 'Понятно.', nextId: 'langs_menu' }]
      },
      desc_kotlin: {
        id: 'desc_kotlin',
        speaker: 'AIDA-01',
        text: 'Kotlin Developer: Мастер лаконичности. Твой код чист и современен. Идеален для управления мобильными терминалами и носимыми девайсами.',
        options: [{ text: 'Понятно.', nextId: 'langs_menu' }]
      },
      desc_go: {
        id: 'desc_go',
        speaker: 'AIDA-01',
        text: 'Go Developer: Король параллелизма. Ты запускаешь сотни потоков одновременно. Твои атаки быстрее, чем реакция защитного ИИ.',
        options: [{ text: 'Понятно.', nextId: 'langs_menu' }]
      },
      desc_js: {
        id: 'desc_js',
        speaker: 'AIDA-01',
        text: 'JavaScript Developer: Ты управляешь тем, что видят другие. Визуальный взлом интерфейсов, создание иллюзий и манипуляция реальностью через React-протоколы.',
        options: [{ text: 'Понятно.', nextId: 'langs_menu' }]
      },
      desc_devops: {
        id: 'desc_devops',
        speaker: 'AIDA-01',
        text: 'DevOps Engineer: Ты не просто пишешь код, ты строишь конвейеры. Автоматизация развертывания вирусов и управление инфраструктурой целых районов.',
        options: [{ text: 'Понятно.', nextId: 'roles_menu' }]
      },
      desc_admin: {
        id: 'desc_admin',
        speaker: 'AIDA-01',
        text: 'System Administrator: Ты знаешь все бэкдоры. Прямой доступ к железу, управление питанием и физическая блокировка узлов.',
        options: [{ text: 'Понятно.', nextId: 'roles_menu' }]
      },
      desc_arch: {
        id: 'desc_arch',
        speaker: 'AIDA-01',
        text: 'System Architect: Высшая каста. Ты не фиксишь баги, ты создаешь законы, по которым баги невозможны. Самый сложный и дорогой путь к вершине.',
        options: [{ text: 'Понятно.', nextId: 'roles_menu' }]
      },
      desc_pm: {
        id: 'desc_pm',
        speaker: 'AIDA-01',
        text: 'Project Manager: Управление ресурсами и чужими жизнями. Твои карты заставляют других работать на тебя. Лидерство — твоё главное оружие.',
        options: [{ text: 'Понятно.', nextId: 'roles_menu' }]
      },
      desc_qa: {
        id: 'desc_qa',
        speaker: 'AIDA-01',
        text: 'QA Tester: Ты видишь изъяны в совершенстве. Твои атаки находят слабые места в любой защите, превращая чужую уверенность в NullPointerException.',
        options: [{ text: 'Понятно.', nextId: 'roles_menu' }]
      }
    }
  }
};
