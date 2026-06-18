import { defaultZoneIconId, normalizeZoneIconId } from '../../shared/nri-domain/zoneIcons.js';
import { ensureNriMapSchema, loadZoneSeedFile } from './nriSchemaBootstrap.js';
export const MAP_LAYOUT_VERSION = 'v4-canon-ru';
function megaKeyFromZoneKey(zoneKey) {
    if (zoneKey.startsWith('corp_'))
        return 'city_center';
    const m = zoneKey.match(/^(watson|westbrook|city_center|heywood|santo_domingo|pacifica)_/);
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
export function serializeMapZone(z) {
    const pois = Array.isArray(z.pois) ? z.pois : [];
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
        locked: s.locked ?? false,
        pois: s.pois ?? [],
    };
}
export async function ensureMapZonesSeeded(prisma) {
    await ensureNriMapSchema(prisma);
    const layoutRow = await prisma.nriMapZone.findUnique({ where: { zoneKey: '__layout__' } });
    const seeds = loadZoneSeedFile();
    const needsReseed = !layoutRow || layoutRow.name !== MAP_LAYOUT_VERSION;
    if (needsReseed) {
        await prisma.nriMapZone.deleteMany({});
        await prisma.nriMapZone.createMany({
            data: [
                ...seeds.map(seedRow),
                {
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
                    locked: true,
                    pois: [],
                },
            ],
        });
        return;
    }
    const existingKeys = new Set((await prisma.nriMapZone.findMany({ select: { zoneKey: true } })).map((z) => z.zoneKey));
    const missing = seeds.filter((s) => !existingKeys.has(s.zoneKey));
    if (missing.length > 0) {
        await prisma.nriMapZone.createMany({ data: missing.map(seedRow) });
    }
    const count = await prisma.nriMapZone.count({ where: { zoneKey: { not: '__layout__' } } });
    if (count === 0) {
        await prisma.nriMapZone.createMany({ data: seeds.map(seedRow) });
    }
}
export async function listMapZones(prisma) {
    await ensureNriMapSchema(prisma);
    await ensureMapZonesSeeded(prisma);
    const rows = await prisma.nriMapZone.findMany({
        where: { zoneKey: { not: '__layout__' } },
        orderBy: { sortOrder: 'asc' },
    });
    return rows.map(serializeMapZone);
}
export async function patchMapZone(prisma, zoneKey, payload) {
    const existing = await prisma.nriMapZone.findUnique({ where: { zoneKey } });
    if (!existing)
        return null;
    const color = normalizeZoneColor(payload.color);
    const iconId = payload.iconId !== undefined
        ? normalizeZoneIconId(payload.iconId, existing.zoneType, zoneKey)
        : undefined;
    if (typeof payload.megaDistrict === 'string' && payload.megaDistrict.trim()) {
        const label = payload.megaDistrict.trim().slice(0, 80);
        const mk = megaKeyFromZoneKey(zoneKey);
        if (mk) {
            const all = await prisma.nriMapZone.findMany({
                where: { NOT: { zoneKey: { startsWith: '__' } } },
            });
            const keys = all.filter((z) => megaKeyFromZoneKey(z.zoneKey) === mk).map((z) => z.zoneKey);
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
        },
    });
    return serializeMapZone(zone);
}
//# sourceMappingURL=nriMapZones.js.map