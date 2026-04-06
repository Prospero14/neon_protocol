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
    description: 'Восстановление концентрации. Дает +1 Энергию (RAM) на текущий ход.',
    language: 'none', tags: ['utility'], phaseConstraint: 'PLANNING'
  },
  {
    id: 'soft_ai_ask', name: 'СПРОСИТЬ НЕЙРОСЕТКУ', type: 'SOFT', grade: 'Script-Kiddo',
    cost: 0, power: 15, integrity: 5,
    description: 'Генерация кода через нейро-подсказку. Наносит урон и раскрывает 1 карту ИИ.',
    language: 'none', tags: ['utility'], phaseConstraint: 'CODING'
  },
  {
    id: 'infra_old_hw', name: 'СТАРОЕ ЖЕЛЕЗО', type: 'INFRASTRUCTURE', grade: 'Script-Kiddo',
    cost: 0, power: 5, integrity: 5,
    description: 'Проверенный временем хлам. Дает +512MB RAM (1 слот) до конца боя.',
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
    description: 'Концентрация. Увеличивает множитель прогресса на текущую фазу.',
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
    description: 'CI/CD пайплайн. Автоматизирует тесты. Дает +1 Энергию каждый ход в фазе DESIGN.',
    tags: ['utility'], phaseConstraint: 'PLANNING'
  },
  {
    id: 'infra_prometheus', name: 'PROMETHEUS_MON', type: 'INFRASTRUCTURE', grade: 'Senior',
    cost: 2, power: 0, integrity: 30,
    description: 'Мониторинг метрик. Анализирует поведение системы. Раскрывает следующие 2 действия ИИ.',
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
    description: 'Парное программирование. Ускоряет написание кода и снижает риск багов.',
    tags: ['utility'], phaseConstraint: 'PLANNING'
  },
  {
    id: 'soft_critical_thinking', name: 'CRIT_THINKING', type: 'SOFT', grade: 'Middle',
    cost: 1, power: 10, integrity: 20,
    description: 'Критическое мышление. Позволяет перерисовать 2 карты из колоды.',
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
    description: 'Контейнеризация. Увеличивает максимальную Энергию (RAM) на +1.',
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
    description: 'Автоматическое развертывание. Значительно ускоряет релизы. Дает +1 Energy каждый ход фазы DESIGN.',
    tags: ['utility'], phaseConstraint: 'DESIGN'
  },
  {
    id: 'infra_redis', name: 'REDIS_CACHE', type: 'INFRASTRUCTURE', grade: 'Middle',
    cost: 1, power: 0, integrity: 20,
    description: 'In-Memory кэширование. Дает мгновенный добор +2 карт в фазе Планирования.',
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
    description: 'Мусорная карта. Нельзя сыграть на Шину. Потратьте 1 Энергию, чтобы сбросить её из руки.',
    tags: ['utility'] // No phaseConstraint so it can be drawn anywhere
  },
  {
    id: 'status_deprecated', name: 'DEPRECATED_LIB', type: 'STATUS', grade: 'Middle',
    cost: 2, power: 0, integrity: 1,
    description: 'Устаревшая зависимость. Занимает место в руке. Сброс стоит целых 2 Энергии.',
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
    description: 'Отказоустойчивый массив. Увеличивает максимальную целостность (HP) на 50.',
    tags: ['utility'], phaseConstraint: 'PLANNING'
  },
  {
    id: 'soft_buffer_flush', name: 'BUFFER_FLUSH', type: 'SOFT', grade: 'Junior',
    cost: 0, power: 0, integrity: 10,
    description: 'Сброс буфера: Сбросьте текущую руку и возьмите 3 новые карты.',
    tags: ['utility']
  },
  {
    id: 'soft_recursive_logic', name: 'RECURSIVE_THINK', type: 'SOFT', grade: 'Middle',
    cost: 1, power: 5, integrity: 15,
    description: 'Рекурсивное мышление: +1 карта в руку каждый ход.',
    tags: ['utility']
  },
  {
    id: 'soft_async_request', name: 'ASYNC_AWAIT', type: 'SOFT', grade: 'Junior',
    cost: 0, power: 0, integrity: 10,
    description: 'Асинхронный вызов: Следующая карта в этом ходу стоит на 1 CPU меньше.',
    tags: ['utility']
  },
  {
    id: 'infra_k8s_cluster', name: 'K8S_CLUSTER', type: 'INFRASTRUCTURE', grade: 'Senior',
    cost: 3, power: 0, integrity: 60,
    description: 'Kubernetes Cluster: +3 CPU и +4GB RAM. Ультимативная мощность.',
    tags: ['utility'], phaseConstraint: 'PLANNING'
  },
  {
    id: 'infra_cdn_edge', name: 'CDN_EDGE', type: 'INFRASTRUCTURE', grade: 'Middle',
    cost: 1, power: 10, integrity: 30,
    description: 'CDN Edge: Распределенная сеть. Снижает стоимость NETWORK-карт на 1.',
    tags: ['utility'], phaseConstraint: 'PLANNING'
  },
  {
    id: 'infra_log_aggregator', name: 'LOG_STASH', type: 'INFRASTRUCTURE', grade: 'Junior',
    cost: 1, power: 0, integrity: 20,
    description: 'Сбор логов: +512MB RAM и добор +1 карты при разыгрывании.',
    tags: ['utility'], phaseConstraint: 'PLANNING'
  },
  {
    id: 'infra_vpc_network', name: 'VPC_PRIVATE', type: 'INFRASTRUCTURE', grade: 'Middle',
    cost: 1, power: 0, integrity: 40,
    description: 'Virtual Private Cloud: +1 CPU и +10 к базовой защите системы.',
    tags: ['utility'], phaseConstraint: 'PLANNING'
  },
  {
    id: 'infra_db_cluster', name: 'DB_REPLICAS', type: 'INFRASTRUCTURE', grade: 'Senior',
    cost: 3, power: 0, integrity: 50,
    description: 'Кластер БД: +3GB RAM. Позволяет перебрасывать ошибки в лог без урона.',
    tags: ['utility'], phaseConstraint: 'PLANNING'
  },
  {
    id: 'soft_throw_ex', name: 'THROW_EX', type: 'SOFT', grade: 'Middle',
    cost: 1, power: 25, integrity: 5,
    description: 'throw new Exception("MEOW!"); Выбрасывает прерывание и наносит мощный урон.',
    tags: ['base-java'], phaseConstraint: 'CODING'
  },
  {
    id: 'soft_finally', name: 'FINALLY_BLOCK', type: 'SOFT', grade: 'Middle',
    cost: 1, power: 0, integrity: 30,
    description: 'finally {…}. Гарантирует завершение процесса вне зависимости от багов.',
    tags: ['base-java'], phaseConstraint: 'CODING'
  },
  {
    id: 'reward_divine_debug', name: 'DIVINE_DEBUG', type: 'SOFT', grade: 'Senior',
    cost: 1, power: 0, integrity: 50,
    description: 'Благословение Никсанны. Мгновенно восстанавливает 30 HP и очищает все баги в руке.',
    tags: ['utility'], phaseConstraint: 'TESTING'
  }
];

export const resolveCombatCard = (id: string) => CARD_LIBRARY.find((c) => c.id === id);
export const getCardById = resolveCombatCard;
