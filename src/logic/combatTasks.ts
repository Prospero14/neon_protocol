/**
 * Библиотека ТЗ для боёв против враждебного ИИ-аудита кода.
 * Шаги проверяют, что нужные «конструкции программы» лежат на шине рантайма.
 */

export interface TZStep {
  id: string;
  name: string;
  requiredCardIds: string[];
}

export interface TechnicalTask {
  id: string;
  name: string;
  description: string;
  steps: TZStep[];
  rank: 'script-kiddie' | 'junior' | 'mid' | 'senior';
}

export const TZ_LIBRARY: TechnicalTask[] = [
  {
    id: 'junior_hello_ai',
    name: 'DRILL: HELLO_MALICIOUS_AI',
    rank: 'junior',
    description:
      'Слушай, ИИ на входе совсем озверел. Ему нужен хотя бы базовый билд, иначе он нас в систему не пустит. Собери стандарт: класс, точку входа и какой-нибудь вывод в консоль. Погнали.',
    steps: [
      { id: '1', name: 'DECLARE_CLASS', requiredCardIds: ['syntax_class_decl'] },
      { id: '2', name: 'LINK_MAIN', requiredCardIds: ['syntax_main_method'] },
      { id: '3', name: 'STDOUT_PROBE', requiredCardIds: ['fn_sysout_print', 'lib_commons_blank'] },
    ],
  },
  {
    id: 'network_init',
    name: 'PROJECT: NETWORK_UPLINK',
    rank: 'junior',
    description: 'Сеть тут дырявая, но капризная. Подтяни сетевые модули и попробуй пинг. Если пакеты дойдут — мы в игре.',
    steps: [
      { id: '1', name: 'IMPORT_NETWORK', requiredCardIds: ['lib_network'] },
      { id: '2', name: 'PING_GATEWAY', requiredCardIds: ['fn_ping'] },
    ],
  },
  {
    id: 'oop_override_lab',
    name: 'DRILL: OVERRIDE_CONTRACT',
    rank: 'mid',
    description: 'Система защиты ищет нарушения в контрактах. Придется поиграть в "правильного программиста": оформи метод как положено и не забудь про аннотацию, иначе нас спалят.',
    steps: [
      { id: '1', name: 'CLASS_SCOPE', requiredCardIds: ['syntax_class_decl'] },
      { id: '2', name: 'INSTANCE_METHOD', requiredCardIds: ['syntax_method_decl'] },
      { id: '3', name: 'MARK_OVERRIDE', requiredCardIds: ['syntax_override'] },
    ],
  },
  {
    id: 'inheritance_chain',
    name: 'DRILL: EXTENDS_SUPER',
    rank: 'mid',
    description: 'Тут нужно прокинуть вызов через всю цепочку наследования. ИИ следит за структурой: делай extends и дергай родителя. Чистая работа.',
    steps: [
      { id: 'BASE_CLASS', name: 'BASE_CLASS', requiredCardIds: ['syntax_class_decl'] },
      { id: 'INHERIT', name: 'INHERIT', requiredCardIds: ['oop_extends'] },
      { id: 'PARENT_DELEGATION', name: 'PARENT_DELEGATION', requiredCardIds: ['oop_super_call'] },
    ],
  },
  {
    id: 'interface_binding',
    name: 'PROJECT: INTERFACE_COMPLIANCE',
    rank: 'senior',
    description: 'Контракт превыше всего. Сначала выкинь интерфейс на шину, а потом заставь класс ему соответствовать. Если все сойдется — доступ наш.',
    steps: [
      { id: '1', name: 'DEFINE_IFACE', requiredCardIds: ['oop_interface'] },
      { id: '2', name: 'CLASS_IMPL', requiredCardIds: ['syntax_class_decl'] },
      { id: '3', name: 'IMPLEMENTS_CLAUSE', requiredCardIds: ['syntax_implements'] },
    ],
  },
  {
    id: 'package_structure',
    name: 'DRILL: PACKAGE_FIRST',
    rank: 'junior',
    description: 'Тут серьезный заказчик. Ему нужно, чтобы код был как по учебнику: сначала пакет, потом публичный класс. Никакой самодеятельности, иначе транш не пройдет.',
    steps: [
      { id: '1', name: 'PACKAGE_TOP', requiredCardIds: ['syntax_package'] },
      { id: '2', name: 'PUBLIC_CLASS', requiredCardIds: ['syntax_class_decl'] },
    ],
  },
  {
    id: 'secure_connection',
    name: 'PROJECT: SECURE_SOCKET',
    rank: 'mid',
    description: 'Канал связи почти готов. Прогрузи сетевой стек и открывай сокет. Нам нужно стабильное соединение, пока нас не отследили.',
    steps: [{ id: '1', name: 'SOCKET_ESTABLISH', requiredCardIds: ['fn_socket'] }],
  },
  {
    id: 'system_breach',
    name: 'PROJECT: DIRECT_EXPLOIT',
    rank: 'senior',
    description: 'Времени нет. Юзай этот 0day и ломай напролом. Если сработает — мы сорвем куш.',
    steps: [{ id: '1', name: 'EXECUTE_0DAY', requiredCardIds: ['fn_exploit'] }],
  },
  // --- TIER 1: JUNIOR (ALTUFYEVO / VYKHINO) ---
  {
    id: 't1_hello_world',
    name: 'PROJECT: BASE_BOOT',
    rank: 'junior',
    description: 'Первичная инициализация. Базовый класс и точка входа.',
    steps: [
      { id: '1', name: 'CLASS_DECL', requiredCardIds: ['syntax_class_decl'] },
      { id: '2', name: 'MAIN_BOOT', requiredCardIds: ['syntax_main_method'] }
    ]
  },
  {
    id: 't1_log_system',
    name: 'DRILL: LOG_PROBE',
    rank: 'junior',
    description: 'Проверка вывода в консоль. Нам нужны логи.',
    steps: [
      { id: '1', name: 'STDOUT', requiredCardIds: ['fn_sysout_print'] }
    ]
  },
  // --- TIER 2: MIDDLE (MARYINO / CHERTANOVO) ---
  {
    id: 't2_collection_flow',
    name: 'PROJECT: COLLECTION_LAB',
    rank: 'mid',
    description: 'Работа с данными. Инициализируй список и наполни его.',
    steps: [
      { id: '1', name: 'LIST_INIT', requiredCardIds: ['syntax_list_init'] },
      { id: '2', name: 'PROCESS_DATA', requiredCardIds: ['syntax_foreach', 'mid_stream_init', 'mid_stream_filter', 'mid_stream_collect'] }
    ]
  },
  {
    id: 't2_entity_mapping',
    name: 'PROJECT: ENTITY_DEFINITION',
    rank: 'mid',
    description: 'Нужно описать сущность для базы данных. Ты можешь написать все геттеры и сеттеры вручную или использовать магию Lombok.',
    steps: [
      { id: '1', name: 'CLASS_DECL', requiredCardIds: ['syntax_class_decl'] },
      { id: '2', name: 'ENTITY_CONTRACT', requiredCardIds: ['syntax_method_decl', 'lib_lombok_data', 'lib_lombok_builder'] }
    ]
  },
  {
    id: 't2_exception_handle',
    name: 'DRILL: TRY_RESCUE',
    rank: 'mid',
    description: 'Защита от критических ошибок. Оберни опасный участок кода.',
    steps: [
      { id: '1', name: 'TRY_CATCH', requiredCardIds: ['syntax_try_catch'] }
    ]
  },
  // --- TIER 3: SENIOR (SOKOL / VDNKH) ---
  {
    id: 't3_interface_contract',
    name: 'PROJECT: API_DEFINITION',
    rank: 'senior',
    description: 'Строгое соблюдение контрактов. Интерфейс и реализация.',
    steps: [
      { id: '1', name: 'DEFINE_IFACE', requiredCardIds: ['oop_interface'] },
      { id: '2', name: 'IMPLEMENT_IFACE', requiredCardIds: ['syntax_implements'] },
      { id: '3', name: 'OVERRIDE_METHOD', requiredCardIds: ['syntax_override'] }
    ]
  },
  {
    id: 't3_annotation_scanner',
    name: 'DRILL: ANNOTATION_SCANNER',
    rank: 'senior',
    description: 'Система ищет скрытые метаданные. Просканируй классы на наличие аннотаций.',
    steps: [
      { id: '1', name: 'MARK_ENTITY', requiredCardIds: ['syntax_annotation'] },
      { id: '2', name: 'INVOKE_METHOD', requiredCardIds: ['syntax_method_decl'] }
    ]
  },
  // --- TIER 4: LEAD (SOKOLNIKI / FILI) ---
  {
    id: 't4_concurrent_race',
    name: 'PROJECT: CONCURRENT_THREAD_POOL',
    rank: 'senior',
    description: 'Нам нужно параллельное выполнение. Запусти потоки и синхронизируй их.',
    steps: [
      { id: '1', name: 'THREAD_SPAWN', requiredCardIds: ['lib_network'] },
      { id: '2', name: 'SYNC_BLOCK', requiredCardIds: ['syntax_synchronized'] }
    ]
  },
  {
    id: 't4_security_audit',
    name: 'DRILL: SECURITY_FILTER_BREACH',
    rank: 'senior',
    description: 'Взлом через фильтры безопасности. Прокинь свой сокет через защищенный слой.',
    steps: [
      { id: '1', name: 'INJECT_INFRA', requiredCardIds: ['infra_postgres'] },
      { id: '2', name: 'OPEN_SECURE_SOCKET', requiredCardIds: ['fn_socket'] }
    ]
  },
  // --- TIER 5: ARCHITECT (TAGANKA / MITINO) ---
  {
    id: 't5_memory_leak_fix',
    name: 'PROJECT: MEMORY_OPTIMIZER',
    rank: 'senior',
    description: 'Система задыхается от утечек. Нужно принудительно очистить ресурсы и оптимизировать обращения.',
    steps: [
      { id: '1', name: 'COLLECT_GARBAGE', requiredCardIds: ['fn_sysout_print'] },
      { id: '2', name: 'FINAL_CLEANUP', requiredCardIds: ['syntax_break'] }
    ]
  },
  {
    id: 'altufyevo_magnus_toilet',
    name: 'QUEST: SMART_TOILET_BYPASS',
    rank: 'mid',
    description: 'Система очистки Умной Уборной №4 перешла в режим самоликвидации. Нужно прокинуть исключение, перехватить поток управления и принудительно завершить процесс смыва. Кот Магнус рассчитывает на тебя.',
    steps: [
      { id: '1', name: 'TRY_BLOCK', requiredCardIds: ['syntax_try_catch'] },
      { id: '2', name: 'THROW_EX', requiredCardIds: ['soft_throw_ex'] },
      { id: '3', name: 'FINALLY_CLEANUP', requiredCardIds: ['soft_finally'] }
    ]
  },
  {
    id: 'combat_nixanna_ritual',
    name: 'PATCH: VISUAL_REFRESH',
    rank: 'mid',
    description: 'Никсанна недовольна визуальным балансом этого сектора. Чтобы "игра" (реальность) стала проходимой, нужно оптимизировать пайплайн отрисовки, очистить буфер вывода и создать четкий интерфейс взаимодействия. Правь это ТЗ быстрее, пока фреймрейт не упал до нуля.',
    steps: [
      { id: 'RENDER_PIPELINE', name: 'RENDER_PIPELINE', requiredCardIds: ['oop_interface'] },
      { id: 'INTERFACE_CONTRACT', name: 'INTERFACE_CONTRACT', requiredCardIds: ['syntax_implements'] },
      { id: 'FLUSH_RENDER_BUFFER', name: 'FLUSH_RENDER_BUFFER', requiredCardIds: ['fn_sysout_print'] }
    ]
  },
  // --- JOB TASKS (EASY BITS) ---
  {
    id: 'job_delivery',
    name: 'JOB: DATA_COURIER',
    rank: 'script-kiddie',
    description: 'Простая курьерская доставка пакетов данных. Нужно проинициализировать сетевой стек и отправить PING. Ничего личного, просто транзакция.',
    steps: [
      { id: 'NET_INIT', name: 'NETWORK_UPLINK', requiredCardIds: ['script_ping'] },
      { id: 'SEND_PACKET', name: 'SEND_PING', requiredCardIds: ['script_grep'] }
    ]
  },
  {
    id: 'combat_local_lan',
    name: 'TASK: LAN_SECURITY_AUDIT',
    rank: 'script-kiddie',
    description: 'Тетя Таня из Марьино подозревает, что в локалке завелись крысы. Проверь периметр, просканируй порты и закрой сокеты.',
    steps: [
      { id: 'SCAN', name: 'PORT_SCAN', requiredCardIds: ['script_grep'] },
      { id: 'CLOSE', name: 'SOCKET_CLOSE', requiredCardIds: ['script_sudo_fix'] }
    ]
  },
  {
    id: 'combat_deep_tree',
    name: 'TASK: DEEP_REFLECT_SCAN',
    rank: 'senior',
    description: 'В глубинах Глубинного Дерева Сокольников код начинает менять форму (Reflection). Просканируй аннотации и вызови скрытые методы, чтобы стабилизировать узел.',
    steps: [
      { id: 'REFL', name: 'REFLECTION_INIT', requiredCardIds: ['syntax_annotation'] },
      { id: 'INVOKE', name: 'INVOKE_DYNAMIC', requiredCardIds: ['syntax_method_decl'] }
    ]
  },
  {
    id: 'job_board_alt',
    name: 'JOB: CACHE_CLEANUP',
    rank: 'script-kiddie',
    description: 'Система Алтуфьево задыхается от логов. Нужно запустить сборщик мусора и очистить буферы. Работа скучная, но Bits не пахнут.',
    steps: [
      { id: 'GC_START', name: 'GC_INITIALIZE', requiredCardIds: ['script_wash_logs'] },
      { id: 'BUFFER_FLUSH', name: 'BUFFER_FLUSH', requiredCardIds: ['script_sudo_fix'] }
    ]
  },
  {
    id: 'job_board_bibi',
    name: 'JOB: BIBIREVO_LINK',
    rank: 'script-kiddie',
    description: 'Узел связи в Бибирево искрит. Нужно пропинговать шлюз и сбросить ошибки.',
    steps: [
      { id: 'PING', name: 'UPSTREAM_PING', requiredCardIds: ['script_ping'] },
      { id: 'CLEAR', name: 'CLEAR_ERROR_FLAGS', requiredCardIds: ['script_sudo_fix'] }
    ]
  },
  {
    id: 'job_board_tekstil',
    name: 'JOB: TEXTILE_LOGS',
    rank: 'script-kiddie',
    description: 'Ткацкая сеть забита мусором. Промой логи и удали следы сбоя.',
    steps: [
      { id: 'WASH', name: 'WASH_LOGS', requiredCardIds: ['script_wash_logs'] },
      { id: 'GREP', name: 'GREP_GARBAGE', requiredCardIds: ['script_grep'] }
    ]
  },
  {
    id: 'job_board_perovo',
    name: 'JOB: PEROVO_HUNT',
    rank: 'script-kiddie',
    description: 'В подвалах Перово что-то фонит. Найди источник в дампе и пропатчи.',
    steps: [
      { id: 'FIND', name: 'GREP_SOURCE', requiredCardIds: ['script_grep'] },
      { id: 'PATCH', name: 'SUDO_PATCH', requiredCardIds: ['script_sudo_fix'] }
    ]
  },
  {
    id: 'sk_remote_breach',
    name: 'PROJECT: REMOTE_SSH_BREACH',
    rank: 'script-kiddie',
    description: 'Цель на связи. Пробрось SSH-туннель, пробей авторизацию и осмотрись. Если найдешь что-то ценное — читай без промедления. Это твой билет в высшую лигу.',
    steps: [
      { id: 'TUNNEL', name: 'ESTABLISH_SSH', requiredCardIds: ['script_ssh'] },
      { id: 'LOGIN', name: 'AUTH_SESSION', requiredCardIds: ['script_auth'] },
      { id: 'EXPLORE', name: 'LS_TARGET', requiredCardIds: ['script_ls'] },
      { id: 'EXTRACT', name: 'CAT_DATA', requiredCardIds: ['script_cat'] }
    ]
  },
  {
    id: 'sk_persistence_op',
    name: 'PROJECT: PERSISTENT_BACKDOOR',
    rank: 'script-kiddie',
    description: 'Нам нужно закрепиться на этом узле. Загрузи бинарник, дай ему права на исполнение и повесь в крон. И не забудь открыть бэкдор для прямого доступа. Грязная работа, но кто-то должен её делать.',
    steps: [
      { id: 'FETCH', name: 'CURL_DROPPER', requiredCardIds: ['script_curl'] },
      { id: 'CHMOD', name: 'MAKE_EXEC', requiredCardIds: ['script_chmod'] },
      { id: 'CRON', name: 'CRONTAB_ENTRY', requiredCardIds: ['script_cron'] },
      { id: 'LISTEN', name: 'NC_LISTENER', requiredCardIds: ['script_nc'] }
    ]
  },
  {
    id: 'sk_stealth_exfil',
    name: 'PROJECT: STEALTH_DATA_MINE',
    rank: 'script-kiddie',
    description: 'Тихая охота. Проверь окружение, найди пароли в логах и вали оттуда, пока защитные скрипты не проснулись. И прибери за собой в логах, скрипт-киддо.',
    steps: [
      { id: 'DISCOVERY', name: 'LS_PROBE', requiredCardIds: ['script_ls'] },
      { id: 'FIND_ID', name: 'GREP_CREDS', requiredCardIds: ['script_grep'] },
      { id: 'READ_FILE', name: 'CAT_SECRET', requiredCardIds: ['script_cat'] },
      { id: 'WIPE', name: 'LOG_PURGE', requiredCardIds: ['script_wash_logs'] }
    ]
  }
];
