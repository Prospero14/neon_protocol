import { MAP_NODES } from './mapData';

export type QuestType = 'talk' | 'combat' | 'delivery' | 'diagnostics';
export type QuestDifficulty = 'quick' | 'standard' | 'hard';

export interface QuestDefinition {
  id: string;
  title: string;
  districtId: string;
  giverNpcId: string;
  description?: string;
  objectiveNodeId?: string;
  type: QuestType;
  difficulty: QuestDifficulty;
  tier: number;
  preClassOnly?: boolean;
}
const TYPE_PREFIX: Record<string, string> = {
  combat: 'БОЙ',
  talk: 'СВЯЗЬ',
  delivery: 'ДОСТ',
  diagnostics: 'ДИАГ'
};

const NPC_QUEST_BLUEPRINTS = [
  {
    suffix: 'signal_sweep',
    title: 'Прочес сети',
    type: 'diagnostics' as const,
    difficulty: 'quick' as const,
    text: 'Сними показания с узлов и верни короткий отчёт.',
  },
  {
    suffix: 'local_contract',
    title: 'Локальный контракт',
    type: 'talk' as const,
    difficulty: 'standard' as const,
    text: 'Собери требования заказчика и закрой тикет без эскалации.',
  },
];

const COMBAT_QUEST_BLUEPRINTS = [
  {
    suffix: 'bug_sweep',
    title: 'Зачистка бага',
    type: 'combat' as const,
    difficulty: 'standard' as const,
    text: 'Подави нестабильный узел в районе и стабилизируй сервис.',
  },
  {
    suffix: 'secure_delivery',
    title: 'Безопасная доставка',
    type: 'delivery' as const,
    difficulty: 'hard' as const,
    text: 'Доставь пакет через враждебный сегмент без потери данных.',
  },
];

function buildNpcQuests() {
  const quests: QuestDefinition[] = [];
  for (const district of MAP_NODES) {
    const npcs = district.subNodes?.filter((s) => s.type === 'npc') ?? [];
    for (const npc of npcs) {
      NPC_QUEST_BLUEPRINTS.forEach((b, idx) => {
        quests.push({
          id: `q_${district.id}_${npc.id}_${b.suffix}`,
          title: `[${TYPE_PREFIX[b.type] || '????'}] ${b.title}: ${npc.name}`,
          districtId: district.id,
          giverNpcId: npc.id,
          description: b.text,
          type: b.type,
          difficulty: b.difficulty,
          tier: district.tier,
          preClassOnly: idx === 0,
        });
      });
    }
  }
  return quests;
}

function buildCombatDistrictQuests() {
  const quests: QuestDefinition[] = [];
  for (const district of MAP_NODES) {
    const combats = district.subNodes?.filter((s) => s.type === 'combat') ?? [];
    for (const node of combats) {
      COMBAT_QUEST_BLUEPRINTS.forEach((b, idx) => {
        quests.push({
          id: `q_${district.id}_${node.id}_${b.suffix}`,
          title: `[${TYPE_PREFIX[b.type] || '????'}] ${b.title}: ${node.name}`,
          districtId: district.id,
          giverNpcId: (district.subNodes?.find((s) => s.type === 'npc')?.id ?? node.id),
          objectiveNodeId: node.id,
          description: b.text,
          type: b.type,
          difficulty: b.difficulty,
          tier: district.tier,
          preClassOnly: idx === 0,
        });
      });
    }
  }
  return quests;
}

