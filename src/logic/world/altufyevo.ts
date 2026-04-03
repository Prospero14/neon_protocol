import type { WorldDistrict } from './types';

export const altufyevo: WorldDistrict = {
  id: 'altufyevo',
  node: {
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
      { id: 'bar_chips', name: 'Бар "Синий Чип"', type: 'bar', description: 'Дешевый охлад и восстановление.', x: 10, y: 60 },
      { id: 'combat_rats', name: 'Стая Крыс-кодеров', type: 'combat', description: 'Мелкие вредители в кабельных каналах.', x: 30, y: 85 },
      { id: 'term_taxi_alt', name: 'Терминал Такси', type: 'terminal', description: 'Разблокировка города.', x: 50, y: 80 }
    ]
  },
  npcs: [
    { id: 'npc_petrovich', name: 'Петрович', districtId: 'altufyevo', role: 'Техник', greeting: 'Плату в руки и не дыши.', shortLore: 'Чинит железо за уважение и биты.' },
    { id: 'npc_varvar', name: 'Варвар', districtId: 'altufyevo', role: 'Хакер-отшельник', greeting: 'Сначала проверка CRC, потом разговор.', shortLore: 'Специалист по низкоуровневому доступу.' },
    { id: 'npc_nixanna', name: 'Никсанна', districtId: 'altufyevo', role: 'Геймдизайнер', greeting: 'Баланс не баг, баланс - религия.', shortLore: 'Дает сложные боевые поручения.' },
    { id: 'job_board_alt', name: 'Доска Объявлений', districtId: 'altufyevo', role: 'Контракт-хаб', greeting: 'Берешь контракт - доводи до результата.', shortLore: 'Быстрые pre-class задачи.' },
  ],
  dialogues: {
    npc_petrovich: {
      id: 'npc_petrovich', startNodeId: 'intro',
      nodes: {
        intro: {
          id: 'intro', speaker: 'ПЕТРОВИЧ', text: 'Здорово, племяш. Чинишься помаленьку? Тут один старый клиент из Митинского радиорынка жалуется — у него в Северных Силосах старое оборудование взбесилось. Скрипты-зомби забили всю шину, новые чипы не прошиваются. Поможешь ветерану?',
          options: [
            { text: 'Что за Скрипты-зомби?', nextId: 'lore_zombie' },
            { text: 'Я готов зачистить драйверы.', nextId: 'quest_accept' },
            { text: 'Нужны запчасти для деки.', nextId: 'trade' },
            { text: 'Бывай, дядюшка.', nextId: 'farewell' }
          ]
        },
        lore_zombie: {
          id: 'lore_zombie', speaker: 'ПЕТРОВИЧ', text: 'Да мусор это, остатки старых прошивок. Они как крысы — плодятся в пустых кластерах и жрут циклы CPU. Без ручного CRC-чека их не выкурить. Формат задачи: DIRECT_PURGE, сложность: JUNIOR.',
          options: [{ text: 'Понял, сделаю.', nextId: 'intro' }]
        },
        quest_accept: {
          id: 'quest_accept', speaker: 'ПЕТРОВИЧ', text: 'Вот и ладно. Узел забит под завязку, так что готовь дебаггер. Как закончишь — с меня 50 Bits на охлад.',
          options: [{ text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_petrovich_legacy' }]
        },
        trade: {
          id: 'trade', speaker: 'ПЕТРОВИЧ', text: 'Смотри, что откопал сегодня. Почти не пользованные библиотеки. "System.out.print" — старая классика для дебага реальности.',
          options: [
            { text: 'SysOut Print (20 Bits)', nextId: 'intro', cost: 20, effect: 'GIVE_CARD', cardRewardId: 'fn_sysout_print' },
            { text: 'Назад', nextId: 'intro' }
          ]
        },
        farewell: {
          id: 'farewell', speaker: 'ПЕТРОВИЧ', text: 'Иди уже. И не забудь сделать бэкап. В Октябре память — единственное, что нельзя украсть...',
          options: [{ text: '[ УЙТИ ]', nextId: 'LEAVE' }]
        },
        quest_vykhino_finish: {
          id: 'quest_vykhino_finish', speaker: 'ПЕТРОВИЧ', text: 'Опа! Это тот самый блок из Выхино? Фонит-то как... Видать, там внутри не только логи, но и пару килограмм "черного" кода. Спасибо, малец. Вот твоя доля.',
          options: [{ text: 'Рад помочь.', nextId: 'intro', effect: 'COMPLETE_TALK_QUEST', cardRewardId: 'q_vykhino_delivery' }]
        }
      }
    },
    npc_varvar: {
      id: 'npc_varvar', startNodeId: 'intro',
      nodes: {
        intro: {
          id: 'intro', speaker: 'ВАРВАР', text: 'Стой! Проверка контрольной суммы... Ладно, проходи. Видишь это? Магнус, мой хвостатый помощник, заперся в Уборной №4 и случайно активировал протокол "Локаут". Теперь там охранный бот VOSKHOD считает, что туалет — это секретный объект.',
          options: [
            { text: 'Кот заперся в туалете?', nextId: 'lore_cat' },
            { text: 'Я разберусь с этим протоколом.', nextId: 'quest_start' },
            { text: '[Уйти]', nextId: 'LEAVE' }
          ]
        },
        lore_cat: {
          id: 'lore_cat', speaker: 'ВАРВАР', text: 'Он не просто кот, он — ходячая уязвимость! Активировал IoT-блокировку по отпечатку лапы. Теперь система очистки считает любого входящего "критическим багом". Клиент — моя психика. Формат: BYPASS_SECURITY.',
          options: [{ text: 'Звучит... специфично.', nextId: 'intro' }]
        },
        quest_start: {
          id: 'quest_start', speaker: 'ВАРВАР', text: 'Уборная №4 — там сейчас жарко. Взломай систему очистки, и я дам тебе одну из своих старых наработок.',
          options: [
            { text: 'Я в деле (Начать бой)', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'combat_magnus_toilet' },
            { text: 'Позже', nextId: 'intro' }
          ]
        }
      }
    },
    npc_nixanna: {
      id: 'npc_nixanna', startNodeId: 'intro',
      nodes: {
        intro: {
          id: 'intro', speaker: 'НИКСАННА', text: 'Внимание: обнаружена утечка в пайплайне рендеринга! Ты выглядишь как человек, который может поправить шейдеры реальности. Команда "Reality Engine" в панике — узел Визуализации начал выдавать артефакты в 4-м измерении.',
          options: [
            { text: 'Что за артефакты?', nextId: 'lore_render' },
            { text: 'Нужен "Патч Визуализации".', nextId: 'quest_start' },
            { text: 'Мне нужна рекомендация в Академию...', nextId: 'quest_recommendation' },
            { text: 'Тут один паникер из Чертаново просил патч...', nextId: 'quest_chertanovo_finish', requireQuestId: 'q_chertanovo_privacy' },
            { text: '[Уйти]', nextId: 'LEAVE' }
          ]
        },
        quest_recommendation: {
          id: 'quest_recommendation', speaker: 'НИКСАННА', text: 'Академия? Профессор Архипов всё еще там сидит? Ха! Ладно, я дам тебе "Визуальный Образец" — это скомпилированный лог одной из моих лучших сцен. Покажи его ему, он оценит уровень оптимизации. (Принять квест)',
          options: [{ text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_niksanna_recommendation' }]
        },
        quest_chertanovo_finish: {
            id: 'quest_chertanovo_finish', speaker: 'НИКСАННА', text: 'Опять эти параноики из высоток... Ладно, вот ему "Privacy Patch v.0.1". Скажи, пусть не забывает чистить куки перед сном, а то Ядро всё равно за ним придет.',
            options: [{ text: 'Заберу патч.', nextId: 'intro', effect: 'COMPLETE_TALK_QUEST', cardRewardId: 'q_chertanovo_privacy' }]
        },
        lore_render: {
          id: 'lore_render', speaker: 'НИКСАННА', text: 'Там переполнение буфера на уровне геометрии. Мир превращается в низкополигональную кашу. Формат задачи: VISUAL_STABILIZATION. Клиент: Департамент Эстетики ГБ.',
          options: [{ text: 'Попробую оптимизировать.', nextId: 'intro' }]
        },
        quest_start: {
          id: 'quest_start', speaker: 'НИКСАННА', text: 'Нужно зайти в узел "Ритуал" и сбросить кэш отрисовки. Справишься — дам карту "Divine Debug".',
          options: [
            { text: 'Готов к патчу.', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'combat_nixanna_ritual' },
            { text: 'Не сейчас', nextId: 'intro' }
          ]
        },
        farewell: {
          id: 'farewell', speaker: 'НИКСАННА', text: 'Увидимся во втором раунде. Или в следующем патче.',
          options: [{ text: '[Уйти]', nextId: 'LEAVE' }]
        }
      }
    },
    job_board_alt: {
      id: 'job_board_alt', startNodeId: 'intro',
      nodes: {
        intro: {
          id: 'intro', speaker: 'ДОСКА_ОБЪЯВЛЕНИЙ', text: 'Алтуфьевская доска фриланса. Множество мелких багов, которые нужно пофиксить за Bits. Выберите контракт:',
          options: [
            { text: 'Контракт: Чистка кэша (50 Bits)', nextId: 'job_accepted' },
            { text: '[Уйти]', nextId: 'LEAVE' }
          ]
        },
        job_accepted: {
          id: 'job_accepted', speaker: 'ДОСКА_ОБЪЯВЛЕНИЙ', text: 'Контракт принят. Целевой узел выделен. Приступайте к выполнению ТЗ.',
          options: [{ text: 'Начать дебаг (Бой)', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'job_board_alt' }]
        }
      }
    },
    shop_scrap: {
      id: 'shop_scrap', startNodeId: 'intro',
      nodes: {
        intro: {
          id: 'intro', speaker: 'СВАЛКА_ДЕТАЛЕЙ', text: 'Горы ржавого железа и битых кластеров памяти. Здесь можно найти дешевый софт для старта.',
          options: [
            { text: 'SysOut Print (20 Bits)', nextId: 'intro', cost: 20, effect: 'GIVE_CARD', cardRewardId: 'fn_sysout_print', subtext: 'Базовая отладка реальности.' },
            { text: 'Old Iron Shell (40 Bits)', nextId: 'intro', cost: 40, effect: 'GIVE_CARD', cardRewardId: 'infra_old_iron', subtext: 'Дешевая броня для деки.' },
            { text: '[Уйти]', nextId: 'LEAVE' }
          ]
        }
      }
    },
    bar_chips: {
      id: 'bar_chips', startNodeId: 'intro',
      nodes: {
        intro: {
          id: 'intro', speaker: 'БАР_СИНИЙ_ЧИП', text: 'Запах горелой изоляции и дешевого хладагента. Местный бармен — полусгоревший бот серии "Жигулевское".',
          options: [
            { text: 'Стакан хладагента (10 Bits)', nextId: 'intro', cost: 10, effect: 'RESTORE_HP', amount: 20, subtext: 'Восстанавливает 20 HP.' },
            { text: 'Полная промывка (30 Bits)', nextId: 'intro', cost: 30, effect: 'RESTORE_HP', amount: 100, subtext: 'Полное восстановление системы.' },
            { text: '[Выход]', nextId: 'LEAVE' }
          ]
        }
      }
    },
    term_taxi_alt: {
      id: 'term_taxi_alt', startNodeId: 'intro',
      nodes: {
        intro: {
          id: 'intro', speaker: 'ТЕРМИНАЛ_ТАКСИ', text: 'Служба такси Алтуфьево. Система заблокирована. Требуется 100 Bits для доступа к GPS-сетке города.',
          options: [
            { text: 'Разблокировать карту (100 Bits)', nextId: 'unlocked', cost: 100 },
            { text: '[Выход]', nextId: 'LEAVE' }
          ]
        },
        unlocked: {
          id: 'unlocked', speaker: 'ТЕРМИНАЛ_ТАКСИ', text: 'Доступ разрешен. Глобальная навигация активна. Удачного полета над Реактором.',
          options: [{ text: 'В ПУТЬ', nextId: 'LEAVE', effect: 'UNLOCK_CITY' }]
        }
      }
    }
  }
};
