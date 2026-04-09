import type { WorldDistrict } from '../types';
import { metro_dispatch_dialogues } from './objects/metro_dispatch/dialogues';
import { metro_gate_dialogues } from './objects/metro_gate/dialogues';

export const metro_stub: WorldDistrict = {
  id: 'metro_stub',
  node: {
    id: 'metro_stub',
    name: 'METRO: TRANSIT_GRID',
    description: 'Техническая заглушка метро: пересадки, диспетчеризация, сервисные коридоры.',
    x: 50,
    y: 50,
    stability: 100,
    type: 'hub',
    tier: 2,
    dominantFactionId: 'NET_DRIVERS',
    subNodes: [
      { id: 'metro_dispatch', name: 'Диспетчер Метро', type: 'npc', description: 'Сводит маршруты между районами.', x: 45, y: 45 },
      { id: 'metro_gate', name: 'Турникет Пересадки', type: 'terminal', description: 'Узел подтверждения транспортных токенов.', x: 65, y: 62 }
    ]
  },
  npcs: [
    {
      id: 'metro_dispatch',
      name: 'Диспетчер Метро',
      districtId: 'metro_stub',
      role: 'Координатор линий',
      greeting: 'Линии дышат в такт городу.',
      shortLore: 'Оперативно разводит потоки между соседними районами.',
      factionId: 'NET_DRIVERS'
    }
  ],
  dialogues: {
    metro_dispatch: metro_dispatch_dialogues,
    metro_gate: metro_gate_dialogues
  }
};
