import type { TechnicalTask } from '../../logic/combatTasks';

export const SCRIPT_KIDDIE_TASKS: TechnicalTask[] = [
  {
    id: 'sk_ping_sweep',
    name: 'RECON: PING_SWEEP',
    rank: 'junior', // Internal ranking mapping later
    description: 'Нужно просканировать подсеть на наличие активных узлов. Запусти PING по диапазону шлюза.',
    steps: [
      { id: '1', name: 'GATEWAY_PROBE', requiredCardId: 'script_ping' }
    ]
  },
  {
    id: 'sk_wash_logs',
    name: 'CLEANUP: AUTH_LOG_WIPE',
    rank: 'junior',
    description: 'Система зафиксировала неудачный вход. Быстрее, промой логи авторизации, пока админ не проснулся.',
    steps: [
      { id: '1', name: 'WIPE_EVIDENCE', requiredCardId: 'script_wash_logs' }
    ]
  },
  {
    id: 'sk_grep_config',
    name: 'EXPLOIT: GREP_PASSWORDS',
    rank: 'junior',
    description: 'В этом дампе где-то лежат пароли в открытом виде. Используй GREP, чтобы вытащить строки с меткой "pass".',
    steps: [
      { id: '1', name: 'SEARCH_PLAIN_TEXT', requiredCardId: 'script_grep' }
    ]
  },
  {
    id: 'sk_sudo_fix',
    name: 'REPAIR: SUDO_OVERRIDE',
    rank: 'junior',
    description: 'Права доступа на исполняемый файл слетели. Юзай SUDO_FIX, чтобы принудительно вернуть управление.',
    steps: [
      { id: '1', name: 'FORCE_PERMISSIONS', requiredCardId: 'script_sudo_fix' }
    ]
  },
  {
    id: 'sk_history_wipe',
    name: 'CLEANUP: BASH_HISTORY_DELETE',
    rank: 'junior',
    description: 'Оставил слишком много следов в консоли. Полная очистка истории команд.',
    steps: [
      { id: '1', name: 'FLUSH_HISTORY', requiredCardId: 'script_wash_logs' }
    ]
  },
  {
    id: 'sk_grep_root',
    name: 'RECON: FIND_ROOT_PID',
    rank: 'junior',
    description: 'Найди PID процесса, запущенного от рута. Нам нужно знать, кого атаковать.',
    steps: [
      { id: '1', name: 'GREP_ROOT_PROCESS', requiredCardId: 'script_grep' }
    ]
  },
  {
    id: 'sk_ping_latency',
    name: 'DIAG: LATENCY_CHECK',
    rank: 'junior',
    description: 'Канал связи лагает. Проверь задержку до центрального сервера.',
    steps: [
      { id: '1', name: 'PING_REMOTE_HOST', requiredCardId: 'script_ping' }
    ]
  },
  {
    id: 'sk_sudo_daemon',
    name: 'SYSTEM: RESTART_DAEMON',
    rank: 'junior',
    description: 'Сервис завис в неопределенном состоянии. Перезагрузка через суперпользователя.',
    steps: [
      { id: '1', name: 'SUDO_SERVICE_RESTART', requiredCardId: 'script_sudo_fix' }
    ]
  },
  {
    id: 'sk_grep_port',
    name: 'RECON: PORT_8080_LISTEN',
    rank: 'junior',
    description: 'Проверь, слушает ли кто-нибудь порт 8080. Нам нужен вход в веб-интерфейс.',
    steps: [
      { id: '1', name: 'GREP_PORT_STATE', requiredCardId: 'script_grep' }
    ]
  },
  {
    id: 'sk_wash_tmp',
    name: 'CLEANUP: TMP_FINGERPRINTS',
    rank: 'junior',
    description: 'В директории /tmp остались временные файлы нашего скрипта. Удали всё.',
    steps: [
      { id: '1', name: 'WASH_TMP_DATA', requiredCardId: 'script_wash_logs' }
    ]
  },
  {
    id: 'sk_ping_alive',
    name: 'DIAG: HEARTBEAT_MONITOR',
    rank: 'junior',
    description: 'Убедись, что целевой бот всё еще в сети. Пингуй каждые 5ms.',
    steps: [
      { id: '1', name: 'SEND_HEARTBEAT', requiredCardId: 'script_ping' }
    ]
  },
  {
    id: 'sk_grep_error',
    name: 'DIAG: ERROR_DUMP_SCAN',
    rank: 'junior',
    description: 'В дампе памяти 10 ГБ мусора. Найди только строки с "CRITICAL_ERROR".',
    steps: [
      { id: '1', name: 'GREP_CRITICAL', requiredCardId: 'script_grep' }
    ]
  },
  {
    id: 'sk_sudo_kill',
    name: 'SYSTEM: KILL_PHANTOM',
    rank: 'junior',
    description: 'Системный процесс не реагирует на обычные сигналы. Грохни его через sudo.',
    steps: [
      { id: '1', name: 'SUDO_SIGKILL', requiredCardId: 'script_sudo_fix' }
    ]
  },
  {
    id: 'sk_wash_syslog',
    name: 'CLEANUP: SYSLOG_SCRUB',
    rank: 'junior',
    description: 'Ядерные логи начали верещать о вторжении. Промой их до блеска.',
    steps: [
      { id: '1', name: 'WASH_KERN_LOGS', requiredCardId: 'script_wash_logs' }
    ]
  },
  {
    id: 'sk_ping_router',
    name: 'NEURAL: ROUTER_BYPASS',
    rank: 'junior',
    description: 'Чтобы обойти фаервол, нужно сначала найти IP роутера. Пингуй стандартный шлюз.',
    steps: [
      { id: '1', name: 'PING_DEFAULT_GW', requiredCardId: 'script_ping' }
    ]
  },
  {
    id: 'sk_grep_env',
    name: 'RECON: ENV_VARIABLE_LEAK',
    rank: 'junior',
    description: 'Проверь переменные окружения на наличие API_KEY. Юзай GREP.',
    steps: [
      { id: '1', name: 'GREP_SECRET_ENV', requiredCardId: 'script_grep' }
    ]
  },
  {
    id: 'sk_sudo_write',
    name: 'SYSTEM: WRITE_PROTECTION_BREAK',
    rank: 'junior',
    description: 'Файл только для чтения, но нам нужно вписать туда свой бэкдор. SUDO_FIX в помощь.',
    steps: [
      { id: '1', name: 'BYPASS_WRITE_PROTECT', requiredCardId: 'script_sudo_fix' }
    ]
  },
  {
    id: 'sk_wash_shm',
    name: 'CLEANUP: SHARED_MEMORY_Wipe',
    rank: 'junior',
    description: 'Общая память забита остатками данных. Очисти сегмент.',
    steps: [
      { id: '1', name: 'WASH_SHM_SEGMENT', requiredCardId: 'script_wash_logs' }
    ]
  },
  {
    id: 'sk_ping_dns',
    name: 'RECON: DNS_VALIDATION',
    rank: 'junior',
    description: 'Проверь, отвечает ли DNS-сервер корпорации. Пингуй 8.8.8.8.',
    steps: [
      { id: '1', name: 'PING_DNS_HOST', requiredCardId: 'script_ping' }
    ]
  },
  {
    id: 'sk_grep_hidden',
    name: 'RECON: HIDDEN_SERVICE_FIND',
    rank: 'junior',
    description: 'В списке запущенных служб есть скрытый процесс. Найди его по необычному префиксу.',
    steps: [
      { id: '1', name: 'GREP_HIDDEN_PREFIX', requiredCardId: 'script_grep' }
    ]
  }
];
