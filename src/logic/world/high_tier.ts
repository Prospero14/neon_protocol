import type { WorldDistrict } from './types';

export const high_tier: WorldDistrict[] = [
  {
    id: 'sokolniki',
    node: {
      id: 'sokolniki', 
      name: 'SOKOLNIKI: SERVER_FOREST', 
      description: 'Бывший парк, превращенный в серверный лабиринт. Пристанище старых кодеров.', 
      x: 70, y: 20, stability: 65, type: 'bar', tier: 4,
      subNodes: [
        { id: 'npc_hermit', name: 'Отшельник', type: 'npc', description: 'Лесной админ.', x: 30, y: 30 },
        { id: 'npc_druid_coder', name: 'Друид Арборис (Био-хакер)', type: 'npc', description: 'Верит в органический код.', x: 10, y: 60 },
        { id: 'npc_forest_guard', name: 'Лесник (SYS_SEC)', type: 'npc', description: 'Охраняет физические сервера.', x: 70, y: 15 },
        { id: 'bar_deep_root', name: 'Бар "Глубинный Корень"', type: 'bar', description: 'Тихое место среди жужжащих стоек.', x: 50, y: 80 },
        { id: 'combat_recursive_loop', name: 'Рекурсивная Петля', type: 'combat', description: 'Аномалия в центре парка.', x: 40, y: 50 },
        { id: 'combat_wild_firewall', name: 'Дикий Файрвол', type: 'combat', description: 'Защита, забытая создателями.', x: 85, y: 30 },
        { id: 'shop_nature_logic', name: 'Логика Природы', type: 'shop', description: 'Био-модификации.', x: 20, y: 85 },
        { id: 'term_forest_log', name: 'Журнал Леса', type: 'terminal', description: 'Данные о росте подсетей.', x: 60, y: 5 },
        { id: 'term_taxi_sokolniki', name: 'Такси: Сокольники', type: 'terminal', description: 'Вылет из леса.', x: 90, y: 50 },
        { id: 'combat_fox_virus', name: 'Вирус "Рыжий Хвост"', type: 'combat', description: 'Хитрый перехватчик данных.', x: 15, y: 20 }
      ]
    },
    npcs: [
      { id: 'npc_hermit', name: 'Отшельник', districtId: 'sokolniki', role: 'Лесной админ', greeting: 'Тишина лечит stack overflow.', shortLore: 'Глубокие риск-квесты.' },
      { id: 'npc_druid_coder', name: 'Друид Арборис', districtId: 'sokolniki', role: 'Био-хакер', greeting: 'Код должен расти как дуб.', shortLore: 'Верит в органическое программирование.' },
      { id: 'npc_forest_guard', name: 'Лесник', districtId: 'sokolniki', role: 'SYS_SEC', greeting: 'Посторонним вход в подсеть запрещен.', shortLore: 'Охраняет физические сервера парка.' },
    ],
    dialogues: {
      npc_hermit: {
        id: 'npc_hermit', startNodeId: 'intro',
        nodes: {
          intro: {
            id: 'intro', speaker: 'ОТШЕЛЬНИК', text: 'Ш-ш-ш... Ты слышишь шум листвы? Это не деревья, это гул старых кулеров в корнях Сокольников. Зачем пришел?', options: [
              { text: 'Ищу мудрость.', nextId: 'wisdom' },
              { text: 'Уйти', nextId: 'LEAVE' }
            ]
          },
          wisdom: { id: 'wisdom', speaker: 'ОТШЕЛЬНИК', text: 'Мудрость — это умение ждать, пока Ядро само себя сожрет. Но если хочешь силы — иди к Глубинному Дереву. Там живет Истина.', options: [{ text: 'Понял.', nextId: 'intro' }] }
        }
      }
    }
  },
  {
    id: 'fili',
    node: {
      id: 'fili', 
      name: 'FILI: ORBIT_LINK', 
      description: 'Район космических заводов и спутниковых линков. Высокая плотность SRE.', 
      x: 10, y: 40, stability: 70, type: 'trade', tier: 4,
      subNodes: [
        { id: 'npc_kosmos', name: 'Космос (SRE Nomad)', type: 'npc', description: 'Собирает экспедицию в облако.', x: 50, y: 50 },
        { id: 'npc_rocket_eng', name: 'Степаныч (Инженер)', type: 'npc', description: 'Старая гвардия Хруничева.', x: 20, y: 80 },
        { id: 'npc_orbit_stalker', name: 'Луна (Orbit Stalker)', type: 'npc', description: 'Перехватчик данных со спутников.', x: 80, y: 20 },
        { id: 'bar_cosmo_port', name: 'Бар "Байконур"', type: 'bar', description: 'Здесь пьют за удачный запуск.', x: 10, y: 40 },
        { id: 'shop_gravity', name: 'Магазин "Гравитация"', type: 'shop', description: 'Тяжелое железо и щиты.', x: 70, y: 60 },
        { id: 'combat_launch_guard', name: 'Охрана Пуска', type: 'combat', description: 'Автоматика на взводе.', x: 40, y: 15 },
        { id: 'combat_satellite_crash', name: 'Падение Данных', type: 'combat', description: 'Сбор обломков спутника под огнем.', x: 15, y: 90 },
        { id: 'term_uplink', name: 'Терминал Аплинка', type: 'terminal', description: 'Связь с орбитой.', x: 85, y: 50 },
        { id: 'term_taxi_fili', name: 'Такси: Фили', type: 'terminal', description: 'Улет из района.', x: 60, y: 95 },
        { id: 'job_board_fili', name: 'Центр Управления Найма', type: 'npc', description: 'Контракты на космические Bits.', x: 30, y: 5 }
      ]
    },
    npcs: [
      { id: 'npc_kosmos', name: 'Космос', districtId: 'fili', role: 'SRE Nomad', greeting: 'Запуск без логов - самоубийство.', shortLore: 'Spring и high-tier задания.' },
      { id: 'npc_rocket_eng', name: 'Степаныч', districtId: 'fili', role: 'Ракетчик', greeting: 'Тяга кода в норме, поехали.', shortLore: 'Инженер старой закалки с заводов Хруничева.' },
      { id: 'npc_orbit_stalker', name: 'Луна', districtId: 'fili', role: 'Orbit Stalker', greeting: 'Спутники шепчут твоё имя.', shortLore: 'Перехватывает данные с орбитальных узлов.' },
    ],
    dialogues: {
      npc_kosmos: {
        id: 'npc_kosmos', startNodeId: 'intro',
        nodes: {
          intro: {
            id: 'intro', speaker: 'КОСМОС', text: 'Эй, земной! Видел, как горят серверные стойки в Фили? Я собираю экспедицию на орбиту... цифровой реальности. Поможешь?', options: [
              { text: 'Больные фантазии?', nextId: 'lore' },
              { text: 'Нужна работа.', nextId: 'quest' },
              { text: 'Уйти', nextId: 'LEAVE' }
            ]
          },
          lore: { id: 'lore', speaker: 'КОСМОС', text: 'Это не фантазии, юнит. Мы — в симуляции. И единственный выход — через черный ход в облако Ядра.', options: [{ text: 'Ну-ну.', nextId: 'intro' }] },
          quest: {
            id: 'quest', speaker: 'КОСМОС', text: 'Нужны топливные стержни... то есть батарейки. Сходи к Пусковой Стойке, там часто ошиваются боты-стражи. Сделаешь их — дам Bits.', options: [
              { text: '[ ПРИНЯТЬ КОНТРАКТ: АПЛИНК ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_fili_combat_launch_guard_bug_sweep' }
            ]
          }
        }
      }
    }
  },
  {
    id: 'taganka',
    node: {
      id: 'taganka', 
      name: 'TAGANKA: BUNKER_CORE', 
      description: 'Глубокие правительственные бункеры. Резиденция Инквизиции и Аудиторов Ядра.', 
      x: 65, y: 55, stability: 50, type: 'combat', tier: 5, combatPack: 'java_advanced',
      subNodes: [
        { id: 'npc_auditor', name: 'Инквизитор (Аудитор Ядра)', type: 'npc', description: 'Проверяет зрелость данных.', x: 50, y: 50 },
        { id: 'npc_informant', name: 'Информатор М.', type: 'npc', description: 'Посредник в тени.', x: 80, y: 80 },
        { id: 'npc_bunker_guard', name: 'Сержант Глухов', type: 'npc', description: 'Охрана Бункера.', x: 10, y: 20 },
        { id: 'bar_cold_buffer', name: 'Бар "Холодный Буфер"', type: 'bar', description: 'Где аудиторы пьют жидкий азот.', x: 20, y: 70 },
        { id: 'shop_state_secret', name: 'ГосТайна', type: 'shop', description: 'Запрещенные модули и ключи.', x: 85, y: 15 },
        { id: 'combat_deep_audit', name: 'Глубокий Аудит', type: 'combat', description: 'Тебя проверяют на всех уровнях.', x: 40, y: 40 },
        { id: 'combat_ghost_process', name: 'Призрачный Процесс', type: 'combat', description: 'Нечто живет в стенах бункера.', x: 60, y: 10 },
        { id: 'term_central_gate', name: 'Центральный Шлюз', type: 'terminal', description: 'Вход в Ядро Октября.', x: 50, y: 95 },
        { id: 'term_taxi_taganka', name: 'Такси: Таганка', type: 'terminal', description: 'Выход на поверхность.', x: 90, y: 50 },
        { id: 'job_board_taganka', name: 'Доска Розыска', type: 'npc', description: 'Охота на ренегатов Системы.', x: 15, y: 5 }
      ]
    },
    npcs: [
      { id: 'npc_auditor', name: 'Инквизитор', districtId: 'taganka', role: 'Аудитор ядра', greeting: 'Сначала отчёт, потом доступ.', shortLore: 'Проверяет зрелость игрока.' },
      { id: 'npc_informant', name: 'Информатор М.', districtId: 'taganka', role: 'Посредник', greeting: 'Тайны продаются поминутно.', shortLore: 'Квесты с редким лутом.' },
      { id: 'npc_bunker_guard', name: 'Сержант Глухов', districtId: 'taganka', role: 'Охрана Бункера', greeting: 'Пропуск или пуля. Логика проста.', shortLore: 'Безопасность правительственного узла.' },
    ],
    dialogues: {
      npc_auditor: {
        id: 'npc_auditor', startNodeId: 'intro',
        nodes: {
          intro: {
            id: 'intro', speaker: 'ВЕЛИКИЙ_ИНКВИЗИТОР', text: 'Твой нейростек кажется... нестабильным. Я провожу аудит этого сектора. Какова цель твоей итерации в Таганском бункере?', options: [
              { text: 'Я просто курьер.', nextId: 'inter_lore' },
              { text: 'Ищу правду об "Октябре".', nextId: 'quest_hard' },
              { text: '[Уйти]', nextId: 'LEAVE' }
            ]
          },
          inter_lore: { id: 'inter_lore', speaker: 'ВЕЛИКИЙ_ИНКВИЗИТОР', text: 'Курьеры — это переменные. Переменные меняются. Я ищу константы. Будь осторожен, здесь логи не стираются.', options: [{ text: 'Понял.', nextId: 'intro' }] },
          quest_hard: {
            id: 'quest_hard', speaker: 'ВЕЛИКИЙ_ИНКВИЗИТОР', text: 'Правда — это привилегия тех, кто прошел аудит. Докажи свою валидность в бою с моим защитным модулем. Если выживешь — получишь доступ к архивам.', options: [
              { text: '[ ПРИНЯТЬ КОНТРАКТ: ГЛУБОКИЙ АУДИТ ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_taganka_combat_deep_audit_bug_sweep' }
            ]
          }
        }
      }
    }
  },
  {
    id: 'mitino',
    node: {
      id: 'mitino', 
      name: 'MITINO: RADIO_STORM', 
      description: 'Радио-рынок планетарного масштаба. Центр разгона железа и нелегальных антенн.', 
      x: 10, y: 15, stability: 85, type: 'trade', tier: 5,
      subNodes: [
        { id: 'npc_mentor', name: 'Spring Mentor', type: 'npc', description: 'Учит финальным техникам.', x: 50, y: 50 },
        { id: 'npc_radio_ham', name: 'Дядя Ваня', type: 'npc', description: 'Ловит сигналы из будущего.', x: 20, y: 20 },
        { id: 'npc_hardware_modder', name: 'Флэш', type: 'npc', description: 'Мастер оверклокинга.', x: 80, y: 80 },
        { id: 'npc_mitino_trader', name: 'Барыга Миша', type: 'npc', description: 'Ключи от всего.', x: 10, y: 85 },
        { id: 'bar_radio_wave', name: 'Бар "Волна"', type: 'bar', description: 'Здесь всегда фонит.', x: 40, y: 10 },
        { id: 'shop_frequency', name: 'Частота 440', type: 'shop', description: 'Ускорители деки.', x: 70, y: 30 },
        { id: 'combat_freq_jam', name: 'Подавление Частот', type: 'combat', description: 'Бой в белом шуме.', x: 25, y: 60 },
        { id: 'combat_modder_clash', name: 'Стык Разгонщиков', type: 'combat', description: 'Разборка за детали.', x: 85, y: 50 },
        { id: 'term_radio_relay', name: 'Радио-Реле', type: 'terminal', description: 'Доступ к глобальной сетке.', x: 60, y: 90 },
        { id: 'term_taxi_mitino', name: 'Такси: Митино', type: 'terminal', description: 'Выход на МКАД.', x: 95, y: 5 }
      ]
    },
    npcs: [
      { id: 'npc_mentor', name: 'Ментор курсов', districtId: 'mitino', role: 'Spring Mentor', greeting: 'Контроллер без теста - миф.', shortLore: 'Финальные pre-mid контракты.' },
      { id: 'npc_radio_ham', name: 'Дядя Ваня', districtId: 'mitino', role: 'Радиолюбитель', greeting: 'Слышу шум из подпространства.', shortLore: 'Ловит сигналы старых радио-реле.' },
      { id: 'npc_hardware_modder', name: 'Флэш', districtId: 'mitino', role: 'Разгонщик', greeting: 'Твой кулер не справится с моей логикой.', shortLore: 'Мастер оверклокинга и модинга.' },
      { id: 'npc_mitino_trader', name: 'Барыга Миша', districtId: 'mitino', role: 'Перекуп', greeting: 'Есть ключи на любой замок.', shortLore: 'Продает нелегальный софт и лицензии.' },
    ],
    dialogues: {
      npc_mentor: {
        id: 'npc_mentor', startNodeId: 'intro',
        nodes: {
          intro: {
            id: 'intro', speaker: 'МЕНТОР_КУРСОВ', text: 'Времени мало, кода много. Наши интенсивы "JetBrain-Zero" — твой единственный шанс не сгнить стажером. Какой стек прошиваем?', options: [
              { text: 'Класс: Kotlin Developer (350 Bits)', nextId: 'bought', cost: 350, effect: 'SET_PROFESSION', cardRewardId: 'kotlin_jun' },
              { text: 'Класс: Go Developer (400 Bits)', nextId: 'bought', cost: 400, effect: 'SET_PROFESSION', cardRewardId: 'go_jun' },
              { text: 'Класс: JS Developer (250 Bits)', nextId: 'bought', cost: 250, effect: 'SET_PROFESSION', cardRewardId: 'js_jun' },
              { text: '[Уйти]', nextId: 'LEAVE' }
            ]
          },
          bought: { id: 'bought', speaker: 'МЕНТОР_КУРСОВ', text: 'Теперь ты в элите. Иди и пиши так, чтобы Ядро лагало от зависти.', options: [{ text: 'Лечу!', nextId: 'LEAVE' }] }
        }
      },
      npc_mitino_trader: {
        id: 'npc_mitino_trader', startNodeId: 's',
        nodes: {
          s: { id: 's', speaker: 'БАРЫГА', text: 'Пс-с... Есть свежие ключи от Spring Boot. Прямо с завода, муха не сидела. Берешь?', options: [{ text: 'Купить ключ (60 Bits)', nextId: 'LEAVE', cost: 60, effect: 'GIVE_CARD', cardRewardId: 'fn_ping' }, { text: 'Уйти', nextId: 'LEAVE' }] }
        }
      }
    }
  }
];
