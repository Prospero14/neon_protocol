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
          id: 'intro', speaker: 'ПЕТРОВИЧ (ВЕТЕРАН)', text: 'Здорово, племяш. Опять твоё кремниевое сердце барахлит? В мои времена мы писали код на перфокартах и не знали, что такое "нейроинтерфейс". Сейчас же каждый второй стажёр мнит себя Архитектором ЕС-Синтаксиса.',
          options: [
            { text: 'Кто такие "ЕС-Синтаксис"?', nextId: 'lore_eu' },
            { text: 'Нужны запчасти для деки.', nextId: 'trade' },
            { text: 'Что слышно о Матрице Октября?', nextId: 'lore_matrix' },
            { text: 'Бывай, дядюшка.', nextId: 'farewell' }
          ]
        },
        lore_eu: {
          id: 'lore_eu', speaker: 'ПЕТРОВИЧ', text: 'Евро-центричные пижоны. Думают, что если у них в Брюсселе сервера стоят на гидропонике, то они могут диктовать алгоритмы всему миру. В Москве их не любят — здесь лог суров и беспощаден.',
          options: [{ text: 'Понятно.', nextId: 'intro' }]
        },
        lore_matrix: {
          id: 'lore_matrix', speaker: 'ПЕТРОВИЧ', text: 'Матрица... Это не просто сеть, парень. Это коллективный сон, который видят Архитекторы. Если проснёшься — Ядро тебя сожрёт. Лучше держись низких уровней, как Алтуфьево. Тут ИИ-аудиторы редко патрулируют.',
          options: [{ text: 'Совет дельный ( +5 VOID )', nextId: 'intro', reputationReward: { factionId: 'ANARCHO_VOID', amount: 5 } }]
        },
        trade: {
          id: 'trade', speaker: 'ПЕТРОВИЧ', text: 'Смотри, что откопал сегодня. Почти не пользованные библиотеки. "System.out.print" — старая классика для дебага реальности.',
          options: [
            { text: 'SysOut Print (20 Bits)', nextId: 'intro', cost: 20, effect: 'GIVE_CARD', cardRewardId: 'fn_sysout_print' },
            { text: 'Назад', nextId: 'intro' }
          ]
        },
        farewell: {
          id: 'farewell', speaker: 'ПЕТРОВИЧ', text: 'Иди уже. И не забудь сделать бэкап. В Октябре память — единственное, что нельзя украсть... если ты не из ГБ.',
          options: [{ text: '[ УЙТИ ]', nextId: 'LEAVE' }]
        }
      }
    },
    npc_varvar: {
      id: 'npc_varvar', startNodeId: 'intro',
      nodes: {
        intro: {
          id: 'intro', speaker: 'ВАРВАР', text: '(Ворчит) Опять кривой патч? Что надо, скрипт-кидди?',
          options: [
            { text: 'Как жизнь?', nextId: 'anything_else' },
            { text: 'Есть работа?', nextId: 'quest_start' },
            { text: '[Уйти]', nextId: 'LEAVE' }
          ]
        },
        anything_else: {
          id: 'anything_else', speaker: 'ВАРВАР', text: 'Да нормально. Если не считать Никсанны, которая опять жалуется на фреймрейт. Есть еще вопросы или делом займемся?',
          options: [
            { text: 'Расскажи о работе', nextId: 'quest_start' },
            { text: 'Про Никсанну', nextId: 'lore_wife' },
            { text: '[Уйти]', nextId: 'LEAVE' }
          ]
        },
        lore_wife: {
          id: 'lore_wife', speaker: 'ВАРВАР', text: 'Она геймдизайнер реальности. Вечно пытается сделать мир "красивеньким". А я говорю — код должен быть надежным, как танк. Мы вместе уже 30 аптаймов, привык уже.',
          options: [{ text: 'Понятно.', nextId: 'anything_else' }]
        },
        quest_start: {
          id: 'quest_start', speaker: 'ВАРВАР', text: 'Кот Магнус заперся в Уборной №4. Взломай систему очистки, и я дам тебе кое-что ценное.',
          options: [
            { text: 'Я в деле (Начать бой)', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'combat_magnus_toilet' },
            { text: 'Позже', nextId: 'anything_else' }
          ]
        }
      }
    },
    npc_nixanna: {
      id: 'npc_nixanna', startNodeId: 'intro',
      nodes: {
        intro: {
          id: 'intro', speaker: 'НИКСАННА', text: 'В этом секторе чудовищный баланс... Ты кто? Пришел подправить геймплей?',
          options: [
            { text: 'Кто ты?', nextId: 'anything_else' },
            { text: 'Варвар послал меня.', nextId: 'husband_talk' },
            { text: 'Нужен "Патч Визуализации".', nextId: 'quest_start' },
            { text: '[Уйти]', nextId: 'LEAVE' }
          ]
        },
        anything_else: {
          id: 'anything_else', speaker: 'НИКСАННА', text: 'Я геймдизайнер реальности. Пытаюсь сделать этот мир играбельным. Что-то еще на твоем "UI"?',
          options: [
            { text: 'Про Варвара', nextId: 'husband_talk' },
            { text: 'Про работу', nextId: 'quest_start' },
            { text: 'Прощай', nextId: 'farewell' }
          ]
        },
        husband_talk: {
          id: 'husband_talk', speaker: 'НИКСАННА', text: 'Мой благоверный... У него код как лапша, зато работает. Мы дополняем друг друга: он пишет логику, я — интерфейс жизни.',
          options: [{ text: 'Ясно.', nextId: 'anything_else' }]
        },
        quest_start: {
          id: 'quest_start', speaker: 'НИКСАННА', text: 'Нужно оптимизировать пайплайн отрисовки в соседнем узле. Справишься — дам карту "Divine Debug".',
          options: [
            { text: 'Готов к патчу.', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'combat_nixanna_ritual' },
            { text: 'Не сейчас', nextId: 'anything_else' }
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
