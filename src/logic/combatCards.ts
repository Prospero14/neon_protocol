/**
 * Библиотека боевых карт (Протоколов) V5.1.
 * Расширена базовыми навыками Junior (Lists, Maps, If-Else).
 */

export type CardLanguage = 'java' | 'kotlin' | 'python' | 'js' | 'go' | 'none';
export type CardLibTag = 'spring' | 'network' | 'collections' | 'streams' | 'concurrency' | 'scripting';
export type CardType = 'SYNTAX' | 'FUNCTION' | 'NETWORK' | 'SOFT' | 'HARD' | 'DEFENSIVE' | 'REACTION' | 'BUG' | 'STATUS' | 'INFRASTRUCTURE' | 'SCRIPT';
export type CardGrade = 'Junior' | 'Middle' | 'Senior' | 'Trainee';
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
  // --- TRAINEE SCRIPTS (NO CLASS REQUIRED) ---
  {
    id: 'script_ping', name: 'PING_REQUEST', type: 'SCRIPT', grade: 'Trainee',
    cost: 0, power: 5, integrity: 5,
    description: 'ping -c 1. Базовая проверка сетевого узла. Наносит минимальный урон.',
    language: 'none', tags: ['script'], phaseConstraint: 'CODING'
  },
  {
    id: 'script_grep', name: 'GREP_SEARCH', type: 'SCRIPT', grade: 'Trainee',
    cost: 1, power: 8, integrity: 6,
    description: 'grep pattern logic. Поиск уязвимостей в потоке данных.',
    language: 'none', tags: ['script'], phaseConstraint: 'CODING'
  },
  {
    id: 'script_wash_logs', name: 'WASH_LOGS', type: 'SCRIPT', grade: 'Trainee',
    cost: 1, power: 0, integrity: 12,
    description: 'rm -rf /var/log/syslog. Скрывает следы вашего ботнета.',
    language: 'none', tags: ['script'], phaseConstraint: 'TESTING'
  },
  {
    id: 'script_sudo_fix', name: 'SUDO_FORCE_FIX', type: 'SCRIPT', grade: 'Trainee',
    cost: 2, power: 15, integrity: 4,
    description: 'sudo apt-get fix-broken. Грубое исправление системы.',
    language: 'none', tags: ['script'], phaseConstraint: 'TESTING'
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
