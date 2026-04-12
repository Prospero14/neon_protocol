/**
 * Библиотека ТЗ для боёв против враждебного ИИ-аудита кода.
 * Шаги проверяют, что нужные «конструкции программы» лежат на шине рантайма.
 */

import { generateCoopYardMissionPool } from './coopYardMissions';

export interface TZStep {
  id: string;
  name: string;
  /** Legacy singular format — одна карта. Поддерживается для обратной совместимости. */
  requiredCardId?: string;
  /** Новый формат — несколько карт, любая из которых удовлетворяет шаг. */
  requiredCardIds?: string[];
}

/**
 * Normalizer: возвращает массив допустимых карт для шага,
 * совместимый с обоими форматами (requiredCardId и requiredCardIds).
 */
export function getStepCardIds(step: TZStep): string[] {
  const ids: string[] = [];
  if (step.requiredCardIds) ids.push(...step.requiredCardIds);
  if (step.requiredCardId) ids.push(step.requiredCardId);
  return ids;
}

export interface TechnicalTask {
  id: string;
  name: string;
  description: string;
  steps: TZStep[];
  rank: 'script-kiddie' | 'junior' | 'mid' | 'senior';
  isExecutionChain?: boolean; // If true, the task requires exact sequence execution on the bus
  districtId?: string; // Optional: restrict task to a specific district
  minLevel?: number; // E.g. 1 (10 exploits), 2 (20 exploits) inside the grade
  resistanceType?: 'ENCRYPTED' | 'AUTH_LOCKED'; // Forces specific bypass cards
}


