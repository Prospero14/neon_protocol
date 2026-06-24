/** Привязки узла сценария — общий тип client/server. */

export type NriScenarioLinks = {
  npcIds: string[];
  catalogIds: string[];
  fileIds: string[];
  syncToLore?: boolean;
  lorePlaceId?: string | null;
  placeTitle?: string;
  mapMarkerId?: string | null;
  zoneKey?: string | null;
  meetCheckpoint?: boolean;
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
