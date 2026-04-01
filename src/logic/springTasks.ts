/**
 * ТЗ для боёв на колоде Spring: заглушки контроллера, сервиса, конфигурация, срез теста.
 */

import type { TechnicalTask } from './combatTasks';

export const SPRING_TZ_LIBRARY: TechnicalTask[] = [
  {
    id: 'spring_rest_stub',
    rank: 'junior',
    name: 'SPRING_DRILL: REST_CONTROLLER_STUB',
    description:
      'ИИ требует рабочую заглушку REST: поднимите Boot, повесьте @RestController и объявите @GetMapping-стаб.',
    steps: [
      { id: 's1', name: 'BOOTSTRAP_CONTEXT', requiredCardId: 'sp_boot_application' },
      { id: 's2', name: 'DECLARE_REST_ADAPTER', requiredCardId: 'sp_rest_controller' },
      { id: 's3', name: 'HTTP_GET_STUB', requiredCardId: 'sp_get_mapping_stub' },
    ],
  },
  {
    id: 'spring_service_stub',
    rank: 'junior',
    name: 'SPRING_DRILL: SERVICE_LAYER_STUB',
    description: 'Вынесите логику из контроллера: @Service и метод-заглушка до подключения БД или брокера.',
    steps: [
      { id: 's1', name: 'BOOTSTRAP_CONTEXT', requiredCardId: 'sp_boot_application' },
      { id: 's2', name: 'REGISTER_SERVICE', requiredCardId: 'sp_service' },
      { id: 's3', name: 'BUSINESS_METHOD_PLACEHOLDER', requiredCardId: 'sp_business_stub' },
    ],
  },
  {
    id: 'spring_java_config_bean',
    rank: 'junior',
    name: 'SPRING_DRILL: @Configuration + @Bean',
    description: 'Сборка зависимостью в коде: конфиг-класс и фабричный бин для инъекций.',
    steps: [
      { id: 's1', name: 'BOOTSTRAP_CONTEXT', requiredCardId: 'sp_boot_application' },
      { id: 's2', name: 'CONFIG_CLASS', requiredCardId: 'sp_configuration' },
      { id: 's3', name: 'FACTORY_BEAN', requiredCardId: 'sp_bean_method' },
    ],
  },
  {
    id: 'spring_response_contract',
    rank: 'junior',
    name: 'SPRING_DRILL: RESPONSE_ENTITY_CONTRACT',
    description: 'Оформите ответ через ResponseEntity.ok — ИИ проверяет явный HTTP-слой.',
    steps: [
      { id: 's1', name: 'BOOTSTRAP_CONTEXT', requiredCardId: 'sp_boot_application' },
      { id: 's2', name: 'DECLARE_REST_ADAPTER', requiredCardId: 'sp_rest_controller' },
      { id: 's3', name: 'GET_ENDPOINT', requiredCardId: 'sp_get_mapping_stub' },
      { id: 's4', name: 'RESPONSE_ENTITY_OK', requiredCardId: 'sp_response_entity_ok' },
    ],
  },
  {
    id: 'spring_constructor_inject',
    rank: 'junior',
    name: 'SPRING_DRILL: CTOR_INJECTION_STUB',
    description: 'Контроллер с конструкторной инъекцией зависимостей (паттерн для тестов и ясности).',
    steps: [
      { id: 's1', name: 'BOOTSTRAP_CONTEXT', requiredCardId: 'sp_boot_application' },
      { id: 's2', name: 'REST_ADAPT', requiredCardId: 'sp_rest_controller' },
      { id: 's3', name: 'CTOR_AUTOWIRE', requiredCardId: 'sp_autowire_ctor' },
    ],
  },
  {
    id: 'spring_web_layer_test',
    rank: 'junior',
    name: 'SPRING_DRILL: WebMvcTest + MockMvc',
    description: 'Напишите минимальный тест среза: @WebMvcTest и dispatch через MockMvc.',
    steps: [
      { id: 's1', name: 'BOOTSTRAP_CONTEXT', requiredCardId: 'sp_boot_application' },
      { id: 's2', name: 'SLICE_ANNOTATION', requiredCardId: 'sp_web_mvctest' },
      { id: 's3', name: 'MOCKMVC_PROBE', requiredCardId: 'sp_mock_mvc' },
    ],
  },
];
