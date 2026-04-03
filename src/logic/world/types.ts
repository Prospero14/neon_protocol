import type { DialogueTree } from '../dialogues';


export type CombatPack = 'java_core' | 'java_advanced' | 'java_spring' | 'python_scripts' | 'go_routines';

export interface MapSubNode {
  id: string;
  name: string;
  type: 'npc' | 'shop' | 'bar' | 'combat' | 'terminal';
  description: string;
  x: number;
  y: number;
  combatPack?: CombatPack;
}

export interface MapNodeData {
  id: string;
  name: string;
  description: string;
  x: number;
  y: number;
  stability: number;
  type: 'hub' | 'trade' | 'combat' | 'bar';
  tier: number;
  subNodes: MapSubNode[];
  combatPack?: CombatPack;
}

export interface NpcProfile {
  id: string;
  name: string;
  districtId: string;
  role: string;
  greeting: string;
  shortLore: string;
}

export interface WorldDistrict {
  id: string;
  node: MapNodeData;
  npcs: NpcProfile[];
  dialogues: Record<string, DialogueTree>;
}
