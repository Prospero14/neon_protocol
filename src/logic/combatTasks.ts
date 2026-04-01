/**
 * Библиотека ТЗ для боёв против враждебного ИИ-аудита кода.
 * Шаги проверяют, что нужные «конструкции программы» лежат на шине рантайма.
 */

export interface TZStep {
  id: string;
  name: string;
  requiredCardId: string;
}

export interface TechnicalTask {
  id: string;
  name: string;
  description: string;
  steps: TZStep[];
  rank: 'junior' | 'mid' | 'senior';
}

export const TZ_LIBRARY: TechnicalTask[] = [
  {
    id: 'junior_hello_ai',
    name: 'DRILL: HELLO_MALICIOUS_AI',
    rank: 'junior',
    description:
      'Слушай, ИИ на входе совсем озверел. Ему нужен хотя бы базовый билд, иначе он нас в систему не пустит. Собери стандарт: класс, точку входа и какой-нибудь вывод в консоль. Погнали.',
    steps: [
      { id: '1', name: 'DECLARE_CLASS', requiredCardId: 'syntax_class_decl' },
      { id: '2', name: 'LINK_MAIN', requiredCardId: 'syntax_main_method' },
      { id: '3', name: 'STDOUT_PROBE', requiredCardId: 'fn_sysout_print' },
    ],
  },
  {
    id: 'network_init',
    name: 'PROJECT: NETWORK_UPLINK',
    rank: 'junior',
    description: 'Сеть тут дырявая, но капризная. Подтяни сетевые модули и попробуй пинг. Если пакеты дойдут — мы в игре.',
    steps: [
      { id: '1', name: 'IMPORT_NETWORK', requiredCardId: 'lib_network' },
      { id: '2', name: 'PING_GATEWAY', requiredCardId: 'fn_ping' },
    ],
  },
  {
    id: 'oop_override_lab',
    name: 'DRILL: OVERRIDE_CONTRACT',
    rank: 'mid',
    description: 'Система защиты ищет нарушения в контрактах. Придется поиграть в "правильного программиста": оформи метод как положено и не забудь про аннотацию, иначе нас спалят.',
    steps: [
      { id: '1', name: 'CLASS_SCOPE', requiredCardId: 'syntax_class_decl' },
      { id: '2', name: 'INSTANCE_METHOD', requiredCardId: 'syntax_method_decl' },
      { id: '3', name: 'MARK_OVERRIDE', requiredCardId: 'syntax_override' },
    ],
  },
  {
    id: 'inheritance_chain',
    name: 'DRILL: EXTENDS_SUPER',
    rank: 'mid',
    description: 'Тут нужно прокинуть вызов через всю цепочку наследования. ИИ следит за структурой: делай extends и дергай родителя. Чистая работа.',
    steps: [
      { id: 'BASE_CLASS', name: 'BASE_CLASS', requiredCardId: 'syntax_class_decl' },
      { id: 'INHERIT', name: 'INHERIT', requiredCardId: 'oop_extends' },
      { id: 'PARENT_DELEGATION', name: 'PARENT_DELEGATION', requiredCardId: 'oop_super_call' },
    ],
  },
  {
    id: 'interface_binding',
    name: 'PROJECT: INTERFACE_COMPLIANCE',
    rank: 'senior',
    description: 'Контракт превыше всего. Сначала выкинь интерфейс на шину, а потом заставь класс ему соответствовать. Если все сойдется — доступ наш.',
    steps: [
      { id: '1', name: 'DEFINE_IFACE', requiredCardId: 'oop_interface' },
      { id: '2', name: 'CLASS_IMPL', requiredCardId: 'syntax_class_decl' },
      { id: '3', name: 'IMPLEMENTS_CLAUSE', requiredCardId: 'syntax_implements' },
    ],
  },
  {
    id: 'package_structure',
    name: 'DRILL: PACKAGE_FIRST',
    rank: 'junior',
    description: 'Тут серьезный заказчик. Ему нужно, чтобы код был как по учебнику: сначала пакет, потом публичный класс. Никакой самодеятельности, иначе транш не пройдет.',
    steps: [
      { id: '1', name: 'PACKAGE_TOP', requiredCardId: 'syntax_package' },
      { id: '2', name: 'PUBLIC_CLASS', requiredCardId: 'syntax_class_decl' },
    ],
  },
  {
    id: 'secure_connection',
    name: 'PROJECT: SECURE_SOCKET',
    rank: 'mid',
    description: 'Канал связи почти готов. Прогрузи сетевой стек и открывай сокет. Нам нужно стабильное соединение, пока нас не отследили.',
    steps: [{ id: '1', name: 'SOCKET_ESTABLISH', requiredCardId: 'fn_socket' }],
  },
  {
    id: 'system_breach',
    name: 'PROJECT: DIRECT_EXPLOIT',
    rank: 'senior',
    description: 'Времени нет. Юзай этот 0day и ломай напролом. Если сработает — мы сорвем куш.',
    steps: [{ id: '1', name: 'EXECUTE_0DAY', requiredCardId: 'fn_exploit' }],
  },
  // --- TIER 1: JUNIOR (ALTUFYEVO / VYKHINO) ---
  {
    id: 't1_hello_world',
    name: 'PROJECT: BASE_BOOT',
    rank: 'junior',
    description: 'Первичная инициализация. Базовый класс и точка входа.',
    steps: [
      { id: '1', name: 'CLASS_DECL', requiredCardId: 'syntax_class_decl' },
      { id: '2', name: 'MAIN_BOOT', requiredCardId: 'syntax_main_method' }
    ]
  },
  {
    id: 't1_log_system',
    name: 'DRILL: LOG_PROBE',
    rank: 'junior',
    description: 'Проверка вывода в консоль. Нам нужны логи.',
    steps: [
      { id: '1', name: 'STDOUT', requiredCardId: 'fn_sysout_print' }
    ]
  },
  // --- TIER 2: MIDDLE (MARYINO / CHERTANOVO) ---
  {
    id: 't2_collection_flow',
    name: 'PROJECT: COLLECTION_LAB',
    rank: 'mid',
    description: 'Работа с данными. Инициализируй список и наполни его.',
    steps: [
      { id: '1', name: 'LIST_INIT', requiredCardId: 'syntax_list_init' },
      { id: '2', name: 'LOOP_ITEMS', requiredCardId: 'syntax_foreach' }
    ]
  },
  {
    id: 't2_exception_handle',
    name: 'DRILL: TRY_RESCUE',
    rank: 'mid',
    description: 'Защита от критических ошибок. Оберни опасный участок кода.',
    steps: [
      { id: '1', name: 'TRY_CATCH', requiredCardId: 'syntax_try_catch' }
    ]
  },
  // --- TIER 3: SENIOR (SOKOL / VDNKH) ---
  {
    id: 't3_interface_contract',
    name: 'PROJECT: API_DEFINITION',
    rank: 'senior',
    description: 'Строгое соблюдение контрактов. Интерфейс и реализация.',
    steps: [
      { id: '1', name: 'DEFINE_IFACE', requiredCardId: 'oop_interface' },
      { id: '2', name: 'IMPLEMENT_IFACE', requiredCardId: 'syntax_implements' },
      { id: '3', name: 'OVERRIDE_METHOD', requiredCardId: 'syntax_override' }
    ]
  },
  {
    id: 't3_annotation_scanner',
    name: 'DRILL: ANNOTATION_SCANNER',
    rank: 'senior',
    description: 'Система ищет скрытые метаданные. Просканируй классы на наличие аннотаций.',
    steps: [
      { id: '1', name: 'MARK_ENTITY', requiredCardId: 'syntax_annotation' },
      { id: '2', name: 'INVOKE_METHOD', requiredCardId: 'syntax_method_decl' }
    ]
  },
  // --- TIER 4: LEAD (SOKOLNIKI / FILI) ---
  {
    id: 't4_concurrent_race',
    name: 'PROJECT: CONCURRENT_THREAD_POOL',
    rank: 'senior',
    description: 'Нам нужно параллельное выполнение. Запусти потоки и синхронизируй их.',
    steps: [
      { id: '1', name: 'THREAD_SPAWN', requiredCardId: 'lib_network' },
      { id: '2', name: 'SYNC_BLOCK', requiredCardId: 'syntax_synchronized' }
    ]
  },
  {
    id: 't4_security_audit',
    name: 'DRILL: SECURITY_FILTER_BREACH',
    rank: 'senior',
    description: 'Взлом через фильтры безопасности. Прокинь свой сокет через защищенный слой.',
    steps: [
      { id: '1', name: 'INJECT_INFRA', requiredCardId: 'infra_postgres' },
      { id: '2', name: 'OPEN_SECURE_SOCKET', requiredCardId: 'fn_socket' }
    ]
  },
  // --- TIER 5: ARCHITECT (TAGANKA / MITINO) ---
  {
    id: 't5_memory_leak_fix',
    name: 'PROJECT: MEMORY_OPTIMIZER',
    rank: 'senior',
    description: 'Система задыхается от утечек. Нужно принудительно очистить ресурсы и оптимизировать обращения.',
    steps: [
      { id: '1', name: 'COLLECT_GARBAGE', requiredCardId: 'fn_sysout_print' },
      { id: '2', name: 'FINAL_CLEANUP', requiredCardId: 'syntax_break' }
    ]
  },
  {
    id: 'altufyevo_magnus_toilet',
    name: 'QUEST: SMART_TOILET_BYPASS',
    rank: 'mid',
    description: 'Система очистки Умной Уборной №4 перешла в режим самоликвидации. Нужно прокинуть исключение, перехватить поток управления и принудительно завершить процесс смыва. Кот Магнус рассчитывает на тебя.',
    steps: [
      { id: '1', name: 'TRY_BLOCK', requiredCardId: 'syntax_try_catch' },
      { id: '2', name: 'THROW_EX', requiredCardId: 'soft_throw_ex' },
      { id: '3', name: 'FINALLY_CLEANUP', requiredCardId: 'soft_finally' }
    ]
  },
  {
    id: 'combat_nixanna_ritual',
    name: 'PATCH: VISUAL_REFRESH',
    rank: 'mid',
    description: 'Никсанна недовольна визуальным балансом этого сектора. Чтобы "игра" (реальность) стала проходимой, нужно оптимизировать пайплайн отрисовки, очистить буфер вывода и создать четкий интерфейс взаимодействия. Правь это ТЗ быстрее, пока фреймрейт не упал до нуля.',
    steps: [
      { id: 'RENDER_PIPELINE', name: 'RENDER_PIPELINE', requiredCardId: 'oop_interface' },
      { id: 'INTERFACE_CONTRACT', name: 'INTERFACE_CONTRACT', requiredCardId: 'syntax_implements' },
      { id: 'FLUSH_RENDER_BUFFER', name: 'FLUSH_RENDER_BUFFER', requiredCardId: 'fn_sysout_print' }
    ]
  },
  // --- JOB TASKS (EASY BITS) ---
  {
    id: 'job_delivery',
    name: 'JOB: DATA_COURIER',
    rank: 'junior',
    description: 'Простая курьерская доставка пакетов данных. Нужно проинициализировать сетевой стек и отправить PING. Ничего личного, просто транзакция.',
    steps: [
      { id: 'NET_INIT', name: 'NETWORK_UPLINK', requiredCardId: 'script_ping' },
      { id: 'SEND_PACKET', name: 'SEND_PING', requiredCardId: 'script_grep' }
    ]
  },
  {
    id: 'combat_local_lan',
    name: 'TASK: LAN_SECURITY_AUDIT',
    rank: 'junior',
    description: 'Тетя Таня из Марьино подозревает, что в локалке завелись крысы. Проверь периметр, просканируй порты и закрой сокеты.',
    steps: [
      { id: 'SCAN', name: 'PORT_SCAN', requiredCardId: 'script_grep' },
      { id: 'CLOSE', name: 'SOCKET_CLOSE', requiredCardId: 'script_sudo_fix' }
    ]
  },
  {
    id: 'combat_deep_tree',
    name: 'TASK: DEEP_REFLECT_SCAN',
    rank: 'senior',
    description: 'В глубинах Глубинного Дерева Сокольников код начинает менять форму (Reflection). Просканируй аннотации и вызови скрытые методы, чтобы стабилизировать узел.',
    steps: [
      { id: 'REFL', name: 'REFLECTION_INIT', requiredCardId: 'syntax_annotation' },
      { id: 'INVOKE', name: 'INVOKE_DYNAMIC', requiredCardId: 'syntax_method_decl' }
    ]
  },
  {
    id: 'job_board_alt',
    name: 'JOB: CACHE_CLEANUP',
    rank: 'junior',
    description: 'Система Алтуфьево задыхается от логов. Нужно запустить сборщик мусора и очистить буферы. Работа скучная, но Bits не пахнут.',
    steps: [
      { id: 'GC_START', name: 'GC_INITIALIZE', requiredCardId: 'script_wash_logs' },
      { id: 'BUFFER_FLUSH', name: 'BUFFER_FLUSH', requiredCardId: 'script_sudo_fix' }
    ]
  },
  {
    id: 'job_board_bibi',
    name: 'JOB: BIBIREVO_LINK',
    rank: 'junior',
    description: 'Узел связи в Бибирево искрит. Нужно пропинговать шлюз и сбросить ошибки.',
    steps: [
      { id: 'PING', name: 'UPSTREAM_PING', requiredCardId: 'script_ping' },
      { id: 'CLEAR', name: 'CLEAR_ERROR_FLAGS', requiredCardId: 'script_sudo_fix' }
    ]
  },
  {
    id: 'job_board_tekstil',
    name: 'JOB: TEXTILE_LOGS',
    rank: 'junior',
    description: 'Ткацкая сеть забита мусором. Промой логи и удали следы сбоя.',
    steps: [
      { id: 'WASH', name: 'WASH_LOGS', requiredCardId: 'script_wash_logs' },
      { id: 'GREP', name: 'GREP_GARBAGE', requiredCardId: 'script_grep' }
    ]
  },
  {
    id: 'job_board_perovo',
    name: 'JOB: PEROVO_HUNT',
    rank: 'junior',
    description: 'В подвалах Перово что-то фонит. Найди источник в дампе и пропатчи.',
    steps: [
      { id: 'FIND', name: 'GREP_SOURCE', requiredCardId: 'script_grep' },
      { id: 'PATCH', name: 'SUDO_PATCH', requiredCardId: 'script_sudo_fix' }
    ]
  }
];
