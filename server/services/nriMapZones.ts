import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import type { PrismaClient } from '@prisma/client';

export const MAP_LAYOUT_VERSION = 'v4-canon-ru';

function megaKeyFromZoneKey(zoneKey: string): string | null {
  if (zoneKey.startsWith('corp_')) return 'city_center';
  const m = zoneKey.match(/^(watson|westbrook|city_center|heywood|santo_domingo|pacifica)_/);
  return m?.[1] ?? null;
}

function defaultMegaLabel(zoneKey: string): string | null {
  const mk = megaKeyFromZoneKey(zoneKey);
  if (!mk) return null;
  const labels: Record<string, string> = {
    watson: 'ВАТСОН',
    westbrook: 'ВЕСТБРУК',
    city_center: 'ЦЕНТР ГОРОДА',
    heywood: 'ХЕЙВУД',
    santo_domingo: 'САНТО-ДОМИНГО',
    pacifica: 'ПАСИФИКА',
  };
  return labels[mk] ?? null;
}

export type MapZoneRow = {
  zoneKey: string;
  sortOrder: number;
  name: string;
  zoneType: string;
  x: number;
  y: number;
  w: number;
  h: number;
  corpName: string | null;
  megaDistrict: string | null;
  locked: boolean;
  pois: string[] | null;
};

type ZoneSeed = {
  zoneKey: string;
  sortOrder: number;
  name: string;
  zoneType: string;
  x: number;
  y: number;
  w: number;
  h: number;
  megaDistrict?: string;
  corpName?: string;
  locked?: boolean;
  pois?: string[];
};

function loadZoneSeedFile(): ZoneSeed[] {
  const p = join(dirname(fileURLToPath(import.meta.url)), '../../shared/nri-night-city-zones.json');
  const raw = readFileSync(p, 'utf8');
  return JSON.parse(raw) as ZoneSeed[];
}

function megaDistrictFor(zoneKey: string, stored: string | null | undefined): string | null {
  if (stored?.trim()) return stored.trim();
  return defaultMegaLabel(zoneKey);
}

export function serializeMapZone(z: {
  zoneKey: string;
  sortOrder: number;
  name: string;
  zoneType: string;
  x: number;
  y: number;
  w: number;
  h: number;
  corpName: string | null;
  megaDistrict?: string | null;
  locked: boolean;
  pois: unknown;
  updatedAt?: Date;
}) {
  const pois = Array.isArray(z.pois) ? (z.pois as string[]) : [];
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
    pois,
    updatedAt: z.updatedAt?.getTime() ?? Date.now(),
  };
}

function seedRow(s: ZoneSeed) {
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
    locked: s.locked ?? false,
    pois: s.pois ?? [],
  };
}

export async function ensureMapZonesSeeded(prisma: PrismaClient): Promise<void> {
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
          locked: true,
          pois: [],
        },
      ],
    });
    return;
  }

  const count = await prisma.nriMapZone.count({ where: { zoneKey: { not: '__layout__' } } });
  if (count > 0) return;

  await prisma.nriMapZone.createMany({
    data: seeds.map(seedRow),
  });
}

export async function listMapZones(prisma: PrismaClient) {
  await ensureMapZonesSeeded(prisma);
  const rows = await prisma.nriMapZone.findMany({
    where: { zoneKey: { not: '__layout__' } },
    orderBy: { sortOrder: 'asc' },
  });
  return rows.map(serializeMapZone);
}

export async function patchMapZone(
  prisma: PrismaClient,
  zoneKey: string,
  payload: {
    name?: string;
    corpName?: string | null;
    megaDistrict?: string;
    pois?: string[];
  }
) {
  const existing = await prisma.nriMapZone.findUnique({ where: { zoneKey } });
  if (!existing) return null;

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
            corpName:
              typeof payload.corpName === 'string' && payload.corpName.trim()
                ? payload.corpName.trim().slice(0, 80)
                : null,
          }
        : {}),
      ...(payload.pois !== undefined
        ? { pois: Array.isArray(payload.pois) ? payload.pois.map((p) => String(p).slice(0, 80)) : [] }
        : {}),
    },
  });

  return serializeMapZone(zone);
}
