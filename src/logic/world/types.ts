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
  dominantFactionId?: string; // New: For district-wide reputation checks
  boundary?: string; // SVG path string
  features?: { type: 'road' | 'park' | 'lake' | 'park_hatch' | 'label', path: string }[]; // Aesthetic line-art
  imageSubstrate?: string; // Optional PNG background path
}

export interface NpcProfile {
  id: string;
  name: string;
  districtId: string;
  role: string;
  greeting: string;
  shortLore: string;
  factionId: string; // Mandatory faction affiliation for all NPCs
}

export interface WorldDistrict {
  id: string;
  node: MapNodeData;
  npcs: NpcProfile[];
  dialogues: Record<string, DialogueTree>;
}
