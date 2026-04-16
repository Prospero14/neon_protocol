/**
 * Библиотека боевых карт (Протоколов) V5.1.
 * Расширена базовыми навыками Junior (Lists, Maps, If-Else).
 */

export type CardLanguage = 'java' | 'kotlin' | 'python' | 'js' | 'go' | 'none';
export type CardLibTag = 'spring' | 'network' | 'collections' | 'streams' | 'concurrency' | 'scripting';
export type CardType = 'SYNTAX' | 'FUNCTION' | 'NETWORK' | 'SOFT' | 'HARD' | 'DEFENSIVE' | 'REACTION' | 'BUG' | 'STATUS' | 'INFRASTRUCTURE' | 'SCRIPT';
export type CardGrade = 'Junior' | 'Middle' | 'Senior' | 'Script-Kiddo';
export type CardTag = 'base-java' | 'base-kotlin' | 'base-python' | 'base-go' | 'base-js' | 'script' | 'reaction' | 'utility' | 'spring' | 'scripting';

export interface CombatCard {
  id: string;
  name: string;
  type: CardType;
  grade: CardGrade;
  cost: number;
  power: number;
  integrity: number; 
  description: string;
  requires?: string; 
  pixelArt?: string; 
  language?: CardLanguage;
  libs?: CardLibTag[];
  tags: CardTag[];
  phaseConstraint?: 'PLANNING' | 'DESIGN' | 'CODING' | 'TESTING'; 
}

