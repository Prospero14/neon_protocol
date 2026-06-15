/** Сценарий стола: дерево узлов и привязки к НПС / предметам / файлам. */

export type NriScenarioLinks = {
  npcIds: string[];
  catalogIds: string[];
  fileIds: string[];
  /** Дублировать место в лор-карточку */
  syncToLore?: boolean;
  lorePlaceId?: string | null;
  placeTitle?: string;
  mapMarkerId?: string | null;
  zoneKey?: string | null;
  /** Чекпоинт: все игроки в месте + текущий пункт сценария */
  meetCheckpoint?: boolean;
};

export type NriScenarioNode = {
  id: string;
  parentId: string | null;
  title: string;
  body: string;
  sortOrder: number;
  links: NriScenarioLinks;
  createdAt: number;
  updatedAt: number;
  checkpointMet?: boolean;
};

export function emptyScenarioLinks(): NriScenarioLinks {
  return { npcIds: [], catalogIds: [], fileIds: [] };
}

export function parseScenarioLinks(raw: unknown): NriScenarioLinks {
  if (!raw || typeof raw !== 'object') return emptyScenarioLinks();
  const o = raw as Record<string, unknown>;
  const ids = (key: string) =>
    Array.isArray(o[key]) ? (o[key] as unknown[]).filter((x): x is string => typeof x === 'string') : [];
  return {
    npcIds: ids('npcIds'),
    catalogIds: ids('catalogIds'),
    fileIds: ids('fileIds'),
    syncToLore: o.syncToLore === true,
    lorePlaceId: typeof o.lorePlaceId === 'string' ? o.lorePlaceId : null,
    placeTitle: typeof o.placeTitle === 'string' ? o.placeTitle : undefined,
    mapMarkerId: typeof o.mapMarkerId === 'string' ? o.mapMarkerId : null,
    zoneKey: typeof o.zoneKey === 'string' ? o.zoneKey : null,
    meetCheckpoint: o.meetCheckpoint === true,
  };
}

export function scenarioDepth(nodes: NriScenarioNode[], id: string): number {
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
