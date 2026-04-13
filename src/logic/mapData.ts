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
  const safeMapNodes: MapNode[] = Array.isArray(MAP_NODES) ? MAP_NODES : [];
  const d = safeMapNodes.find((m) => m.id === districtId);
  const nodes = Array.isArray(d?.subNodes) ? d.subNodes : [];
  if (nodes.length === 0) return districtId;
  const bar = nodes.find((s) => s.type === 'bar');
  if (bar) return bar.id;
  const term = nodes.find((s) => s.type === 'terminal');
  if (term) return term.id;
  return nodes[0].id;
}
