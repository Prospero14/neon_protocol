/** Сценарий стола: дерево узлов и привязки к НПС / предметам / файлам. */

export type { NriScenarioLinks } from '../../shared/nri-domain/scenarioLinks.js';
export {
  emptyScenarioLinks,
  parseScenarioLinks,
} from '../../shared/nri-domain/scenarioLinks.js';

export type NriScenarioNode = {
  id: string;
  parentId: string | null;
  title: string;
  /** Краткая сводка для [[ссылки]] в чате — видят игроки. */
  summary: string;
  /** Полный текст — только мастер в редакторе сценария. */
  body: string;
  sortOrder: number;
  links: import('../../shared/nri-domain/scenarioLinks.js').NriScenarioLinks;
  createdAt: number;
  updatedAt: number;
  checkpointMet?: boolean;
};

export function scenarioDepth(
  nodes: NriScenarioNode[],
  id: string
): number {
  let depth = 0;
  let cur = nodes.find((n) => n.id === id);
  while (cur?.parentId) {
    depth += 1;
    cur = nodes.find((n) => n.id === cur!.parentId);
    if (depth > 20) break;
  }
  return depth;
}

export function evaluateCheckpoint(
  node: NriScenarioNode,
  currentScriptNodeId: string | null,
  playerZoneKeys: string[],
  playerCount: number
): { met: boolean; reason?: string } {
  const links = node.links;
  if (!links.meetCheckpoint || !links.zoneKey) {
    return { met: false, reason: 'Не настроен чекпоинт встречи' };
  }
  if (currentScriptNodeId !== node.id) {
    return { met: false, reason: 'Игроки пришли раньше сценария или это не текущий пункт' };
  }
  if (playerCount <= 0) {
    return { met: false, reason: 'Нет игроков за столом' };
  }
  const atPlace = playerZoneKeys.filter((z) => z === links.zoneKey).length;
  if (atPlace < playerCount) {
    return { met: false, reason: `В месте ${atPlace}/${playerCount} игроков` };
  }
  return { met: true };
}
