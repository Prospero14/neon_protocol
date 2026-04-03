import type { TechnicalTask } from '../../logic/combatTasks';

export const MID_TASKS: TechnicalTask[] = [
  {
    id: 'mid_exception_handle',
    name: 'PROJECT: ERROR_BARRIER',
    rank: 'mid',
    description: 'Система начала плеваться исключениями. Оберни опасный участок в TRY-CATCH, чтобы не упасть.',
    steps: [
      { id: '1', name: 'TRY_BLOCK', requiredCardId: 'syntax_try_catch' }
    ]
  },
  {
    id: 'mid_list_init',
    name: 'DRILL: DATA_SPOOL_INIT',
    rank: 'mid',
    description: 'Для хранения входящих пакетов нужен список. Инициализируй ArrayList.',
    steps: [
      { id: '1', name: 'LIST_CREATION', requiredCardId: 'syntax_list_init' }
    ]
  },
  {
    id: 'mid_foreach_scan',
    name: 'PROJECT: BULK_RECON_FOR',
    rank: 'mid',
    description: 'Пройдись по списку всех активных сессий. Юзай FOREACH для быстрого перебора.',
    steps: [
      { id: '1', name: 'ITERATE_COLLECTION', requiredCardId: 'syntax_foreach' }
    ]
  },
  {
    id: 'mid_extends_logic',
    name: 'DRILL: INHERITANCE_LINK',
    rank: 'mid',
    description: 'Создай новый модуль, который наследует функционал базового. Нам нужен EXTENDS.',
    steps: [
      { id: '1', name: 'EXTENDS_BASE', requiredCardId: 'oop_extends' }
    ]
  },
  {
    id: 'mid_super_call',
    name: 'PROJECT: PARENT_DELEGATE',
    rank: 'mid',
    description: 'Вызови конструктор родительского класса. Нам нужны его ресурсы и инициализация.',
    steps: [
      { id: '1', name: 'SUPER_INVOKE', requiredCardId: 'oop_super_call' }
    ]
  },
  {
    id: 'mid_lambda_filter',
    name: 'DRILL: LAMBDA_STREAMS',
    rank: 'mid',
    description: 'Отфильтруй список по условию. Коротко и ясно — через Лямбду.',
    steps: [
      { id: '1', name: 'LAMBDA_FILTER', requiredCardId: 'syntax_lambda' }
    ]
  },
  {
    id: 'mid_method_override',
    name: 'PROJECT: LOGIC_REPLACEMENT',
    rank: 'mid',
    description: 'Переопредели стандартный метод. Старая логика больше не работает.',
    steps: [
      { id: '1', name: 'OVERRIDE_METHOD', requiredCardId: 'syntax_method_decl' }
    ]
  },
  {
    id: 'mid_full_oop_chain',
    name: 'DRILL: CLASS_HIERARCHY',
    rank: 'mid',
    description: 'Выстрой цепочку. Наследование и вызов супер-метода.',
    steps: [
      { id: '1', name: 'EXTENDS', requiredCardId: 'oop_extends' },
      { id: '2', name: 'SUPER', requiredCardId: 'oop_super_call' }
    ]
  },
  {
    id: 'mid_safe_access',
    name: 'PROJECT: GUARDED_INIT',
    rank: 'mid',
    description: 'Инициализируй список, но оберни это в блок обработки ошибок.',
    steps: [
      { id: '1', name: 'SAFE_LIST', requiredCardId: 'syntax_try_catch' },
      { id: '2', name: 'INIT_COLL', requiredCardId: 'syntax_list_init' }
    ]
  },
  {
    id: 'mid_complex_loop',
    name: 'DRILL: NESTED_FOREACH',
    rank: 'mid',
    description: 'Пройдись циклом по всем элементам базы данных.',
    steps: [
      { id: '1', name: 'LOOP_START', requiredCardId: 'syntax_foreach' }
    ]
  },
  {
    id: 'mid_try_final',
    name: 'PROJECT: SECURE_SHUTDOWN',
    rank: 'mid',
    description: 'Обязательно закрой соединение в блоке FINALLY. Ошибки не должны мешать очистке.',
    steps: [
      { id: '1', name: 'TRY_CATCH_FINALLY', requiredCardId: 'syntax_try_catch' }
    ]
  },
  {
    id: 'mid_data_transformer',
    name: 'DRILL: STREAM_MAP_CONVERT',
    rank: 'mid',
    description: 'Преобразуй один поток данных в другой.',
    steps: [
      { id: '1', name: 'TRANSFORM', requiredCardId: 'syntax_lambda' }
    ]
  },
  {
    id: 'mid_method_factory',
    name: 'PROJECT: DYNAMIC_SPAWNER',
    rank: 'mid',
    description: 'Создай метод, который возвращает новый объект класса.',
    steps: [
      { id: '1', name: 'FACTORY_METHOD', requiredCardId: 'syntax_method_decl' }
    ]
  },
  {
    id: 'mid_subclass_init',
    name: 'DRILL: CHILD_COMPONENT',
    rank: 'mid',
    description: 'Создай подкласс и расширь его методы.',
    steps: [
      { id: '1', name: 'SUB_CLASS', requiredCardId: 'oop_extends' }
    ]
  },
  {
    id: 'mid_list_bulk_add',
    name: 'PROJECT: BATCH_PUSH',
    rank: 'mid',
    description: 'Наполни коллекцию данными через цикл.',
    steps: [
      { id: '1', name: 'INIT_LIST', requiredCardId: 'syntax_list_init' },
      { id: '2', name: 'FOR_EACH_ADD', requiredCardId: 'syntax_foreach' }
    ]
  },
  {
    id: 'mid_error_propagation',
    name: 'DRILL: THROW_RETHROW',
    rank: 'mid',
    description: 'Перехвати ошибку и передай её на уровень выше.',
    steps: [
      { id: '1', name: 'INTERCEPT', requiredCardId: 'syntax_try_catch' }
    ]
  },
  {
    id: 'mid_lambda_action',
    name: 'PROJECT: EVENT_LISTENER_MOCK',
    rank: 'mid',
    description: 'Привяжи действие к событию через функциональный интерфейс.',
    steps: [
      { id: '1', name: 'BIND_LAMBDA', requiredCardId: 'syntax_lambda' }
    ]
  },
  {
    id: 'mid_protected_access',
    name: 'DRILL: HIERARCHY_VISIBILITY',
    rank: 'mid',
    description: 'Используй наследование для доступа к защищенным ресурсам.',
    steps: [
      { id: '1', name: 'EXTENDS_V2', requiredCardId: 'oop_extends' }
    ]
  },
  {
    id: 'mid_multi_catch',
    name: 'PROJECT: ROBUST_PARSER',
    rank: 'mid',
    description: 'Обработка нескольких типов ошибок в одном блоке.',
    steps: [
      { id: '1', name: 'MULTI_CATCH', requiredCardId: 'syntax_try_catch' }
    ]
  },
  {
    id: 'mid_iterator_logic',
    name: 'DRILL: CURSOR_TRAVERSAL',
    rank: 'mid',
    description: 'Сложный перебор коллекции с условием.',
    steps: [
      { id: '1', name: 'ITER_LOOP', requiredCardId: 'syntax_foreach' }
    ]
  }
];
