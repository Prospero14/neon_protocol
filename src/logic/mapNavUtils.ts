import { MAP_NODES } from './world/mapNodes';
import type { MapNodeData } from './world/types';

/** Subnode id where a «wandering» NPC meets the player when AWAY (bar preferred). */
export function defaultAwayVisitNodeIdForDistrict(districtId: string): string {
  const safeMapNodes: MapNodeData[] = Array.isArray(MAP_NODES) ? MAP_NODES : [];
  const d = safeMapNodes.find((m) => m.id === districtId);
  const nodes = Array.isArray(d?.subNodes) ? d.subNodes : [];
  if (nodes.length === 0) return districtId;
  const bar = nodes.find((s) => s.type === 'bar');
  if (bar) return bar.id;
  const term = nodes.find((s) => s.type === 'terminal');
  if (term) return term.id;
  return nodes[0].id;
}
