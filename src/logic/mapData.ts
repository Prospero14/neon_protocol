import { MAP_NODES as MODULAR_MAP_NODES } from './world/mapNodes';
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

export const MAP_NODES: MapNode[] = MODULAR_MAP_NODES;

export { defaultAwayVisitNodeIdForDistrict } from './mapNavUtils';
