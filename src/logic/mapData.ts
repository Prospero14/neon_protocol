import { MAP_NODES as MODULAR_MAP_NODES } from './world';
import { type CombatPack, type MapNodeData as ModularMapNodeData } from './world/types';

export interface SubNode {
  id: string;
  name: string;
  type: 'npc' | 'shop' | 'combat' | 'terminal' | 'bar';
  description: string;
  x: number;
  y: number;
}

export type MapNode = ModularMapNodeData;
export type MapNodeData = MapNode;
export type { CombatPack };

// Consolidating all districts from the new modular structure
export const MAP_NODES: MapNode[] = MODULAR_MAP_NODES;

/** Subnode id where a «wandering» NPC meets the player when AWAY (bar preferred). */
export function defaultAwayVisitNodeIdForDistrict(districtId: string): string {
  const d = MAP_NODES.find((m) => m.id === districtId);
  if (!d?.subNodes?.length) return districtId;
  const bar = d.subNodes.find((s) => s.type === 'bar');
  if (bar) return bar.id;
  const term = d.subNodes.find((s) => s.type === 'terminal');
  if (term) return term.id;
  return d.subNodes[0].id;
}
