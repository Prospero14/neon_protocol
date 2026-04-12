/**
 * Каталог стартовых колод: 4 языковых ядра, по 4 тематических пакета «библиотек» на язык,
 * усиленные роли QA / PM / Admin (корреляция со script/infra).
 * Все cardIds должны существовать в CARD_LIBRARY (combatCards.ts).
 */

/** Стек языка для коопа: доп. класс разработчика. */
export type DevLanguageStack = 'java' | 'kotlin' | 'python' | 'go';

export const DEV_LANGUAGE_STACKS: DevLanguageStack[] = ['java', 'kotlin', 'python', 'go'];

export const DEV_LANGUAGE_LABELS: Record<
  DevLanguageStack,
  { title: string; blurb: string }
> = {
  java: {
    title: 'JAVA',
    blurb: 'JVM, коллекции, Stream API, Spring/JPA-акценты в картах.',
  },
  kotlin: {
    title: 'KOTLIN',
    blurb: 'Лаконичность, null-safety-аналоги, Gradle/Android-обвязка скриптами.',
  },
  python: {
    title: 'PYTHON',
    blurb: 'Скрипты, автоматизация, «django-like» сеть и данные через утилиты.',
  },
  go: {
    title: 'GO',
    blurb: 'Сеть, простота деплоя, контейнеры и облачные примитивы.',
  },
};

/** Дефолтный пакет «библиотек» для стартовой колоды разработчика (ключ из LANGUAGE_LIBRARY_PACKS). */
export const DEV_DEFAULT_LIB_PACK: Record<DevLanguageStack, string> = {
  java: 'spring_web',
  kotlin: 'jvm_interop',
  python: 'scripting',
  go: 'net_http',
};

/** Ядро языка — базовые карты «под стек» (реальные id в библиотеке). */
export const LANGUAGE_CORE_IDS: Record<DevLanguageStack, string[]> = {
  java: [
    'syntax_class_decl',
    'syntax_main_method',
    'syntax_try_catch',
    'fn_map_put',
    'mid_stream_init',
    'mid_optional',
    'lib_lombok_data',
    'lib_commons_blank',
  ],
  kotlin: [
    'syntax_class_decl',
    'syntax_method_decl',
    'syntax_if',
    'syntax_foreach',
    'mid_optional',
    'fn_set_add',
    'lib_lombok_builder',
    'soft_async_request',
  ],
  python: [
    'script_grep',
    'script_cat',
    'script_ls',
    'script_curl',
    'script_auth',
    'script_cron',
    'fn_map_put',
    'syntax_try_catch',
  ],
  go: [
    'script_ping',
    'script_nc',
    'script_curl',
    'script_ssh',
    'infra_docker',
    'infra_basic_pod',
    'infra_mesh_relay',
    'infra_log_aggregator',
  ],
};

/** По 4 тематических пакета на язык (популярные направления из индустрии; id — игровые аналоги). */
export const LANGUAGE_LIBRARY_PACKS: Record<
  DevLanguageStack,
  Record<string, { title: string; hint: string; cardIds: string[] }>