const TUTORIAL_QUESTS: QuestDefinition[] = [
  {
    id: 'q_kiddo_start',
    title: '[ВВОД] Пробуждение в Altufyevo',
    description: 'Не знаешь что делать? Поговори с Петровичем в "Синем Чипе", он направит.',
    districtId: 'altufyevo',
    giverNpcId: 'job_board_alt',
    type: 'talk',
    objectiveNodeId: 'npc_petrovich',
    difficulty: 'quick',
    tier: 1,
    preClassOnly: true,
  },
  {
    id: 'q_kiddo_first_bits',
    title: '[ВВОД] Первые Bits',
    description: 'Петрович не работает бесплатно. Найди Доску Объявлений в Алтуфьево и заверши простейший контракт на чистку кэша.',
    districtId: 'altufyevo',
    giverNpcId: 'job_board_alt',
    objectiveNodeId: 'combat_rats', // Changed to the actual combat node
    type: 'combat',
    difficulty: 'quick',
    tier: 1,
    preClassOnly: true,
  },
  {
    id: 'q_altufyevo_data_leak',
    title: 'Утечка пакетов L1',
    description: 'Обнаружена потеря пакетов данных рядом с узлом Синего Чипа. Требуется провести диагностику сети.',
    districtId: 'altufyevo',
    giverNpcId: 'job_board_alt',
    objectiveNodeId: 'bar_chips', // Players have to go to Blue Chip bar area for diagnostics
    type: 'diagnostics',
    difficulty: 'quick',
    tier: 1,
    preClassOnly: true,
  },
  {
    id: 'q_bar_copy_logs',
    title: '[ПАЙПЛАЙН] Компрометирующие логи',
    description: 'Нервный Клиент из бара Синий Чип нанял вас, чтобы вытащить данные из Удаленного Прокси. Требуется собрать алгоритмическую цепь: ls -> grep -> scp.',
    districtId: 'altufyevo',
    giverNpcId: 'bar_chips', // Dialog occurs in bar_chips node
    objectiveNodeId: 'combat_client_proxy', // This is where combat happens
    type: 'combat',
    difficulty: 'standard',
    tier: 1,
  },
  {
    id: 'q_altufyevo_scrap_hunt',
    title: 'Охота за Восходом',
    description: 'Серый просит добыть процессоры с ботов "Восход" на Свалке.',
    districtId: 'altufyevo',
    giverNpcId: 'shop_scrap',
    objectiveNodeId: 'combat_nixanna_ritual', // Let's pretend they spawn near the Ritual node
    type: 'combat',
    difficulty: 'standard',
    tier: 1,
    preClassOnly: true,
  },
  {
    id: 'q_kiddo_metro_access',
    title: '[ВВОД] Путь в Центр',
    description: 'Чтобы покинуть окраины, тебе нужен доступ к Такси. Собери 100 Bits и разблокируй терминал в Алтуфьево.',
    districtId: 'altufyevo',
    giverNpcId: 'term_taxi_alt',
    objectiveNodeId: 'term_taxi_alt',
    type: 'talk',
    difficulty: 'standard',
    tier: 1,
    preClassOnly: true,
  },
  {
    id: 'q_trainee_exam_theory',
    title: '[ЭКЗАМЕН] Теория Архитектуры',
    description: 'Найди Профессора Туранова на Юго-Западной. Он проверит твои знания основ перед тем, как допустить к Боевому Экзамену.',
    districtId: 'south_west',
    giverNpcId: 'npc_professor',
    type: 'talk',
    difficulty: 'standard',
    tier: 1,
    preClassOnly: true,
  },
  {
    id: 'q_trainee_exam_practice',
    title: '[ЭКЗАМЕН] Боевой Диплом',
    description: 'Финальный этап. Докажи Профессору, что ты можешь не только рассуждать о Java, но и дебажить реальность. Победи тренировочного бота на ВДНХ.',
    districtId: 'vdnkh',
    giverNpcId: 'npc_besm',
    objectiveNodeId: 'combat_pavilions',
    type: 'combat',
    difficulty: 'hard',
    tier: 1,
    preClassOnly: true,
  },
  {
    id: 'q_academy_combat_training',
    title: '[ПРАКТИКА] Боевой Дибаг',
    description: 'Тьютор-бот "Индекс" вызвал тебя на учебный поединок. Победи Тренировочного Манекена, чтобы подтвердить свою квалификацию.',
    districtId: 'academy',
    giverNpcId: 'npc_academy_tutor',
    objectiveNodeId: 'academy_tutorial_debug',
    type: 'combat',
    difficulty: 'quick',
    tier: 1,
    preClassOnly: true,
  },
  {
    id: 'q_bibirevo_monya_intro',
    title: '[СВЯЗЬ] Визит к Моне',
    description: 'Варвар просил навестить Связиста Моню в Бибирево. Он выдал пару жетонов на такси для быстрого перемещения.',
    districtId: 'bibirevo',
    giverNpcId: 'npc_varvar',
    objectiveNodeId: 'npc_signalman',
    type: 'talk',
    difficulty: 'standard',
    tier: 1,
  },
  {
    id: 'q_maryino_qa_audit',
    title: '[QUAD] Аудит безопасности',
    description: 'Trace (QA) просит собрать дампы с трех терминалов в секторе и проверить их на наличие аномалий в заголовках. Награда: 50 Bits.',
    districtId: 'maryino',
    giverNpcId: 'npc_tanya',
    type: 'talk',
    difficulty: 'standard',
    tier: 1,
    preClassOnly: true,
  },
  {
    id: 'q_maryino_scrap_raid',
    title: '[VOID] Рейд за деталями',
    description: 'Крыса-курьер наводку на склад Regulators. Нужно зайти и "приватизировать" пару модулей памяти. Ожидается сопротивление.',
    districtId: 'maryino',
    giverNpcId: 'npc_rat',
    objectiveNodeId: 'combat_local_lan',
    type: 'combat',
    difficulty: 'hard',
    tier: 1,
    preClassOnly: true,
  },
  {
    id: 'q_maryino_shluz_repair',
    title: '[RPG] Ремонт шлюза',
    description: 'Сержант сообщает, что система авторизации на южном шлюзе "зависла". Нужно вручную обнулить триггер в консоли управления.',
    districtId: 'maryino',
    giverNpcId: 'npc_sarge',
    type: 'talk',
    difficulty: 'quick',
    tier: 1,
    preClassOnly: true,
  },
  {
    id: 'q_maryino_terminal_404',
    title: '[TECH] Восстановление 404',
    description: 'Терминал #404 содержит битые сектора. Если вы сможете восстановить таблицу разделов, вы получите доступ к скрытым архивам Анархистов.',
    districtId: 'maryino',
    giverNpcId: 'term_404',
    type: 'talk',
    difficulty: 'standard',
    tier: 1,
    preClassOnly: true,
  },
  {
    id: 'q_maryino_passage',
    title: '[RPG] Переправа: Марьино',
    description: 'Для свободного прохода через южные узлы нужно договориться с группировкой "Восход". Начни с Крысы-курьера, он знает, кто здесь держит улицу.',
    districtId: 'maryino',
    giverNpcId: 'npc_rat',
    type: 'talk',
    difficulty: 'standard',
    tier: 1,
    preClassOnly: true,
  },
  {
    id: 'q_professor_garbage',
    title: '[АКАДЕМИЯ] Сборка мусора',
    description: 'В Мейнфрейме Университета скопилось слишком много "битых ссылок". Профессор просит провести ручную дефрагментацию и очистку памяти.',
    districtId: 'south_west',
    giverNpcId: 'npc_professor',
    objectiveNodeId: 'combat_academic_guard',
    type: 'combat',
    difficulty: 'standard',
    tier: 1,
    preClassOnly: false,
  },
  {
    id: 'q_trace_stress_test',
    title: '[QUAD] Стресс-тест сети',
    description: 'Trace (QA) из Марьино требует провести принудительный прозвон (ping) локальных узлов. Пакеты теряются, и нужно выяснить, где именно происходит затык.',
    districtId: 'maryino',
    giverNpcId: 'npc_tanya',
    objectiveNodeId: 'combat_local_lan',
    type: 'combat',
    difficulty: 'standard',
    tier: 1,
    preClassOnly: true,
  },
  {
    id: 'q_rat_data_dump',
    title: '[VOID] Нелегальный дамп',
    description: 'Крыса-курьер хочет, чтобы вы отбили серверную ферму в "Buffer Overflow Zone". Там спрятаны ценные данные Анархистов.',
    districtId: 'maryino',
    giverNpcId: 'npc_rat',
    objectiveNodeId: 'combat_overflow',
    type: 'combat',
    difficulty: 'hard',
    tier: 1,
    preClassOnly: true,
  },
  {
    id: 'q_besm_vintage_code',
    title: '[RPG] Винтажный код',
    description: 'Генерал БЭСМ ищет драйверы для своей архитектуры 1974 года. Попробуйте найти их у Скупщика на рынке в Измайлово.',
    districtId: 'vdnkh',
    giverNpcId: 'npc_besm',
    type: 'talk',
    difficulty: 'standard',
    tier: 1,
    preClassOnly: true,
  },
  {
    id: 'q_monya_signal_echo',
    title: '[RPG] Эхо сигнала',
    description: 'Связист Моня из Бибирево жалуется на помехи. Гид в ВДНХ может знать о старых зонах радиомолчания в этом районе.',
    districtId: 'bibirevo',
    giverNpcId: 'npc_signalman',
    type: 'talk',
    difficulty: 'standard',
    tier: 1,
    preClassOnly: true,
  },
  {
    id: 'q_verstak_cooling',
    title: '[DELIVERY] Хладагент для Верстака',
    description: 'Мастеру Верстаку из Измайлово нужен технический хладагент. Его можно достать у Крысы-курьера в Марьино.',
    districtId: 'izmailovo',
    giverNpcId: 'npc_master',
    type: 'delivery',
    difficulty: 'standard',
    tier: 1,
    preClassOnly: true,
  },
  {
    id: 'q_niksanna_recommendation',
    title: '[TALK] Рекомендация в Академию',
    description: 'Никсанна хочет, чтобы вы пошли в Академию. Обратитесь к Профессору Туранову в Юго-Западном секторе с её "визуальным образцом".',
    districtId: 'altufyevo',
    giverNpcId: 'npc_niksanna',
    type: 'talk',
    difficulty: 'standard',
    tier: 1,
    preClassOnly: true,
  },
  {
    id: 'q_altufyevo_data_leak',
    title: '[REPAIR] Утечка в распредщите',
    description: 'Узел связи в Алтуфьево коротит на массу. Нужно найти распредщит и принудительно патчить изоляцию протокола.',
    districtId: 'altufyevo',
    giverNpcId: 'job_board_alt',
    type: 'talk',
    difficulty: 'quick',
    tier: 1,
    preClassOnly: true,
  },
  {
    id: 'q_altufyevo_silo_scout',
    title: '[SCAN] Тепловая карта Силоса 7',
    description: 'Варвару нужны данные о температуре в 7-м силосе. Литейные цени перекрыты, но консоль в Силосе №7 всё еще доступна для ручной диагностики.',
    districtId: 'altufyevo',
    giverNpcId: 'npc_varvar',
    objectiveNodeId: 'term_silo_7',
    type: 'diagnostics',
    difficulty: 'quick',
    tier: 1,
    preClassOnly: true,
  },
  {
    id: 'q_altufyevo_scrap_hunt',
    title: '[COMBAT] Охота за хламом',
    description: 'Скупщику нужны запчасти от ботов "Восход". Отправься в зону Свалки и добудь пару рабочих процессоров.',
    districtId: 'altufyevo',
    giverNpcId: 'shop_scrap',
    objectiveNodeId: 'combat_rats',
    type: 'combat',
    difficulty: 'standard',
    tier: 1,
    preClassOnly: true,
  },
  {
    id: 'q_altufyevo_varvar_backup',
    title: '[DELIVERY] Доставка бэкапа',
    description: 'Варвару нужно передать зашифрованный бэкап Связисту Моне в Бибирево. Это старый долг по коду.',
    districtId: 'altufyevo',
    giverNpcId: 'npc_varvar',
    type: 'delivery',
    difficulty: 'standard',
    tier: 1,
    preClassOnly: true,
  },
  {
    id: 'q_weaver_pattern',
    title: '[DELIVERY] Паттерн Ткача',
    description: 'Старшему Ткачу из Текстильщиков нужен старый промышленный паттерн. Он должен быть в архивах Академии на Юго-Западе.',
    districtId: 'tekstilschiki',
    giverNpcId: 'npc_weaver_senior',
    type: 'delivery',
    difficulty: 'standard',
    tier: 1,
    preClassOnly: false,
  },
  {
    id: 'q_vykhino_delivery',
    title: '[DELIVERY] Опечатанный архив',
    description: 'Грузчик из Выхино просит доставить тяжелый опечатанный блок данных Петровичу в Алтуфьево. Будьте осторожны на перегонах.',
    districtId: 'vykhino',
    giverNpcId: 'npc_vykhino_loader',
    type: 'delivery',
    difficulty: 'standard',
    tier: 1,
    preClassOnly: true,
  },
  {
    id: 'q_vykhino_subway_leak',
    title: '[REPAIR] Сигнал перегона',
    description: 'Менеджер каналов сообщает о рассинхронизации сигналов на путях. Нужно найти релейный шкаф и обновить прошивку.',
    districtId: 'vykhino',
    giverNpcId: 'npc_link_manager',
    type: 'talk',
    difficulty: 'quick',
    tier: 1,
    preClassOnly: true,
  },
  {
    id: 'q_vykhino_audit_evasion',
    title: '[TECH] Чистка логов аудита',
    description: 'Грей хочет, чтобы вы пробрались к центральному терминалу и удалили логи посещений за последние 24 часа. Аудиторы GigaBank наступают на пятки.',
    districtId: 'vykhino',
    giverNpcId: 'npc_grey',
    objectiveNodeId: 'vykhino_audit_wipe',
    type: 'combat',
    difficulty: 'standard',
    tier: 1,
    preClassOnly: true,
  },
  {
    id: 'q_vykhino_transit_tax',
    title: '[TALK] Сбор дебита',
    description: 'Фиксер Батя просит напомнить бармену в "Транзите", что за безопасность нужно платить. Соберите долю и вернитесь к Бате.',
    districtId: 'vykhino',
    giverNpcId: 'npc_job_boss',
    type: 'talk',
    difficulty: 'quick',
    tier: 1,
    preClassOnly: true,
  },
  {
    id: 'q_vykhino_corp_favor',
    title: '[SCAN] Корпоративный шпионаж',
    description: 'Скаут GigaBank обещает бонусы за сканирование частот, на которых общаются Redundants. Нужно найти их "тихий" узел.',
    districtId: 'vykhino',
    giverNpcId: 'npc_corp_scout',
    type: 'talk',
    difficulty: 'standard',
    tier: 1,
    preClassOnly: true,
  },
  {
    id: 'q_chertanovo_privacy',
    title: '[TALK] Протокол приватности',
    description: 'Параноидальному жителю Чертаново нужен "Privacy Patch". Никсанна из Алтуфьево — единственный мастер, кто может его собрать.',
    districtId: 'chertanovo',
    giverNpcId: 'npc_chertanovo_paranoid',
    type: 'talk',
    difficulty: 'standard',
    tier: 1,
    preClassOnly: true,
  },
  {
    id: 'q_sokolniki_haunted_logs',
    title: '[VOID] Призрак в машине: Сокольники',
    description: 'В заброшенной лаборатории Сокольников проснулся древний ИИ-ассистент. Он бредит и спамит в сеть фрагментами удаленных логов. Нужно либо упокоить его, либо вылечить.',
    districtId: 'sokolniki',
    giverNpcId: 'npc_ghost_server',
    type: 'talk',
    difficulty: 'hard',
    tier: 2,
    preClassOnly: false,
  },
  {
    id: 'q_fili_media_leak',
    title: '[MEDIA] Утечка на Орбите: Фили',
    description: 'Эхо (медиа-брокер) ищет "жареные" факты о слиянии корпораций. Спутник перехватил поток данных, но он зашифрован ключом 4-й категории.',
    districtId: 'fili',
    giverNpcId: 'npc_echo_broker',
    type: 'talk',
    difficulty: 'standard',
    tier: 4,
    preClassOnly: false,
  },
  {
    id: 'q_mitino_black_market_ping',
    title: '[VOID] Прозвон черного рынка: Митино',
    description: 'Теневой Скупщик хочет проверить стабильность скрытых каналов связи перед крупной сделкой. Нужно провести серию скрытых "пингов" без привлечения внимания Регуляторов.',
    districtId: 'mitino',
    giverNpcId: 'npc_market_shady',
    type: 'talk',
    difficulty: 'quick',
    tier: 2,
    preClassOnly: false,
  },
  {
    id: 'q_perovo_combat_commissar_redistribution',
    title: '[RED] Экспроприация данных',
    description: 'Комиссар Байт требует перехватить конвой Gigabank и обнулить долговые реестры жителей Перово. Это удар по самому сердцу финансовой диктатуры.',
    districtId: 'perovo',
    giverNpcId: 'npc_commissar_byte',
    objectiveNodeId: 'perovo_shluze_4', 
    type: 'combat',
    difficulty: 'hard',
    tier: 3,
    preClassOnly: false,
  },
  {
    id: 'q_academy_student_research',
    title: '[SCAN] Сбор данных для курсовой',
    description: 'Студент-Прикладник в Академии просит собрать три дампа с внешних узлов для его работы по низкоуровневым протоколам.',
    districtId: 'academy',
    giverNpcId: 'npc_academy_student',
    type: 'diagnostics',
    difficulty: 'quick',
    tier: 1,
    preClassOnly: true,
  },
  {
    id: 'q_chertanovo_find_zero',
    title: '[TALK] Поиск Z3R0',
    description: 'Глюк в Чертаново упомянул некоего Z3R0, который "видит пустоту". Нужно найти его в этом районе.',
    districtId: 'chertanovo',
    giverNpcId: 'npc_glitch',
    type: 'talk',
    difficulty: 'quick',
    tier: 1,
    preClassOnly: true,
  },
  {
    id: 'q_sokol_talk_lab_delivery',
    title: '[ДОСТ] Методички по Ассемблеру',
    description: 'Лаборант Илья просит доставить учебные материалы Профессору Туранову. Простое задание для укрепления репутации.',
    districtId: 'sokol',
    giverNpcId: 'npc_lab_assistant',
    type: 'delivery',
    difficulty: 'quick',
    tier: 1,
    preClassOnly: true,
  },
  {
    id: 'q_sokol_combat_drone_training',
    title: '[БОЙ] Тренировочный полет',
    description: 'Пилот Дронов готов провести учебный спарринг. Попробуй выжить под натиском легких дронов.',
    districtId: 'sokol',
    giverNpcId: 'npc_drone_pilot',
    type: 'combat',
    difficulty: 'quick',
    tier: 1,
    preClassOnly: true,
  },
  {
    id: 'q_sokol_fetch_chip_quest',
    title: '[TECH] Поиск чипа "Стриж-4"',
    description: 'Инженер ищет редкий чип управления. Спроси у Семёныча, он знает все свалки Сокола.',
    districtId: 'sokol',
    giverNpcId: 'npc_avionics_dev',
    type: 'talk',
    difficulty: 'standard',
    tier: 1,
    preClassOnly: true,
  },
  {
    id: 'q_bibirevo_energy',
    title: '[RPG] Энергия для Кодера',
    description: 'Сонный Кодер в Бибирево засыпает на ходу. Ему нужен особый чай "Дзен-Лог" от Олега на ВДНХ.',
    districtId: 'bibirevo',
    giverNpcId: 'npc_bibirevo_coder',
    type: 'talk',
    difficulty: 'standard',
    tier: 1,
    preClassOnly: true,
  },
  {
    id: 'q_sokolniki_herb_data',
    title: '[SCAN] Био-ритмы леса',
    description: 'Друиду Арборису нужны данные о чистоте почвы в Сокольниках. Просканируй три точки и вернись к нему.',
    districtId: 'sokolniki',
    giverNpcId: 'npc_druid_coder',
    type: 'diagnostics',
    difficulty: 'standard',
    tier: 1,
    preClassOnly: true,
  },
  {
    id: 'q_fili_satellite_interception',
    title: '[MEDIA] Орбитальный перехват',
    description: 'Луна из Фили пытается поймать сигнал со старого спутника. Ей нужна помощь с релейным оборудованием из Митино.',
    districtId: 'fili',
    giverNpcId: 'npc_orbit_stalker',
    type: 'talk',
    difficulty: 'standard',
    tier: 1,
    preClassOnly: true,
  },
  {
    id: 'q_mitino_radio_relay',
    title: '[TECH] Радио-реле Дяди Вани',
    description: 'Дядя Ваня в Митино готов собрать реле, но ему не хватает запчастей. Нужно найти Флэша.',
    districtId: 'mitino',
    giverNpcId: 'npc_radio_ham',
    type: 'talk',
    difficulty: 'standard',
    tier: 1,
    preClassOnly: true,
  },
  {
    id: 'q_mitino_hardware_mod',
    title: '[TECH] Тюнинг Флэша',
    description: 'Флэш может разогнать реле, если ты поможешь ему с тестами на Свалке.',
    districtId: 'mitino',
    giverNpcId: 'npc_hardware_modder',
    type: 'talk',
    difficulty: 'standard',
    tier: 1,
    preClassOnly: true,
  },
  {
    id: 'q_fili_audit_logs',
    title: '[ADMIN] Логи Архивариуса',
    description: 'Архивариус в Фили нашел странные записи в логах. Их нужно передать Аудитору в Таганку для расшифровки.',
    districtId: 'fili',
    giverNpcId: 'npc_archivist',
    type: 'delivery',
    difficulty: 'standard',
    tier: 1,
    preClassOnly: true,
  },
  {
    id: 'q_taganka_bribe_negotiation',
    title: '[CORP] Переговоры в Таганке',
    description: 'Аудитор в Таганке не хочет делиться инфой бесплатно. Нужно либо заплатить, либо найти компромат.',
    districtId: 'taganka',
    giverNpcId: 'npc_auditor',
    type: 'talk',
    difficulty: 'hard',
    tier: 2,
    preClassOnly: true,
  },
  {
    id: 'q_hub_signature',
    title: '[TALK] Подпись Петровича',
    description: 'Для обхода системы в Таганке нужна цифровая подпись Петровича из Хаба.',
    districtId: 'hub',
    giverNpcId: 'npc_petrovich',
    type: 'talk',
    difficulty: 'quick',
    tier: 2,
    preClassOnly: true,
  },
  {
    id: 'q_taganka_combat_deep_audit_bug_sweep', // Inferred ID for the combat quest defined in dialogue
    title: '[CORP] Глубокий Аудит',
    description: 'Великий Инквизитор требует принести Истину из глубин Бункера. SSH -> Auth -> Sudo-Patch -> SCP. Ошибка недопустима.',
    districtId: 'taganka',
    giverNpcId: 'npc_auditor',
    objectiveNodeId: 'taganka_deep_audit',
    type: 'combat',
    difficulty: 'hard',
    tier: 4,
    preClassOnly: false,
  },
  {
    id: 'q_punitive_squad_combat',
    title: '[SYSTEM] Система Подавления',
    description: 'Система Регуляторов обнаружила девиацию. Приказ 77 в действии. Порядок подавления: LS -> Auth -> Sudo-Patch -> Wash -> RM. Ошибка — смерть.',
    districtId: 'punitive',
    giverNpcId: 'punitive_squad',
    objectiveNodeId: 'punitive_squad_wipe',
    type: 'combat',
    difficulty: 'hard',
    tier: 5,
    preClassOnly: false,
  },
  {
    id: 'q_mitino_debt',
    title: '[VOID] Долги Митино',
    description: 'Флэш задолжал Барыге Мише. Нужно либо отдать Bits, либо отработать на Свалке.',
    districtId: 'mitino',
    giverNpcId: 'npc_hardware_modder',
    type: 'talk',
    difficulty: 'standard',
    tier: 1,
    preClassOnly: true,
  },
  {
    id: 'q_altufyevo_silo_clear',
    title: '[ВВОД] Зачистка Силоса 7',
    description: 'Петрович говорит, что системы охлаждения шумят из-за стаи крыс-кодеров. Помоги ему стабилизировать узел в зоне "СИЛОС №7: ВНУТРЕННИЙ КОНТУР".',
    districtId: 'altufyevo',
    giverNpcId: 'npc_petrovich',
    objectiveNodeId: 'combat_silo_inner',
    type: 'combat',
    difficulty: 'standard',
    tier: 1,
    preClassOnly: true,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// DISTRICT NARRATIVE QUESTS
// Unique quests defined in dialogue trees that need explicit entries in QUEST_LIBRARY.
// These do not follow the auto-generated pattern and require manual registration.
// ─────────────────────────────────────────────────────────────────────────────
const DISTRICT_NARRATIVE_QUESTS: QuestDefinition[] = [
  // ── BIBIREVO ──
  { id: 'q_bibirevo_job_jitter', title: '[ДИАГ] Джиттер в сети', districtId: 'bibirevo', giverNpcId: 'job_board_bibi', type: 'diagnostics', difficulty: 'quick', tier: 1 },
  { id: 'q_bibirevo_job_fix_link', title: '[РЕМОНТ] Стабилизация канала', districtId: 'bibirevo', giverNpcId: 'job_board_bibi', type: 'talk', difficulty: 'standard', tier: 1 },
  
  // ── CHERTANOVO ──
  { id: 'q_chertanovo_combat_anarcho_cell_bug_sweep', title: '[БОЙ] Ячейка Анархистов', districtId: 'chertanovo', giverNpcId: 'npc_glitch', objectiveNodeId: 'combat_anarcho_cell', type: 'combat', difficulty: 'standard', tier: 1 },
  { id: 'q_chertanovo_combat_night_scan_bug_sweep', title: '[БОЙ] Ночной Скан', districtId: 'chertanovo', giverNpcId: 'npc_glitch', objectiveNodeId: 'combat_night_scan', type: 'combat', difficulty: 'hard', tier: 1 },

  // ── FILI ──
  { id: 'q_fili_combat_satellite_crash_bug_sweep', title: '[БОЙ] Крушение Спутника', districtId: 'fili', giverNpcId: 'npc_kosmos', objectiveNodeId: 'combat_satellite_crash', type: 'combat', difficulty: 'hard', tier: 4 },
  { id: 'q_fili_combat_launch_guard_bug_sweep', title: '[БОЙ] Охрана Запуска', districtId: 'fili', giverNpcId: 'npc_orbit_stalker', objectiveNodeId: 'combat_launch_guard', type: 'combat', difficulty: 'standard', tier: 4 },
  { id: 'q_fili_hardware_repair', title: '[РЕМОНТ] Калибровка ретранслятора', districtId: 'fili', giverNpcId: 'npc_rocket_eng', type: 'talk', difficulty: 'standard', tier: 1 },

  // ── HUB (KITAY-GOROD) ──
  { id: 'q_hub_digital_signature', title: '[CORP] Цифровая Подпись Хаба', districtId: 'kitay_gorod', giverNpcId: 'npc_gb_agent', type: 'talk', difficulty: 'hard', tier: 2 },

  // ── IZMAILOVO ──
  { id: 'q_izmailovo_combat_job_craft_scrap_bug_sweep', title: '[БОЙ] Сбор деталей на свалке', districtId: 'izmailovo', giverNpcId: 'npc_master', objectiveNodeId: 'job_craft_scrap', type: 'combat', difficulty: 'standard', tier: 1 },
  { id: 'q_izmailovo_old_timer_capacitor', title: '[DELIVERY] Винтажный конденсатор', districtId: 'izmailovo', giverNpcId: 'npc_old_timer', type: 'delivery', difficulty: 'standard', tier: 1 },
  { id: 'q_izmailovo_master_verstak_parts', title: '[DELIVERY] Детали для Верстака', districtId: 'izmailovo', giverNpcId: 'npc_master', type: 'delivery', difficulty: 'standard', tier: 1 },

  // ── MARYINO ──
  { id: 'q_maryino_combat_grid_patrol_bug_sweep', title: '[БОЙ] Патруль Сетки', districtId: 'maryino', giverNpcId: 'npc_sarge', objectiveNodeId: 'combat_grid_patrol', type: 'combat', difficulty: 'standard', tier: 1 },
  { id: 'q_maryino_npc_tanya_signal_sweep', title: '[ДИАГ] Сигнальный Прочес', districtId: 'maryino', giverNpcId: 'npc_tanya', type: 'diagnostics', difficulty: 'quick', tier: 1 },

  // ── MITINO ──
  { id: 'q_mitino_combat_drone_hunt_bug_sweep', title: '[БОЙ] Охота на дроны', districtId: 'mitino', giverNpcId: 'npc_mitino_trader', objectiveNodeId: 'combat_drone_hunt', type: 'combat', difficulty: 'standard', tier: 2 },
  { id: 'q_mitino_combat_freq_jam_bug_sweep', title: '[БОЙ] Частотная Глушилка', districtId: 'mitino', giverNpcId: 'npc_slick_shady', objectiveNodeId: 'combat_freq_jam', type: 'combat', difficulty: 'hard', tier: 2 },
  { id: 'q_mitino_term_relay_stabilizer', title: '[TECH] Стабилизация реле', districtId: 'mitino', giverNpcId: 'npc_radio_ham', objectiveNodeId: 'term_radio_relay', type: 'diagnostics', difficulty: 'quick', tier: 1 },

  // ── PEROVO ──
  { id: 'q_perovo_communitarian_distro', title: '[RED] Распределение трафика', districtId: 'perovo', giverNpcId: 'npc_commissar_byte', type: 'talk', difficulty: 'quick', tier: 3 },
  { id: 'q_perovo_factory_strike', title: '[RED] Стачка на заводе', districtId: 'perovo', giverNpcId: 'npc_commissar_byte', objectiveNodeId: 'engine_perovo', type: 'talk', difficulty: 'hard', tier: 3 },
  { id: 'q_perovo_engine_repair', title: '[РЕМОНТ] Калибровка турбины', districtId: 'perovo', giverNpcId: 'npc_foreman', objectiveNodeId: 'engine_perovo', type: 'talk', difficulty: 'standard', tier: 1 },
  { id: 'q_perovo_combat_data_mining_bug_sweep', title: '[БОЙ] Осада процесс-майнером', districtId: 'perovo', giverNpcId: 'npc_marina', objectiveNodeId: 'combat_data_mining', type: 'combat', difficulty: 'standard', tier: 1 },
  { id: 'q_perovo_marina_log_clean', title: '[ДИАГ] Очистка логов Марины', districtId: 'perovo', giverNpcId: 'npc_marina', type: 'diagnostics', difficulty: 'quick', tier: 1 },
  { id: 'q_perovo_combat_rat_invasion_bug_sweep', title: '[БОЙ] Истребление системных крыс', districtId: 'perovo', giverNpcId: 'npc_resident_perovo', objectiveNodeId: 'combat_rat_invasion', type: 'combat', difficulty: 'quick', tier: 1 },
  { id: 'q_perovo_zina_delivery', title: '[DELIVERY] Ящик для Петровича', districtId: 'perovo', giverNpcId: 'npc_zina', type: 'delivery', difficulty: 'standard', tier: 1 },

  // ── SOKOL ──
  { id: 'q_sokol_sysadmin_certification', title: '[CERT] Сертификация SysAdmin', districtId: 'sokol', giverNpcId: 'npc_dean', type: 'talk', difficulty: 'hard', tier: 2 },
  { id: 'q_sokol_qa_certification', title: '[CERT] Сертификация QA Tester', districtId: 'sokol', giverNpcId: 'npc_dean', type: 'talk', difficulty: 'hard', tier: 2 },
  { id: 'q_sokol_combat_drone_swarm_bug_sweep', title: '[БОЙ] Рой дронов', districtId: 'sokol', giverNpcId: 'npc_retired_tester', objectiveNodeId: 'combat_drone_swarm', type: 'combat', difficulty: 'standard', tier: 2 },
  { id: 'q_sokol_combat_server_overheat_bug_sweep', title: '[БОЙ] Перегрев серверной', districtId: 'sokol', giverNpcId: 'npc_retired_tester', objectiveNodeId: 'combat_server_overheat', type: 'combat', difficulty: 'hard', tier: 2 },

  // ── SOKOLNIKI ──
  { id: 'q_sokolniki_hardware_repair', title: '[РЕМОНТ] Стойка лесного сервера', districtId: 'sokolniki', giverNpcId: 'npc_forest_guard', type: 'talk', difficulty: 'quick', tier: 1 },
  { id: 'q_sokolniki_combat_fox_virus_bug_sweep', title: '[БОЙ] Вирус Лис', districtId: 'sokolniki', giverNpcId: 'npc_ghost_server', objectiveNodeId: 'combat_fox_virus', type: 'combat', difficulty: 'hard', tier: 2 },
  { id: 'q_sokolniki_combat_recursive_loop_bug_sweep', title: '[БОЙ] Рекурсивный Цикл', districtId: 'sokolniki', giverNpcId: 'npc_hermit', objectiveNodeId: 'combat_recursive_loop', type: 'combat', difficulty: 'hard', tier: 2 },
  { id: 'q_sokolniki_term_forest_calibration', title: '[ДИАГ] Калибровка лесного терминала', districtId: 'sokolniki', giverNpcId: 'npc_druid_coder', objectiveNodeId: 'term_forest_log', type: 'diagnostics', difficulty: 'standard', tier: 1 },

  // ── SOUTH WEST ──
  { id: 'q_south_west_profiler', title: '[TECH] Профилировщик Мейнфрейма', districtId: 'south_west', giverNpcId: 'npc_compiler', objectiveNodeId: 'combat_academic_guard', type: 'combat', difficulty: 'standard', tier: 1 },
  { id: 'q_south_west_combat_academic_guard_bug_sweep', title: '[БОЙ] Зачистка Мейнфрейма', districtId: 'south_west', giverNpcId: 'npc_compiler', objectiveNodeId: 'combat_academic_guard', type: 'combat', difficulty: 'hard', tier: 1 },

  // ── TAGANKA ──
  { id: 'q_taganka_bounty_shadow_coder', title: '[BOUNTY] Теневой Программист', districtId: 'taganka', giverNpcId: 'job_board_taganka', objectiveNodeId: 'combat_ghost_process', type: 'combat', difficulty: 'hard', tier: 4 },
  { id: 'q_taganka_bounty_modem_ghost', title: '[BOUNTY] Призрак Модема', districtId: 'taganka', giverNpcId: 'job_board_taganka', objectiveNodeId: 'combat_ghost_process', type: 'combat', difficulty: 'hard', tier: 4 },
  { id: 'q_taganka_core_access_granted', title: '[ACCESS] Доступ к Ядру', districtId: 'taganka', giverNpcId: 'term_central_gate', objectiveNodeId: 'term_central_gate', type: 'talk', difficulty: 'hard', tier: 4 },

  // ── TEKSTILSCHIKI ──
  { id: 'q_safety_audit', title: '[AUDIT] Аудит безопасности', districtId: 'tekstilschiki', giverNpcId: 'npc_safety_auditor', type: 'talk', difficulty: 'standard', tier: 2 },
  { id: 'q_tekstilschiki_combat_textile_raid_bug_sweep', title: '[БОЙ] Налёт на Текстиль', districtId: 'tekstilschiki', giverNpcId: 'npc_vlad', objectiveNodeId: 'combat_textile_raid', type: 'combat', difficulty: 'standard', tier: 2 },
  { id: 'q_tekstilschiki_delivery_pattern_kuzminki', title: '[DELIVERY] Паттерны в Кузьминки', districtId: 'tekstilschiki', giverNpcId: 'job_board_tekstil', type: 'delivery', difficulty: 'standard', tier: 2 },

  // ── TEPLY STAN ──
  { id: 'q_teply_stan_bio_scan', title: '[ДИАГ] Биосканирование леса', districtId: 'teply_stan', giverNpcId: 'npc_hermit_forest', type: 'diagnostics', difficulty: 'quick', tier: 1 },
  { id: 'q_teply_stan_combat_forest_hunt_bug_sweep', title: '[БОЙ] Охота в лесу', districtId: 'teply_stan', giverNpcId: 'npc_ranger', objectiveNodeId: 'combat_forest_hunt', type: 'combat', difficulty: 'standard', tier: 1 },
  { id: 'q_teply_stan_combat_wild_node_bug_sweep', title: '[БОЙ] Дикий Узел', districtId: 'teply_stan', giverNpcId: 'npc_sre_recruit', objectiveNodeId: 'combat_wild_node', type: 'combat', difficulty: 'quick', tier: 1 },
  { id: 'q_teply_stan_combat_router_clash_bug_sweep', title: '[БОЙ] Схватка Router', districtId: 'teply_stan', giverNpcId: 'npc_ranger', objectiveNodeId: 'combat_router_clash', type: 'combat', difficulty: 'hard', tier: 1 },

  // ── TEPLY STAN: ЛУНАРИОРИ ──
  { id: 'q_lunariori_catch_bot', title: '[ПИТОМНИК] Поймать дикого бота Δ-5', description: 'Хранительница Лунариори просит поймать молодого бота на опушке у Стыка Роутеров. Используй PING и NULL_PACKET — не навреди.', districtId: 'teply_stan', giverNpcId: 'npc_lunariori_keeper', objectiveNodeId: 'combat_router_clash', type: 'combat', difficulty: 'quick', tier: 1 },
  { id: 'q_lunariori_repair_bot', title: '[ПИТОМНИК] Починить ботёнка Ру', description: 'Малыш Ру застрял в рекурсивном цикле питания. Нужна карта UNIT_TEST_REACTION и доступ к системному терминалу питомника.', districtId: 'teply_stan', giverNpcId: 'npc_lunariori_keeper', objectiveNodeId: 'term_lunariori_registry', type: 'diagnostics', difficulty: 'quick', tier: 1 },
  { id: 'q_lunariori_defend', title: '[ПИТОМНИК] Отбить налёт охотников за железом', description: 'Ночные мародёры пришли за автономными ботами. Останови их до рассвета.', districtId: 'teply_stan', giverNpcId: 'npc_lunariori_keeper', objectiveNodeId: 'combat_lunariori_defense', type: 'combat', difficulty: 'standard', tier: 1 },
  { id: 'q_lunariori_find_alpha', title: '[ПИТОМНИК] Найти легендарного бота A-0', description: 'Первый бот питомника пропал три месяца назад. Лесной отшельник видел его следы у Митино. Найди координаты — не трогай руками.', districtId: 'teply_stan', giverNpcId: 'npc_lunariori_keeper', type: 'talk', difficulty: 'hard', tier: 2 },

  // ── TEPLY STAN: KIN-T (SRE / GIGACORP) ──
  { id: 'q_kin_t_load_test', title: '[SRE] Нагрузочный тест: Дикий Узел', description: 'Kin-T нужны данные о поведении узла под нагрузкой. Пройди бой с Диким Узлом без REACTION-карт — только SCRIPT. Выдержи 3 хода.', districtId: 'teply_stan', giverNpcId: 'npc_kin_t', objectiveNodeId: 'combat_wild_node', type: 'combat', difficulty: 'standard', tier: 1 },
  { id: 'q_kin_t_latency_spike', title: '[SRE] Источник spike latency', description: 'P99 прыгает с 12ms до 340ms каждую ночь в 03:17. Проверь Монитор Экосистемы и зону Охоты на Баг-Тварей. Принеси логи.', districtId: 'teply_stan', giverNpcId: 'npc_kin_t', objectiveNodeId: 'term_nature_log', type: 'diagnostics', difficulty: 'standard', tier: 1 },
  { id: 'q_kin_t_postmortem', title: '[SRE] Написать post-mortem', description: 'Данные собраны. Задокументируй инцидент по стандарту: RCA, timeline, contributing factors, action items. Kin-T читает только по шаблону.', districtId: 'teply_stan', giverNpcId: 'npc_kin_t', type: 'talk', difficulty: 'standard', tier: 1 },
  { id: 'q_kin_t_red_team', title: '[SRE] Red Team: Стык Роутеров', description: 'Неофициальный контракт от Kin-T: провести контролируемую атаку на Стык Роутеров и принести отчёт о точках отказа.', districtId: 'teply_stan', giverNpcId: 'npc_kin_t', objectiveNodeId: 'combat_router_clash', type: 'combat', difficulty: 'hard', tier: 2 },

  // ── VYKHINO ──
  { id: 'q_vykhino_combat_cargo_bug_sweep', title: '[БОЙ] Зачистка Карго', districtId: 'vykhino', giverNpcId: 'npc_grey', objectiveNodeId: 'combat_cargo', type: 'combat', difficulty: 'standard', tier: 1 },

  // ── ACADEMY ──
  { id: 'q_neon_academy_bootcamp', title: '[ТУТОРИАЛ] Учебный Лагерь Оператора', description: 'Пройди вводный инструктаж Профессора Туранова: узнай о NEURAL_RAM, SYSTEM_STRESS и структуре OPERATIONS. Завершение открывает активную деку.', districtId: 'academy', giverNpcId: 'npc_academy_tutor', type: 'talk', difficulty: 'quick', tier: 1, preClassOnly: true },

  // ── ALTUFYEVO / MARYINO CHAIN ──
  { id: 'q_petrovich_rogue_module', title: '[CHAIN] Изгнанный Модуль Петровича', description: 'Петрович потерял чип «Zero-Point». Последний сигнал зафиксирован в районе Крысы-курьера в Марьино. Разберись.', districtId: 'altufyevo', giverNpcId: 'npc_petrovich', type: 'delivery', difficulty: 'standard', tier: 1 },
];

export const QUEST_LIBRARY: QuestDefinition[] = [
  ...TUTORIAL_QUESTS,
  ...DISTRICT_NARRATIVE_QUESTS,
  ...buildNpcQuests(), 
  ...buildCombatDistrictQuests()
];
