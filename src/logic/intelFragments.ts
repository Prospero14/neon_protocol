/**
 * Intel Fragment System — Lore V2.0
 * Заменяем монологи коллекционными фрагментами.
 * Игрок собирает их через диалоги, терминалы и квесты.
 */

export type IntelClassification = 'PUBLIC' | 'RESTRICTED' | 'CLASSIFIED';

export interface IntelFragment {
  id: string;
  /** Фракция к которой относится фрагмент */
  factionId?: 'voskhod' | 'net_drivers' | 'eu_syntax' | 'gigabank' | 'zen_cod' | 'redundants' | 'regulators' | 'world';
  /** Район где можно получить */
  districtId?: string;
  title: string;
  /** Короткий лор-текст. Максимум 3-4 предложения — читается как терминал. */
  content: string;
  classification: IntelClassification;
  /** Цепочка: открывает следующий фрагмент при получении этого */
  revealsFragmentId?: string;
  /** Требует репутацию у фракции */
  requiredReputation?: { factionId: string; minPoints: number };
  /** Требует завершённый квест */
  requiredQuestId?: string;
  /** Нарративная нить которой принадлежит фрагмент */
  threadId?: string;
}

export interface NarrativeThread {
  id: string;
  title: string;
  /** Фрагменты нити в порядке сбора */
  fragmentIds: string[];
  /** Квест-финал открывается когда все фрагменты собраны */
  conclusionQuestId?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// INTEL FRAGMENTS
// ─────────────────────────────────────────────────────────────────────────────

export const INTEL_FRAGMENTS: IntelFragment[] = [

  // ── ВОСХОД ──────────────────────────────────────────────────────────────────
  {
    id: 'intel_voskhod_origin_1',
    factionId: 'voskhod',
    districtId: 'vdnkh',
    title: '[ВОСХОД] Откуда они',
    content: 'Восход начинался не как фракция — просто группа инженеров, которые отказались уйти с ВДНХ после Коллапса. Они успели поднять резервные сервера на электрогенераторах выставочных павильонов. Первый узел — Павильон №5.',
    classification: 'PUBLIC',
    revealsFragmentId: 'intel_voskhod_origin_2',
    threadId: 'thread_voskhod_rise'
  },
  {
    id: 'intel_voskhod_origin_2',
    factionId: 'voskhod',
    districtId: 'vdnkh',
    title: '[ВОСХОД] Первый сервер',
    content: 'Первый сервер Восхода работал на дизеле и советских ПЗУ. Они хранили бэкапы: медицинские архивы, коды эвакуации, карты подземелий Москвы. Это сделало их незаменимыми для всех кто выжил в первую зиму.',
    classification: 'PUBLIC',
    revealsFragmentId: 'intel_voskhod_betrayal',
    threadId: 'thread_voskhod_rise'
  },
  {
    id: 'intel_voskhod_betrayal',
    factionId: 'voskhod',
    districtId: 'vdnkh',
    title: '[ВОСХОД] Цена союза',
    content: 'В 2043 году Восход заключил "технический протокол" с Net Drivers — доступ к магистральным каналам в обмен на копии архивов. Генерал БЭСМ до сих пор называет это своей главной ошибкой. Часть архивов ушла прямо к GigaBank.',
    classification: 'RESTRICTED',
    requiredReputation: { factionId: 'voskhod', minPoints: 30 },
    threadId: 'thread_net_drivers_traitor'
  },
  {
    id: 'intel_voskhod_zero_node',
    factionId: 'voskhod',
    districtId: 'vdnkh',
    title: '[ВОСХОД] Узел Zero',
    content: 'Есть узел которого нет ни на одной официальной карте. Генерал БЭСМ называет его "Нулевая Память". Говорят, там хранятся логи первого взлома Ядра — того самого, с которого всё началось.',
    classification: 'CLASSIFIED',
    requiredReputation: { factionId: 'voskhod', minPoints: 60 },
    threadId: 'thread_zero_server'
  },

  // ── NET DRIVERS ──────────────────────────────────────────────────────────────
  {
    id: 'intel_nd_structure_1',
    factionId: 'net_drivers',
    districtId: 'vykhino',
    title: '[NET_DRIVERS] Кто управляет каналами',
    content: 'Net Drivers — это не иерархия, это протокол. Каждый Менеджер Каналов действует автономно в своём секторе. Координация через зашифрованные пакеты раз в сутки. Никто не знает кто принимает решения на самом верху.',
    classification: 'PUBLIC',
    revealsFragmentId: 'intel_nd_gigabank_deal',
    threadId: 'thread_net_drivers_traitor'
  },
  {
    id: 'intel_nd_gigabank_deal',
    factionId: 'net_drivers',
    districtId: 'maryino',
    title: '[NET_DRIVERS] Документ 77',
    content: 'Существует "Документ 77" — соглашение о резервировании 30% пропускной способности магистралей для транзакций GigaBank. Этот документ никогда не был вынесен на общее голосование. Кто его подписал — неизвестно.',
    classification: 'RESTRICTED',
    requiredReputation: { factionId: 'net_drivers', minPoints: 20 },
    revealsFragmentId: 'intel_nd_traitor_name',
    threadId: 'thread_net_drivers_traitor'
  },
  {
    id: 'intel_nd_traitor_name',
    factionId: 'net_drivers',
    districtId: 'bibirevo',
    title: '[NET_DRIVERS] Имя в логах',
    content: 'Связист Моня случайно перехватил пакет с подписью "KAN-7". Это кодовый идентификатор одного из старших Менеджеров Каналов. Месяц назад KAN-7 запросил доступ к архивам Восхода без протокола согласования.',
    classification: 'CLASSIFIED',
    requiredReputation: { factionId: 'net_drivers', minPoints: 50 },
    threadId: 'thread_net_drivers_traitor'
  },

  // ── EU_SYNTAX ────────────────────────────────────────────────────────────────
  {
    id: 'intel_eu_manifesto',
    factionId: 'eu_syntax',
    districtId: 'south_west',
    title: '[EU_SYNTAX] Манифест Компилятора',
    content: '"Код есть язык власти. Кто контролирует синтаксис — контролирует реальность." Это первая строка манифеста EU_Syntax, написанного в 2041 году. До сих пор каждый новый студент Академии переписывает его от руки в первый день.',
    classification: 'PUBLIC',
    revealsFragmentId: 'intel_eu_academy_secret',
  },
  {
    id: 'intel_eu_academy_secret',
    factionId: 'eu_syntax',
    districtId: 'south_west',
    title: '[EU_SYNTAX] Академия как прикрытие',
    content: 'Академия на Юго-Западе официально — образовательный центр. Неофициально — архив довоенных алгоритмов военного назначения. Профессор Туранов был куратором самого закрытого раздела. До своего исчезновения.',
    classification: 'RESTRICTED',
    requiredReputation: { factionId: 'eu_syntax', minPoints: 25 },
    threadId: 'thread_archipov_disappearance'
  },
  {
    id: 'intel_eu_archipov_last_log',
    factionId: 'eu_syntax',
    districtId: 'taganka',
    title: '[EU_SYNTAX] Последний лог Туранова',
    content: 'В таганском архиве нашли фрагмент: "...они не поняли что Zero-Node — это не хранилище. Это ключ. Если они откроют его без протокола инициализации, Ядро получит прямой доступ к..." — запись обрывается.',
    classification: 'CLASSIFIED',
    requiredQuestId: 'q_taganka_core_access_granted',
    threadId: 'thread_archipov_disappearance'
  },

  // ── GIGABANK ─────────────────────────────────────────────────────────────────
  {
    id: 'intel_gb_debt_matrix',
    factionId: 'gigabank',
    districtId: 'vykhino',
    title: '[GIGABANK] Долговая матрица',
    content: 'GigaBank не выдаёт деньги — он выдаёт "вычислительный кредит". Каждый Bit в системе уже заложен трижды: под транзакционный сбор, под инфраструктурный налог и под "страховой резерв". Абсолютное большинство жителей Москвы технически банкроты.',
    classification: 'PUBLIC',
    revealsFragmentId: 'intel_gb_real_owner',
  },
  {
    id: 'intel_gb_real_owner',
    factionId: 'gigabank',
    districtId: 'hub',
    title: '[GIGABANK] Кто настоящий хозяин',
    content: 'Совет директоров GigaBank — это фикция. Настоящие решения принимает система "Аудитор Прайм" — ИИ первого поколения, запущенный в 2038 году. Люди в офисах просто утверждают его предписания. Аудитор не засыпает.',
    classification: 'RESTRICTED',
    requiredReputation: { factionId: 'regulators', minPoints: -30 },
    threadId: 'thread_auditor_prime'
  },

  // ── ДЗЕН-ЦОД ────────────────────────────────────────────────────────────────
  {
    id: 'intel_zen_monastery',
    factionId: 'zen_cod',
    districtId: 'sokolniki',
    title: '[ДЗЕН-ЦОД] Что хранит монастырь',
    content: 'Монахи Дзен-ЦОД говорят что медитируют. На самом деле они поддерживают работу сервера который никогда не выключался с момента запуска в 2036 году. Его называют просто "Тишина". Что в нём хранится — не знает никто снаружи.',
    classification: 'PUBLIC',
    revealsFragmentId: 'intel_zen_zero_server',
    threadId: 'thread_zero_server'
  },
  {
    id: 'intel_zen_zero_server',
    factionId: 'zen_cod',
    districtId: 'teply_stan',
    title: '[ДЗЕН-ЦОД] Нулевой сервер',
    content: 'Отшельник в Тёплом Стане хранит карту. Не цифровую — бумажную. На ней отмечен кабель который уходит под землю из монастыря в Сокольниках на север — туда где никакой инфраструктуры нет. Или не должно быть.',
    classification: 'RESTRICTED',
    requiredReputation: { factionId: 'zen_cod', minPoints: 40 },
    threadId: 'thread_zero_server'
  },
  {
    id: 'intel_zen_cable_north',
    factionId: 'zen_cod',
    districtId: 'mitino',
    title: '[ДЗЕН-ЦОД] Сигнал на севере',
    content: 'Флэш в Митино всю зиму слышал в своих антеннах странный пульс: 3 коротких — 1 длинный, каждые 47 минут. Это не радиопомехи. Это хартбит. Кто-то очень старый ждёт пинга.',
    classification: 'CLASSIFIED',
    requiredReputation: { factionId: 'zen_cod', minPoints: 60 },
    threadId: 'thread_zero_server'
  },

  // ── KIN-T / GigaBank SRE ────────────────────────────────────────────────────
  {
    id: 'intel_kin_t_slo_doctrine',
    factionId: 'gigabank',
    districtId: 'teply_stan',
    title: '[GigaBank] Доктрина SLO',
    content: 'GigaBank держит 99.97% uptime не потому что заботится о пользователях. Каждая минута downtime = штраф по контракту с Московским Ядром. Финансовая мотивация точнее любого DevOps-манифеста. Это и есть настоящий SLO.',
    classification: 'PUBLIC',
    revealsFragmentId: 'intel_kin_t_load_testing_secret',
  },
  {
    id: 'intel_kin_t_load_testing_secret',
    factionId: 'gigabank',
    districtId: 'teply_stan',
    title: '[GigaBank] Что скрывают нагрузочные тесты',
    content: 'Kin-T рассекретила: в 2043 году GigaBank намеренно не публиковала результаты нагрузочного теста, показавшего что при пиковой нагрузке Московского рынка система падает. Решение — ограничение трафика для "низкоприоритетных" пользователей. Читай: бедных.',
    classification: 'RESTRICTED',
    requiredReputation: { factionId: 'gigabank', minPoints: -20 },
    threadId: 'thread_auditor_prime'
  },
  {
    id: 'intel_kin_t_auditor_prime',
    factionId: 'gigabank',
    districtId: 'teply_stan',
    title: '[GigaBank] Аудитор Прайм и нагрузка',
    content: 'Kin-T говорит тихо: "Аудитор Прайм сам и есть нагрузочный тест. Каждый день он гоняет систему на предельных мощностях — в 3:17 ночи, когда трафик минимален. Это не баг. Это его плановое обучение."',
    classification: 'CLASSIFIED',
    requiredQuestId: 'q_kin_t_postmortem',
    threadId: 'thread_auditor_prime'
  },

  // ── ЛУНАРИОРИ ────────────────────────────────────────────────────────────────
  {
    id: 'intel_lunariori_origin',
    factionId: 'zen_cod',
    districtId: 'teply_stan',
    title: '[ЛУНАРИОРИ] Откуда взялись дикие боты',
    content: 'В 2039-м GigaBank выключила централизованные координирующие серверы без graceful shutdown. 12 000 сервисных ботов одновременно потеряли мастер-узел. Часть зациклилась и деградировала. Часть — адаптировалась. Хранительница называет это "стихийной эволюцией".',
    classification: 'PUBLIC',
    revealsFragmentId: 'intel_lunariori_alpha_zero',
    threadId: 'thread_zero_server'
  },
  {
    id: 'intel_lunariori_alpha_zero',
    factionId: 'zen_cod',
    districtId: 'teply_stan',
    title: '[ЛУНАРИОРИ] Α-0: Первый адаптировавшийся',
    content: 'Α-0 был первым ботом который не зациклился при потере мастера. Вместо этого он начал искать другие боты и формировать локальную mesh-сеть. Хранительница считает что он создал что-то похожее на примитивный протокол взаимопомощи. Бот-альтруист.',
    classification: 'RESTRICTED',
    requiredQuestId: 'q_lunariori_catch_bot',
    threadId: 'thread_zero_server'
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// NARRATIVE THREADS
// ─────────────────────────────────────────────────────────────────────────────

export const NARRATIVE_THREADS: NarrativeThread[] = [
  {
    id: 'thread_archipov_disappearance',
    title: 'Куда пропал профессор Туранов?',
    fragmentIds: ['intel_eu_academy_secret', 'intel_voskhod_zero_node', 'intel_eu_archipov_last_log'],
    conclusionQuestId: 'q_taganka_deep_audit'
  },
  {
    id: 'thread_net_drivers_traitor',
    title: 'Предатель в Net Drivers',
    fragmentIds: ['intel_voskhod_betrayal', 'intel_nd_gigabank_deal', 'intel_nd_traitor_name'],
    conclusionQuestId: 'q_vykhino_corp_favor'
  },
  {
    id: 'thread_zero_server',
    title: 'Нулевой сервер: Дзен-ЦОД',
    fragmentIds: ['intel_zen_monastery', 'intel_zen_zero_server', 'intel_zen_cable_north'],
    conclusionQuestId: 'q_sokolniki_haunted_logs'
  },
  {
    id: 'thread_voskhod_rise',
    title: 'Восход: от выживших к фракции',
    fragmentIds: ['intel_voskhod_origin_1', 'intel_voskhod_origin_2', 'intel_voskhod_betrayal'],
  },
  {
    id: 'thread_auditor_prime',
    title: 'Кто управляет GigaBank?',
    fragmentIds: ['intel_gb_debt_matrix', 'intel_gb_real_owner'],
    conclusionQuestId: 'q_hub_signature'
  }
];

export const getFragmentById = (id: string): IntelFragment | undefined =>
  INTEL_FRAGMENTS.find(f => f.id === id);

export const getFragmentsByFaction = (factionId: string): IntelFragment[] =>
  INTEL_FRAGMENTS.filter(f => f.factionId === factionId);

export const getThreadById = (id: string): NarrativeThread | undefined =>
  NARRATIVE_THREADS.find(t => t.id === id);

export const getThreadByFragment = (fragmentId: string): NarrativeThread | undefined =>
  NARRATIVE_THREADS.find(t => t.fragmentIds.includes(fragmentId));
