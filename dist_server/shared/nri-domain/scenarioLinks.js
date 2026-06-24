/** Привязки узла сценария — общий тип client/server. */
export function emptyScenarioLinks() {
    return { npcIds: [], catalogIds: [], fileIds: [] };
}
export function parseScenarioLinks(raw) {
    if (!raw || typeof raw !== 'object')
        return emptyScenarioLinks();
    const o = raw;
    const ids = (key) => Array.isArray(o[key]) ? o[key].filter((x) => typeof x === 'string') : [];
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
//# sourceMappingURL=scenarioLinks.js.map