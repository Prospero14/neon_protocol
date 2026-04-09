import type { WorldDistrict } from '../types';
import { npc_spider_profile } from './npcs/npc_spider/profile';
import { npc_spider_dialogues } from './npcs/npc_spider/dialogues';
import { npc_mira_profile } from './npcs/npc_mira/profile';
import { npc_mira_dialogues } from './npcs/npc_mira/dialogues';
import { npc_gb_agent_profile } from './npcs/npc_gb_agent/profile';
import { npc_gb_agent_dialogues } from './npcs/npc_gb_agent/dialogues';
import { npc_barman_profile } from './npcs/npc_barman/profile';
import { npc_barman_dialogues } from './npcs/npc_barman/dialogues';
import { npc_deck_ai_profile } from './npcs/npc_deck_ai/profile';
import { npc_deck_ai_dialogues } from './npcs/npc_deck_ai/dialogues';
import { npc_midnight_runner_profile } from './npcs/npc_midnight_runner/profile';
import { npc_midnight_runner_dialogues } from './npcs/npc_midnight_runner/dialogues';

import { term_taxi_hub_dialogues } from './objects/term_taxi_hub/dialogues';
import { job_board_hub_dialogues } from './objects/job_board_hub/dialogues';
import { generic_stub_dialogues } from './objects/generic_stub/dialogues';

export const hub: WorldDistrict = {
  id: 'kitay_gorod',
  node: {
    id: 'kitay_gorod', 
    name: 'KITAY_GOROD: THE_SOCKET', 
    description: 'Бар «The Socket» — перекресток нулей и единиц. Здесь пахнет дешевым синтехолом и перегретым кремнием.', 
    x: 52, y: 55, stability: 100, type: 'hub', tier: 2,
    subNodes: [
      { id: 'npc_spider', name: 'Spider (VOID)', type: 'npc', description: 'Связник анархистов. Торгует эксплойтами.', x: 20, y: 30 },
      { id: 'npc_mira', name: 'Mira (NK)', type: 'npc', description: 'Представитель NeoKyoto. Продает апгрейды.', x: 80, y: 30 },
      { id: 'npc_gb_agent', name: 'Агент ГБ', type: 'npc', description: 'В тени за столиком. Следит за всем.', x: 50, y: 70 },
      { id: 'npc_barman', name: 'Бармен', type: 'npc', description: 'Заправиться охладом. Знает всех и всё.', x: 10, y: 10 },
      { id: 'npc_deck_ai', name: 'AIDA-01', type: 'npc', description: 'Твой ИИ-ассистент. База знаний о мире.', x: 50, y: 10 },
      { id: 'term_taxi_hub', name: 'Такси: Китай-Город', type: 'terminal', description: 'Центральный транспортный узел.', x: 90, y: 90 },
      { id: 'job_board_hub', name: 'Доска заказов', type: 'npc', description: 'Высокоуровневые контракты Хаба.', x: 70, y: 80 }
    ]
  },
  npcs: [
    npc_spider_profile,
    npc_mira_profile,
    npc_gb_agent_profile,
    npc_barman_profile,
    npc_deck_ai_profile,
    npc_midnight_runner_profile
  ],
  dialogues: {
    npc_spider: npc_spider_dialogues,
    npc_mira: npc_mira_dialogues,
    npc_gb_agent: npc_gb_agent_dialogues,
    npc_barman: npc_barman_dialogues,
    npc_deck_ai: npc_deck_ai_dialogues,
    npc_midnight_runner: npc_midnight_runner_dialogues,
    term_taxi_hub: term_taxi_hub_dialogues,
    job_board_hub: job_board_hub_dialogues,
    GENERIC_STUB: generic_stub_dialogues
  }
};