> = {
  java: {
    spring_web: {
      title: 'Spring / Web',
      hint: 'REST, сервисный слой, JPA-репозиторий (как Spring Data).',
      cardIds: ['lib_spring_repo', 'infra_postgres', 'infra_redis', 'infra_lb_nginx'],
    },
    build_ci: {
      title: 'Сборка и CI',
      hint: 'Lombok, Actions, GitHub-стиль пайплайна.',
      cardIds: ['lib_lombok_data', 'lib_lombok_builder', 'infra_actions_ci', 'infra_cicd'],
    },
    streams_data: {
      title: 'Stream / Collections',
      hint: 'Потоки и коллекции — типичные задачи на манипуляции данными.',
      cardIds: ['mid_stream_init', 'mid_stream_map', 'mid_stream_filter', 'mid_stream_collect'],
    },
    observability: {
      title: 'Наблюдаемость',
      hint: 'Метрики, логи, CDN — как Prometheus/Grafana в проде.',
      cardIds: ['infra_prometheus', 'infra_log_aggregator', 'infra_cdn_edge', 'infra_s3_bucket'],
    },
  },
  kotlin: {
    jvm_interop: {
      title: 'JVM + Gradle vibe',
      hint: 'Общие JVM-карты + CI; Kotlin живёт рядом с Java-стеком.',
      cardIds: ['syntax_try_catch', 'mid_optional', 'infra_actions_ci', 'lib_commons_blank'],
    },
    android_net: {
      title: 'Сеть и туннели',
      hint: 'SSH/CURL как типичные инструменты мобильного/бэка.',
      cardIds: ['script_ssh', 'script_curl', 'script_auth', 'infra_safe_proxy'],
    },
    concurrency_soft: {
      title: 'Асинхронность / софт',
      hint: 'Корутины концептуально → async + реакции.',
      cardIds: ['soft_async_request', 'soft_pair_programming', 'react_hotfix', 'react_emergency_flush'],
    },
    testing: {
      title: 'Тесты',
      hint: 'JUnit-настроение: юнит и интеграция.',
      cardIds: ['react_unit_test', 'react_integration_test', 'def_validator', 'react_refactoring'],
    },
  },
  python: {
    scripting: {
      title: 'Скрипты и автоматизация',
      hint: 'bash/python-стиль утилит в терминале.',
      cardIds: ['script_grep', 'script_sed', 'script_wash_logs', 'script_chmod'],
    },
    data_http: {
      title: 'Данные и HTTP',
      hint: 'curl/wget-запросы, работа с файлами.',
      cardIds: ['script_curl', 'script_cat', 'script_ls', 'script_scp'],
    },
    sched_net: {
      title: 'Cron и сеть',
      hint: 'Планировщики и ping/diagnostics.',
      cardIds: ['script_cron', 'script_ping', 'script_nc', 'infra_dns_resolver'],
    },
    infra_cloud: {
      title: 'Облако / S3',
      hint: 'Объектное хранилище и границы сети.',
      cardIds: ['infra_s3_bucket', 'infra_vpc_network', 'infra_edge_cache', 'infra_cdn_edge'],
    },
  },
  go: {
    net_http: {
      title: 'Сеть',
      hint: 'net/http vibe: curl, ping, raw sockets.',
      cardIds: ['script_curl', 'script_ping', 'script_nc', 'script_ssh'],
    },
    containers: {
      title: 'Контейнеры',
      hint: 'Docker / pod — как у типичного Go-сервиса.',
      cardIds: ['infra_docker', 'infra_basic_pod', 'infra_k8s_cluster', 'infra_h_scaling'],
    },
    storage: {
      title: 'Хранилища',
      hint: 'Postgres/Redis как стандартный стек.',
      cardIds: ['infra_postgres', 'infra_redis', 'infra_db_cluster', 'infra_raid_array'],
    },
    deploy: {
      title: 'Деплой',
      hint: 'CI/CD и mesh.',
      cardIds: ['infra_actions_ci', 'infra_cicd', 'infra_mesh_relay', 'infra_orbital_uplink'],
    },
  },
};

/** QA / PM / Admin — явная связь: QA = реакции+тесты; PM = soft; Admin = script+infra+права. */
export const ROLE_SPECIALTY_IDS: Record<'qa' | 'pm' | 'admin', string[]> = {
  qa: [
    'react_unit_test',
    'react_integration_test',
    'react_firewall_patch',
    'def_validator',
    'script_grep',
    'script_cat',
    'soft_coffee',
    'soft_ai_ask',
  ],
  pm: [
    'soft_deadline_trance',
    'soft_signal_prediction',
    'soft_critical_thinking',
    'soft_pair_programming',
    'soft_buffer_flush',
    'script_ls',
    'script_cat',
    'react_unit_test',
  ],
  admin: [
    'script_sudo_fix',
    'script_chmod',
    'script_auth',
    'script_rm',
    'infra_quarantine_vm',
    'infra_vpc_network',
    'react_firewall_patch',
    'def_validator',
  ],
};
