/** Сценарий стола: дерево узлов и привязки к НПС / предметам / файлам. */

export type NriScenarioLinks = {
  npcIds: string[];
  catalogIds: string[];
  fileIds: string[];
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
