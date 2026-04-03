import type { TechnicalTask } from '../../logic/combatTasks';

export const SENIOR_TASKS: TechnicalTask[] = [
  {
    id: 'sn_annotation_scan',
    name: 'PROJECT: METADATA_AUDIT',
    rank: 'senior',
    description: 'Система ищет помеченные узлы. Промаркируй класс аннотацией, чтобы он прошел проверку.',
    steps: [
      { id: '1', name: 'MARK_ANNOTATION', requiredCardId: 'syntax_annotation' }
    ]
  },
  {
    id: 'sn_interface_contract',
    name: 'DRILL: API_DECOUPLING',
    rank: 'senior',
    description: 'Определи жесткий контракт взаимодействия. Сначала Интерфейс, потом его Реализация.',
    steps: [
      { id: '1', name: 'DEFINE_IFACE', requiredCardId: 'oop_interface' },
      { id: '2', name: 'IMPLEMENT_IFACE', requiredCardId: 'syntax_implements' }
    ]
  },
  {
    id: 'sn_sync_thread',
    name: 'PROJECT: ATOMIC_ACCESS',
    rank: 'senior',
    description: 'Два процесса пытаются изменить один и тот же сектор памяти. Заблокируй доступ через SYNCHRONIZED.',
    steps: [
      { id: '1', name: 'LOCK_METHOD', requiredCardId: 'syntax_synchronized' }
    ]
  },
  {
    id: 'sn_lambda_heavy',
    name: 'DRILL: PARALLEL_STREAM_PROC',
    rank: 'senior',
    description: 'Сложная трансформация данных в параллельном потоке. Максимальная скорость через Лямбду.',
    steps: [
      { id: '1', name: 'PARALLEL_LAMBDA', requiredCardId: 'syntax_lambda' }
    ]
  },
  {
    id: 'sn_override_super',
    name: 'PROJECT: LEGACY_BRIDGE',
    rank: 'senior',
    description: 'Переопредели метод базового класса, но сохрани вызов оригинальной логики.',
    steps: [
      { id: '1', name: 'OVERRIDE', requiredCardId: 'syntax_override' },
      { id: '2', name: 'SUPER_DELEGATE', requiredCardId: 'oop_super_call' }
    ]
  },
  {
    id: 'sn_complex_contract',
    name: 'DRILL: MULTI_IFACE_COMPLIANCE',
    rank: 'senior',
    description: 'Класс должен соответствовать сразу нескольким интерфейсам системы.',
    steps: [
      { id: '1', name: 'IFACE_A', requiredCardId: 'oop_interface' },
      { id: '2', name: 'IFACE_B', requiredCardId: 'oop_interface' },
      { id: '3', name: 'IMPLEMENT_ALL', requiredCardId: 'syntax_implements' }
    ]
  },
  {
    id: 'sn_reflective_invoke',
    name: 'PROJECT: SHADOW_INVOCATION',
    rank: 'senior',
    description: 'Вызови метод по имени через рефлексию. Обойди статические проверки.',
    steps: [
      { id: '1', name: 'SCAN_METHODS', requiredCardId: 'syntax_annotation' },
      { id: '2', name: 'INVOKE_DYNAMIC', requiredCardId: 'syntax_method_decl' }
    ]
  },
  {
    id: 'sn_synchronized_block',
    name: 'DRILL: MONITOR_RACE_CONDITION',
    rank: 'senior',
    description: 'Используй объект для синхронизации критической секции.',
    steps: [
      { id: '1', name: 'SYNC_BLOCK', requiredCardId: 'syntax_synchronized' }
    ]
  },
  {
    id: 'sn_interface_adapter',
    name: 'PROJECT: ADAPTER_PATTERN',
    rank: 'senior',
    description: 'Создай адаптер между двумя несовместимыми интерфейсами.',
    steps: [
      { id: '1', name: 'IFACE_IN', requiredCardId: 'oop_interface' },
      { id: '2', name: 'IFACE_OUT', requiredCardId: 'oop_interface' },
      { id: '3', name: 'ADAPT_IMPL', requiredCardId: 'syntax_implements' }
    ]
  },
  {
    id: 'sn_thread_safe_collection',
    name: 'DRILL: CONCURRENT_MAPS',
    rank: 'senior',
    description: 'Настрой потокобезопасное хранилище сессий.',
    steps: [
      { id: '1', name: 'INIT_SYNC_MAP', requiredCardId: 'syntax_synchronized' },
      { id: '2', name: 'BULK_WRITE', requiredCardId: 'syntax_foreach' }
    ]
  },
  {
    id: 'sn_annotation_processor',
    name: 'PROJECT: CODE_GENERATOR_AUDIT',
    rank: 'senior',
    description: 'Автоматическая генерация кода на основе аннотаций класса.',
    steps: [
      { id: '1', name: 'DETECT_ANNOTATION', requiredCardId: 'syntax_annotation' }
    ]
  },
  {
    id: 'sn_api_stability',
    name: 'DRILL: BREAKING_CHANGE_PREVENT',
    rank: 'senior',
    description: 'Убедись, что все изменения методов помечены как Override для сохранения стабильности API.',
    steps: [
      { id: '1', name: 'MARK_OVERRIDE', requiredCardId: 'syntax_override' }
    ]
  },
  {
    id: 'sn_lambda_callback',
    name: 'PROJECT: ASYNC_NOTIFIER',
    rank: 'senior',
    description: 'Реализуй систему обратных вызовов через лямбда-выражения.',
    steps: [
      { id: '1', name: 'SET_CALLBACK', requiredCardId: 'syntax_lambda' }
    ]
  },
  {
    id: 'sn_singleton_monitor',
    name: 'DRILL: SINGLETON_SYNC',
    rank: 'senior',
    description: 'Обеспечь потокобезопасную инициализацию одиночного узла управления.',
    steps: [
      { id: '1', name: 'DOUBLE_CHECK_LOCK', requiredCardId: 'syntax_synchronized' }
    ]
  },
  {
    id: 'sn_contract_polymorphism',
    name: 'PROJECT: POLYMORPHIC_ROUTING',
    rank: 'senior',
    description: 'Маршрутизация сигналов на основе реализации интерфейсов.',
    steps: [
      { id: '1', name: 'DEFINE_SPEC', requiredCardId: 'oop_interface' },
      { id: '2', name: 'IMPLEMENT_SPEC', requiredCardId: 'syntax_implements' }
    ]
  },
  {
    id: 'sn_reflection_deep_scan',
    name: 'DRILL: DEEP_REFLECT_AUDIT',
    rank: 'senior',
    description: 'Полный аудит полей класса, включая скрытые и системные.',
    steps: [
      { id: '1', name: 'FIND_METADATA', requiredCardId: 'syntax_annotation' }
    ]
  },
  {
    id: 'sn_synchronized_deadlock_prevent',
    name: 'PROJECT: DEADLOCK_WATCHER',
    rank: 'senior',
    description: 'Следи за порядком блокировок, чтобы не допустить взаимного ожидания.',
    steps: [
      { id: '1', name: 'ORDERED_LOCK', requiredCardId: 'syntax_synchronized' }
    ]
  },
  {
    id: 'sn_lambda_reduction',
    name: 'DRILL: DATA_AGGREGATOR',
    rank: 'senior',
    description: 'Собери все части кода в один агрегат через операцию Reduce.',
    steps: [
      { id: '1', name: 'REDUCE_FLOW', requiredCardId: 'syntax_lambda' }
    ]
  },
  {
    id: 'sn_interface_versioning',
    name: 'PROJECT: VERSIONED_PROTOCOL',
    rank: 'senior',
    description: 'Поддержка нескольких версий протокола через наследование интерфейсов.',
    steps: [
      { id: '1', name: 'IFACE_V1', requiredCardId: 'oop_interface' },
      { id: '2', name: 'IFACE_V2', requiredCardId: 'oop_interface' }
    ]
  },
  {
    id: 'sn_final_architect',
    name: 'PROJECT: SYSTEMS_CORE_INIT',
    rank: 'senior',
    description: 'Финальная сборка ядра системы. Полный набор: Интерфейсы, Реализации, Синхронизация.',
    steps: [
      { id: '1', name: 'CORE_IFACE', requiredCardId: 'oop_interface' },
      { id: '2', name: 'CORE_IMPL', requiredCardId: 'syntax_implements' },
      { id: '3', name: 'CORE_SYNC', requiredCardId: 'syntax_synchronized' }
    ]
  }
];
