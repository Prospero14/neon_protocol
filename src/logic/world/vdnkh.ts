import type { WorldDistrict } from './types';

export const vdnkh: WorldDistrict = {
  id: 'vdnkh', 
  node: {
    id: 'vdnkh', 
    name: 'ВДНХ: PAVILION_ZERO', 
    description: 'Синтетические нейро-напитки и сборище легендарных хакеров в тени заброшенных павильонов.', 
    x: 52, y: 30, stability: 80, type: 'bar', tier: 3,
    subNodes: [
      { id: 'npc_besm', name: 'Генерал БЭСМ', type: 'npc', description: 'Цифровой призрак прошлого.', x: 10, y: 30 },
      { id: 'npc_guide_vdnkh', name: 'Экскурсовод', type: 'npc', description: 'Рассказывает сказки о золотом веке кода.', x: 25, y: 50 },
      { id: 'npc_scavenger', name: 'Стервятник', type: 'npc', description: 'Ищет ценное железо в руинах павильонов.', x: 55, y: 15 },
      { id: 'shop_vintage', name: 'Лавка "Ретро-Тех"', type: 'shop', description: 'Редкое Legacy.', x: 40, y: 60 },
      { id: 'bar_vostok', name: 'Бар "Восток-1"', type: 'bar', description: 'Напитки для космонавтов данных.', x: 80, y: 20 },
      { id: 'combat_pavilions', name: 'Зачистка Павильонов', type: 'combat', description: 'Бой с системными багами.', x: 60, y: 40 },
      { id: 'combat_retro_virus', name: 'Ретро-Вирус 86', type: 'combat', description: 'Древняя зараза, ожившая в старых сетях.', x: 20, y: 75 },
      { id: 'term_archive_data', name: 'Архив ВДНХ', type: 'terminal', description: 'Доступ к историческим логам выставок.', x: 70, y: 80 },
      { id: 'term_taxi_vdnkh', name: 'Такси: ВДНХ', type: 'terminal', description: 'Связь с городом.', x: 90, y: 55 },
      { id: 'npc_tea_master', name: 'Мастер Чая (Олег)', type: 'npc', description: 'Успокаивает нервы после тяжелых дампов.', x: 45, y: 10 }
    ]
  },
  npcs: [
    { id: 'npc_besm', name: 'Генерал БЭСМ', districtId: 'vdnkh', role: 'Легенда', greeting: 'Память длиннее ваших релизов.', shortLore: 'Исторические и редкие квесты.' },
    { id: 'npc_guide_vdnkh', name: 'Гид Раиса', districtId: 'vdnkh', role: 'Экскурсовод', greeting: 'Посмотрите налево - здесь был первый мейнфрейм.', shortLore: 'Знает каждый винтик в заброшенных павильонах.' },
    { id: 'npc_tea_master', name: 'Олег (Мастер Чая)', districtId: 'vdnkh', role: 'Психолог-бариста', greeting: 'Пей чай, забудь о дедлайне.', shortLore: 'Лечит нервные срывы кодеров.' },
  ],
  dialogues: {
    npc_besm: {
      id: 'npc_besm', startNodeId: 'intro',
      nodes: {
        intro: {
          id: 'intro', speaker: 'ГЕНЕРАЛ_БЭСМ', text: '...Загрузка протокола 1974... Внимание, юнит. Ты находишься в зоне исторического резонанса. Я — Генерал БЭСМ, страж этого павильона. Зачем ты тревожишь спящую память?', options: [
            { text: 'Я пришел сдать Экзамен Стажёра.', nextId: 'exam_start' },
            { text: 'Мне нужен винтажный софт для моей коллекции.', nextId: 'quest_vintage_start' },
            { text: 'Как вы здесь оказались?', nextId: 'lore_old' },
            { text: '[Уйти]', nextId: 'LEAVE' }
          ]
        },
        quest_vintage_start: {
            id: 'quest_vintage_start', speaker: 'ГЕНЕРАЛ_БЭСМ', text: 'Винтаж... Мои драйверы рассыпались на биты еще в прошлом веке. Если хочешь помочь — найди Скупщика на Рынке в Измайлово. У него должно быть "Legacy Core 1974". Принесешь — и я поделюсь с тобой знаниями Архитекторов. (Принять квест)',
            options: [{ text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_besm_vintage_code' }]
        },
        quest_vintage_finish: {
            id: 'quest_vintage_finish', speaker: 'ГЕНЕРАЛ_БЭСМ', text: '...Считывание... Да, это оно. Тёплый ламповый код. Мои системы стабилизируются. Ты хорошо поработал, юнит. Держи этот "Patch_0.01_Legacy".',
            options: [{ text: 'Рад служить.', nextId: 'intro', effect: 'COMPLETE_TALK_QUEST', cardRewardId: 'q_besm_vintage_code' }]
        },
        exam_start: {
            id: 'exam_start', speaker: 'ГЕНЕРАЛ_БЭСМ', text: 'Экзамен... Да. Архипов присылает их пачками. Но ты выглядишь... иначе. Докажи, что твой стек выдержит нагрузку древнего Legacy. Порази Тренировочного Бота в главном павильоне.',
            options: [
                { text: 'Я готов. В бой!', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'combat_pavilions', subtext: 'Финальный этап получения Красного Диплома.' },
                { text: 'Мне нужно подготовиться.', nextId: 'intro' }
            ]
        },
        lore_old: {
          id: 'lore_old', speaker: 'ГЕНЕРАЛ_БЭСМ', text: 'Я не оказался. Я БЫЛ. Когда Москва-Сити была лишь нагромождением бетона, мы уже считали траектории звезд. Ядро считает нас мусором, но мы — фундамент.', options: [{ text: 'Глубоко.', nextId: 'intro' }]
        }
      }
    },
    shop_vintage: {
      id: 'shop_vintage', startNodeId: 'intro',
      nodes: {
        intro: { id: 'intro', speaker: 'ВИНТАЖ_БОЙ', text: 'Это не просто железо, это история. 64кб хватит всем, верно?', options: [{ text: 'Old-School Script (40 Bits)', nextId: 'intro', cost: 40, effect: 'GIVE_CARD', cardRewardId: 'script_ping', subtext: 'Проверенный временем запрос.' }, { text: '[Уйти]', nextId: 'LEAVE' }] }
      }
    },
    bar_vostok: {
        id: 'bar_vostok', startNodeId: 'intro',
        nodes: {
            intro: {
                id: 'intro', speaker: 'БАР_ВОСТОК-1', text: 'Напитки здесь такие крепкие, что могут прожечь даже квантовую броню. "Поехали!" — любимый тост завсегдатаев.',
                options: [
                    { text: 'Тюбик с хладагентом (18 Bits)', nextId: 'intro', cost: 18, effect: 'RESTORE_HP', amount: 45, subtext: 'Восстановление 45 HP.' },
                    { text: 'Космический паек (45 Bits)', nextId: 'intro', cost: 45, effect: 'RESTORE_HP', amount: 100, subtext: 'Максимальный ремонт.' },
                    { text: '[Выход]', nextId: 'LEAVE' }
                ]
            }
        }
    },
    npc_guide_vdnkh: {
        id: 'npc_guide_vdnkh', startNodeId: 'intro',
        nodes: {
            intro: {
            id: 'intro', speaker: 'ГИД_РАИСА', text: 'Посмотрите налево — здесь был первый мейнфрейм серии "Раздача". Хотите узнать больше о золотом веке советского кода?',
            options: [
                { text: 'Расскажите о павильонах.', nextId: 'lore' },
                { text: 'Тут один Связист из Бибирево жалуется на эхо...', nextId: 'quest_echo_finish', requireQuestId: 'q_monya_signal_echo' },
                { text: '[Уйти]', nextId: 'LEAVE' }
            ]
        },
        quest_echo_finish: {
            id: 'quest_echo_finish', speaker: 'ГИД_РАИСА', text: 'Эхо? Ах, это старые ретрансляторы в подвалах Pavilion #32. Они до сих пор пытаются передать новости Олимпиады-80. Вот, передай ему этот "Frequency Jammer", он заглушит исторический шум.',
            options: [{ text: 'Спасибо, передам.', nextId: 'intro', effect: 'COMPLETE_TALK_QUEST', cardRewardId: 'q_monya_signal_echo' }]
        },
            lore: {
                id: 'lore', speaker: 'ГИД_РАИСА', text: 'Павильон "Космос" теперь — это огромный серверный массив. А "Земледелие" — ферма для майнинга древних алгоритмов. (+5 Репутации VOSKHOD)',
                options: [{ text: 'Познавательно.', nextId: 'LEAVE', effect: 'GIVE_REPUTATION', amount: 5, cardRewardId: 'VOSKHOD_OFFICE' }]
            }
        }
    },
    npc_tea_master: {
        id: 'npc_tea_master', startNodeId: 'intro',
        nodes: {
            intro: {
                id: 'intro', speaker: 'МАСТЕР_ЧАЯ_ОЛЕГ', text: 'Сядь. Выпей чаю. Твой CPU перегрет, а стек забит мусором. Дай системе отдохнуть.',
                options: [
                    { text: 'Чашка "Дзен-Лога" (Бесплатно)', nextId: 'intro', effect: 'RESTORE_HP', amount: 10, subtext: 'Немного успокаивает.' },
                    { text: '[Уйти]', nextId: 'LEAVE' }
                ]
            }
        }
    },
    npc_scavenger: {
        id: 'npc_scavenger', startNodeId: 'intro',
        nodes: {
            intro: {
                id: 'intro', speaker: 'СТЕРВЯТНИК', text: 'Нашел пару дырявых кластеров в Pavilion #5. Хочешь купить? Или у тебя есть что на продажу?',
                options: [
                    { text: 'Показать свой скрап (Получить 15 Bits)', nextId: 'intro', effect: 'GIVE_BITS', amount: 15 },
                    { text: '[Уйти]', nextId: 'LEAVE' }
                ]
            }
        }
    },
    term_archive_data: {
        id: 'term_archive_data', startNodeId: 'intro',
        nodes: {
            intro: {
                id: 'intro', speaker: 'АРХИВ_ВДНХ', text: '[SYSTEM] ДОСТУП_К_ИСТОРИИ_ОТКРЫТ. ВЫБЕРИТЕ_ГОД:',
                options: [
                    { text: '1970 (Эра БЭСМ)', nextId: 'lore' },
                    { text: '[Выход]', nextId: 'LEAVE' }
                ]
            },
            lore: {
                id: 'lore', speaker: 'АРХИВ_ВДНХ', text: '[DATA] В то время код писали на перфокартах. Одна ошибка — и весь рассчет в корзину. Мы были титанами.',
                options: [{ text: 'Назад', nextId: 'intro' }]
            }
        }
    },
    term_taxi_vdnkh: {
        id: 'term_taxi_vdnkh', startNodeId: 's',
        nodes: {
            s: {
                id: 's', speaker: 'ТЕРМИНАЛ_ТАКСИ', text: 'СИСТЕМА_ТАКСИ: Узел ВДНХ. Маршруты до Центра заблокированы. Требуется высший допуск.', options: [
                    { text: 'Оплатить проезд (100 Bits)', nextId: 'LEAVE', effect: 'UNLOCK_CITY', cost: 100 },
                    { text: 'Отмена', nextId: 'LEAVE' }
                ]
            }
        }
    }
  }
};