const TZ_LIBRARY_BASE: TechnicalTask[] = [
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
    isExecutionChain: true,
    description: 'Система задыхается от утечек. Нужно принудительно очистить ресурсы: проинициализируй поток, отфильтруй мертвые объекты и вызови сборщик. Любая ошибка в порядке приведет к переполнению кучи.',
    steps: [
      { id: '1', name: 'STREAM_INIT', requiredCardIds: ['mid_stream_init'] },
      { id: '2', name: 'STREAM_FILTER', requiredCardIds: ['mid_stream_filter'] },
      { id: '3', name: 'STREAM_COLLECT', requiredCardIds: ['mid_stream_collect'] }
    ]
  },
  {
    id: 'combat_maryino_data_exfil',
    name: 'PROJECT: MARYINO_DATA_EXFIL',
    rank: 'mid',
    isExecutionChain: true,
    description: 'Нужно выкачать ядро из лог-архива. Сначала просканируй директорию, затем отфильтруй нужные данные и наконец выкачивай. Если порядок будет нарушен — защита заблокирует доступ к файлам.',
    steps: [
      { id: '1', name: 'DIRECTORY_SCAN', requiredCardIds: ['script_ls'] },
      { id: '2', name: 'FILTER_DATA', requiredCardIds: ['script_grep'] },
      { id: '3', name: 'SECURE_COPY', requiredCardIds: ['script_scp'] }
    ]
  },
  {
    id: 'combat_perovo_registry_wipe',
    name: 'PROJECT: REGISTRY_REDISTRIBUTION',
    rank: 'senior',
    isExecutionChain: true,
    description: 'Цель — реестр долгов GigaBank. Сначала найди нужную запись, выдели долговые обязательства и примени команду полного удаления. Народу не нужны долги!',
    steps: [
      { id: '1', name: 'FILE_DISCOVERY', requiredCardIds: ['script_ls'] },
      { id: '2', name: 'TARGET_SELECTION', requiredCardIds: ['script_grep'] },
      { id: '3', name: 'TOTAL_WIPE', requiredCardIds: ['script_rm'] }
    ]
  },
  {
    id: 'trainee_exam_final',
    name: 'EXAM: AURORA_VB1_LEETCODE',
    rank: 'junior',
    isExecutionChain: true,
    description: 'Финальный этап аттестации. Бот "Аврора" требует реализации алгоритма "Contains Duplicate". Тебе нужно: объявить класс и метод, инициализировать HashSet, запустить цикл по входящему массиву, проверить наличие текущего элемента в сете. Если элемент найден — вернуть true. Если нет — добавить его в сет и продолжить. В конце вернуть false. Любая ошибка в логике приведет к немедленному сбросу сессии.',
    steps: [
      { id: '1', name: 'DECLARE_CLASS', requiredCardIds: ['syntax_class_decl'] },
      { id: '2', name: 'DECLARE_METHOD', requiredCardIds: ['syntax_method_decl'] },
      { id: '3', name: 'INIT_HASHSET', requiredCardIds: ['syntax_set_init'] },
      { id: '4', name: 'LOOP_ITEMS', requiredCardIds: ['syntax_foreach'] },
      { id: '5', name: 'CHECK_EXISTS', requiredCardIds: ['syntax_if'] },
      { id: '6', name: 'CONTAINS_PROBE', requiredCardIds: ['fn_set_contains'] },
      { id: '7', name: 'FOUND_RETURN', requiredCardIds: ['syntax_return_true'] },
      { id: '8', name: 'ADD_TO_SET', requiredCardIds: ['fn_set_add'] },
      { id: '9', name: 'END_RETURN', requiredCardIds: ['syntax_return_false'] }
    ]
  },
  {
    id: 'haunted_log_cleansing',
    name: 'PROJECT: LOG_RECONSTRUCTION',
    rank: 'mid',
    isExecutionChain: true,
    description: 'Логи Сокольников прокляты "призраком в машине". Нужно провести ритуал очистки: найди битые записи, выдели аномалии, отстирай следы и удали проклятый сектор.',
    steps: [
      { id: '1', name: 'GHOST_SCAN', requiredCardIds: ['script_ls'] },
      { id: '2', name: 'ANOMALY_GRIP', requiredCardIds: ['script_grep'] },
      { id: '3', name: 'ETHICAL_WASH', requiredCardIds: ['script_wash_logs'] },
      { id: '4', name: 'FINAL_PURGE', requiredCardIds: ['script_rm'] }
    ]
  },
  {
    id: 'satellite_handshake',
    name: 'PROJECT: ORBITAL_HANDSHAKE',
    rank: 'senior',
    isExecutionChain: true,
    description: 'Сигнал со спутника Фили. Установи соединение, стяни прошивку реле, выдай права и слушай обратный канал. Поторопись, спутник уходит за горизонт!',
    steps: [
      { id: '1', name: 'RADIO_BOOT', requiredCardIds: ['script_ssh'] },
      { id: '2', name: 'FIRMWARE_CURL', requiredCardIds: ['script_curl'] },
      { id: '3', name: 'RIGHTS_MOD', requiredCardIds: ['script_chmod'] },
      { id: '4', name: 'LISTENING_NC', requiredCardIds: ['script_nc'] }
    ]
  },
  {
    id: 'combat_magnus_toilet',
    name: 'QUEST: SMART_TOILET_BYPASS',
    rank: 'script-kiddie',
    isExecutionChain: true,
    description: 'Система очистки Умной Уборной №4 перешла в режим самоликвидации. Нужно прокинуть исключение, перехватить поток управления и принудительно завершить процесс смыва. Кот Магнус рассчитывает на тебя.',
    steps: [
      { id: '0', name: 'STABILIZE_INFRA', requiredCardIds: ['infra_old_hw', 'infra_edge_cache', 'infra_safe_proxy'] },
      { id: '1', name: 'DIRECTORY_SCAN', requiredCardIds: ['script_ls'] },
      { id: '2', name: 'PROCESS_FILTER', requiredCardIds: ['script_grep'] },
      { id: '3', name: 'FORCE_TERMINATE', requiredCardIds: ['script_sudo_fix'] }
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
    id: 'combat_copy_logs',
    name: 'JOB: TARGETED_LOG_EXTRACTION',
    rank: 'script-kiddie',
    isExecutionChain: true,
    description: 'Нам нужны доказательства. Сначала найди нужный лог среди файлов. Затем отфильтруй только строки с ошибками. Наконец, выгрузи эти логи ко мне на безопасный сервер. Порядок действий критически важен, иначе мы скачаем тонну бесполезного мусора.',
    steps: [
      { id: '0', name: 'PREP_PROXY', requiredCardIds: ['infra_safe_proxy', 'infra_edge_cache'] },
      { id: '1', name: 'DIRECTORY_SCAN', requiredCardIds: ['script_ls'] },
      { id: '2', name: 'FILTER_DATA', requiredCardIds: ['script_grep'] },
      { id: '3', name: 'SECURE_COPY_EXPORT', requiredCardIds: ['script_scp'] }
    ]
  },
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
      { id: '0', name: 'DEPLOY_EDGE', requiredCardIds: ['infra_old_hw', 'infra_edge_cache'] },
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
    isExecutionChain: true,
    districtId: 'altufyevo',
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
    isExecutionChain: true,
    districtId: 'bibirevo',
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
    isExecutionChain: true,
    districtId: 'tekstilschiki',
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
    isExecutionChain: true,
    districtId: 'perovo',
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
    isExecutionChain: true,
    description:
      'Удаленный узел держит многослойный контроль доступа. Нужно пройти его спокойно и без шума: закрепиться в канале, подтвердить право входа и извлечь нужный артефакт без тревоги.',
    steps: [
      { id: 'TUNNEL', name: 'SSH', requiredCardIds: ['script_ssh'] },
      { id: 'LOGIN', name: 'AUTH', requiredCardIds: ['script_auth'] },
      { id: 'EXPLORE', name: 'LS', requiredCardIds: ['script_ls'] },
      { id: 'EXTRACT', name: 'CAT', requiredCardIds: ['script_cat'] }
    ]
  },
  {
    id: 'sk_persistence_op',
    name: 'PROJECT: PERSISTENT_BACKDOOR',
    rank: 'script-kiddie',
    isExecutionChain: true,
    description: 'Операция на удержание точки: подготовь контур, обеспечь автономный запуск и открой скрытый сервисный доступ. Ошибка в последовательности сорвет весь цикл закрепления.',
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
    isExecutionChain: true,
    description:
      'Ночной сбор проходит под давлением патрулей: сначала разведка, затем точечный отбор данных, верификация и аккуратное скрытие следов. Работа тонкая, времени мало.',
    steps: [
      { id: 'DISCOVERY', name: 'LS', requiredCardIds: ['script_ls'] },
      { id: 'FIND_ID', name: 'GREP', requiredCardIds: ['script_grep'] },
      { id: 'READ_FILE', name: 'CAT', requiredCardIds: ['script_cat'] },
      { id: 'WIPE', name: 'WIPE_LOGS', requiredCardIds: ['script_wash_logs'] }
    ]
  },
  {
    id: 'academy_tutorial_debug',
    name: 'TUTORIAL: SEQUENTIAL_DEBUG',
    rank: 'script-kiddie',
    isExecutionChain: true,
    description:
      'Учебный стенд проверяет дисциплину инженера: сначала разведка контекста, затем чтение ключевого фрагмента. Если перепутаешь логику действий, тренажер обрывает сессию.',
    steps: [
      { id: '1', name: 'LS', requiredCardIds: ['script_ls'] },
      { id: '2', name: 'CAT', requiredCardIds: ['script_cat'] }
    ]
  },
  {
    id: 'combat_silo_inner',
    name: 'CLEANUP: SILO_7_INFESTATION',
    rank: 'script-kiddie',
    isExecutionChain: true,
    description:
      'Силосный тикет критический: в шине застряли хвосты старых прошивок. Нужна строгая операционная последовательность — разведка, фильтрация и фиксация состояния — иначе узел останется в красной зоне.',
    steps: [
      { id: '1', name: 'LS_LIST', requiredCardIds: ['script_ls'] },
      { id: '2', name: 'GREP_FILTER', requiredCardIds: ['script_grep'] },
      { id: '3', name: 'CAT_DUMP', requiredCardIds: ['script_cat'] }
    ]
  },
  {
    id: 'combat_rats',
    name: 'CLEANUP: RAT_INFESTATION',
    rank: 'script-kiddie',
    isExecutionChain: true,
    description: 'Крысы-кодеры перегрызли магистраль. Нужно осмотреть сектор и удалить вредоносные процессы.',
    steps: [
      { id: '1', name: 'SECTOR_SCAN', requiredCardIds: ['script_ls'] },
      { id: '2', name: 'PROCESS_WIPE', requiredCardIds: ['script_rm'] }
    ]
  },
  {
    id: 'vykhino_audit_wipe',
    name: 'JOB: AUDIT_EVASION_WIPE',
    rank: 'script-kiddie',
    isExecutionChain: true,
    description: 'Аудиторы наступают. Найди свои логи, выдели записи за 24 часа и "отстирай" их до блеска. Порядок важен, иначе останутся фантомные следы.',
    steps: [
      { id: '1', name: 'LOG_FIND', requiredCardIds: ['script_ls'] },
      { id: '2', name: 'FILTER_PAGES', requiredCardIds: ['script_grep'] },
      { id: '3', name: 'WASH_TRACE', requiredCardIds: ['script_wash_logs'] }
    ]
  },
  {
    id: 'chertanovo_night_scan',
    name: 'TASK: CHERTANOVO_NIGHT_SCAN',
    rank: 'mid',
    isExecutionChain: true,
    description: 'Ночной перехват в Гетто. Найди пакеты в эфире, отфильтруй сигнатуру Анархистов и выгрузи дамп на "Черный Линк".',
    steps: [
      { id: '1', name: 'ETH_SCAN', requiredCardIds: ['script_ls'] },
      { id: '2', name: 'SIGNAL_GRIP', requiredCardIds: ['script_grep'] },
      { id: '3', name: 'VOID_EXFIL', requiredCardIds: ['script_scp'] }
    ]
  },
  {
    id: 'taganka_deep_audit',
    name: 'PROJECT: TAGANKA_DEEP_AUDIT',
    rank: 'senior',
    isExecutionChain: true,
    description: 'Высшая лига. Пробей SSH-туннель в Бункер, пройди авторизацию, примени Sudo-фикс к ядру и выгрузи Истину. Если ошибешься — аудит обнулит тебя.',
    steps: [
      { id: '1', name: 'SSH_TUNNEL', requiredCardIds: ['script_ssh'] },
      { id: '2', name: 'AUTH_SESSION', requiredCardIds: ['script_auth'] },
      { id: '3', name: 'CORE_PATCH', requiredCardIds: ['fn_sudo_fix'] },
      { id: '4', name: 'TRUTH_EXPORT', requiredCardIds: ['script_scp'] }
    ]
  },
  {
    id: 'punitive_squad_wipe',
    name: 'ENFORCEMENT: PUNITIVE_WIPE',
    rank: 'senior',
    isExecutionChain: true,
    description: 'Система подавления Regulators. Просканируй их щиты, пройди авторизацию командира, примени Sudo-фикс к протоколу, "отстирай" следы взлома и удали девиантный шелл. Если промахнешься — тебя обнулят.',
    steps: [
      { id: '1', name: 'SHIELD_SCAN', requiredCardIds: ['script_ls'] },
      { id: '2', name: 'CMD_AUTH', requiredCardIds: ['script_auth'] },
      { id: '3', name: 'PROTO_PATCH', requiredCardIds: ['fn_sudo_fix'] },
      { id: '4', name: 'TRACE_WASH', requiredCardIds: ['script_wash_logs'] },
      { id: '5', name: 'SHELL_PURGE', requiredCardIds: ['script_rm'] }
    ]
  },
  // --- PROGRESSIVE SCRIPT-KIDDIE TASKS ---
  {
    id: 'sk_lvl1_data_breach',
    name: 'JOB: TIER_1_AUTH_BREACH',
    rank: 'script-kiddie',
    minLevel: 1,
    resistanceType: 'AUTH_LOCKED',
    description: 'Сеть Синхрофазотрона в Сокольниках защищена базовыми паролями. Эта задача с сопротивлением (Resistance). Сначала ломани авторизацию (Auth), иначе любой скрипт отскочит. А потом найди скрытые файлы.',
    steps: [
      { id: '1', name: 'OVERRIDE_AUTH', requiredCardIds: ['script_auth'] },
      { id: '2', name: 'DISCOVERY', requiredCardIds: ['script_ls'] }
    ]
  },
  {
    id: 'sk_lvl2_proxy_tunnel',
    name: 'JOB: TIER_2_ENCRYPTED_TUNNEL',
    rank: 'script-kiddie',
    minLevel: 2,
    resistanceType: 'ENCRYPTED',
    description: 'Узел старых серверов Измайлово зашифрован. ICE "Морозко" блокирует твои пинги. Сначала прокинь туннель (SSH), чтобы обойти лед, а затем вытяни данные.',
    steps: [
      { id: '1', name: 'SECURE_TUNNEL', requiredCardIds: ['script_ssh'] },
      { id: '2', name: 'PING_INTERNAL', requiredCardIds: ['script_ping'] },
      { id: '3', name: 'GREP_DATA', requiredCardIds: ['script_grep'] }
    ]
  },
  {
    id: 'sk_lvl3_sokol_wipe',
    name: 'JOB: TIER_3_SUDO_WIPE',
    rank: 'script-kiddie',
    minLevel: 3,
    resistanceType: 'AUTH_LOCKED',
    isExecutionChain: true,
    description: 'Файловая система Сокола. Сюда не пускают без прав (Sudo). Введи учетные данные, повысь права (sudo), очисти логи и затри систему.',
    steps: [
      { id: '1', name: 'AUTH_SESSION', requiredCardIds: ['script_auth'] },
      { id: '2', name: 'ELEVATE_SUDO', requiredCardIds: ['script_sudo_fix'] },
      { id: '3', name: 'WASH_LOGS', requiredCardIds: ['script_wash_logs'] },
      { id: '4', name: 'RM_TRACE', requiredCardIds: ['script_rm'] }
    ]
  },
  {
    id: 'sk_lvl4_black_ice',
    name: 'JOB: TIER_4_BLACK_ICE',
    rank: 'script-kiddie',
    minLevel: 4,
    resistanceType: 'ENCRYPTED',
    isExecutionChain: true,
    description: 'Магистраль ВДНХ. Последня преграда скриптера - Черный Лед Станции. Пробивай туннель, получай Sudo, скачивай ядро ИИ и вали.',
    steps: [
      { id: '1', name: 'SSH_TUNNEL', requiredCardIds: ['script_ssh'] },
      { id: '2', name: 'SUDO_ACCESS', requiredCardIds: ['script_sudo_fix'] },
      { id: '3', name: 'SCP_EXFIL', requiredCardIds: ['script_scp'] },
      { id: '4', name: 'LOG_PURGE', requiredCardIds: ['script_wash_logs'] }
    ]
  },
  {
    id: 'sk_lvl1_bibi_cams',
    name: 'JOB: BIBIREVO_CAM_DECOY',
    rank: 'script-kiddie',
    minLevel: 1,
    districtId: 'bibirevo',
    resistanceType: 'AUTH_LOCKED',
    description: 'Камеры Бибирево застряли в ложном кадре. Перехвати доступ и аккуратно внедри отвлекающий поток, чтобы открыть короткое окно для прохода.',
    steps: [
      { id: '1', name: 'AUTH', requiredCardIds: ['script_auth'] },
      { id: '2', name: 'DECOY_INJECT', requiredCardIds: ['script_ls', 'script_cat'] }
    ]
  },
  {
    id: 'sk_lvl2_tekstil_looms',
    name: 'JOB: TEXTILE_LOOM_OVERRIDE',
    rank: 'script-kiddie',
    minLevel: 2,
    districtId: 'tekstilschiki',
    resistanceType: 'ENCRYPTED',
    description: 'Производственный контур шифрует управляющие сигналы. Выведи безопасный канал и мягко останови линию, не разрушив цеховой цикл.',
    steps: [
      { id: '1', name: 'TUNNEL', requiredCardIds: ['script_ssh'] },
      { id: '2', name: 'STOP_SIGNAL', requiredCardIds: ['script_sudo_fix'] }
    ]
  },
  {
    id: 'sk_lvl3_alt_silo_bypass',
    name: 'JOB: SILO_7_BYPASS_VALVE',
    rank: 'script-kiddie',
    minLevel: 3,
    districtId: 'altufyevo',
    resistanceType: 'AUTH_LOCKED',
    description: 'Аварийный клапан Силоса №7 заблокирован регламентом. Подними допуск и восстанови контроль до критического порога давления.',
    steps: [
      { id: '1', name: 'AUTH', requiredCardIds: ['script_auth'] },
      { id: '2', name: 'SUDO_OPEN', requiredCardIds: ['script_sudo_fix'] },
      { id: '3', name: 'VALVE_ECHO', requiredCardIds: ['script_cat'] }
    ]
  },
  {
    id: 'sk_lvl4_perovo_grid',
    name: 'JOB: PEROVO_SUBSTATION_REROUTE',
    rank: 'script-kiddie',
    minLevel: 4,
    districtId: 'perovo',
    resistanceType: 'ENCRYPTED',
    isExecutionChain: true,
    description: 'Подстанция Перово работает на грани. Пройди защищенный контур, получи расширенный доступ и перенаправь нагрузку в северную ветку без каскадного сбоя.',
    steps: [
      { id: '1', name: 'SSH', requiredCardIds: ['script_ssh'] },
      { id: '2', name: 'AUTH', requiredCardIds: ['script_auth'] },
      { id: '3', name: 'SUDO', requiredCardIds: ['script_sudo_fix'] },
      { id: '4', name: 'REROUTE', requiredCardIds: ['script_rm'] }
    ]
  },
  // --- JUNIOR REINFORCEMENTS ---
  {
    id: 'jr_reverse_string',
    name: 'ALGO: REVERSE_STRING_VAL',
    rank: 'junior',
    description: 'Бот-цензор требует перевернуть строку приветствия. Объяви метод, создай StringBuilder, запусти цикл с конца и верни результат (String).',
    steps: [
      { id: '1', name: 'METHOD', requiredCardIds: ['syntax_method_decl'] },
      { id: '2', name: 'SB_INIT', requiredCardIds: ['syntax_class_decl'] }, // Representative for building
      { id: '3', name: 'FOR_REVERSE', requiredCardIds: ['syntax_foreach'] },
      { id: '4', name: 'RESULT', requiredCardIds: ['syntax_return_true'] }
    ]
  },
  {
    id: 'jr_find_min',
    name: 'ALGO: FIND_MINIMUM_ID',
    rank: 'junior',
    description: 'Нужно найти минимальный ID в поврежденном массиве. Проинициализируй переменную min, пройдись циклом и сравнивай каждое значение.',
    steps: [
      { id: '1', name: 'DECLARE', requiredCardIds: ['syntax_method_decl'] },
      { id: '2', name: 'LOOP', requiredCardIds: ['syntax_foreach'] },
      { id: '3', name: 'COMPARE', requiredCardIds: ['syntax_if'] },
      { id: '4', name: 'FINISH', requiredCardIds: ['syntax_return_true'] }
    ]
  },
  {
    id: 'jr_fizz_buzz_lite',
    name: 'ALGO: FIZZ_BUZZ_VALIDATOR',
    rank: 'junior',
    description: 'Классика. Пройди от 1 до N. Если делится на 3 — выведи Fizz, на 5 — Buzz, на оба — FizzBuzz. Тебе понадобятся циклы и много условных операторов.',
    steps: [
      { id: '1', name: 'LOOP', requiredCardIds: ['syntax_foreach'] },
      { id: '2', name: 'IF_3', requiredCardIds: ['syntax_if'] },
      { id: '3', name: 'IF_5', requiredCardIds: ['syntax_elseif'] },
      { id: '4', name: 'PRINT', requiredCardIds: ['fn_sysout_print'] }
    ]
  },
  {
    id: 'jr_max_subarray',
    name: 'ALGO: MAX_SUBARRAY_SUM',
    rank: 'junior',
    isExecutionChain: true,
    description: 'Бот "Кадане" требует найти максимальную сумму подмассива. Инициализируй maxSoFar и maxEndingHere. Пройдись по массиву, обновляй текущую сумму. Если она стала отрицательной — сбрось в ноль. Твоя цель — глобальный максимум.',
    steps: [
      { id: '1', name: 'DECLARE_ALGO', requiredCardIds: ['syntax_method_decl'] },
      { id: '2', name: 'INIT_VARS', requiredCardIds: ['syntax_class_decl'] },
      { id: '3', name: 'LOOP_ARRAY', requiredCardIds: ['syntax_foreach'] },
      { id: '4', name: 'UPDATE_SUM', requiredCardIds: ['syntax_if'] },
      { id: '5', name: 'CHECK_MAX', requiredCardIds: ['syntax_return_true'] }
    ]
  }
];

const COOP_YARD_GENERATED = generateCoopYardMissionPool() as TechnicalTask[];

export const TZ_LIBRARY: TechnicalTask[] = [...TZ_LIBRARY_BASE, ...COOP_YARD_GENERATED];
