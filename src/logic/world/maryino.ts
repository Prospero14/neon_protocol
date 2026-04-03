import type { WorldDistrict } from './types';

export const maryino: WorldDistrict = {
  id: 'maryino',
  node: {
    id: 'maryino', 
    name: 'МАРЬИНО: GRID_EXHAUST', 
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
          id: 'intro', speaker: 'ТАНЯ (QA)', text: 'Опять без тестов пришел? Какая наглость.',
          options: [
            { text: 'Я от Бати. Нужна помощь с локалкой?', nextId: 'job' },
            { text: '[Уйти]', nextId: 'LEAVE' }
          ]
        },
        job: {
          id: 'job', speaker: 'ТАНЯ (QA)', text: 'А, этот старый пень всё еще жив. Ладно, иди чини "Местную локалку". Заплачу 50 Bits, если всё будет ровно.',
          options: [
            { text: 'Иду (Бой)', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'combat_local_lan' }
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
                id: 'intro', speaker: 'КРЫСА_КУРЬЕР', text: 'Пи-пи... Вижу тебя, кожаный. Ищешь дыры в заборе GIGA_CORP? У меня есть пара "хвостов" для тебя.',
                options: [
                    { text: 'Что за хвосты?', nextId: 'lore' },
                    { text: 'Мне нужно пройти через южные шлюзы...', nextId: 'passage_lead', requireQuestId: 'q_maryino_passage' },
                    { text: 'Есть работа?', nextId: 'quest' },
                    { text: '[Прогнать]', nextId: 'LEAVE' }
                ]
            },
            passage_lead: {
                id: 'passage_lead', speaker: 'КРЫСА_КУРЬЕР', text: 'Пи! Официально - никак. Но Сержант из "Восхода" иногда закрывает глаза на ошибки в логах... за скромную плату. Найди его на южной окраине, он там дежурит.',
                options: [
                    { text: 'Я его найду.', nextId: 'intro', effect: 'GIVE_TRAIT', cardRewardId: 'trait_maryino_gang_lead', subtext: 'Получено: Зацепка по Сержанту.' }
                ]
            },
            lore: {
                id: 'lore', speaker: 'КРЫСА_КУРЬЕР', text: 'Они думают, что контролируют Сетку. Но мы живем в её тени. Под фундаментом Марьино зарыты старые серверные стойки 20-го века.',
                options: [{ text: 'Полезно.', nextId: 'intro' }]
            },
            quest: {
                id: 'quest', speaker: 'КРЫСА_КУРЬЕР', text: 'Помоги моей стае отбить Buffer Overflow Zone у патрулей. Мы в долгу не останемся.',
                options: [{ text: 'Я помогу.', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'combat_overflow' }]
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
            { text: 'Кто ты такой?', nextId: 'lore' },
            { text: '[Уйти]', nextId: 'LEAVE' }
          ]
        },
        lore: {
          id: 'lore', speaker: 'СЕРЖАНТ', text: 'Я тот, кто отделяет чистый код Марьино от мусора снаружи. "Восход" держит порядок, а порядок стоит денег.',
          options: [{ text: 'Ясно.', nextId: 'intro' }]
        },
        negotiate: {
          id: 'negotiate', speaker: 'СЕРЖАНТ', text: 'А, хвостатые напели? Ладно. Транзитный ключ на сутки стоит 50 Bits. Либо... помоги нам зачистить один глючный узел, и я выпишу тебе пропуск бесплатно.',
          options: [
            { text: 'Заплатить 50 Bits', nextId: 'complete', cost: 50 },
            { text: 'Я готов поработать. (Бой)', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'combat_grid_patrol' },
            { text: 'Я вернусь позже.', nextId: 'LEAVE' }
          ]
        },
        complete: {
          id: 'complete', speaker: 'СЕРЖАНТ', text: 'Принято. Твой ID добавлен в список исключений на южном шлюзе. Свободен, кодер.',
          options: [
            { text: '[Завершить контракт]', nextId: 'LEAVE', completeQuestId: 'q_maryino_passage' }
          ]
        }
      }
    }
  }
};
