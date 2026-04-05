import type { WorldDistrict } from '../types';
import { hub_npcs } from './npcs';
import { hub_dialogues } from './dialogues';

export const hub: WorldDistrict = {
  id: 'kitay_gorod',
  node: {
    id: 'kitay_gorod', 
    name: 'KITAY_GOROD: THE_SOCKET', 
    description: 'Бар "The Socket" — перекресток нулей и единиц. Здесь пахнет дешевым синтехолом и перегретым кремнием.', 
    x: 52, y: 55, stability: 100, type: 'hub', tier: 2,
    subNodes: [
      { id: 'npc_spider', name: 'Spider (VOID)', type: 'npc', description: 'Связник анархистов.', x: 20, y: 30 },
      { id: 'npc_mira', name: 'Mira (NK)', type: 'npc', description: 'Представитель NeoKyoto.', x: 80, y: 30 },
      { id: 'npc_gb_agent', name: 'Агент ГБ', type: 'npc', description: 'В тени за столиком.', x: 50, y: 70 },
      { id: 'npc_barman', name: 'Бармен', type: 'npc', description: 'Заправиться охладом.', x: 10, y: 10 }
    ]
  },
  npcs: hub_npcs,
  dialogues: hub_dialogues
};
