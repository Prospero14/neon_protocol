/**
 * Отдельная библиотека карт: Spring / Spring Boot (SDLC V5.0).
 * Тегированные для новой системы фаз.
 */

import type { CombatCard } from './combatCards';

export const SPRING_CARD_LIBRARY: CombatCard[] = [
  // --- DESIGN PHASE ---
  {
    language: 'java',
    libs: ['spring'],
    id: 'sp_boot_application',
    name: 'SPRING_BOOTAPP',
    type: 'NETWORK',
    grade: 'Junior',
    cost: 1,
    power: 5,
    integrity: 16,
    description: '@SpringBootApplication — точка входа контекста. Основа проекта.',
    tags: ['spring'],
    phaseConstraint: 'DESIGN'
  },
  {
    language: 'java',
    libs: ['spring'],
    id: 'sp_application_props',
    name: 'APPLICATION_PROPERTIES',
    type: 'SOFT',
    grade: 'Junior',
    cost: 0,
    power: 2,
    integrity: 8,
    description: 'application.yml: настройки портов и профилей.',
    tags: ['spring'],
    phaseConstraint: 'DESIGN'
  },

  // --- CODING PHASE ---
  {
    language: 'java',
    libs: ['spring'],
    id: 'sp_rest_controller',
    name: 'REST_CONTROLLER',
    type: 'SYNTAX',
    grade: 'Junior',
    cost: 1,
    power: 8,
    integrity: 12,
    description: '@RestController: Каркас HTTP-эндпоинтов.',
    requires: 'sp_boot_application',
    tags: ['spring'],
    phaseConstraint: 'CODING'
  },
  {
    language: 'java',
    libs: ['spring'],
    id: 'sp_get_mapping_stub',
    name: 'GET_MAPPING_STUB',
    type: 'FUNCTION',
    grade: 'Junior',
    cost: 1,
    power: 12,
    integrity: 8,
    description: '@GetMapping: Обработка входящих запросов.',
    requires: 'sp_rest_controller',
    tags: ['spring'],
    phaseConstraint: 'CODING'
  },
  {
    language: 'java',
    libs: ['spring'],
    id: 'sp_service',
    name: 'SERVICE_STEREOTYPE',
    type: 'SYNTAX',
    grade: 'Junior',
    cost: 1,
    power: 7,
    integrity: 11,
    description: '@Service: Слой бизнес-логики.',
    requires: 'sp_boot_application',
    tags: ['spring'],
    phaseConstraint: 'CODING'
  },
  {
    language: 'java',
    libs: ['spring'],
    id: 'sp_repository',
    name: 'DATA_REPOSITORY',
    type: 'SYNTAX',
    grade: 'Junior',
    cost: 2,
    power: 8,
    integrity: 10,
    description: '@Repository: Доступ к данным.',
    requires: 'sp_boot_application',
    tags: ['spring'],
    phaseConstraint: 'CODING'
  },

  // --- TESTING PHASE ---
  {
    language: 'java',
    libs: ['spring'],
    id: 'sp_web_mvctest',
    name: 'WEB_MVC_TEST',
    type: 'HARD',
    grade: 'Middle',
    cost: 1,
    power: 6,
    integrity: 11,
    description: '@WebMvcTest: Тестирование веб-слоя.',
    requires: 'sp_boot_application',
    tags: ['spring', 'reaction'],
    phaseConstraint: 'TESTING'
  },
  {
    language: 'java',
    libs: ['spring'],
    id: 'sp_mock_mvc',
    name: 'MOCK_MVC_DISPATCH',
    type: 'FUNCTION',
    grade: 'Middle',
    cost: 1,
    power: 13,
    integrity: 7,
    description: 'mockMvc: Проверка ответов API.',
    requires: 'sp_web_mvctest',
    tags: ['spring', 'reaction'],
    phaseConstraint: 'TESTING'
  },
];

export const getSpringCardById = (id: string) => SPRING_CARD_LIBRARY.find((c) => c.id === id);
