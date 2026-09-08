import { defaultZoneIconId, normalizeZoneIconId } from '../../shared/nri-domain/zoneIcons.js';
import { isSubMapZoneKey, rootMapZoneKey, subMapZoneKey, } from '../../shared/nri-domain/mapZones.js';
import { normalizeDistrictStyle, normalizePlaceType, parseSubTileGrid, } from '../../shared/nri-domain/districtGrid.js';
import { resolveCityScale, isPopulationBand } from '../../shared/nri-domain/cityScale.js';
import { computeExitLink, parseStoredLinksTo, } from '../../shared/nri-domain/exitLinks.js';
import { computeDistrictGridLayout, generateDistrictGrid, } from '../../shared/nri-domain/districtLayout.js';
import { ensureNriMapSchema, loadTopLevelZoneSeeds } from './nriSchemaBootstrap.js';
export const MAP_LAYOUT_VERSION = 'v8-lazy-district-tiles';
let mapZonesSeedCacheVersion = null;
let subTileCountCache = null;
const SUB_COUNT_CACHE_MS = 45_000;
function megaKeyFromZoneKey(zoneKey) {
    const root = rootMapZoneKey(zoneKey);
    if (root.startsWith('corp_'))
        return 'city_center';
    const m = root.match(/^(watson|westbrook|city_center|heywood|santo_domingo|pacifica)_/);
    return m?.[1] ?? null;
}
function defaultMegaLabel(zoneKey) {
    const mk = megaKeyFromZoneKey(zoneKey);
    if (!mk)
        return null;
    const labels = {
        watson: 'ВАТСОН',
        westbrook: 'ВЕСТБРУК',
        city_center: 'ЦЕНТР ГОРОДА',
        heywood: 'ХЕЙВУД',
        santo_domingo: 'САНТО-ДОМИНГО',
        pacifica: 'ПАСИФИКА',
    };
    return labels[mk] ?? null;
}
function normalizeZoneColor(raw) {
    if (raw === undefined)
        return undefined;
    if (raw === null || raw === '')
        return null;
    if (typeof raw !== 'string')
        return undefined;
    const c = raw.trim();
    if (!/^#[0-9a-fA-F]{6}$/.test(c))
        return undefined;
    return c.toLowerCase();
}
function megaDistrictFor(zoneKey, stored) {
    if (stored?.trim())
        return stored.trim();
    return defaultMegaLabel(zoneKey);
}
function applyCityScaleFields(z) {
    if (z.parentZoneKey)
        return {};
    const scale = resolveCityScale({
        zoneType: z.zoneType,
        populationBand: isPopulationBand(z.populationBand) ? z.populationBand : null,
        densityLabel: z.densityLabel,
        trafficLevel: z.trafficLevel,
        nightlifeLevel: z.nightlifeLevel,
    });
    return {
        populationBand: scale.populationBand,
        densityLabel: scale.densityLabel,
        trafficLevel: scale.trafficLevel,
        nightlifeLevel: scale.nightlifeLevel,
    };
}
function parseLinksToField(raw) {
    if (raw == null || raw === '')
        return undefined;
    if (typeof raw === 'string') {
        try {
            return parseStoredLinksTo(JSON.parse(raw)) ?? undefined;
        }
        catch {
            return undefined;
        }
    }
    return parseStoredLinksTo(raw) ?? undefined;
}
export function serializeMapZone(z) {
    const pois = Array.isArray(z.pois) ? z.pois : [];
    const storedLinks = parseLinksToField(z.linksTo);
    const cityScale = applyCityScaleFields(z);
    return {
        zoneKey: z.zoneKey,
        sortOrder: z.sortOrder,
        name: z.name,
        zoneType: z.zoneType,
        x: z.x,
        y: z.y,
        w: z.w,
        h: z.h,
        corpName: z.corpName,
        locked: z.locked,
        megaDistrict: megaDistrictFor(z.zoneKey, z.megaDistrict),
        color: z.color ?? null,
        iconId: z.iconId ?? defaultZoneIconId(z.zoneType, z.zoneKey),
        parentZoneKey: z.parentZoneKey ?? null,
        placeType: z.placeType ?? null,
        districtStyle: z.districtStyle ?? null,
        gridRow: z.gridRow ?? null,
        gridCol: z.gridCol ?? null,
        ...cityScale,
        linksTo: z.linksToResolved ?? storedLinks ?? [],
        ...(z.subTileCount !== undefined ? { subTileCount: z.subTileCount } : {}),
        pois,
        updatedAt: z.updatedAt?.getTime() ?? Date.now(),
    };
}
function seedRow(s) {
    return {
        zoneKey: s.zoneKey,
        sortOrder: s.sortOrder,
        name: s.name,
        zoneType: s.zoneType,
        x: s.x,
        y: s.y,
        w: s.w,
        h: s.h,
        corpName: s.corpName ?? null,
        megaDistrict: s.megaDistrict ?? defaultMegaLabel(s.zoneKey),
        color: null,
        iconId: defaultZoneIconId(s.zoneType, s.zoneKey),
        parentZoneKey: s.parentZoneKey ?? null,
        placeType: s.placeType ?? null,
        districtStyle: s.districtStyle ?? null,
        gridRow: s.gridRow ?? null,
        gridCol: s.gridCol ?? null,
        locked: s.locked ?? false,
        pois: s.pois ?? [],
    };
}
async function insertMissingSeeds(prisma, seeds) {
    const existingKeys = new Set((await prisma.nriMapZone.findMany({ select: { zoneKey: true } })).map((z) => z.zoneKey));
    const missing = seeds.filter((s) => !existingKeys.has(s.zoneKey));
    if (missing.length > 0) {
        await prisma.nriMapZone.createMany({ data: missing.map(seedRow) });
    }
}
async function upsertLayoutVersion(prisma) {
    await prisma.nriMapZone.upsert({
        where: { zoneKey: '__layout__' },
        create: {
            zoneKey: '__layout__',
            sortOrder: -1,
            name: MAP_LAYOUT_VERSION,
            zoneType: 'meta',
            x: 0,
            y: 0,
            w: 0,
            h: 0,
            corpName: null,
            megaDistrict: null,
            color: null,
            iconId: null,
            parentZoneKey: null,
            locked: true,
            pois: [],
        },
        update: { name: MAP_LAYOUT_VERSION },
    });
}
async function syncTopLevelGeometryFromSeeds(prisma, seeds) {
    const tops = seeds.filter((s) => !s.parentZoneKey && s.zoneKey !== '__layout__' && s.zoneType !== 'meta');
    for (const s of tops) {
        await prisma.nriMapZone.updateMany({
            where: { zoneKey: s.zoneKey, parentZoneKey: null },
            data: { x: s.x, y: s.y, w: s.w, h: s.h },
        });
    }
}
/**
 * Сид только топ-районов (без тысяч клеток квартала).
 * Клетки генерируются лениво в ensureDistrictTilesForParent — иначе Amvera
 * на первом GET /map/zones OOM/таймаутит → HTML → клиент видит API_NOT_FOUND.
 */
export async function ensureMapZonesSeeded(prisma) {
    if (mapZonesSeedCacheVersion === MAP_LAYOUT_VERSION)
        return;
    await ensureNriMapSchema(prisma);
    const layoutRow = await prisma.nriMapZone.findUnique({ where: { zoneKey: '__layout__' } });
    if (layoutRow?.name === MAP_LAYOUT_VERSION) {
        mapZonesSeedCacheVersion = MAP_LAYOUT_VERSION;
        return;
    }
    const topSeeds = loadTopLevelZoneSeeds();
    const topCount = await prisma.nriMapZone.count({
        where: { zoneKey: { not: '__layout__' }, parentZoneKey: null },
    });
    if (topCount === 0) {
        await insertMissingSeeds(prisma, topSeeds);
        await upsertLayoutVersion(prisma);
        mapZonesSeedCacheVersion = MAP_LAYOUT_VERSION;
        return;
    }
    await insertMissingSeeds(prisma, topSeeds);
    if (!layoutRow || layoutRow.name !== MAP_LAYOUT_VERSION) {
        await syncTopLevelGeometryFromSeeds(prisma, topSeeds);
        // Сбрасываем старые клетки — пересоберём по запросу drill, без bulk 5k+ insert.
        await prisma.nriMapZone.deleteMany({
            where: { parentZoneKey: { not: null }, NOT: { zoneKey: { startsWith: '__' } } },
        });
        subTileCountCache = null;
        await upsertLayoutVersion(prisma);
    }
    mapZonesSeedCacheVersion = MAP_LAYOUT_VERSION;
}
const districtSeedLocks = new Map();
/** Лениво создать сетку квартала, если мастер/игрок провалился в район. */
export async function ensureDistrictTilesForParent(prisma, parentZoneKey) {
    const inflight = districtSeedLocks.get(parentZoneKey);
    if (inflight) {
        await inflight;
        return;
    }
    const run = (async () => {
        await ensureNriMapSchema(prisma);
        const parent = await prisma.nriMapZone.findUnique({ where: { zoneKey: parentZoneKey } });
        if (!parent || parent.parentZoneKey)
            return;
        if (['highway', 'overpass', 'tunnel', 'meta'].includes(parent.zoneType))
            return;
        const layout = computeDistrictGridLayout();
        const expected = layout.rows * layout.cols;
        const existing = await prisma.nriMapZone.count({ where: { parentZoneKey } });
        if (existing > 0 && existing < expected) {
            await prisma.nriMapZone.deleteMany({ where: { parentZoneKey } });
        }
        else if (existing >= expected) {
            return;
        }
        const tiles = generateDistrictGrid({
            zoneKey: parent.zoneKey,
            sortOrder: parent.sortOrder,
            name: parent.name,
            zoneType: parent.zoneType,
            x: parent.x,
            y: parent.y,
            w: parent.w,
            h: parent.h,
            parentZoneKey: parent.parentZoneKey,
            megaDistrict: parent.megaDistrict,
            corpName: parent.corpName,
        });
        if (tiles.length === 0)
            return;
        const chunk = 200;
        for (let i = 0; i < tiles.length; i += chunk) {
            const slice = tiles.slice(i, i + chunk);
            await prisma.nriMapZone.createMany({
                data: slice.map((t) => ({
                    zoneKey: t.zoneKey,
                    sortOrder: t.sortOrder,
                    name: t.name,
                    zoneType: t.zoneType,
                    x: t.x,
                    y: t.y,
                    w: t.w,
                    h: t.h,
                    corpName: t.corpName ?? null,
                    megaDistrict: t.megaDistrict ?? null,
                    color: null,
                    iconId: defaultZoneIconId(t.zoneType, t.zoneKey),
                    parentZoneKey: t.parentZoneKey,
                    placeType: t.placeType,
                    districtStyle: t.districtStyle,
                    gridRow: t.gridRow,
                    gridCol: t.gridCol,
                    locked: false,
                    pois: t.pois,
                })),
                skipDuplicates: true,
            });
        }
        subTileCountCache = null;
    })().finally(() => {
        districtSeedLocks.delete(parentZoneKey);
    });
    districtSeedLocks.set(parentZoneKey, run);
    await run;
}
export async function listMapZones(prisma, opts) {
    await ensureNriMapSchema(prisma);
    const parentFilter = opts?.parentZoneKey;
    await ensureMapZonesSeeded(prisma);
    if (typeof parentFilter === 'string' && parentFilter.trim()) {
        const parentKey = parentFilter.trim();
        await ensureDistrictTilesForParent(prisma, parentKey);
        const [parent, rows, topRows] = await Promise.all([
            prisma.nriMapZone.findUnique({ where: { zoneKey: parentKey } }),
            prisma.nriMapZone.findMany({
                where: { parentZoneKey: parentKey },
                orderBy: [{ gridRow: 'asc' }, { gridCol: 'asc' }, { sortOrder: 'asc' }],
            }),
            prisma.nriMapZone.findMany({
                where: { zoneKey: { not: '__layout__' }, parentZoneKey: null },
                orderBy: { sortOrder: 'asc' },
            }),
        ]);
        const layout = parent ? computeDistrictGridLayout() : null;
        const neighborKeys = new Set();
        if (parent && layout) {
            for (const t of rows) {
                if (t.placeType !== 'exit')
                    continue;
                const link = computeExitLink(t, parent, layout, topRows, []);
                if (link)
                    neighborKeys.add(rootMapZoneKey(link.zoneKey));
            }
        }
        for (const nk of neighborKeys) {
            await ensureDistrictTilesForParent(prisma, nk);
        }
        const neighborSubTiles = neighborKeys.size > 0
            ? await prisma.nriMapZone.findMany({
                where: { parentZoneKey: { in: [...neighborKeys] } },
            })
            : [];
        return rows.map((row) => {
            const stored = parseLinksToField(row.linksTo);
            let linksToResolved = stored;
            if (!linksToResolved && parent && layout && row.placeType === 'exit') {
                const computed = computeExitLink(row, parent, layout, topRows, neighborSubTiles);
                if (computed)
                    linksToResolved = [computed];
            }
            return serializeMapZone({ ...row, linksToResolved });
        });
    }
    const [rows, subCounts] = await Promise.all([
        prisma.nriMapZone.findMany({
            where: { zoneKey: { not: '__layout__' }, parentZoneKey: null },
            orderBy: { sortOrder: 'asc' },
        }),
        (async () => {
            const now = Date.now();
            if (subTileCountCache && now - subTileCountCache.at < SUB_COUNT_CACHE_MS) {
                return subTileCountCache.map;
            }
            const grouped = await prisma.nriMapZone.groupBy({
                by: ['parentZoneKey'],
                where: { parentZoneKey: { not: null } },
                _count: { zoneKey: true },
            });
            const map = new Map();
            for (const g of grouped) {
                if (g.parentZoneKey)
                    map.set(g.parentZoneKey, g._count.zoneKey);
            }
            subTileCountCache = { at: now, map };
            return map;
        })(),
    ]);
    const countByParent = subCounts;
    return rows.map((z) => {
        const subTileCount = countByParent.get(z.zoneKey) ?? 0;
        return serializeMapZone({ ...z, subTileCount });
    });
}
export async function patchMapZone(prisma, zoneKey, payload) {
    const existing = await prisma.nriMapZone.findUnique({ where: { zoneKey } });
    if (!existing)
        return null;
    const color = normalizeZoneColor(payload.color);
    const iconId = payload.iconId !== undefined
        ? normalizeZoneIconId(payload.iconId, existing.zoneType, zoneKey)
        : undefined;
    if (typeof payload.megaDistrict === 'string' && payload.megaDistrict.trim() && !isSubMapZoneKey(zoneKey)) {
        const label = payload.megaDistrict.trim().slice(0, 80);
        const mk = megaKeyFromZoneKey(zoneKey);
        if (mk) {
            const all = await prisma.nriMapZone.findMany({
                where: { NOT: { zoneKey: { startsWith: '__' } } },
            });
            const keys = all
                .filter((z) => megaKeyFromZoneKey(z.zoneKey) === mk && !isSubMapZoneKey(z.zoneKey))
                .map((z) => z.zoneKey);
            if (keys.length > 0) {
                await prisma.nriMapZone.updateMany({
                    where: { zoneKey: { in: keys } },
                    data: { megaDistrict: label },
                });
            }
        }
    }
    const zone = await prisma.nriMapZone.update({
        where: { zoneKey },
        data: {
            ...(typeof payload.name === 'string' && payload.name.trim()
                ? { name: payload.name.trim().slice(0, 120) }
                : {}),
            ...(payload.corpName !== undefined
                ? {
                    corpName: typeof payload.corpName === 'string' && payload.corpName.trim()
                        ? payload.corpName.trim().slice(0, 80)
                        : null,
                }
                : {}),
            ...(payload.pois !== undefined
                ? { pois: Array.isArray(payload.pois) ? payload.pois.map((p) => String(p).slice(0, 80)) : [] }
                : {}),
            ...(color !== undefined ? { color } : {}),
            ...(iconId !== undefined ? { iconId } : {}),
            ...(payload.placeType !== undefined ? { placeType: normalizePlaceType(payload.placeType) } : {}),
            ...(payload.districtStyle !== undefined
                ? {
                    districtStyle: payload.districtStyle === null
                        ? null
                        : normalizeDistrictStyle(payload.districtStyle) ?? existing.districtStyle,
                }
                : {}),
            ...(payload.populationBand !== undefined
                ? {
                    populationBand: payload.populationBand === null || payload.populationBand === ''
                        ? null
                        : isPopulationBand(payload.populationBand)
                            ? payload.populationBand
                            : existing.populationBand,
                }
                : {}),
            ...(payload.densityLabel !== undefined
                ? {
                    densityLabel: typeof payload.densityLabel === 'string' && payload.densityLabel.trim()
                        ? payload.densityLabel.trim().slice(0, 120)
                        : null,
                }
                : {}),
            ...(payload.trafficLevel !== undefined
                ? {
                    trafficLevel: typeof payload.trafficLevel === 'number' &&
                        payload.trafficLevel >= 0 &&
                        payload.trafficLevel <= 3
                        ? Math.round(payload.trafficLevel)
                        : null,
                }
                : {}),
            ...(payload.nightlifeLevel !== undefined
                ? {
                    nightlifeLevel: typeof payload.nightlifeLevel === 'number' &&
                        payload.nightlifeLevel >= 0 &&
                        payload.nightlifeLevel <= 3
                        ? Math.round(payload.nightlifeLevel)
                        : null,
                }
                : {}),
        },
    });
    if (payload.districtStyle !== undefined &&
        !isSubMapZoneKey(zoneKey) &&
        normalizeDistrictStyle(payload.districtStyle ?? '')) {
        const style = normalizeDistrictStyle(payload.districtStyle ?? '');
        if (style) {
            await prisma.nriMapZone.updateMany({
                where: { parentZoneKey: zoneKey },
                data: { districtStyle: style },
            });
        }
    }
    return serializeMapZone(zone);
}
function defaultSubRect(parent) {
    const bw = Math.max(4, Math.min(parent.w * 0.35, parent.w - 1.2));
    const bh = Math.max(3, Math.min(parent.h * 0.35, parent.h - 1.2));
    return {
        x: parent.x + (parent.w - bw) / 2,
        y: parent.y + (parent.h - bh) / 2,
        w: bw,
        h: bh,
        zoneType: parent.zoneType === 'corp' ? 'corp' : 'mid',
    };
}
export async function createMapSubZone(prisma, payload) {
    const parent = await prisma.nriMapZone.findUnique({ where: { zoneKey: payload.parentZoneKey } });
    if (!parent || parent.parentZoneKey)
        return { error: 'PARENT_NOT_FOUND' };
    if (['highway', 'overpass', 'tunnel', 'meta'].includes(parent.zoneType)) {
        return { error: 'PARENT_NOT_DRILLABLE' };
    }
    const name = payload.name.trim().slice(0, 120);
    if (!name)
        return { error: 'NAME_REQUIRED' };
    const zoneKey = subMapZoneKey(parent.zoneKey, payload.slug?.trim() || name);
    const exists = await prisma.nriMapZone.findUnique({ where: { zoneKey } });
    if (exists)
        return { error: 'ZONE_EXISTS' };
    const rect = defaultSubRect(parent);
    const zoneType = payload.zoneType?.trim() || rect.zoneType;
    const row = await prisma.nriMapZone.create({
        data: {
            zoneKey,
            sortOrder: parent.sortOrder + 9000,
            name,
            zoneType,
            x: rect.x,
            y: rect.y,
            w: rect.w,
            h: rect.h,
            corpName: parent.corpName,
            megaDistrict: parent.megaDistrict ?? defaultMegaLabel(parent.zoneKey),
            color: null,
            iconId: defaultZoneIconId(zoneType, zoneKey),
            parentZoneKey: parent.zoneKey,
            locked: false,
            pois: [],
        },
    });
    return { zone: serializeMapZone(row) };
}
export async function deleteMapSubZone(prisma, zoneKey) {
    const existing = await prisma.nriMapZone.findUnique({ where: { zoneKey } });
    if (!existing?.parentZoneKey)
        return { error: 'NOT_SUBZONE' };
    const parentKey = existing.parentZoneKey;
    const positions = await prisma.nriPlayerPosition.count({ where: { zoneKey } });
    if (positions > 0) {
        await prisma.nriPlayerPosition.updateMany({
            where: { zoneKey },
            data: { zoneKey: parentKey },
        });
    }
    const grid = parseSubTileGrid(zoneKey);
    if (grid) {
        const zone = await prisma.nriMapZone.update({
            where: { zoneKey },
            data: {
                name: `Клетка ${grid.row + 1}.${grid.col + 1}`,
                placeType: 'generic',
                pois: [],
            },
        });
        return { ok: true, reset: true, zone: serializeMapZone(zone) };
    }
    await prisma.nriMapZone.delete({ where: { zoneKey } });
    return { ok: true, reset: false };
}
export { megaKeyFromZoneKey, rootMapZoneKey };
//# sourceMappingURL=nriMapZones.js.map