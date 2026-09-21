import { defaultZoneIconId, normalizeZoneIconId } from '../../shared/nri-domain/zoneIcons.js';
import { isSubMapZoneKey, rootMapZoneKey, subMapZoneKey, } from '../../shared/nri-domain/mapZones.js';
import { defaultDistrictStyle, normalizeDistrictStyle, normalizePlaceType, parseSubTileGrid, } from '../../shared/nri-domain/districtGrid.js';
import { resolveCityScale, isPopulationBand } from '../../shared/nri-domain/cityScale.js';
import { computeExitLink, parseStoredLinksTo, } from '../../shared/nri-domain/exitLinks.js';
import { computeDistrictGridLayout, generateDistrictGrid, } from '../../shared/nri-domain/districtLayout.js';
import { ensureNriMapSchema, loadTopLevelZoneSeeds } from './nriSchemaBootstrap.js';
export const MAP_LAYOUT_VERSION = 'v27-corp-campus-underhive';
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
        artId: z.artId ?? null,
        parentZoneKey: z.parentZoneKey ?? null,
        placeType: z.placeType ?? null,
        districtStyle: z.districtStyle ?? null,
        gridRow: z.gridRow ?? null,
        gridCol: z.gridCol ?? null,
        rotation: typeof z.rotation === 'number' ? ((Math.round(z.rotation / 90) * 90) % 360 + 360) % 360 : 0,
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
        // Важно: НЕ использовать LIKE/startsWith с «__» — в SQLite «_» = wildcard,
        // и zoneKey вида watson_kabuki__3_4 ложно матчится → deleteMany удаляет 0 строк.
        await prisma.$executeRaw `
      DELETE FROM NriMapZone
      WHERE parentZoneKey IS NOT NULL
        AND zoneKey NOT GLOB '__*'
    `;
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
        if (existing > 0) {
            const style = normalizeDistrictStyle(parent.districtStyle ?? '') ?? defaultDistrictStyle(parent.zoneType);
            const [composed, staleAlleys, landmarks, dumps, corpHq] = await Promise.all([
                prisma.nriMapZone.count({
                    where: { parentZoneKey, placeType: { notIn: ['generic', 'exit'] } },
                }),
                prisma.nriMapZone.count({
                    where: {
                        parentZoneKey,
                        OR: [{ placeType: 'alley' }, { name: { startsWith: 'Переулок' } }],
                    },
                }),
                prisma.nriMapZone.count({
                    where: {
                        parentZoneKey,
                        placeType: { in: ['nightclub', 'hospital', 'police', 'electronics', 'pond'] },
                    },
                }),
                prisma.nriMapZone.count({
                    where: { parentZoneKey, placeType: 'dump' },
                }),
                prisma.nriMapZone.count({
                    where: { parentZoneKey, placeType: 'corp_hq' },
                }),
            ]);
            const missingCorpCampus = (style === 'corp_clean' || parent.zoneType === 'corp') && corpHq === 0;
            // Старые сетки (переулки / без landmark'ов / без корп-кампуса / слишком много свалок) — пересобрать.
            if (existing < expected ||
                composed === 0 ||
                staleAlleys > 0 ||
                landmarks === 0 ||
                dumps > 3 ||
                missingCorpCampus) {
                await prisma.nriMapZone.deleteMany({ where: { parentZoneKey } });
            }
            else {
                return;
            }
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
            districtStyle: parent.districtStyle,
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
            });
        }
        subTileCountCache = null;
    })().finally(() => {
        districtSeedLocks.delete(parentZoneKey);
    });
    districtSeedLocks.set(parentZoneKey, run);
    await run;
}
/**
 * Хост: сбросить клетки квартала и сгенерировать заново (игроков с клеток — на родителя).
 * Кастомные имена клеток не сохраняются — это явный regen.
 */