export const CARD_LIBRARY: CombatCard[] = [
  // --- SCRIPT-KIDDO BASICS (NO CLASS REQUIRED) ---
  {
    id: 'script_ping', name: 'PING_REQUEST', type: 'SCRIPT', grade: 'Script-Kiddo',
    cost: 0, power: 5, integrity: 5,
    description: 'ping -c 1. Базовая проверка сетевого узла. Наносит минимальный урон.',
    language: 'none', tags: ['script'], phaseConstraint: 'CODING'
  },
  {
    id: 'script_grep', name: 'GREP_SEARCH', type: 'SCRIPT', grade: 'Script-Kiddo',
    cost: 0, power: 8, integrity: 6,
    description: 'grep pattern logic. Поиск уязвимостей в потоке данных.',
    language: 'none', tags: ['script'], phaseConstraint: 'CODING'
  },
  {
    id: 'script_wash_logs', name: 'WASH_LOGS', type: 'SCRIPT', grade: 'Script-Kiddo',
    cost: 0, power: 0, integrity: 12,
    description: 'rm -rf /var/log/syslog. Скрывает следы вашего ботнета.',
    language: 'none', tags: ['script'], phaseConstraint: 'TESTING'
  },
  {
    id: 'script_sudo_fix', name: 'SUDO_FORCE_FIX', type: 'SCRIPT', grade: 'Script-Kiddo',
    cost: 0, power: 15, integrity: 4,
    description: 'sudo !!. Принудительное выполнение с правами суперпользователя. Пробивает фаерволы.',
    language: 'none', tags: ['script'], phaseConstraint: 'TESTING'
  },
  {
    id: 'script_auth', name: 'AUTH_HANDSHAKE', type: 'SCRIPT', grade: 'Script-Kiddo',
    cost: 0, power: 5, integrity: 10,
    description: 'auth -u admin. Попытка авторизации в системе. Критично для доступа к защищенным узлам.',
    language: 'none', tags: ['script'], phaseConstraint: 'PLANNING'
  },
  {
    id: 'script_scp', name: 'SCP_EXPORT', type: 'SCRIPT', grade: 'Script-Kiddo',
    cost: 0, power: 10, integrity: 8,
    description: 'scp logs.txt. Защищенное копирование данных (Экспорт). Финальное звено во многих цепочках сбора данных.',
    language: 'none', tags: ['script'], phaseConstraint: 'CODING'
  },
  {
    id: 'script_ls', name: 'LS_DISCOVER', type: 'SCRIPT', grade: 'Script-Kiddo',
    cost: 0, power: 2, integrity: 8,
    description: 'ls -la. Листинг директорий. Позволяет найти скрытые точки входа (инфо-дампы).',
    language: 'none', tags: ['script'], phaseConstraint: 'PLANNING'
  },
  {
    id: 'script_cat', name: 'CAT_READ', type: 'SCRIPT', grade: 'Script-Kiddo',
    cost: 0, power: 10, integrity: 5,
    description: 'cat secret.txt. Чтение содержимого файлов. Извлечение полезной инфы и повреждение данных.',
    language: 'none', tags: ['script'], phaseConstraint: 'CODING'
  },
  {
    id: 'script_ssh', name: 'SSH_TUNNEL', type: 'SCRIPT', grade: 'Script-Kiddo',
    cost: 0, power: 12, integrity: 15,
    description: 'ssh root@host. Установка защищенного туннеля для удаленного исполнения команд.',
    language: 'none', tags: ['script'], phaseConstraint: 'DESIGN'
  },
  {
    id: 'script_curl', name: 'CURL_REQUEST', type: 'SCRIPT', grade: 'Script-Kiddo',
    cost: 0, power: 15, integrity: 3,
    description: 'curl -X POST. Прямой запрос к API или загрузка вредоносного ПО.',
    language: 'none', tags: ['script'], phaseConstraint: 'CODING'
  },
  {
    id: 'script_chmod', name: 'CHMOD_PERMS', type: 'SCRIPT', grade: 'Script-Kiddo',
    cost: 0, power: 5, integrity: 12,
    description: 'chmod +x exploit. Смена прав доступа. Делает ваш код исполняемым.',
    language: 'none', tags: ['script'], phaseConstraint: 'TESTING'
  },
  {
    id: 'script_cron', name: 'CRONTAB_PERSIST', type: 'SCRIPT', grade: 'Script-Kiddo',
    cost: 0, power: 0, integrity: 25,
    description: 'crontab -e. Закрепление в системе (Persistence). Дает +5 HP щита за каждый ход.',
    language: 'none', tags: ['script'], phaseConstraint: 'TESTING'
  },
  {
    id: 'script_nc', name: 'NETCAT_BACKDOOR', type: 'SCRIPT', grade: 'Script-Kiddo',
    cost: 0, power: 20, integrity: 2,
    description: 'nc -lvp 4444. Открытие бэкдора. Наносит большой урон, но демаскирует систему.',
    language: 'none', tags: ['script'], phaseConstraint: 'CODING'
  },
  {
    id: 'script_rm', name: 'RM_WIPE', type: 'SCRIPT', grade: 'Script-Kiddo',
    cost: 0, power: 15, integrity: 5,
    description: 'rm -rf target. Безвозвратное удаление файлов или процессов. Чистая зачистка.',
    language: 'none', tags: ['script'], phaseConstraint: 'TESTING'
  },
  {
    id: 'soft_coffee', name: 'ВЫПИТЬ КОФЕ', type: 'SOFT', grade: 'Script-Kiddo',
    cost: 0, power: 0, integrity: 10,
    description: 'Восстановление концентрации. Снимает стресс и добавляет небольшой защитный буфер.',
    language: 'none', tags: ['utility'], phaseConstraint: 'PLANNING'
  },
  {
    id: 'soft_ai_ask', name: 'СПРОСИТЬ НЕЙРОСЕТКУ', type: 'SOFT', grade: 'Script-Kiddo',
    cost: 0, power: 15, integrity: 5,
    description: 'Нейро-подсказка. Помогает предсказать следующий ход ИИ и режет темп угрозы.',
    language: 'none', tags: ['utility'], phaseConstraint: 'CODING'
  },
  {
    id: 'infra_old_hw', name: 'СТАРОЕ ЖЕЛЕЗО', type: 'INFRASTRUCTURE', grade: 'Script-Kiddo',
    cost: 0, power: 5, integrity: 5,
    description: 'Проверенный временем хлам. Дает +512MB RAM (1 слот) до конца боя.',
    language: 'none', tags: ['utility'], phaseConstraint: 'PLANNING'
  },
  {
    id: 'infra_edge_cache', name: 'EDGE_CACHE_BOX', type: 'INFRASTRUCTURE', grade: 'Script-Kiddo',
    cost: 0, power: 0, integrity: 9,
    description: 'Локальный кэш на краю сети. Дает защитный буфер и немного снижает стресс старта.',
    language: 'none', tags: ['utility'], phaseConstraint: 'PLANNING'
  },
  {
    id: 'infra_safe_proxy', name: 'SAFE_PROXY_NODE', type: 'INFRASTRUCTURE', grade: 'Script-Kiddo',
    cost: 0, power: 3, integrity: 10,
    description: 'Прокси-узел для безопасного транзита. Сильно повышает mitigation и дополнительно снимает стресс.',
    language: 'none', tags: ['utility'], phaseConstraint: 'PLANNING'
  },

  // --- DESIGN PHASE (BASE JAVA) ---
  {
    id: 'syntax_package', name: 'PACKAGE_DECL', type: 'SYNTAX', grade: 'Junior',
    cost: 0, power: 3, integrity: 8,
    description: 'package com.neon.app; задаёт пространство имён модуля.',
    tags: ['base-java'], phaseConstraint: 'DESIGN'
  },
  {
    id: 'syntax_class_decl', name: 'CLASS_PUBLIC', type: 'SYNTAX', grade: 'Junior',
    cost: 1, power: 5, integrity: 12,
    description: 'public class NeuralAgent { … } — контейнер полей и методов.',
    tags: ['base-java'], phaseConstraint: 'DESIGN'
  },
  {
    id: 'syntax_main_method', name: 'STATIC_MAIN', type: 'SYNTAX', grade: 'Junior',
    cost: 1, power: 0, integrity: 10,
    description: 'public static void main(String[] args). Точка входа в систему.',
    requires: 'syntax_class_decl',
    tags: ['base-java'], phaseConstraint: 'DESIGN'
  },
  {
    id: 'syntax_list_init', name: 'LIST_ARRAYLIST', type: 'SYNTAX', grade: 'Junior',
    cost: 1, power: 5, integrity: 10,
    description: 'List<String> list = new ArrayList<>(); Инициализация коллекции.',
    libs: ['collections'], tags: ['base-java'], phaseConstraint: 'DESIGN'
  },
  {
    id: 'soft_focus', name: 'SOFT_FOCUS', type: 'SOFT', grade: 'Junior',
    cost: 1, power: 0, integrity: 20,
    description: 'Концентрация. Дает +1 CPU и небольшой mitigation на ближайший ответ ИИ.',
    tags: ['utility'], phaseConstraint: 'DESIGN'
  },
  {
    id: 'syntax_set_init', name: 'HASHSET_INIT', type: 'SYNTAX', grade: 'Junior',
    cost: 1, power: 5, integrity: 10,
    description: 'Set<Integer> set = new HashSet<>(); Инициализация уникального хранилища.',
    libs: ['collections'], tags: ['base-java'], phaseConstraint: 'DESIGN'
  },
  {
    id: 'syntax_method_decl', name: 'METHOD_PUBLIC', type: 'SYNTAX', grade: 'Junior',
    cost: 1, power: 5, integrity: 12,
    description: 'public boolean solve(int[] input) { … } — Описание логического блока.',
    tags: ['base-java'], phaseConstraint: 'DESIGN'
  },

  // --- CODING PHASE (BASE JAVA) ---
  {
    id: 'syntax_if', name: 'IF_CONDITION', type: 'SYNTAX', grade: 'Junior',
    cost: 1, power: 10, integrity: 8,
    description: 'if (condition) {…}. Проверка условия и ветвление.',
    tags: ['base-java'], phaseConstraint: 'CODING'
  },
  {
    id: 'syntax_elseif', name: 'ELSE_IF_BLOCK', type: 'SYNTAX', grade: 'Junior',
    cost: 1, power: 8, integrity: 8,
    description: 'else if (condition) {…}. Дополнительная ветка логики.',
    requires: 'syntax_if',
    tags: ['base-java'], phaseConstraint: 'CODING'
  },
  {
    id: 'syntax_foreach', name: 'FOR_EACH_LOOP', type: 'SYNTAX', grade: 'Junior',
    cost: 1, power: 15, integrity: 7,
    description: 'for (var item : list) {…}. Циклическая обработка данных.',
    tags: ['base-java'], phaseConstraint: 'CODING'
  },
  {
    id: 'fn_sysout_print', name: 'SYSOUT_PRINT', type: 'FUNCTION', grade: 'Junior',
    cost: 1, power: 12, integrity: 6,
    description: 'System.out.println(...). Выводит результат и наносит урон.',
    tags: ['base-java'], phaseConstraint: 'CODING'
  },
  {
    id: 'fn_map_put', name: 'MAP_PUT_DATA', type: 'FUNCTION', grade: 'Junior',
    cost: 1, power: 14, integrity: 8,
    description: 'map.put(key, value). Сохранение данных в ассоциативный массив.',
    libs: ['collections'], tags: ['base-java'], phaseConstraint: 'CODING'
  },
  {
    id: 'syntax_try_catch', name: 'TRY_CATCH', type: 'SYNTAX', grade: 'Junior',
    cost: 1, power: 0, integrity: 15,
    description: 'try {…} catch {…}. Защищает от багов и прерываний.',
    tags: ['base-java'], phaseConstraint: 'CODING'
  },
  {
    id: 'fn_set_add', name: 'SET_ADD', type: 'FUNCTION', grade: 'Junior',
    cost: 1, power: 12, integrity: 8,
    description: 'set.add(value). Добавление элемента в уникальную коллекцию.',
    libs: ['collections'], tags: ['base-java'], phaseConstraint: 'CODING'
  },
  {
    id: 'fn_set_contains', name: 'SET_CONTAINS', type: 'FUNCTION', grade: 'Junior',
    cost: 1, power: 15, integrity: 5,
    description: 'set.contains(value). Проверка наличия элемента в коллекции.',
    libs: ['collections'], tags: ['base-java'], phaseConstraint: 'CODING'
  },
  {
    id: 'syntax_return_true', name: 'RETURN_TRUE', type: 'SYNTAX', grade: 'Junior',
    cost: 1, power: 20, integrity: 5,
    description: 'return true. Завершение процесса с положительным результатом.',
    tags: ['base-java'], phaseConstraint: 'CODING'
  },
  {
    id: 'syntax_return_false', name: 'RETURN_FALSE', type: 'SYNTAX', grade: 'Junior',
    cost: 1, power: 5, integrity: 10,
    description: 'return false. Завершение процесса с отрицательным результатом.',
    tags: ['base-java'], phaseConstraint: 'CODING'
  },

  // --- TESTING PHASE / REACTIONS ---
  {
    id: 'def_validator', name: 'INPUT_VALIDATOR', type: 'DEFENSIVE', grade: 'Middle',
    cost: 1, power: 5, integrity: 25,
    description: 'Проверка входных данных. Очищает слот от карт-багов.',
    tags: ['reaction'], phaseConstraint: 'TESTING'
  },
  {
    id: 'react_unit_test', name: 'UNIT_TEST_REACTION', type: 'REACTION', grade: 'Junior',
    cost: 1, power: 0, integrity: 10,
    description: 'Юнит-тест: Удаляет 1 стак "Bugs" у ИИ или очищает "Syntax Glitch".',
    tags: ['reaction'], phaseConstraint: 'TESTING'
  },
  {
    id: 'react_refactoring', name: 'CODE_REFACTOR', type: 'REACTION', grade: 'Middle',
    cost: 2, power: 0, integrity: 15,
    description: 'Рефакторинг: Снимает эффект "Fatigue" (усталость) с игрока.',
    tags: ['reaction'], phaseConstraint: 'TESTING'
  },

  // --- MIDDLE TIER (CODING) ---
  {
    id: 'mid_stream_init', name: 'STREAM_API', type: 'FUNCTION', grade: 'Middle',
    cost: 2, power: 15, integrity: 10,
    description: 'collection.stream(). Создает поток данных для обработки.',
    libs: ['streams'], tags: ['base-java'], phaseConstraint: 'CODING'
  },
  {
    id: 'mid_stream_map', name: 'STREAM_MAP', type: 'FUNCTION', grade: 'Middle',
    cost: 1, power: 20, integrity: 8,
    description: '.map(x -> x * 2). Трансформирует данные в потоке.',
    requires: 'mid_stream_init', tags: ['base-java'], phaseConstraint: 'CODING'
  },
  {
    id: 'mid_optional', name: 'OPTIONAL_WRAP', type: 'FUNCTION', grade: 'Middle',
    cost: 1, power: 5, integrity: 20,
    description: 'Optional.ofNullable(). Предотвращает ошибки NullPointerException.',
    tags: ['base-java'], phaseConstraint: 'TESTING'
  },
  {
    id: 'lib_lombok_data', name: 'LOMBOK_DATA', type: 'FUNCTION', grade: 'Middle',
    cost: 1, power: 0, integrity: 15,
    description: '@Data. Генерирует геттеры, сеттеры и toString. Экономит 3 слота на шине.',
    tags: ['utility'], phaseConstraint: 'DESIGN'
  },
  {
    id: 'lib_lombok_builder', name: 'LOMBOK_BUILDER', type: 'FUNCTION', grade: 'Middle',
    cost: 1, power: 5, integrity: 10,
    description: '@Builder. Паттерн Строитель для создания сложных объектов без длинных конструкторов.',
    tags: ['utility'], phaseConstraint: 'DESIGN'
  },
  {
    id: 'lib_commons_blank', name: 'STR_IS_BLANK', type: 'FUNCTION', grade: 'Junior',
    cost: 1, power: 10, integrity: 5,
    description: 'StringUtils.isBlank(). Профессиональная проверка строки на пустоту и пробелы.',
    tags: ['utility'], phaseConstraint: 'CODING'
  },
  {
    id: 'mid_stream_filter', name: 'STREAM_FILTER', type: 'FUNCTION', grade: 'Middle',
    cost: 1, power: 15, integrity: 5,
    description: '.filter(x -> x > 0). Функциональный способ фильтрации данных без циклов.',
    requires: 'mid_stream_init', tags: ['base-java'], phaseConstraint: 'CODING'
  },
  {
    id: 'mid_stream_collect', name: 'STREAM_COLLECT', type: 'FUNCTION', grade: 'Middle',
    cost: 1, power: 10, integrity: 10,
    description: '.collect(Collectors.toList()). Терминальная операция для сборки результата стрима.',
    requires: 'mid_stream_init', tags: ['base-java'], phaseConstraint: 'CODING'
  },
  {
    id: 'lib_spring_repo', name: 'JPA_REPOSITORY', type: 'FUNCTION', grade: 'Senior',
    cost: 2, power: 0, integrity: 30,
    description: 'interface UserRepository extends JpaRepository. Автоматическое управление БД без SQL.',
    tags: ['spring'], phaseConstraint: 'DESIGN'
  },

  // --- INFRASTRUCTURE CARDS (PLANNING PHASE) ---
  {
    id: 'infra_dns_resolver', name: 'DNS_RESOLVER', type: 'INFRASTRUCTURE', grade: 'Junior',
    cost: 0, power: 0, integrity: 10,
    description: 'Настройка DNS-записей. Фундамент системы. +1 к CPU_CYCLES.',
    libs: ['network'], tags: ['utility'], phaseConstraint: 'PLANNING'
  },
  {
    id: 'infra_lb_nginx', name: 'NGINX_LB', type: 'INFRASTRUCTURE', grade: 'Middle',
    cost: 1, power: 5, integrity: 20,
    description: 'Балансировщик Nginx. Оптимизирует трафик. +1 CPU и +512MB RAM.',
    tags: ['utility'], phaseConstraint: 'PLANNING'
  },
  {
    id: 'infra_actions_ci', name: 'GITHUB_ACTIONS', type: 'INFRASTRUCTURE', grade: 'Middle',
    cost: 1, power: 0, integrity: 25,
    description: 'CI/CD пайплайн. Сразу дает +1 CPU и небольшой защитный буфер.',
    tags: ['utility'], phaseConstraint: 'PLANNING'
  },
  {
    id: 'infra_prometheus', name: 'PROMETHEUS_MON', type: 'INFRASTRUCTURE', grade: 'Senior',
    cost: 2, power: 0, integrity: 30,
    description: 'Мониторинг метрик. Снижает текущие threat/bugs за счет раннего обнаружения аномалий.',
    tags: ['utility'], phaseConstraint: 'PLANNING'
  },
  {
    id: 'infra_basic_pod', name: 'BASIC_POD', type: 'INFRASTRUCTURE', grade: 'Junior',
    cost: 0, power: 0, integrity: 10,
    description: 'Базовый под: +1 CPU и +512MB RAM. Фундамент системы.',
    tags: ['utility'], phaseConstraint: 'PLANNING'
  },
  {
    id: 'infra_h_scaling', name: 'HORIZ_SCALE', type: 'INFRASTRUCTURE', grade: 'Junior',
    cost: 0, power: 0, integrity: 15,
    description: 'Горизонтальное масштабирование. +1 CPU и +1GB RAM за +2 Stress.',
    tags: ['utility'], phaseConstraint: 'PLANNING'
  },
  {
    id: 'soft_pair_programming', name: 'PAIR_PROG', type: 'SOFT', grade: 'Junior',
    cost: 0, power: 0, integrity: 20,
    description: 'Парное программирование. Ускоряет прогресс проекта и немного чистит баги.',
    tags: ['utility'], phaseConstraint: 'PLANNING'
  },
  {
    id: 'soft_critical_thinking', name: 'CRIT_THINKING', type: 'SOFT', grade: 'Middle',
    cost: 1, power: 10, integrity: 20,
    description: 'Критическое мышление. Подкидывает CPU и усиливает контроль в фазе стабилизации.',
    tags: ['utility'], phaseConstraint: 'DESIGN'
  },
  {
    id: 'react_hotfix', name: 'HOTFIX_DEPLOY', type: 'REACTION', grade: 'Middle',
    cost: 1, power: 15, integrity: 15,
    description: 'Хотфикс: Мгновенно исправляет 1 баг на шине и дает +10 прогресса.',
    tags: ['reaction'], phaseConstraint: 'TESTING'
  },
  {
    id: 'react_rollback', name: 'COMMIT_ROLLBACK', type: 'REACTION', grade: 'Senior',
    cost: 2, power: 0, integrity: 25,
    description: 'Откат коммита: Возвращает HP игрока на значение начала хода.',
    tags: ['reaction'], phaseConstraint: 'TESTING'
  },
  {
    id: 'infra_docker', name: 'DOCKER_CONTAINER', type: 'INFRASTRUCTURE', grade: 'Junior',
    cost: 1, power: 0, integrity: 30,
    description: 'Контейнеризация. Увеличивает RAM-лимит на +512MB.',
    tags: ['utility'], phaseConstraint: 'DESIGN'
  },
  {
    id: 'infra_postgres', name: 'POSTGRESQL_DB', type: 'INFRASTRUCTURE', grade: 'Middle',
    cost: 2, power: 0, integrity: 40,
    description: 'База данных уровня Enterprise. Необходима для работы с DAO/Repository.',
    tags: ['utility'], phaseConstraint: 'DESIGN'
  },
  {
    id: 'infra_cicd', name: 'CICD_PIPELINE', type: 'INFRASTRUCTURE', grade: 'Senior',
    cost: 3, power: 0, integrity: 30,
    description: 'Автоматическое развертывание. Моментально расширяет вычислительный лимит: +2 CPU.',
    tags: ['utility'], phaseConstraint: 'DESIGN'
  },
  {
    id: 'infra_redis', name: 'REDIS_CACHE', type: 'INFRASTRUCTURE', grade: 'Middle',
    cost: 1, power: 0, integrity: 20,
    description: 'In-Memory кэширование. Мгновенно добирает 2 карты и слегка разгружает баг-давление.',
    tags: ['utility'], phaseConstraint: 'DESIGN'
  },
  {
    id: 'react_integration_test', name: 'INTEGRATION_TEST', type: 'REACTION', grade: 'Middle',
    cost: 1, power: 10, integrity: 30,
    description: 'Проверяет связи модулей. Может снять эффект усложнения (Vague Requirements) у босса.',
    tags: ['reaction'], phaseConstraint: 'TESTING'
  },

  // --- STATUS CARDS (ENEMY CURSES) ---
  {
    id: 'status_spaghetti', name: 'SPAGHETTI_CODE', type: 'STATUS', grade: 'Junior',
    cost: 1, power: 0, integrity: 1,
    description: 'Мусорная карта. Нельзя сыграть на Шину. Потратьте 1 CPU, чтобы сбросить её из руки.',
    tags: ['utility'] // No phaseConstraint so it can be drawn anywhere
  },
  {
    id: 'status_deprecated', name: 'DEPRECATED_LIB', type: 'STATUS', grade: 'Middle',
    cost: 2, power: 0, integrity: 1,
    description: 'Устаревшая зависимость. Занимает место в руке. Сброс стоит целых 2 CPU.',
    tags: ['utility']
  },
  {
    id: 'infra_s3_bucket', name: 'S3_BUCKET', type: 'INFRASTRUCTURE', grade: 'Middle',
    cost: 1, power: 0, integrity: 20,
    description: 'Облачное хранилище. Увеличивает максимальную RAM на +1.5GB (3 слота).',
    tags: ['utility'], phaseConstraint: 'PLANNING'
  },
  {
    id: 'infra_raid_array', name: 'RAID_ARRAY', type: 'INFRASTRUCTURE', grade: 'Middle',
    cost: 1, power: 0, integrity: 40,
    description: 'Отказоустойчивый массив. Резко снижает текущий стресс (-20).',
    tags: ['utility'], phaseConstraint: 'PLANNING'
  },
  {
    id: 'soft_buffer_flush', name: 'BUFFER_FLUSH', type: 'SOFT', grade: 'Junior',
    cost: 0, power: 0, integrity: 10,
    description: 'Сброс буфера: перезагрузка руки под текущую фазу и разгрузка стресса.',
    tags: ['utility']
  },
  {
    id: 'soft_recursive_logic', name: 'RECURSIVE_THINK', type: 'SOFT', grade: 'Middle',
    cost: 1, power: 5, integrity: 15,
    description: 'Рекурсивное мышление: добавляет mitigation и дает быстрый прирост прогресса.',
    tags: ['utility']
  },
  {
    id: 'soft_async_request', name: 'ASYNC_AWAIT', type: 'SOFT', grade: 'Junior',
    cost: 0, power: 0, integrity: 10,
    description: 'Асинхронный вызов: расширяет окно CPU на ход и помогает пережить ответ ИИ.',
    tags: ['utility']
  },
  {
    id: 'infra_k8s_cluster', name: 'K8S_CLUSTER', type: 'INFRASTRUCTURE', grade: 'Senior',
    cost: 3, power: 0, integrity: 60,
    description: 'Kubernetes Cluster: +3 CPU и +4GB RAM. Ультимативный разгон инфраструктуры.',
    tags: ['utility'], phaseConstraint: 'PLANNING'
  },
  {
    id: 'infra_cdn_edge', name: 'CDN_EDGE', type: 'INFRASTRUCTURE', grade: 'Middle',
    cost: 1, power: 10, integrity: 30,
    description: 'CDN Edge: распределенная сеть. Снижает текущую угрозу и добавляет защитный буфер.',
    tags: ['utility'], phaseConstraint: 'PLANNING'
  },
  {
    id: 'infra_log_aggregator', name: 'LOG_STASH', type: 'INFRASTRUCTURE', grade: 'Junior',
    cost: 1, power: 0, integrity: 20,
    description: 'Сбор логов: +512MB RAM и мгновенный добор +1 карты.',
    tags: ['utility'], phaseConstraint: 'PLANNING'
  },
  {
    id: 'infra_vpc_network', name: 'VPC_PRIVATE', type: 'INFRASTRUCTURE', grade: 'Middle',
    cost: 1, power: 0, integrity: 40,
    description: 'Virtual Private Cloud: +1 CPU и сильный защитный буфер (+mitigation).',
    tags: ['utility'], phaseConstraint: 'PLANNING'
  },
  {
    id: 'infra_db_cluster', name: 'DB_REPLICAS', type: 'INFRASTRUCTURE', grade: 'Senior',
    cost: 3, power: 0, integrity: 50,
    description: 'Кластер БД: +3GB RAM и заметное снижение стресса за счет репликации.',
    tags: ['utility'], phaseConstraint: 'PLANNING'
  },
  {
    id: 'soft_throw_ex', name: 'THROW_EX', type: 'SOFT', grade: 'Middle',
    cost: 1, power: 25, integrity: 5,
    description: 'Контролируемый сброс: режет угрозу и баги, но слегка повышает стресс.',
    tags: ['base-java'], phaseConstraint: 'CODING'
  },
  {
    id: 'soft_finally', name: 'FINALLY_BLOCK', type: 'SOFT', grade: 'Middle',
    cost: 1, power: 0, integrity: 30,
    description: 'FINALLY-блок: усиливает защитный буфер и снимает часть стресса.',
    tags: ['base-java'], phaseConstraint: 'CODING'
  },
  {
    id: 'reward_divine_debug', name: 'DIVINE_DEBUG', type: 'SOFT', grade: 'Senior',
    cost: 1, power: 0, integrity: 50,
    description: 'Глубокий дебаг. Сильно снимает стресс, чистит баги в руке и стабилизирует бой.',
    tags: ['utility'], phaseConstraint: 'TESTING'
  },
  {
    id: 'infra_mesh_relay', name: 'MESH_RELAY_GRID', type: 'INFRASTRUCTURE', grade: 'Junior',
    cost: 1, power: 0, integrity: 18,
    description: 'Сетка ретрансляторов метро. +1 CPU и +512MB RAM, стабильный базис для ранних контрактов.',
    tags: ['utility'], phaseConstraint: 'PLANNING'
  },
  {
    id: 'infra_quarantine_vm', name: 'QUARANTINE_VM', type: 'INFRASTRUCTURE', grade: 'Middle',
    cost: 1, power: 0, integrity: 26,
    description: 'Песочница для сомнительного кода. Снимает 8 стресса при деплое и повышает выживаемость шины.',
    tags: ['utility'], phaseConstraint: 'PLANNING'
  },
  {
    id: 'infra_street_fusion', name: 'STREET_FUSION_CORE', type: 'INFRASTRUCTURE', grade: 'Middle',
    cost: 2, power: 0, integrity: 30,
    description: 'Гибридный модуль из скрапа и корп-железа. +2 CPU, но добавляет немного фонового стресса.',
    tags: ['utility'], phaseConstraint: 'PLANNING'
  },
  {
    id: 'infra_orbital_uplink', name: 'ORBITAL_UPLINK', type: 'INFRASTRUCTURE', grade: 'Senior',
    cost: 3, power: 0, integrity: 35,
    description: 'Спутниковый uplink из Филей. +1 CPU и +2GB RAM, открывает ресурс под длинные цепочки.',
    tags: ['utility'], phaseConstraint: 'PLANNING'
  },
  {
    id: 'soft_tactical_breath', name: 'TACTICAL_BREATH', type: 'SOFT', grade: 'Junior',
    cost: 0, power: 0, integrity: 14,
    description: 'Короткая нейро-пауза. Мгновенно снимает стресс и даёт контроль темпа.',
    tags: ['utility'], phaseConstraint: 'TESTING'
  },
  {
    id: 'soft_patch_drill', name: 'PATCH_DRILL', type: 'SOFT', grade: 'Middle',
    cost: 1, power: 0, integrity: 20,
    description: 'Тренировочный протокол патчей. Поднимает mitigation и помогает пережить ответ ИИ.',
    tags: ['utility'], phaseConstraint: 'TESTING'
  },
  {
    id: 'soft_signal_prediction', name: 'SIGNAL_PREDICTION', type: 'SOFT', grade: 'Middle',
    cost: 1, power: 0, integrity: 18,
    description: 'Предиктивный анализ линии угроз. Ослабляет накопленные баги и сбивает темп противника.',
    tags: ['utility'], phaseConstraint: 'TESTING'
  },
  {
    id: 'soft_deadline_trance', name: 'DEADLINE_TRANCE', type: 'SOFT', grade: 'Senior',
    cost: 2, power: 0, integrity: 28,
    description: 'Боевой режим дедлайна. +1 CPU в этот ход и добор карты ценой небольшого стресса.',
    tags: ['utility'], phaseConstraint: 'TESTING'
  },

  // --- COUNTER-ICE REACTIONS (Script-Kiddo) ---
  // Каждая карта — ответ на конкретную личность ICE или общую угрозу.
  {
    id: 'react_trace_jam', name: 'TRACE_JAM', type: 'REACTION', grade: 'Script-Kiddo',
    cost: 0, power: 0, integrity: 8,
    description: '[vs TRACER] Глушит сигнатурный анализ. Следующие 3 карты этого хода не засчитываются TRACER-режимом. Играй спокойно.',
    language: 'none', tags: ['reaction', 'script']
  },
  {
    id: 'react_null_packet', name: 'NULL_PACKET', type: 'REACTION', grade: 'Script-Kiddo',
    cost: 0, power: 5, integrity: 12,
    description: '[vs PHANTOM/MIME] Нулевой пакет — убирает один BUG_ERROR со случайного слота шины без затрат CPU.',
    language: 'none', tags: ['reaction', 'script']
  },
  {
    id: 'react_spoof_id', name: 'SPOOF_ID', type: 'REACTION', grade: 'Script-Kiddo',
    cost: 0, power: 0, integrity: 10,
    description: '[vs AUDITOR] Подмена идентификатора. Позволяет первой картой на шине быть любого типа — AUDITOR не заметит разницы.',
    language: 'none', tags: ['reaction', 'script']
  },
  {
    id: 'react_log_mask', name: 'LOG_MASK', type: 'REACTION', grade: 'Script-Kiddo',
    cost: 0, power: 0, integrity: 6,
    description: '[vs SNIFFER] Маскировка логов. STATUS-карты в руке становятся невидимы для SNIFFER на 2 хода. Время выдышаться.',
    language: 'none', tags: ['reaction', 'script']
  },
  {
    id: 'react_decoy_ping', name: 'DECOY_PING', type: 'REACTION', grade: 'Script-Kiddo',
    cost: 0, power: 3, integrity: 8,
    description: '[vs PHANTOM] Ложный пинг. Перенаправляет следующий PHANTOM phase-shift на пустой слот шины вместо занятого.',
    language: 'none', tags: ['reaction', 'script']
  },
  {
    id: 'react_firewall_patch', name: 'FIREWALL_PATCH', type: 'REACTION', grade: 'Junior',
    cost: 1, power: 0, integrity: 25,
    description: '[GENERAL] Аварийный патч. +20 integrity всем картам на шине. Используй когда шина под давлением.',
    language: 'none', tags: ['reaction']
  },
  {
    id: 'react_emergency_flush', name: 'EMERGENCY_FLUSH', type: 'REACTION', grade: 'Script-Kiddo',
    cost: 0, power: 0, integrity: 5,
    description: '[PANIC] Аварийный сброс буфера. Сброси текущую руку мгновенно — возьми 4 новые карты и сними -8 стресс. Только в крайнем случае.',
    language: 'none', tags: ['reaction', 'script']
  },
  {
    id: 'react_contract_test', name: 'CONTRACT_TEST', type: 'REACTION', grade: 'Junior',
    cost: 1, power: 4, integrity: 10,
    description: 'Проверка API-контрактов. Срезает баги интерфейсов и ловит несовместимые ответы.',
    language: 'none', tags: ['reaction']
  },
  {
    id: 'react_snapshot_guard', name: 'SNAPSHOT_GUARD', type: 'REACTION', grade: 'Junior',
    cost: 1, power: 3, integrity: 11,
    description: 'Снимок ожидаемого состояния UI/ответа. Отбивает регресс в критичных точках.',
    language: 'none', tags: ['reaction']
  },
  {
    id: 'react_schema_fence', name: 'SCHEMA_FENCE', type: 'REACTION', grade: 'Junior',
    cost: 1, power: 4, integrity: 12,
    description: 'Ограждение схемы данных. Режет ошибки несовместимых миграций и payload.',
    language: 'none', tags: ['reaction']
  },
  {
    id: 'react_load_probe', name: 'LOAD_PROBE', type: 'REACTION', grade: 'Middle',
    cost: 1, power: 5, integrity: 8,
    description: 'Нагрузочный щуп. Выявляет деградацию до прод-аварии.',
    language: 'none', tags: ['reaction']
  },
  {
    id: 'react_soak_test', name: 'SOAK_TEST', type: 'REACTION', grade: 'Middle',
    cost: 1, power: 5, integrity: 10,
    description: 'Длительный прогон. Выдавливает накопленные сбои и утечки.',
    language: 'none', tags: ['reaction']
  },
  {
    id: 'react_property_fuzz', name: 'PROPERTY_FUZZ', type: 'REACTION', grade: 'Middle',
    cost: 1, power: 6, integrity: 8,
    description: 'Fuzz/Property based. Ловит редкие edge-case до того, как их использует ИИ.',
    language: 'none', tags: ['reaction']
  },
  {
    id: 'react_mock_server', name: 'MOCK_SERVER', type: 'REACTION', grade: 'Junior',
    cost: 1, power: 3, integrity: 12,
    description: 'Изоляция внешних зависимостей. Стабилизирует тестовый контур.',
    language: 'none', tags: ['reaction']
  },
  {
    id: 'react_flaky_quarantine', name: 'FLAKY_QUARANTINE', type: 'REACTION', grade: 'Middle',
    cost: 1, power: 4, integrity: 11,
    description: 'Карантин флаки-тестов. Убирает шум и возвращает сигнал по качеству.',
    language: 'none', tags: ['reaction']
  },
  {
    id: 'react_boundary_case', name: 'BOUNDARY_CASE', type: 'REACTION', grade: 'Junior',
    cost: 1, power: 4, integrity: 10,
    description: 'Проверка границ входа. Закрывает частый источник production-багов.',
    language: 'none', tags: ['reaction']
  },
  {
    id: 'react_perf_budget', name: 'PERF_BUDGET', type: 'REACTION', grade: 'Middle',
    cost: 1, power: 5, integrity: 9,
    description: 'Бюджет производительности. Блокирует тихую деградацию и таймауты.',
    language: 'none', tags: ['reaction']
  },
  {
    id: 'react_race_detector', name: 'RACE_DETECTOR', type: 'REACTION', grade: 'Senior',
    cost: 1, power: 6, integrity: 9,
    description: 'Детектор гонок/конкурентности. Ловит трудно-воспроизводимые дефекты.',
    language: 'none', tags: ['reaction']
  },
  {
    id: 'react_mutation_suite', name: 'MUTATION_SUITE', type: 'REACTION', grade: 'Senior',
    cost: 1, power: 6, integrity: 8,
    description: 'Мутационный набор. Проверяет реальную силу тестов и выбивает ложную уверенность.',
    language: 'none', tags: ['reaction']
  },
  {
    id: 'def_ci_gate', name: 'CI_GATE', type: 'DEFENSIVE', grade: 'Junior',
    cost: 1, power: 2, integrity: 18,
    description: 'Защитный шлюз качества. Не пропускает сомнительные изменения в релиз.',
    language: 'none', tags: ['reaction']
  },
  {
    id: 'def_smoke_suite', name: 'SMOKE_SUITE', type: 'DEFENSIVE', grade: 'Junior',
    cost: 1, power: 3, integrity: 16,
    description: 'Смоук-пак на критический путь. Быстрый ранний сигнал о поломке.',
    language: 'none', tags: ['reaction']
  },
  {
    id: 'def_release_candidate', name: 'RELEASE_CANDIDATE_CHECK', type: 'DEFENSIVE', grade: 'Middle',
    cost: 1, power: 4, integrity: 17,
    description: 'Полная проверка RC перед выкладкой. Снижает риск ночного отката.',
    language: 'none', tags: ['reaction']
  },
  {
    id: 'def_canary_assert', name: 'CANARY_ASSERT', type: 'DEFENSIVE', grade: 'Middle',
    cost: 1, power: 4, integrity: 16,
    description: 'Канареечная валидация в малом трафике. Локализует сбой до взрыва.',
    language: 'none', tags: ['reaction']
  },
  {
    id: 'react_bug_repro', name: 'BUG_REPRO', type: 'REACTION', grade: 'Junior',
    cost: 1, power: 4, integrity: 9,
    description: 'Шаги воспроизведения. Переводит хаос в конкретный и лечимый баг.',
    language: 'none', tags: ['reaction']
  },
  {
    id: 'react_root_cause', name: 'ROOT_CAUSE_PINPOINT', type: 'REACTION', grade: 'Senior',
    cost: 1, power: 6, integrity: 8,
    description: 'Поиск первопричины. Закрывает класс дефекта, а не симптом.',
    language: 'none', tags: ['reaction']
  },

  {
    id: 'soft_agile_ceremony', name: 'AGILE_CEREMONY', type: 'SOFT', grade: 'Junior',
    cost: 1, power: 0, integrity: 14,
    description: 'Короткий sync ритуал. Упорядочивает поток задач и снижает хаос команды.',
    language: 'none', tags: ['utility']
  },
  {
    id: 'soft_daily_sync', name: 'DAILY_SYNC', type: 'SOFT', grade: 'Junior',
    cost: 1, power: 0, integrity: 13,
    description: 'Ежедневный апдейт статуса. Ускоряет координацию и снимает часть тревоги.',
    language: 'none', tags: ['utility']
  },
  {
    id: 'soft_retro_action', name: 'RETRO_ACTIONS', type: 'SOFT', grade: 'Junior',
    cost: 1, power: 0, integrity: 13,
    description: 'Ретро с action items. Повышает качество следующего цикла.',
    language: 'none', tags: ['utility']
  },
  {
    id: 'soft_pizza_party', name: 'PIZZA_PARTY', type: 'SOFT', grade: 'Script-Kiddo',
    cost: 0, power: 0, integrity: 11,
    description: 'Командный буст морали. Сильно снижает стресс и возвращает фокус.',
    language: 'none', tags: ['utility']
  },
  {
    id: 'soft_scope_cut', name: 'SCOPE_CUT', type: 'SOFT', grade: 'Middle',
    cost: 1, power: 0, integrity: 12,
    description: 'Срез неключевого scope. Позволяет успеть в срок без перегрева.',
    language: 'none', tags: ['utility']
  },
  {
    id: 'soft_stakeholder_alignment', name: 'STAKEHOLDER_ALIGNMENT', type: 'SOFT', grade: 'Middle',
    cost: 1, power: 0, integrity: 12,
    description: 'Выравнивание ожиданий бизнеса. Снижает внешний шум и конфликты.',
    language: 'none', tags: ['utility']
  },
  {
    id: 'soft_risk_register', name: 'RISK_REGISTER', type: 'SOFT', grade: 'Middle',
    cost: 1, power: 0, integrity: 12,
    description: 'Реестр рисков и план B. Гасит внезапные провалы по дедлайну.',
    language: 'none', tags: ['utility']
  },
  {
    id: 'soft_release_train', name: 'RELEASE_TRAIN', type: 'SOFT', grade: 'Middle',
    cost: 1, power: 0, integrity: 12,
    description: 'Релизный поезд по расписанию. Поддерживает регулярность и ритм поставки.',
    language: 'none', tags: ['utility']
  },
  {
    id: 'soft_backlog_refine', name: 'BACKLOG_REFINE', type: 'SOFT', grade: 'Junior',
    cost: 1, power: 0, integrity: 11,
    description: 'Уточнение backlog. Убирает двусмысленность и ускоряет execution.',
    language: 'none', tags: ['utility']
  },
  {
    id: 'soft_priority_matrix', name: 'PRIORITY_MATRIX', type: 'SOFT', grade: 'Junior',
    cost: 1, power: 0, integrity: 11,
    description: 'Матрица приоритетов. Команда тратит усилия туда, где максимальная отдача.',
    language: 'none', tags: ['utility']
  },
  {
    id: 'soft_team_health', name: 'TEAM_HEALTH_CHECK', type: 'SOFT', grade: 'Junior',
    cost: 1, power: 0, integrity: 12,
    description: 'Проверка состояния команды. Предотвращает срыв из-за выгорания.',
    language: 'none', tags: ['utility']
  },
  {
    id: 'soft_crisis_room', name: 'CRISIS_ROOM', type: 'SOFT', grade: 'Senior',
    cost: 1, power: 0, integrity: 10,
    description: 'Антикризисная комната. Концентрирует фокус на тушении ключевых рисков.',
    language: 'none', tags: ['utility']
  },
  {
    id: 'soft_business_case', name: 'BUSINESS_CASE_DEFENSE', type: 'SOFT', grade: 'Senior',
    cost: 1, power: 0, integrity: 10,
    description: 'Защита бизнес-кейса. Снимает внешнее давление и удерживает курс релиза.',
    language: 'none', tags: ['utility']
  },
  {
    id: 'soft_kpi_dashboard', name: 'KPI_DASHBOARD', type: 'SOFT', grade: 'Middle',
    cost: 1, power: 0, integrity: 11,
    description: 'Прозрачные метрики спринта. Ранний сигнал отклонений до критической фазы.',
    language: 'none', tags: ['utility']
  },
  {
    id: 'soft_hard_tradeoff', name: 'HARD_TRADEOFF', type: 'SOFT', grade: 'Senior',
    cost: 1, power: 0, integrity: 9,
    description: 'Сложный управленческий trade-off. Ускоряет поставку ценой локального напряжения.',
    language: 'none', tags: ['utility']
  },
  {
    id: 'soft_wip_limit', name: 'WIP_LIMIT', type: 'SOFT', grade: 'Middle',
    cost: 1, power: 0, integrity: 12,
    description: 'Ограничение параллельной работы. Снижает баги и стресс из-за переключений.',
    language: 'none', tags: ['utility']
  },
  {
    id: 'soft_sprint_goal', name: 'SPRINT_GOAL_LOCK', type: 'SOFT', grade: 'Junior',
    cost: 1, power: 0, integrity: 11,
    description: 'Единая цель спринта. Синхронизирует команду на конкретном результате.',
    language: 'none', tags: ['utility']
  },
  {
    id: 'soft_unblock_channel', name: 'UNBLOCK_CHANNEL', type: 'SOFT', grade: 'Junior',
    cost: 1, power: 0, integrity: 11,
    description: 'Разблокировка коммуникации. Ускоряет отклик QA и Admin на проблемы.',
    language: 'none', tags: ['utility']
  },
  {
    id: 'soft_dev_pairing', name: 'DEV_PAIRING', type: 'SOFT', grade: 'Middle',
    cost: 1, power: 0, integrity: 10,
    description: 'Точечная поддержка разработчика: фокус на критическом блокере и ускорение поставки.',
    language: 'none', tags: ['utility']
  },
  {
    id: 'soft_qa_handoff', name: 'QA_HANDOFF', type: 'SOFT', grade: 'Middle',
    cost: 1, power: 0, integrity: 10,
    description: 'Чёткий handoff в тестирование. Снижает регресс и очищает путь к релизу.',
    language: 'none', tags: ['utility']
  },
  {
    id: 'soft_ops_priority', name: 'OPS_PRIORITY', type: 'SOFT', grade: 'Middle',
    cost: 1, power: 0, integrity: 10,
    description: 'Приоритезация операций. Дает администратору окно для укрепления контура.',
    language: 'none', tags: ['utility']
  },
  {
    id: 'soft_cross_team_sync', name: 'CROSS_TEAM_SYNC', type: 'SOFT', grade: 'Senior',
    cost: 1, power: 0, integrity: 9,
    description: 'Синхронизация всех треков команды. Балансирует стресс, прогресс и угрозу.',
    language: 'none', tags: ['utility']
  },
  {
    id: 'soft_release_freeze', name: 'RELEASE_FREEZE', type: 'SOFT', grade: 'Senior',
    cost: 1, power: 0, integrity: 8,
    description: 'Временный freeze перед выкладкой. Снижает бизнес-риски и шум релиза.',
    language: 'none', tags: ['utility']
  },
  {
    id: 'soft_support_rotation', name: 'SUPPORT_ROTATION', type: 'SOFT', grade: 'Middle',
    cost: 1, power: 0, integrity: 10,
    description: 'Ротация нагрузки в команде. Снимает перегрев и сохраняет темп.',
    language: 'none', tags: ['utility']
  }
];

export const resolveCombatCard = (id: string) => CARD_LIBRARY.find((c) => c.id === id);
export const getCardById = resolveCombatCard;
