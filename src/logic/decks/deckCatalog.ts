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
    'script_auth',
    'script_chmod',
    'script_ls',
    'script_grep',
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
      cardIds: ['lib_spring_repo', 'lib_lombok_data', 'mid_stream_map', 'mid_stream_collect'],
    },
    build_ci: {
      title: 'Сборка и CI',
      hint: 'Lombok, Actions, GitHub-стиль пайплайна.',
      cardIds: ['lib_lombok_data', 'lib_lombok_builder', 'script_grep', 'script_wash_logs'],
    },
    streams_data: {
      title: 'Stream / Collections',
      hint: 'Потоки и коллекции — типичные задачи на манипуляции данными.',
      cardIds: ['mid_stream_init', 'mid_stream_map', 'mid_stream_filter', 'mid_stream_collect'],
    },
    observability: {
      title: 'Наблюдаемость',
      hint: 'Метрики, логи, CDN — как Prometheus/Grafana в проде.',
      cardIds: ['mid_stream_filter', 'mid_stream_collect', 'script_cat', 'script_grep'],
    },
  },
  kotlin: {
    jvm_interop: {
      title: 'JVM + Gradle vibe',
      hint: 'Общие JVM-карты + CI; Kotlin живёт рядом с Java-стеком.',
      cardIds: ['syntax_try_catch', 'mid_optional', 'script_auth', 'lib_commons_blank'],
    },
    android_net: {
      title: 'Сеть и туннели',
      hint: 'SSH/CURL как типичные инструменты мобильного/бэка.',
      cardIds: ['script_ssh', 'script_curl', 'script_auth', 'script_ping'],
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
      cardIds: ['script_cron', 'script_ping', 'script_nc', 'script_auth'],
    },
    infra_cloud: {
      title: 'Облако / S3',
      hint: 'Объектное хранилище и границы сети.',
      cardIds: ['script_scp', 'script_wash_logs', 'script_chmod', 'script_curl'],
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
      cardIds: ['script_chmod', 'script_rm', 'script_ls', 'script_cat'],
    },
    storage: {
      title: 'Хранилища',
      hint: 'Postgres/Redis как стандартный стек.',
      cardIds: ['script_cat', 'script_grep', 'script_sed', 'script_ls'],
    },
    deploy: {
      title: 'Деплой',
      hint: 'CI/CD и mesh.',
      cardIds: ['script_auth', 'script_ssh', 'script_wash_logs', 'script_chmod'],
    },
  },
};

function buildDeveloperStackBrowseIdSet(stack: DevLanguageStack): Set<string> {
  const out = new Set<string>(LANGUAGE_CORE_IDS[stack]);
  for (const pack of Object.values(LANGUAGE_LIBRARY_PACKS[stack])) {
    for (const id of pack.cardIds) out.add(id);
  }
  return out;
}

/** Ядро + все пакеты каталога для стека разработчика (кооп): фильтр конструктора колоды. */
export const DEVELOPER_STACK_BROWSE_IDS: Record<DevLanguageStack, ReadonlySet<string>> = {
  java: buildDeveloperStackBrowseIdSet('java'),
  kotlin: buildDeveloperStackBrowseIdSet('kotlin'),
  python: buildDeveloperStackBrowseIdSet('python'),
  go: buildDeveloperStackBrowseIdSet('go'),
};

/** Объединение каталогов четырёх стеков — чтобы не скрывать награды вне «чужого» JVM/Python/Go. */
export const DEVELOPER_STACKS_UNION_IDS: ReadonlySet<string> = new Set<string>([
  ...DEVELOPER_STACK_BROWSE_IDS.java,
  ...DEVELOPER_STACK_BROWSE_IDS.kotlin,
  ...DEVELOPER_STACK_BROWSE_IDS.python,
  ...DEVELOPER_STACK_BROWSE_IDS.go,
]);

/** QA / PM / Admin — взаимоисключающие пулы: QA = реакции+DEFENSIVE; PM = SOFT; Admin = SCRIPT+INFRA (+HARD в картах инфры). */
export const ROLE_SPECIALTY_IDS: Record<'qa' | 'pm' | 'admin', string[]> = {
  qa: [
    'react_unit_test',
    'react_integration_test',
    'react_firewall_patch',
    'def_validator',
    'react_trace_jam',
    'react_null_packet',
    'react_refactoring',
    'react_emergency_flush',
    'react_hotfix',
    'react_rollback',
    'react_spoof_id',
    'react_log_mask',
    'react_contract_test',
    'react_snapshot_guard',
    'react_schema_fence',
    'react_load_probe',
    'react_soak_test',
    'react_property_fuzz',
    'react_mock_server',
    'react_flaky_quarantine',
    'react_boundary_case',
    'react_perf_budget',
    'react_race_detector',
    'react_mutation_suite',
    'def_ci_gate',
    'def_smoke_suite',
    'def_release_candidate',
    'def_canary_assert',
    'react_bug_repro',
    'react_root_cause',
  ],
  pm: [
    'soft_deadline_trance',
    'soft_signal_prediction',
    'soft_critical_thinking',
    'soft_pair_programming',
    'soft_buffer_flush',
    'soft_coffee',
    'soft_ai_ask',
    'soft_focus',
    'soft_recursive_logic',
    'soft_async_request',
    'soft_throw_ex',
    'soft_finally',
    'soft_tactical_breath',
    'soft_patch_drill',
    'soft_agile_ceremony',
    'soft_daily_sync',
    'soft_retro_action',
    'soft_pizza_party',
    'soft_scope_cut',
    'soft_stakeholder_alignment',
    'soft_risk_register',
    'soft_release_train',
    'soft_backlog_refine',
    'soft_priority_matrix',
    'soft_team_health',
    'soft_crisis_room',
    'soft_business_case',
    'soft_kpi_dashboard',
    'soft_hard_tradeoff',
    'soft_wip_limit',
    'soft_sprint_goal',
    'soft_unblock_channel',
    'soft_dev_pairing',
    'soft_qa_handoff',
    'soft_ops_priority',
    'soft_cross_team_sync',
    'soft_release_freeze',
    'soft_support_rotation',
  ],
  admin: [
    'script_sudo_fix',
    'script_chmod',
    'script_auth',
    'script_rm',
    'script_ping',
    'script_ssh',
    'script_curl',
    'script_nc',
    'script_ls',
    'script_cat',
    'script_grep',
    'infra_quarantine_vm',
    'infra_vpc_network',
    'infra_safe_proxy',
    'infra_dns_resolver',
  ],
};