export async function regenerateDistrictTilesForParent(prisma, parentZoneKey) {
    await ensureNriMapSchema(prisma);
    const parent = await prisma.nriMapZone.findUnique({ where: { zoneKey: parentZoneKey } });
    if (!parent || parent.parentZoneKey) {
        return { ok: false, reason: 'Нужен топ-район (не клетка).' };
    }
    if (['highway', 'overpass', 'tunnel', 'meta'].includes(parent.zoneType)) {
        return { ok: false, reason: 'В этот тип зоны нельзя провалиться / перегенерировать.' };
    }
    const prefix = `${parentZoneKey}__`;
    await prisma.nriPlayerPosition.updateMany({
        where: { zoneKey: { startsWith: prefix } },
        data: { zoneKey: parentZoneKey },
    });
    await prisma.nriMapZone.deleteMany({ where: { parentZoneKey } });
    subTileCountCache = null;
    // Снимаем lock-кэш, чтобы ensure точно пересоздал
    districtSeedLocks.delete(parentZoneKey);
    await ensureDistrictTilesForParent(prisma, parentZoneKey);
    const count = await prisma.nriMapZone.count({ where: { parentZoneKey } });
    return { ok: true, count };
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
            const placeType = normalizePlaceType(row.placeType);
            return serializeMapZone({ ...row, placeType, linksToResolved });
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
    if (typeof payload.swapWithZoneKey === 'string' && payload.swapWithZoneKey.trim()) {
        const otherKey = payload.swapWithZoneKey.trim();
        const other = await prisma.nriMapZone.findUnique({ where: { zoneKey: otherKey } });
        if (!other)
            return { error: 'SWAP_INVALID' };
        // Sibling district tiles: swap content
        if (existing.parentZoneKey && other.parentZoneKey === existing.parentZoneKey) {
            await prisma.$transaction([
                prisma.nriMapZone.update({
                    where: { zoneKey },
                    data: {
                        placeType: other.placeType,
                        name: other.name,
                        rotation: other.rotation ?? 0,
                        artId: other.artId ?? null,
                        pois: other.pois,
                    },
                }),
                prisma.nriMapZone.update({
                    where: { zoneKey: otherKey },
                    data: {
                        placeType: existing.placeType,
                        name: existing.name,
                        rotation: existing.rotation ?? 0,
                        artId: existing.artId ?? null,
                        pois: existing.pois,
                    },
                }),
            ]);
            const zone = await prisma.nriMapZone.findUnique({ where: { zoneKey } });
            return zone ? serializeMapZone(zone) : null;
        }
        // Top-level zones: swap AABB geometry
        if (!existing.parentZoneKey && !other.parentZoneKey) {
            await prisma.$transaction([
                prisma.nriMapZone.update({
                    where: { zoneKey },
                    data: { x: other.x, y: other.y, w: other.w, h: other.h },
                }),
                prisma.nriMapZone.update({
                    where: { zoneKey: otherKey },
                    data: { x: existing.x, y: existing.y, w: existing.w, h: existing.h },
                }),
            ]);
            const zone = await prisma.nriMapZone.findUnique({ where: { zoneKey } });
            return zone ? serializeMapZone(zone) : null;
        }
        return { error: 'SWAP_INVALID' };
    }
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
            ...(payload.artId !== undefined
                ? {
                    artId: typeof payload.artId === 'string' && payload.artId.trim()
                        ? payload.artId.trim().slice(0, 80)
                        : null,
                }
                : {}),
            ...(payload.zoneType !== undefined && typeof payload.zoneType === 'string' && payload.zoneType.trim()
                ? { zoneType: payload.zoneType.trim().slice(0, 40) }
                : {}),
            ...(typeof payload.x === 'number' && Number.isFinite(payload.x) ? { x: payload.x } : {}),
            ...(typeof payload.y === 'number' && Number.isFinite(payload.y) ? { y: payload.y } : {}),
            ...(typeof payload.w === 'number' && Number.isFinite(payload.w) && payload.w > 0
                ? { w: Math.min(240, payload.w) }
                : {}),
            ...(typeof payload.h === 'number' && Number.isFinite(payload.h) && payload.h > 0
                ? { h: Math.min(165, payload.h) }
                : {}),
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
            ...(payload.rotation !== undefined
                ? {
                    rotation: ((Math.round(Number(payload.rotation) / 90) * 90) % 360 + 360) % 360,
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
function slugifyZoneKey(raw) {
    const s = raw
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9а-яё_+-]+/gi, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
        .slice(0, 48);
    return s || `zone_${Date.now().toString(36)}`;
}
/** Создать топ-район / тоннель (parentZoneKey = null). Имя обязательно. */
export async function createMapTopZone(prisma, payload) {
    const name = payload.name.trim().slice(0, 120);
    if (!name)
        return { error: 'NAME_REQUIRED' };
    const zoneType = (payload.zoneType?.trim() || 'mid').slice(0, 40);
    let zoneKey = slugifyZoneKey(payload.slug?.trim() || name);
    if (zoneKey.startsWith('__'))
        zoneKey = `z_${zoneKey}`;
    const exists = await prisma.nriMapZone.findUnique({ where: { zoneKey } });
    if (exists) {
        zoneKey = `${zoneKey}_${Date.now().toString(36).slice(-4)}`;
    }
    const w = typeof payload.w === 'number' && payload.w > 0 ? Math.min(80, payload.w) : 22;
    const h = typeof payload.h === 'number' && payload.h > 0 ? Math.min(80, payload.h) : 22;
    const x = typeof payload.x === 'number' && Number.isFinite(payload.x)
        ? Math.max(0, Math.min(240 - w, payload.x))
        : 100;
    const y = typeof payload.y === 'number' && Number.isFinite(payload.y)
        ? Math.max(0, Math.min(165 - h, payload.y))
        : 60;
    const color = normalizeZoneColor(payload.color);
    const maxSort = await prisma.nriMapZone.aggregate({
        where: { parentZoneKey: null, NOT: { zoneKey: '__layout__' } },
        _max: { sortOrder: true },
    });
    const row = await prisma.nriMapZone.create({
        data: {
            zoneKey,
            sortOrder: (maxSort._max.sortOrder ?? 0) + 10,
            name,
            zoneType,
            x,
            y,
            w,
            h,
            corpName: null,
            megaDistrict: typeof payload.megaDistrict === 'string' && payload.megaDistrict.trim()
                ? payload.megaDistrict.trim().slice(0, 80)
                : defaultMegaLabel(zoneKey),
            color: color === undefined ? null : color,
            iconId: defaultZoneIconId(zoneType, zoneKey),
            artId: typeof payload.artId === 'string' && payload.artId.trim()
                ? payload.artId.trim().slice(0, 80)
                : null,
            parentZoneKey: null,
            locked: false,
            pois: [],
        },
    });
    return { zone: serializeMapZone(row) };
}
/** Удалить зону. Топ — только с confirmName === name; сабзоны — как раньше. */
export async function deleteMapZone(prisma, zoneKey, opts) {
    const existing = await prisma.nriMapZone.findUnique({ where: { zoneKey } });
    if (!existing)
        return { error: 'NOT_FOUND' };
    if (existing.zoneKey === '__layout__')
        return { error: 'FORBIDDEN' };
    if (!existing.parentZoneKey) {
        const confirm = (opts?.confirmName ?? '').trim();
        if (!confirm || confirm !== existing.name) {
            return { error: 'CONFIRM_NAME' };
        }
        await prisma.nriMapZone.deleteMany({ where: { parentZoneKey: zoneKey } });
        const positions = await prisma.nriPlayerPosition.count({ where: { zoneKey } });
        if (positions > 0) {
            const fallback = await prisma.nriMapZone.findFirst({
                where: { parentZoneKey: null, NOT: { zoneKey: { in: [zoneKey, '__layout__'] } } },
                orderBy: { sortOrder: 'asc' },
            });
            if (fallback) {
                await prisma.nriPlayerPosition.updateMany({
                    where: { zoneKey },
                    data: { zoneKey: fallback.zoneKey },
                });
            }
            else {
                await prisma.nriPlayerPosition.deleteMany({ where: { zoneKey } });
            }
        }
        await prisma.nriMapZone.delete({ where: { zoneKey } });
        return { ok: true, reset: false };
    }
    return deleteMapSubZone(prisma, zoneKey);
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
/** Очистить клетки квартала до generic (дороги/exit не трогаем). */
export async function clearDistrictTiles(prisma, parentZoneKey) {
    const parent = await prisma.nriMapZone.findUnique({ where: { zoneKey: parentZoneKey } });
    if (!parent || parent.parentZoneKey)
        return { error: 'NOT_PARENT' };
    const keep = new Set(['road', 'crossing', 'bridge', 'exit', 'metro']);
    const children = await prisma.nriMapZone.findMany({ where: { parentZoneKey } });
    let n = 0;
    for (const c of children) {
        const pt = normalizePlaceType(c.placeType);
        if (keep.has(pt))
            continue;
        await prisma.nriMapZone.update({
            where: { zoneKey: c.zoneKey },
            data: {
                placeType: 'generic',
                name: c.gridRow != null && c.gridCol != null
                    ? `Клетка ${c.gridRow + 1}.${c.gridCol + 1}`
                    : c.name,
                rotation: 0,
                pois: [],
            },
        });
        n++;
    }
    return { ok: true, count: n };
}
export { megaKeyFromZoneKey, rootMapZoneKey };
//# sourceMappingURL=nriMapZones.js.map