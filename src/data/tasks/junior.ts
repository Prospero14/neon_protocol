import type { TechnicalTask } from '../../logic/combatTasks';

export const JUNIOR_TASKS: TechnicalTask[] = [
  {
    id: 'jr_hello_world',
    name: 'PROJECT: BASE_BOOT_HELL0',
    rank: 'junior',
    description: 'Чтобы система нас приняла, нужно представиться. Создай публичный класс и точку входа.',
    steps: [
      { id: '1', name: 'PUBLIC_CLASS', requiredCardId: 'syntax_class_decl' },
      { id: '2', name: 'ENTRY_POINT', requiredCardId: 'syntax_main_method' }
    ]
  },
  {
    id: 'jr_log_print',
    name: 'DRILL: STDOUT_DIAG',
    rank: 'junior',
    description: 'Проверка канала вывода. Выведи в консоль сообщение о готовности системы.',
    steps: [
      { id: '1', name: 'SYS_OUT', requiredCardId: 'fn_sysout_print' }
    ]
  },
  {
    id: 'jr_var_init',
    name: 'PROJECT: NEURAL_ID_BIND',
    rank: 'junior',
    description: 'Нам нужно сохранить твой ID в памяти. Объяви строковую переменную.',
    steps: [
      { id: '1', name: 'DEFINE_STRING', requiredCardId: 'syntax_var_decl' }
    ]
  },
  {
    id: 'jr_double_print',
    name: 'DRILL: MULTI_LOG_PROBE',
    rank: 'junior',
    description: 'Система требует двойного подтверждения. Выведи логи дважды.',
    steps: [
      { id: '1', name: 'LOG_A', requiredCardId: 'fn_sysout_print' },
      { id: '2', name: 'LOG_B', requiredCardId: 'fn_sysout_print' }
    ]
  },
  {
    id: 'jr_main_wrapper',
    name: 'PROJECT: BOOT_WRAPPER',
    rank: 'junior',
    description: 'Оберни логику запуска в отдельный метод. ИИ любит структуру.',
    steps: [
      { id: '1', name: 'METHOD_DECL', requiredCardId: 'syntax_method_decl' }
    ]
  },
  {
    id: 'jr_fizzbuzz_init',
    name: 'DRILL: LOGIC_GATE_ALPHA',
    rank: 'junior',
    description: 'Простейшая проверка на вшивость. Нам нужно ветвление IF, чтобы понять, какой поток пускать.',
    steps: [
      { id: '1', name: 'IF_BRANCH', requiredCardId: 'syntax_if' }
    ]
  },
  {
    id: 'jr_loop_ping',
    name: 'PROJECT: SCAN_ITERATOR',
    rank: 'junior',
    description: 'Нам нужно повторить операцию 10 раз. Юзай FOR для итерации.',
    steps: [
      { id: '1', name: 'FOR_LOOP', requiredCardId: 'syntax_for' }
    ]
  },
  {
    id: 'jr_class_container',
    name: 'DRILL: DATA_OBJECT_MOCK',
    rank: 'junior',
    description: 'Создай контейнер для данных системы. Просто голый класс.',
    steps: [
      { id: '1', name: 'EMPTY_CLASS', requiredCardId: 'syntax_class_decl' }
    ]
  },
  {
    id: 'jr_param_method',
    name: 'PROJECT: SIGNAL_PROCESSOR',
    rank: 'junior',
    description: 'Объяви метод, который принимает параметры. Нужно обработать входящий поток.',
    steps: [
      { id: '1', name: 'PARAM_METHOD', requiredCardId: 'syntax_method_decl' }
    ]
  },
  {
    id: 'jr_local_var',
    name: 'DRILL: TEMP_STACK_VARS',
    rank: 'junior',
    description: 'Создай временную переменную внутри метода для хранения промежуточных вычислений.',
    steps: [
      { id: '1', name: 'LOCAL_VAR', requiredCardId: 'syntax_var_decl' }
    ]
  },
  {
    id: 'jr_bool_check',
    name: 'PROJECT: FIREWALL_SWITCH',
    rank: 'junior',
    description: 'Проверка флага защиты. Если TRUE — доступ закрыт.',
    steps: [
      { id: '1', name: 'BOOL_IF', requiredCardId: 'syntax_if' }
    ]
  },
  {
    id: 'jr_print_val',
    name: 'DRILL: VARIABLE_DUMP',
    rank: 'junior',
    description: 'Выведи значение переменной в консоль. Нам нужно видеть содержимое регистров.',
    steps: [
      { id: '1', name: 'PRINT_VALUE', requiredCardId: 'fn_sysout_print' }
    ]
  },
  {
    id: 'jr_main_only',
    name: 'PROJECT: SCRIPT_ENTRY',
    rank: 'junior',
    description: 'Иногда достаточно одного метода Main. Минимум кода, максимум эффекта.',
    steps: [
      { id: '1', name: 'STANDALONE_MAIN', requiredCardId: 'syntax_main_method' }
    ]
  },
  {
    id: 'jr_string_concat',
    name: 'DRILL: PACKET_ASSEMBLY',
    rank: 'junior',
    description: 'Склей две строки идентификаторов. Нам нужно полное имя узла.',
    steps: [
      { id: '1', name: 'CONCAT_LOGIC', requiredCardId: 'syntax_method_decl' }
    ]
  },
  {
    id: 'jr_for_counter',
    name: 'PROJECT: TICK_INCREMENT',
    rank: 'junior',
    description: 'Счетчик циклов. Пройдись по диапазону от 1 до 100.',
    steps: [
      { id: '1', name: 'COUNT_LOOP', requiredCardId: 'syntax_for' }
    ]
  },
  {
    id: 'jr_public_api',
    name: 'DRILL: API_SURFACE_MOCK',
    rank: 'junior',
    description: 'Объяви публичный метод. Это будет точка входа для внешних запросов.',
    steps: [
      { id: '1', name: 'PUBLIC_METHOD', requiredCardId: 'syntax_method_decl' }
    ]
  },
  {
    id: 'jr_multi_var',
    name: 'PROJECT: CONTEXT_INIT',
    rank: 'junior',
    description: 'Нам нужно сразу три переменные для хранения контекста портал.',
    steps: [
      { id: '1', name: 'VAR_A', requiredCardId: 'syntax_var_decl' },
      { id: '2', name: 'VAR_B', requiredCardId: 'syntax_var_decl' },
      { id: '3', name: 'VAR_C', requiredCardId: 'syntax_var_decl' }
    ]
  },
  {
    id: 'jr_nested_if',
    name: 'DRILL: SECURITY_GATE_N2',
    rank: 'junior',
    description: 'Проверка внутри проверки. Вложенные IF — для особо секретных данных.',
    steps: [
      { id: '1', name: 'OUTER_IF', requiredCardId: 'syntax_if' },
      { id: '2', name: 'INNER_IF', requiredCardId: 'syntax_if' }
    ]
  },
  {
    id: 'jr_final_class',
    name: 'PROJECT: IMMUTABLE_NODE',
    rank: 'junior',
    description: 'Объяви класс. Нам нужна база для наращивания логики.',
    steps: [
      { id: '1', name: 'CLASS_DECL', requiredCardId: 'syntax_class_decl' }
    ]
  },
  {
    id: 'jr_end_log',
    name: 'DRILL: EXIT_SIGNAL',
    rank: 'junior',
    description: 'В конце работы обязательно выведи сигнал завершения.',
    steps: [
      { id: '1', name: 'FINISH_LOG', requiredCardId: 'fn_sysout_print' }
    ]
  }
];
