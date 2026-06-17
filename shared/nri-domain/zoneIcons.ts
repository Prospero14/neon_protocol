/** Пресеты иконок районов карты (полупрозрачный оверлей на SVG). */

function svgDataUrl(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const STROKE = '#e8f4ff';

function iconSvg(paths: string, viewBox = '0 0 24 24'): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill="none" stroke="${STROKE}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
}

export const NRI_ZONE_ICON_PRESETS = [
  {
    id: 'highway',
    label: 'Магистраль',
    dataUrl: svgDataUrl(iconSvg('<path d="M4 18h16M6 14l3-8h6l3 8M9 10h6"/>')),
  },
  {
    id: 'overpass',
    label: 'Эстакада',
    dataUrl: svgDataUrl(iconSvg('<path d="M3 16h18M6 16V9M18 16V9M6 9h12"/><path d="M8 6h8"/>')),
  },
  {
    id: 'industrial',
    label: 'Промзона',
    dataUrl: svgDataUrl(iconSvg('<path d="M4 20V10l4-3v13M10 20V6l4 3v11M16 20V8l4 2v10"/><path d="M3 20h18"/>')),
  },
  {
    id: 'slum',
    label: 'Трущобы',
    dataUrl: svgDataUrl(iconSvg('<path d="M4 20V12l4-2v10M10 20V8l4 2v10M16 20V10l4 2v8"/><path d="M3 20h18"/>')),
  },
  {
    id: 'mid',
    label: 'Жилой квартал',
    dataUrl: svgDataUrl(iconSvg('<rect x="5" y="8" width="5" height="12" rx="0.5"/><rect x="14" y="5" width="5" height="15" rx="0.5"/><path d="M3 20h18"/>')),
  },
  {
    id: 'park',
    label: 'Парк',
    dataUrl: svgDataUrl(iconSvg('<circle cx="12" cy="10" r="4"/><path d="M12 14v6M8 20h8"/><path d="M6 12c-2-1-2-4 0-5M18 12c2-1 2-4 0-5"/>')),
  },
  {
    id: 'corp',
    label: 'Корпорация',
    dataUrl: svgDataUrl(iconSvg('<path d="M6 20V6l6-3 6 3v14"/><path d="M9 10h2v2H9zM13 10h2v2h-2zM9 14h2v2H9zM13 14h2v2h-2zM12 20v-4"/>')),
  },
  {
    id: 'tunnel',
    label: 'Тоннель',
    dataUrl: svgDataUrl(iconSvg('<path d="M4 16c0-6 16-6 16 0"/><path d="M6 16v2M18 16v2"/><ellipse cx="12" cy="16" rx="8" ry="3"/>')),
  },
] as const;

export type NriZoneIconPresetId = (typeof NRI_ZONE_ICON_PRESETS)[number]['id'];

const PRESET_BY_ID = new Map(NRI_ZONE_ICON_PRESETS.map((p) => [p.id, p]));

export function defaultZoneIconId(zoneType: string, zoneKey: string): NriZoneIconPresetId {
  if (zoneKey.startsWith('corp_') || zoneType === 'corp') return 'corp';
  if (zoneType === 'highway' || zoneType === 'overpass') return zoneType as NriZoneIconPresetId;
  if (zoneType === 'industrial' || zoneType === 'slum' || zoneType === 'park' || zoneType === 'tunnel') {
    return zoneType as NriZoneIconPresetId;
  }
  return 'mid';
}

/** iconId: preset id, `url:https://…`, или полный data: URL. */
export function resolveZoneIconHref(
  iconId: string | null | undefined,
  zoneType: string,
  zoneKey: string
): string | null {
  if (!iconId) {
    const preset = PRESET_BY_ID.get(defaultZoneIconId(zoneType, zoneKey));
    return preset?.dataUrl ?? null;
  }
  if (iconId.startsWith('url:')) return iconId.slice(4).trim() || null;
  if (iconId.startsWith('data:')) return iconId;
  return PRESET_BY_ID.get(iconId as NriZoneIconPresetId)?.dataUrl ?? null;
}

export function normalizeZoneIconId(raw: unknown, zoneType: string, zoneKey: string): string {
  if (typeof raw !== 'string' || !raw.trim()) return defaultZoneIconId(zoneType, zoneKey);
  const v = raw.trim();
  if (v.startsWith('url:') || v.startsWith('data:')) return v.slice(0, 500);
  if (PRESET_BY_ID.has(v as NriZoneIconPresetId)) return v;
  return defaultZoneIconId(zoneType, zoneKey);
}

/** Иконка по метке сущности (фракции, места без района). */
export function defaultEntityIconId(entityTag: string | null | undefined): NriZoneIconPresetId {
  switch (entityTag) {
    case 'corp':
      return 'corp';
    case 'gang':
    case 'dealers':
      return 'slum';
    case 'gov':
    case 'fixers':
      return 'mid';
    case 'pmc':
      return 'industrial';
    case 'netrunners':
      return 'corp';
    case 'peaceful':
      return 'park';
    case 'free':
      return 'highway';
    default:
      return 'mid';
  }
}

export function resolveEntityIconHref(
  iconId: string | null | undefined,
  entityTag: string | null | undefined
): string | null {
  if (iconId?.startsWith('url:')) return iconId.slice(4).trim() || null;
  if (iconId?.startsWith('data:')) return iconId;
  const preset = PRESET_BY_ID.get((iconId as NriZoneIconPresetId) ?? defaultEntityIconId(entityTag));
  return preset?.dataUrl ?? null;
}
