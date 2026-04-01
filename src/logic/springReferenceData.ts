/**
 * Справочник концепций для карт Spring (Spring Boot).
 * Архитектурные паттерны и аннотации для корпоративного бэкенда.
 */

import type { JavaConcept } from './referenceData';

export const SPRING_JAVA_REFERENCE: Record<string, JavaConcept> = {
  sp_boot_application: {
    id: 'sp_boot_application',
    title: 'Spring Boot: @SpringBootApplication',
    concept: 'Bootstrap & Magic Auto-configuration',
    explanation:
      'Инициализирует всю мощь Spring в одной точке. Эта аннотация "все-в-одном" настраивает сервер, сканирует ваши компоненты и подключает "стартеры" (DB, Security, Web).',
    example:
      '@SpringBootApplication\npublic class NeonApp {\n  public static void main(String[] a) {\n    SpringApplication.run(NeonApp.class, a);\n  }\n}',
    purpose: 'Мгновенный подъем микросервиса из консоли (запуск встроенного Tomcat).',
    bullets: [
      '@Configuration: Разрешает контексту регистрировать бины из этого класса.',
      '@EnableAutoConfiguration: Самый важный механизм — Spring угадывает, что вам нужно (например, БД, если есть драйвер в classpath).',
      '@ComponentScan: Автоматический поиск ваших @Service, @Repository и @Controller.',
      'Convention over Configuration: Позволяет не писать горы XML-кода.',
      'Standalone: Приложение упаковывается в один исполняемый Uber-JAR.'
    ]
  },
  sp_rest_controller: {
    id: 'sp_rest_controller',
    title: 'Контроллер: @RestController',
    concept: 'RESTful API Layer',
    explanation:
      'Специальный вид бина, отвечающий за прием HTTP-запросов и возврат данных в формате JSON. Это "лицо" вашего бэкенда для остального мира.',
    example: '@RestController\n@RequestMapping("/api/v1")\npublic class AgentController { ... }',
    purpose: 'Объявление точек доступа (Endpoints) для связи фронтенда с логикой.',
    bullets: [
      '@Controller + @ResponseBody: Автоматически сериализует объекты (POJO) в JSON/XML.',
      'Stateless: Обычно контроллеры не хранят состояние сессии, следуя принципам REST.',
      'Entry point: Первая линия обороны, где можно проверять токены и валидировать JSON.',
      'Mapping: Позволяет гибко связывать URL-пути с методами класса.',
      'Binding: Автоматически преобразует параметры URL в аргументы методов Java.'
    ]
  },
  sp_get_mapping_stub: {
    id: 'sp_get_mapping_stub',
    title: 'Чтение: @GetMapping (Заглушка)',
    concept: 'HTTP GET Endpoint Stub',
    explanation:
      'Помечает метод для обработки GET-запросов. В Neon Protocol используется как быстрая заглушка, возвращающая статические данные до подключения реальной БД.',
    example:
      '@GetMapping("/api/status")\npublic String getStatus() {\n  return "SYSTEM_STABLE";\n}',
    purpose: 'Быстрая фиксация API-контракта для фронтенда и тестов.',
    bullets: [
      'Read-only: По правилам REST должен только отдавать данные, не меняя состояние сервера.',
      'Params: Легко принимает переменные пути (@PathVariable) и параметры запроса (@RequestParam).',
      'Caching: Ответы GET-запросов легко кэшируются на уровне Nginx/CDN.',
      'Prototype: Идеально для демо-версий архитектур без сложного персистенса.',
      'Standard: Использует HTTP GET 1.1 и HTTP/2 спецификации.'
    ]
  },
  sp_response_entity_ok: {
    id: 'sp_response_entity_ok',
    title: 'Ответ: ResponseEntity.ok',
    concept: 'Explicit HTTP Response Control',
    explanation:
      'Мощный инструмент управления HTTP-ответом. Позволяет вручную задать статус-код (200 OK), заголовки и тело сообщения.',
    example: 'return ResponseEntity.ok()\n  .header("X-Neon", "Secure")\n  .body(agentData);',
    purpose: 'Полный контроль над тем, что увидит клиент в своем браузере или терминале.',
    bullets: [
      'Flexible: Можно возвращать разные коды (200, 404, 500) в зависимости от логики.',
      'Fluent Interface: Позволяет писать код цепочкой (builder pattern).',
      'Content-Type: Можно явно указать, что мы возвращаем (JSON, PDF или изображение).',
      'Standard: Самый профессиональный способ возврата данных из контроллера.',
      'Validation: Позволяет вернуть 400 Bad Request при неверных данных игрока.'
    ]
  },
  sp_service: {
    id: 'sp_service',
    title: 'Слой логики: @Service',
    concept: 'Business Core Layer',
    explanation:
      'Специализация @Component для бизнес-слоя. Здесь живет ваша основная "умная" логика, расчеты и алгоритмы имплантов.',
    example: '@Service\npublic class HackService {\n  public void executeInfiltration() { ... }\n}',
    purpose: 'Отделение технического кода (HTTP/SQL) от правил предметной области.',
    bullets: [
      'Domain logic: Содержит основные "правила игры" вашего приложения.',
      'Transaction: Идеальное место для навешивания @Transactional.',
      'Reusability: Один сервис может использоваться разными контроллерами или тасками.',
      'Singleton: По умолчанию Spring создает один экземпляр сервиса на все приложение.',
      'Isolation: Делает архитектуру тестируемой без запуска веб-сервера.'
    ]
  },
  sp_business_stub: {
    id: 'sp_business_stub',
    title: 'Заглушка логики (Business Stub)',
    concept: 'Logic Prototyping',
    explanation:
      'Метод в сервисе с "хардкод" результатом. Позволяет прокинуть путь от API до Бизнеса, не отвлекаясь на сложную интеграцию.',
    example: 'public List<Node> findNodes() {\n  return List.of(new Node("ALPHA"), new Node("BETA"));\n}',
    purpose: 'Тестирование сквозных сценариев на ранних стадиях разработки.',
    bullets: [
      'Decoupling: Ваш контроллер уже работает с интерфейсом, а не с финальной сложной логикой.',
      'Mock: Позволяет имитировать успех или ошибку (например, нехватку памяти) для теста HUD.',
      'Velocity: Ускоряет командную разработку — пока один делает БД, другой уже пишет UI.',
      'Safety: Гарантирует стабильный результат на этапе демо-показов.',
      'Iteration: Легко заменяется на реальный вызов репозитория позже.'
    ]
  },
  sp_configuration: {
    id: 'sp_configuration',
    title: 'Настройка: @Configuration',
    concept: 'Static Wiring Layer',
    explanation: 'Квартира для ваших бинов. Позволяет вручную регистрировать и настраивать объекты (например, подключение к Redis или S3).',
    example: '@Configuration\npublic class SystemConfig {\n  // your @Bean methods here\n}',
    purpose: 'Централизованное управление зависимостями и внешними библиотеками.',
    bullets: [
      'Java Config: Заменяет старые и страшные XML-файлы настроек.',
      'Beans collection: Позволяет собирать разрозненные модули в единую систему.',
      'Conditionals: Можно включать/выключать блоки системы через @ConditionalOnProperty.',
      'Inter-bean: Методы внутри могут безопасно вызывать друг друга для DI.',
      'Type-safety: Компилятор проверит наличие бинов еще до запуска приложения.'
    ]
  },
  sp_bean_method: {
    id: 'sp_bean_method',
    title: 'Регистрация бина: @Bean',
    concept: 'Custom Object Creation',
    explanation: 'Метод, который говорит Spring: "Эй, возьми этот объект, который я создал, и положи его в свой контекст". Теперь его можно вставить через @Autowired в любое место.',
    example: '@Bean\npublic ObjectMapper jsonMapper() {\n  return new ObjectMapper();\n}',
    purpose: 'Обучение Spring работе со сторонними объектами, которые не помечены @Component.',
    bullets: [
      'Factory: Работает как фабрика объектов.',
      'Dependency cleanup: Позволяет настроить бин один раз для всего проекта.',
      'Lifecycle: Spring сам вызовет destroy/close методы, когда приложение будет выключаться.',
      'Third-party: Единственный способ засунуть внешние библиотеки в ваш DI.',
      'Qualifier: Позволяет различать два бина одного типа по имени.'
    ]
  },
  sp_autowire_ctor: {
    id: 'sp_autowire_ctor',
    title: 'Внедрение (Constructor DI)',
    concept: 'Dependency Injection: Hard Wiring',
    explanation:
      'Самый надежный способ получения зависимостей. Все поля помечаются final, что гарантирует: ваш сервис не родится "пустым" (без связей).',
    example:
      'public Controller(Service s) {\n  this.s = s;\n}',
    purpose: 'Исключение NullPointerException и легкое написание юнит-тестов.',
    bullets: [
      'Immutability: Поля нельзя изменить после старта — это безопасно.',
      'Testing: В тесте вы просто передаете "фейковую" (Mock) зависимость в конструктор руками.',
      'Spring validation: Если нужного бина нет, Spring просто не запустится (защита от багов).',
      'No @Autowired: С версии 4.3 аннотация на конструкторе не обязательна — Spring поймет сам.',
      'Required fields: Гарантирует наличие всех необходимых компонентов (CPU/RAM) для работы.'
    ]
  },
  sp_repository: {
    id: 'sp_repository',
    title: 'Доступ к данным: @Repository',
    concept: 'Data Access Object (DAO)',
    explanation:
      'Слой общения с базой данных. Spring Data JPA позволяет даже не писать SQL — достаточно просто объявить интерфейс с правильными именами методов.',
    example: '@Repository\npublic interface AgentRepo extends JpaRepository<Agent, Long> {\n}',
    purpose: 'Хранение и поиск "цифровых душ" агентов в постоянной памяти (Postgres).',
    bullets: [
      'Magic methods: findByIntegrityGreaterThan(50) — Spring сам напишет SQL-запрос.',
      'Exception conversion: Переводит страшные системные ошибки БД в понятные Java исключения.',
      'ACID support: Базовая точка для работы с транзакциями.',
      'Hibernate: Под капотом обычно прячется мощный движок ORM.',
      'Proxy: Spring создает реализацию этого интерфейса автоматически при старте.'
    ]
  },
  sp_web_mvctest: {
    id: 'sp_web_mvctest',
    title: 'Тест API: @WebMvcTest',
    concept: 'Narrow Sliced Testing',
    explanation:
      'Хирургически точный тест. Spring НЕ поднимает все приложение, а загружает только веб-слой (контроллеры и фильтры).',
    example: '@WebMvcTest(AgentController.class)\nclass ControllerTest { ... }',
    purpose: 'Проверка маршрутов (URL) и кодов ответа (200, 403) за миллисекунды.',
    bullets: [
      'Speed: В 10 раз быстрее, чем запуск всего бэкенда.',
      'Isolation: Мы тестируем только логику контроллера, "имитируя" (Mock) ответы сервисов.',
      'Contract validation: Гарантирует, что JSON формат не сломался после рефакторинга.',
      'Secure by default: Позволяет сразу проверить права доступа (Security).',
      'Annotation: Автоматически конфигурирует MockMvc и Jackson ObjectMapper.'
    ]
  },
  sp_mock_mvc: {
    id: 'sp_mock_mvc',
    title: 'Имитация HTTP: MockMvc',
    concept: 'Internal Request Simulation',
    explanation:
      'Ваш виртуальный браузер внутри тестов. Позволяет стучаться в API и проверять результаты без реальной отправки пакетов по сети.',
    example:
      'mockMvc.perform(get("/api/nodes"))\n  .andExpect(status().isOk());',
    purpose: 'Проверка "стыка" вашего кода с веб-стандартами HTTP.',
    bullets: [
      'Fluent: Гибкий синтаксис проверки (Expect) состояния ответа.',
      'JsonPath: Позволяет заглянуть внутрь JSON ответа и проверить конкретные поля.',
      'Headers: Проверка куки, токенов и кастомных заголовков.',
      'Debugging: Выводит полный отчет о запросе и ответе (Print) в консоль теста.',
      'No Network: Тесты проходят быстро и не зависят от занятости портов на сервере.'
    ]
  },
  sp_application_props: {
    id: 'sp_application_props',
    title: 'Настройки: .properties / .yaml',
    concept: 'Environment Orchestration',
    explanation:
      'Файлы конфигурации, где хранятся пароли, порты и URL внешних систем. Позволяет менять поведение программы без перекомпиляции.',
    example: 'server.port=8080\nneon.encryption.enabled=true',
    purpose: 'Адаптация микросервиса под разные "миры" (Dev, Prod, Test).',
    bullets: [
      'Profiles: Можно иметь разные файлы для Теста и Боевой среды.',
      'Passwords: Сюда пишутся секреты, которые нельзя хранить в коде.',
      'Dynamic: Можно перезагружать настройки прямо во время работы (Spring Cloud Config).',
      'Hierarchy: Значения из свойств легко считываются в код через @Value или @ConfigurationProperties.',
      'Format: Поддерживает как простой ключ=значение, так и иерархический YAML.'
    ]
  },
  'sp_repository_query': {
    id: 'sp_repository_query',
    title: 'Запросы: @Query (JPA)',
    concept: 'Custom JPQL/SQL Execution',
    explanation: 'Позволяет писать свои запросы, когда стандартных имен методов (findBy...) не хватает. Работает прямо над методом репозитория.',
    example: '@Query("SELECT a FROM Agent a WHERE a.status = :s")\nList<Agent> findByStatus(@Param("s") String s);',
    purpose: 'Реализация сложной бизнес-выборки данных из БД в одно касание.',
    bullets: [
      'JPQL: Объектно-ориентированный язык запросов (не зависит от типа БД).',
      'Native SQL: Можно писать "чистый" SQL (Postgres/Oracle/H2) через nativeQuery=true.',
      'Params: Безопасная передача переменных через двоеточие (:param) для защиты от инъекций.',
      'Projection: Позволяет выбирать только нужные поля, экономя память CPU/RAM.'
    ]
  },
  'sp_feign_client': {
    id: 'sp_feign_client',
    title: 'Связь: @FeignClient',
    concept: 'Declarative HTTP Client',
    explanation: 'Самый простой способ заставить один микросервис "говорить" с другим. Вы просто описываете интерфейс, а Spring сам делает HTTP-запросы под капотом.',
    example: '@FeignClient(name = "auth-service")\npublic interface AuthClient {\n  @GetMapping("/validate") Token check();\n}',
    purpose: 'Межсервисное взаимодействие в распределенной сети Neon Protocol.',
    bullets: [
      'Interface only: Не нужно писать реализацию клиента вручную.',
      'Load Balancing: Автоматически интегрируется с Ribbon/Spring Cloud LoadBalancer.',
      'Fallback: Позволяет задать поведение, если другой сервис "упал" (Hystrix/Resilience4j).',
      'Decoding: Автоматически превращает JSON ответа в ваши Java объекты.'
    ]
  },
  'sp_web_client': {
    id: 'sp_web_client',
    title: 'Поток данных: WebClient',
    concept: 'Reactive Non-blocking Client',
    explanation: 'Современный способ делать запросы. В отличие от старого RestTemplate, он не блокирует поток исполнения, пока ждет ответа от сервера.',
    example: 'webClient.get().uri("/api").retrieve()\n  .bodyToMono(Agent.class).subscribe();',
    purpose: 'Высокопроизводительный обмен данными в реальном времени.',
    bullets: [
      'Reactive: Основан на Project Reactor (Mono/Flux).',
      'Non-blocking: Один поток может обрабатывать тысячи параллельных запросов одновременно.',
      'Performance: Идеально для высоконагруженных систем "Moscow Zero".',
      'Timeout: Очень гибкая настройка задержек и повторных попыток (Retry).'
    ]
  },
  'sp_security_filter': {
    id: 'sp_security_filter',
    title: 'Защита: Security Filter',
    concept: 'Auth & Filter Chain',
    explanation: 'Цепочка проверок, через которые проходит каждый запрос. Здесь проверяются пароли, JWT-токены и права доступа (Roles).',
    example: 'http.authorizeRequests().antMatchers("/admin/**").hasRole("ADMIN");',
    purpose: 'Обеспечение безопасности узлов и предотвращение несанкционированного доступа.',
    bullets: [
      'Chain: Запрос проходит через много фильтров (Authentication, Authorization, CSRF).',
      'JWT: Основной способ передачи личности хакера в Neon Protocol.',
      'Deny All: По умолчанию в правильной системе всё запрещено.',
      'Interception: Позволяет выкинуть 403 Forbidden еще до того, как запрос дойдет до контроллера.'
    ]
  }
};
