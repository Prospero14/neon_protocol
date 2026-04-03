import type { WorldDistrict } from './types';

export const maryino: WorldDistrict = {
  id: 'maryino', 
  node: {
    id: 'maryino', 
    name: 'MARYINO: GRID_EXHAUST', 
    description: 'Гигантский жилой массив на юго-востоке. Перенаселенный, но богатый на дешевое железо.', 
    x: 80, y: 85, stability: 100, type: 'trade', tier: 1,
    subNodes: [
      { id: 'npc_tanya', name: 'Trace (Lead QA)', type: 'npc', description: 'Аудитор цепей и архитектор стабильности.', x: 20, y: 30 },
      { id: 'npc_rat', name: 'Крыса-курьер', type: 'npc', description: 'Маленький информатор из вентиляции.', x: 40, y: 15 },
      { id: 'combat_local_lan', name: 'Местная локалка', type: 'combat', description: 'Проверка периметра.', x: 50, y: 70 },
      { id: 'combat_overflow', name: 'Buffer Overflow Zone', type: 'combat', description: 'Узел с критической ошибкой.', x: 70, y: 50 },
      { id: 'combat_grid_patrol', name: 'Патруль Сетки', type: 'combat', description: 'Дроны-надзиратели VOSKHOD.', x: 15, y: 85 },
      { id: 'shop_pharmacy', name: 'Дата-аптека', type: 'shop', description: 'Стимуляторы и патчи для HP.', x: 85, y: 60 },
      { id: 'bar_packet', name: 'Бар "Пакет"', type: 'bar', description: 'Мутный притон для местных.', x: 10, y: 45 },
      { id: 'job_delivery', name: 'Доставка данных', type: 'combat', description: 'Простая работа за 30 Bits.', x: 80, y: 20 },
      { id: 'npc_sarge', name: 'Сержант (VOSKHOD)', type: 'npc', description: 'Координатор уличного патруля. Проверяет ключи доступа.', x: 5, y: 88 },
      { id: 'term_404', name: 'Терминал #404', type: 'terminal', description: 'Скрытые логи района.', x: 60, y: 80 },
      { id: 'term_taxi_maryino', name: 'Станция Такси', type: 'terminal', description: 'Выход в город.', x: 50, y: 90 }
    ]
  },
  npcs: [
    { id: 'npc_tanya', name: 'Trace', districtId: 'maryino', role: 'Lead QA', greeting: 'Memory integrity compromised. Establish connection or leave.', shortLore: 'Data auditor of the Southern Hub.' },
    { id: 'npc_rat', name: 'Крыса-курьер', districtId: 'maryino', role: 'Informant', greeting: 'Пи-пи... Вижу тебя.', shortLore: 'Знает все дыры в Сетке.' },
    { id: 'npc_sarge', name: 'Сержант', districtId: 'maryino', role: 'Security', greeting: 'Твой ID не в белом списке. Разворачивайся.', shortLore: 'Ветеран VOSKHOD, контролирует южные шлюзы.' },
  ],
  dialogues: {
    npc_tanya: {
      id: 'npc_tanya', startNodeId: 'intro',
      nodes: {
        intro: {
          id: 'intro', speaker: 'ТАНЯ (QA)', text: 'Внимание: целостность памяти скомпрометирована. Ты из тех, кто может пропинговать реальность? Клиент — Группа Оптимизации "Восход". В Марьинском узле пакеты данных теряются на уровне L2. Нужен принудительный стресс-тест локалки.',
          options: [
            { text: 'Как именно пропинговать?', nextId: 'lore_stress' },
            { text: 'Я готов к стресс-тесту.', nextId: 'job' },
            { text: '[Уйти]', nextId: 'LEAVE' }
          ]
        },
        lore_stress: {
          id: 'lore_stress', speaker: 'ТАНЯ (QA)', text: 'Там затык в коммутаторах. Нужно зайти и "протолкнуть" трафик грубой силой кода. Формат задачи: CONNECTIVITY_STRESS_TEST. Ожидаемая задержка: 0ms после фикса.',
          options: [{ text: 'Понятно, иду.', nextId: 'intro' }]
        },
        job: {
          id: 'job', speaker: 'ТАНЯ (QA)', text: 'Хорошо. Узел выделен. Если прозвон пройдет успешно — Bits будут на твоем счету моментально. Приступай.',
          options: [
            { text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_maryino_npc_tanya_signal_sweep' }
          ]
        }
      }
    },
    term_taxi_maryino: {
      id: 'term_taxi_maryino', startNodeId: 's',
      nodes: {
        s: {
          id: 's', speaker: 'ТЕРМИНАЛ_ТАКСИ', text: 'СИСТЕМА_ТАКСИ: Марьинский узел. Трафик перегружен. Требуется приоритетный пропуск.', options: [
            { text: 'Купить пропуск (100 Bits) [РАЗБЛОКИРОВАТЬ МОСКВУ]', nextId: 'LEAVE', effect: 'UNLOCK_CITY', cost: 100 },
            { text: 'Отмена', nextId: 'LEAVE' }
          ]
        }
      }
    },
    shop_pharmacy: {
      id: 'shop_pharmacy', startNodeId: 'intro',
      nodes: {
        intro: {
          id: 'intro', speaker: 'ДАТА_АПТЕКА', text: 'Бесконечные ряды ампул с жидким кодом. Здесь продают патчи для биологической и цифровой оболочек.',
          options: [
            { text: 'Патч "Стабильность" (40 Bits)', nextId: 'intro', cost: 40, effect: 'GIVE_CARD', cardRewardId: 'def_stability_patch', subtext: 'Карта: Защита +15.' },
            { text: 'Сборка "Анти-фриз" (60 Bits)', nextId: 'intro', cost: 60, effect: 'GIVE_CARD', cardRewardId: 'reac_antifreeze', subtext: 'Карта: Снятие дебаффов.' },
            { text: '[Уйти]', nextId: 'LEAVE' }
          ]
        }
      }
    },
    bar_packet: {
      id: 'bar_packet', startNodeId: 'intro',
      nodes: {
        intro: {
          id: 'intro', speaker: 'БАР_ПАКЕТ', text: 'Место, где пакеты данных теряются навсегда. Здесь пахнет дешевым табаком и озоном.',
          options: [
            { text: 'Кружка "Битого Пикселя" (12 Bits)', nextId: 'intro', cost: 12, effect: 'RESTORE_HP', amount: 25, subtext: 'Восстановление 25 HP.' },
            { text: 'Залить кэш (40 Bits)', nextId: 'intro', cost: 40, effect: 'RESTORE_HP', amount: 80, subtext: 'Восстановление 80 HP.' },
            { text: '[Выход]', nextId: 'LEAVE' }
          ]
        }
      }
    },
    npc_rat: {
        id: 'npc_rat', startNodeId: 'intro',
        nodes: {
            intro: {
                id: 'intro', speaker: 'КРЫСА_КУРЬЕР', text: 'Пи-пи... Вижу тебя, кодер. У меня есть "горячий" дамп из Buffer Overflow Zone. Нам нужна помощь, чтобы отбить ферму.',
                options: [
                    { text: 'Что за серверная ферма?', nextId: 'lore_dump' },
                    { text: 'Мне нужен хладагент для Мастера Верстака.', nextId: 'quest_cooling_finish', requireQuestId: 'q_verstak_cooling' },
                    { text: 'Мне нужно пройти через южные шлюзы...', nextId: 'passage_lead', requireQuestId: 'q_maryino_passage' },
                    { text: 'Я готов забрать дамп.', nextId: 'quest' },
                    { text: '[Прогнать]', nextId: 'LEAVE' }
                ]
            },
            lore_dump: {
                id: 'lore_dump', speaker: 'КРЫСА_КУРЬЕР', text: 'Это теневой архив! Нас зажали патрули, и данные могут сгореть при дефрагментации сектора. Нужно отбить ферму и выкачать лог. Половина Bits — тебе.',
                options: [{ text: 'Полезно. Я в деле.', nextId: 'intro' }]
            },
            quest_cooling_finish: {
                id: 'quest_cooling_finish', speaker: 'КРЫСА_КУРЬЕР', text: 'Пи! Хладагент? "Buffer Liquid"? Есть у меня пара канистр. Отдам за 20 Bits, чисто за риск. Скажи Верстаку, что Крыса помнит старые долги.',
                options: [
                    { text: 'Плачу 20 Bits.', nextId: 'intro', cost: 20, effect: 'COMPLETE_TALK_QUEST', cardRewardId: 'q_verstak_cooling' },
                    { text: 'Позже.', nextId: 'intro' }
                ]
            },
            passage_lead: {
                id: 'passage_lead', speaker: 'КРЫСА_КУРЬЕР', text: 'Пи! Официально - никак. Но Сержант из "Восхода" иногда закрывает глаза на ошибки в логах... за скромную плату. Найди его на южной окраине, он там дежурит.',
                options: [
                    { text: 'Я его найду.', nextId: 'intro', effect: 'GIVE_TRAIT', cardRewardId: 'trait_maryino_gang_lead', subtext: 'Получено: Зацепка по Сержанту.' }
                ]
            },
            quest: {
                id: 'quest', speaker: 'КРЫСА_КУРЬЕР', text: 'Помоги моей стае отбить Buffer Overflow Zone. Мы в долгу не останемся. (Принять квест)',
                options: [{ text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_rat_data_dump' }]
            }
        }
    },
    term_404: {
        id: 'term_404', startNodeId: 'intro',
        nodes: {
            intro: {
                id: 'intro', speaker: 'ТЕРМИНАЛ_#404', text: '[SYSTEM_ERROR] Файл не найден. Но есть скрытые дампы сектора. Авторизоваться?',
                options: [
                    { text: 'Вскрыть логи (25 Bits)', nextId: 'lore', cost: 25 },
                    { text: '[Выход]', nextId: 'LEAVE' }
                ]
            },
            lore: {
                id: 'lore', speaker: 'ТЕРМИНАЛ_#404', text: '[LOG_ENTRY_089] Марьино было построено на месте цифрового кладбища. Здесь до сих пор витают призраки Web 2.0. (+10 Репутации Анархистов)',
                options: [{ text: 'Закрыть терминал', nextId: 'LEAVE', effect: 'GIVE_REPUTATION', amount: 10, cardRewardId: 'ANARCHO_VOID' }]
            }
        }
    },
    npc_sarge: {
      id: 'npc_sarge', startNodeId: 'intro',
      nodes: {
        intro: {
          id: 'intro', speaker: 'СЕРЖАНТ', text: 'Стой. Дальше только для сотрудников VOSKHOD или тех, у кого оплачен транзит. Твоего лица нет в базе.',
          options: [
            { text: 'Мне сказали, ты можешь помочь с проходом...', nextId: 'negotiate', requireTrait: 'trait_maryino_gang_lead' },
            { text: 'Я хочу помочь с зачисткой сектора.', nextId: 'quest_start', requireQuestId: 'q_maryino_passage' },
            { text: 'Кто ты такой?', nextId: 'lore' },
            { text: '[Уйти]', nextId: 'LEAVE' }
          ]
        },
        lore: {
          id: 'lore', speaker: 'СЕРЖАНТ', text: 'Я тот, кто отделяет чистый код Марьино от мусора снаружи. "Восход" держит порядок, а порядок стоит денег.',
          options: [{ text: 'Ясно.', nextId: 'intro' }]
        },
        quest_start: {
            id: 'quest_start', speaker: 'СЕРЖАНТ', text: 'Помощь? Ладно. На 15-й магистрали дроны-отступники блокируют курьерский шлюз. Разберись с ними, и я выдам тебе транзитный код. Бесплатно.',
            options: [
                { text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_maryino_combat_grid_patrol_bug_sweep' }
            ]
        },
        negotiate: {
          id: 'negotiate', speaker: 'СЕРЖАНТ', text: 'А, хвостатые напели? Ладно. Транзитный ключ на сутки стоит 50 Bits. Либо... помоги нам зачистить один глючный узел, и я выпишу тебе пропуск бесплатно.',
          options: [
            { text: 'Плачу 50 Bits.', nextId: 'LEAVE', cost: 50, effect: 'GIVE_TRAIT', cardRewardId: 'trait_maryino_shluz_unlocked', subtext: 'Разблокировано: Проезд в Марьино.' },
            { text: 'Я помогу.', nextId: 'quest_start' },
            { text: 'Позже.', nextId: 'intro' }
          ]
        }
      }
    }
  }
};
