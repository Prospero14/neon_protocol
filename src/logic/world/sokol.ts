import type { WorldDistrict } from './types';

export const sokol: WorldDistrict = {
  id: 'sokol',
  node: {
    id: 'sokol', 
    name: 'SOKOL: TECH_HUB', 
    description: 'Центр авиационных и космических исследований. Место сосредоточения старой технической элиты.', 
    x: 30, y: 15, stability: 90, type: 'combat', tier: 3, combatPack: 'java_core',
    subNodes: [
      { id: 'npc_dean', name: 'Декан Техникума', type: 'npc', description: 'Выдает дипломы и базовые знания.', x: 40, y: 40 },
      { id: 'npc_lab_assistant', name: 'Лаборант Илья', type: 'npc', description: 'Помогает с практическими работами.', x: 55, y: 30 },
      { id: 'npc_drone_pilot', name: 'Пилот Дронов', type: 'npc', description: 'Сдает в аренду разведывательные модули.', x: 10, y: 20 },
      { id: 'npc_retired_tester', name: 'Тестер на пенсии', type: 'npc', description: 'Знает всё о багах старых авиасистем.', x: 80, y: 55 },
      { id: 'npc_avionics_dev', name: 'Авионик-Разработчик', type: 'npc', description: 'Специалист по встроенным системам.', x: 25, y: 15 },
      { id: 'college_tech', name: 'Колледж Информатики', type: 'shop', description: 'Прикладное обучение.', x: 20, y: 60 },
      { id: 'bar_propeller', name: 'Бар "Пропеллер"', type: 'bar', description: 'Место встречи технарей старой закалки.', x: 45, y: 80 },
      { id: 'term_blueprint', name: 'Архив чертежей', type: 'terminal', description: 'Данные об архитектуре.', x: 70, y: 20 },
      { id: 'combat_drone_swarm', name: 'Рой Дронов', type: 'combat', description: 'Взломанная система защиты атакует всех подряд.', x: 60, y: 70 },
      { id: 'combat_server_overheat', name: 'Перегрев Серверной', type: 'combat', description: 'Бой в условиях критической температуры.', x: 15, y: 45 },
      { id: 'term_taxi_sokol', name: 'Такси: Сокол', type: 'terminal', description: 'Вылет в центр.', x: 85, y: 85 }
    ]
  },
  npcs: [
    { id: 'npc_dean', name: 'Декан Техникума', districtId: 'sokol', role: 'Академия', greeting: 'Диплом не спасает от багов.', shortLore: 'Высокоуровневые учебные контракты.' },
    { id: 'npc_retired_tester', name: 'Семёныч', districtId: 'sokol', role: 'Бывалый тестер', greeting: 'В моё время мы ловили баги голыми руками.', shortLore: 'Старик, видевший крах первых авиа-сетей.' },
  ],
  dialogues: {
    npc_dean: {
      id: 'npc_dean', startNodeId: 'intro',
      nodes: {
        intro: {
          id: 'intro', speaker: 'ДЕКАН_КОЛЛЕДЖА', text: 'Нужна работа, стажер? Нам в Колледже нужны практики, а не теоретики. Могу выправить тебе лицензию админа или тестера. Что берешь?', options: [
            { text: 'Класс: System Administrator (200 Bits)', nextId: 'ok', cost: 200, effect: 'SET_PROFESSION', cardRewardId: 'sysadmin_jun' },
            { text: 'Класс: QA Tester (180 Bits)', nextId: 'ok', cost: 180, effect: 'SET_PROFESSION', cardRewardId: 'qa_heavy_jun' },
            { text: '[Уйти]', nextId: 'LEAVE' }
          ]
        },
        ok: {
          id: 'ok', speaker: 'ДЕКАН_КОЛЛЕДЖА', text: 'Корочка готова. Теперь ты в системе не просто так. Работай честно.', options: [{ text: 'Принято.', nextId: 'LEAVE' }]
        }
      }
    },
    npc_retired_tester: {
      id: 'npc_retired_tester', startNodeId: 'intro',
      nodes: {
        intro: {
          id: 'intro', speaker: 'СЕМЕНЫЧ', text: 'Баги в авионике — это не шутки, сынок. Одна ошибка в плавучке — и дрон летит не в ту сторону. Хочешь почувствовать, как это было в сороковых?',
          options: [
            { text: 'Я готов к испытанию роем.', nextId: 'quest_drone' },
            { text: 'Что за перегрев в северной?', nextId: 'quest_heat' },
            { text: '[Уйти]', nextId: 'LEAVE' }
          ]
        },
        quest_drone: {
          id: 'quest_drone', speaker: 'СЕМЕНЫЧ', text: 'Старые дроны "Сокол-1" сошли с ума от циклической зависимости. Иди и покажи им, что такое правильная инъекция кода. (Принять квест)',
          options: [{ text: '[ ПРИНЯТЬ КОНТРАКТ: РОЙ ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_sokol_combat_drone_swarm_bug_sweep' }]
        },
      }
    }
  }
};