/**
 * «Библиотеки» для QA / PM / Admin — тематические пакеты карт (как LANGUAGE_LIBRARY_PACKS у dev).
 * Стартовая колода в коопе: specialty → выбранный акцент → базовый список роли (см. sessionMode).
 */
export const ROLE_ACCENT_PACKS: Record<
  'qa' | 'pm' | 'admin',
  Record<string, { title: string; hint: string; cardIds: string[] }>
> = {
  qa: {
    defect_pipeline: {
      title: 'Defect pipeline',
      hint: 'Юнит → интеграция → регресс; чистка ICE и null-case.',
      cardIds: ['react_integration_test', 'react_unit_test', 'react_null_packet', 'react_trace_jam', 'react_contract_test', 'def_smoke_suite'],
    },
    regression_suite: {
      title: 'Regression / hotfix',
      hint: 'Повторяемость прогона и откат.',
      cardIds: ['react_refactoring', 'react_hotfix', 'react_rollback', 'react_emergency_flush', 'react_bug_repro', 'react_root_cause'],
    },
    perimeter_tests: {
      title: 'Периметр и валидатор',
      hint: 'Фаервол, валидатор, маскировка логов.',
      cardIds: ['react_firewall_patch', 'def_validator', 'react_log_mask', 'react_spoof_id', 'def_ci_gate', 'def_canary_assert'],
    },
    stress_chaos: {
      title: 'Chaos / стресс',
      hint: 'Снятие шума и ложных срабатываний.',
      cardIds: ['react_decoy_ping', 'react_trace_jam', 'react_spoof_id', 'react_emergency_flush', 'react_flaky_quarantine', 'react_property_fuzz'],
    },
  },
  pm: {
    sprint_ops: {
      title: 'Sprint ops',
      hint: 'Дедлайн, буферы, фокус команды.',
      cardIds: ['soft_deadline_trance', 'soft_buffer_flush', 'soft_focus', 'soft_signal_prediction', 'soft_daily_sync', 'soft_sprint_goal', 'soft_release_freeze'],
    },
    stakeholder_sync: {
      title: 'Stakeholder / коммуникация',
      hint: 'Предсказание сигналов и критическое мышление.',
      cardIds: ['soft_critical_thinking', 'soft_signal_prediction', 'soft_pair_programming', 'soft_ai_ask', 'soft_stakeholder_alignment', 'soft_business_case', 'soft_cross_team_sync'],
    },
    ceremony_light: {
      title: 'Церемонии без боли',
      hint: 'Мягкие инструменты процесса.',
      cardIds: ['soft_coffee', 'soft_recursive_logic', 'soft_tactical_breath', 'soft_buffer_flush', 'soft_pizza_party', 'soft_retro_action', 'soft_support_rotation'],
    },
    risk_buffers: {
      title: 'Риски и исключения',
      hint: 'Исключения, финализаторы, божественный дебаг как крайний случай.',
      cardIds: ['soft_throw_ex', 'soft_finally', 'soft_buffer_flush', 'reward_divine_debug', 'soft_risk_register', 'soft_crisis_room', 'soft_dev_pairing', 'soft_qa_handoff', 'soft_ops_priority'],
    },
  },
  admin: {
    perimeter_hardening: {
      title: 'Периметр',
      hint: 'Прокси, карантин, DNS, VPC.',
      cardIds: ['infra_safe_proxy', 'infra_quarantine_vm', 'infra_dns_resolver', 'infra_vpc_network'],
    },
    cluster_mesh: {
      title: 'Кластер / mesh',
      hint: 'Pod, k8s, mesh, горизонталь.',
      cardIds: ['infra_basic_pod', 'infra_k8s_cluster', 'infra_mesh_relay', 'infra_h_scaling'],
    },
    storage_backup: {
      title: 'Хранилища',
      hint: 'Реплики, RAID, S3.',
      cardIds: ['infra_postgres', 'infra_db_cluster', 'infra_raid_array', 'infra_s3_bucket'],
    },
    incident_response: {
      title: 'Инцидент',
      hint: 'Логи, CI/CD, орбитал — когда горит прод.',
      cardIds: ['infra_log_aggregator', 'infra_actions_ci', 'infra_cicd', 'infra_orbital_uplink'],
    },
  },
};

/** Дефолтный акцент для кооп-старта (можно позже привязать к выбору игрока). */
export const ROLE_DEFAULT_ACCENT: Record<'qa' | 'pm' | 'admin', string> = {
  qa: 'defect_pipeline',
  pm: 'sprint_ops',
  admin: 'perimeter_hardening',
};
