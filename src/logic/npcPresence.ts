export interface NpcPresenceConfig {
  npcId: string;
  name: string;
  homeNodeId: string;
  awayNodeId: string;
  awayChance: number;
  awayNote: string;
  discoveryQuestId?: string; // If set, home is hidden until quest is finished/talked
}

export const NPC_PRESENCE_CONFIGS: Record<string, NpcPresenceConfig> = {
  npc_petrovich: {
    npcId: 'npc_petrovich',
    name: 'Петрович',
    homeNodeId: 'npc_petrovich',
    awayNodeId: 'bar_chips',
    awayChance: 0.3,
    awayNote: 'Записка на двери: Ушел в бар. Буду поздно.',
    discoveryQuestId: 'q_kiddo_start'
  },
  npc_varvar: {
    npcId: 'npc_varvar',
    name: 'ВАРВАР',
    homeNodeId: 'npc_varvar',
    awayNodeId: 'term_silo_7',
    awayChance: 0.2,
    awayNote: 'Записка на двери: Прозваниваю порты на нижнем ярусе. Не входить.'
  },
  npc_nixanna: {
    npcId: 'npc_nixanna',
    name: 'НИКСАННА',
    homeNodeId: 'npc_nixanna',
    awayNodeId: 'combat_nixanna_ritual',
    awayChance: 0.4,
    awayNote: 'Записка на двери: Ушла в рендер. Буду когда догорит видюха.'
  },
  shop_scrap: {
    npcId: 'shop_scrap',
    name: 'Серый',
    homeNodeId: 'shop_scrap',
    awayNodeId: 'bar_chips',
    awayChance: 0.15,
    awayNote: 'Записка на двери: Ушел пропивать выручку. Заходи завтра.'
  }
};
