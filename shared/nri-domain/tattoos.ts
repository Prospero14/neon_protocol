/** Татуировки на листе: описания, выбор при голо-импланте, генерация для НПС. */

export const HOLO_TATTOO_PART_ID = 'cosm_holo_tattoo';

export type TattooKind =
  | 'gang'
  | 'corp'
  | 'clan'
  | 'cult'
  | 'nomads'
  | 'military'
  | 'ethnic'
  | 'street'
  | 'custom';

export type TattooSource = 'ink' | 'holo_implant';

export type SheetTattoo = {
  id: string;
  kind: TattooKind;
  label: string;
  description: string;
  placement: string;
  source: TattooSource;
  factionId?: string;
  locked?: boolean;
};

export type FactionRef = {
  id: string;
  kind: string;
  name: string;
  displayName?: string;
};

export type TattooPickOption = {
  id: string;
  kind: TattooKind;
  label: string;
  blurb: string;
  factionId?: string;
};

export type TattooGenParams = {
  originId?: string;
  activityId?: string;
  archetypeId?: string;
  factionId?: string;
};

const PLACEMENTS = [
  'на предплечье',
  'на плече',
  'на шее',
  'на затылке',
  'на груди',
  'на спине',
  'на кисти',
  'на лопатке',
  'на бедре',
  'на виске',
];

const ETHNIC_BY_ORIGIN: Record<string, string[]> = {
  neo_tokyo: ['японский орнамент волны', 'иероглиф «путь»', 'силуэт сакуры', 'кои под неоном'],
  night_city: ['Night City skyline', 'силуэт Afterlife', 'номер района', 'логотип уличного дока'],
  europe: ['готический крест', 'европейский герб', 'координаты порта', 'стилизованная роза'],
  nomad_trail: ['шрам-маршрут', 'символ каравана', 'знак племени', 'компас кочевника'],
  soviet_block: ['красная звезда', 'герб завода', 'номер бригады', 'серп под сеткой'],
  corporate_arcology: ['логотип корп-академии', 'штрих-код ID', 'схема этажа', 'печать отдела'],
};

const MILITARY_MARKS = [
  'шеврон частной армии',
  'номер подразделения',
  'силуэт дрона',
  'дата контракта',
  'знак снайпера',
];

const STREET_MARKS = [
  'уличный тег',
  'номер сделки',
  'символ чипа',
  'координаты точки',
];

function pick<T>(arr: T[], seed = Math.random()): T {
  return arr[Math.floor(seed * arr.length)]!;
}

function factionLabel(f: FactionRef): string {
  return (f.displayName?.trim() || f.name).trim() || 'Без названия';
}

function factionsByKind(factions: FactionRef[], kinds: string[]): FactionRef[] {
  const set = new Set(kinds);
  return factions.filter((f) => set.has(f.kind));
}

export function parseSheetTattoos(raw: unknown): SheetTattoo[] {
  if (!Array.isArray(raw)) return [];
  const out: SheetTattoo[] = [];
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue;
    const o = row as Record<string, unknown>;
    if (typeof o.id !== 'string' || typeof o.kind !== 'string' || typeof o.label !== 'string') continue;
    if (typeof o.description !== 'string' || typeof o.placement !== 'string') continue;
    const source = o.source === 'holo_implant' ? 'holo_implant' : 'ink';
    out.push({
      id: o.id,
      kind: o.kind as TattooKind,
      label: o.label,
      description: o.description,
      placement: o.placement,
      source,
      factionId: typeof o.factionId === 'string' ? o.factionId : undefined,
      locked: o.locked === true,
    });
  }
  return out;
}

export function cyberBlueprintHasHoloTattoo(blueprint: unknown): boolean {
  if (!blueprint || typeof blueprint !== 'object') return false;
  const partIds = (blueprint as { partIds?: unknown }).partIds;
  return Array.isArray(partIds) && partIds.includes(HOLO_TATTOO_PART_ID);
}

export function inventoryItemHasHoloTattoo(item: { cyber?: { blueprint?: unknown } } | null | undefined): boolean {
  return cyberBlueprintHasHoloTattoo(item?.cyber?.blueprint);
}

export function sheetHasHoloTattooAug(sheet: { augmentations?: { cyber?: { blueprint?: unknown } }[] } | null): boolean {
  return (sheet?.augmentations ?? []).some((a) => cyberBlueprintHasHoloTattoo(a.cyber?.blueprint));
}

export function holoTattooAlreadyChosen(sheet: { holoTattooChosen?: boolean; tattoos?: unknown } | null): boolean {
  if (sheet?.holoTattooChosen === true) return true;
  return parseSheetTattoos(sheet?.tattoos).some((t) => t.source === 'holo_implant' && t.locked);
}

export function markPendingHoloTattooAfterInstall<T extends Record<string, unknown>>(
  sheet: T,
  installedItem: { cyber?: { blueprint?: unknown } } | null
): T & { pendingHoloTattoo?: boolean } {
  if (!inventoryItemHasHoloTattoo(installedItem)) return sheet;
  if (holoTattooAlreadyChosen(sheet)) {
    const next = { ...sheet };
    delete (next as { pendingHoloTattoo?: boolean }).pendingHoloTattoo;
    return next;
  }
  return { ...sheet, pendingHoloTattoo: true };
}

export function describeOrgTattoo(f: FactionRef, kind: TattooKind): { label: string; description: string } {
  const name = factionLabel(f);
  const marks: Record<TattooKind, string> = {
    gang: `ганг-тег «${name}»`,
    corp: `корп-логотип «${name}»`,
    clan: `клановый знак «${name}»`,
    cult: `символ культа «${name}»`,
    nomads: `знак каравана «${name}»`,
    military: `шеврон «${name}»`,
    ethnic: `орнамент «${name}»`,
    street: `уличная метка «${name}»`,
    custom: `символ «${name}»`,
  };
  const label = marks[kind] ?? marks.custom;
  const description =
    kind === 'gang'
      ? `Узнаваемый тег банды ${name} — на улице читается с первого взгляда.`
      : kind === 'corp'
        ? `Корпоративная маркировка ${name}: статус, долг или контракт.`
        : kind === 'military'
          ? `Военный шеврон ${name} — служба, подразделение или ветеранский знак.`
          : `Метка организации «${name}» — видна при близком осмотре.`;
  return { label, description };
}

export function describeEthnicTattoo(originId?: string): { label: string; description: string } {
  const pool = ETHNIC_BY_ORIGIN[originId ?? ''] ?? ['этнический орнамент', 'семейный символ', 'племенная линия'];
  const mark = pick(pool);
  return {
    label: mark,
    description: `Традиционная или культурная татуировка: ${mark}. Часто связана с происхождением и семьёй.`,
  };
}

export function describeMilitaryTattoo(): { label: string; description: string } {
  const mark = pick(MILITARY_MARKS);
  return {
    label: mark,
    description: `Военная или полувоенная татуировка: ${mark}. Выдаёт службу или контрактника.`,
  };
}

export function describeStreetTattoo(): { label: string; description: string } {
  const mark = pick(STREET_MARKS);
  return {
    label: mark,
    description: `Уличная татуировка: ${mark}. Без явной привязки к организации.`,
  };
}

function kindForFaction(f: FactionRef): TattooKind {
  const map: Record<string, TattooKind> = {
    gang: 'gang',
    corp: 'corp',
    clan: 'clan',
    cult: 'cult',
    nomads: 'nomads',
    gov: 'military',
    faction: 'street',
  };
  return map[f.kind] ?? 'street';
}

export function buildHoloTattooOptions(
  params: TattooGenParams,
  factions: FactionRef[]
): TattooPickOption[] {
  const options: TattooPickOption[] = [];
  const orgKinds: { kinds: string[]; tattooKind: TattooKind }[] = [
    { kinds: ['gang'], tattooKind: 'gang' },
    { kinds: ['corp'], tattooKind: 'corp' },
    { kinds: ['clan'], tattooKind: 'clan' },
    { kinds: ['cult'], tattooKind: 'cult' },
    { kinds: ['nomads'], tattooKind: 'nomads' },
    { kinds: ['gov'], tattooKind: 'military' },
    { kinds: ['faction'], tattooKind: 'street' },
  ];

  for (const row of orgKinds) {
    for (const f of factionsByKind(factions, row.kinds)) {
      const { label, description } = describeOrgTattoo(f, row.tattooKind);
      options.push({
        id: `org:${f.id}`,
        kind: row.tattooKind,
        label,
        blurb: description,
        factionId: f.id,
      });
    }
  }

  const ethnic = describeEthnicTattoo(params.originId);
  options.push({
    id: 'generic:ethnic',
    kind: 'ethnic',
    label: ethnic.label,
    blurb: ethnic.description,
  });

  const military = describeMilitaryTattoo();
  options.push({
    id: 'generic:military',
    kind: 'military',
    label: military.label,
    blurb: military.description,
  });

  const street = describeStreetTattoo();
  options.push({
    id: 'generic:street',
    kind: 'street',
    label: street.label,
    blurb: street.description,
  });

  return options;
}

export function createTattooFromOption(
  option: TattooPickOption,
  factions: FactionRef[],
  source: TattooSource = 'holo_implant'
): SheetTattoo {
  const placement = pick(PLACEMENTS);
  if (option.factionId) {
    const f = factions.find((x) => x.id === option.factionId);
    if (f) {
      const { label, description } = describeOrgTattoo(f, option.kind);
      return {
        id: `tattoo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        kind: option.kind,
        label,
        description,
        placement,
        source,
        factionId: f.id,
        locked: source === 'holo_implant',
      };
    }
  }
  return {
    id: `tattoo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    kind: option.kind,
    label: option.label,
    description: option.blurb,
    placement,
    source,
    locked: source === 'holo_implant',
  };
}

export function applyHoloTattooPick(
  sheet: Record<string, unknown>,
  optionId: string,
  factions: FactionRef[],
  options?: TattooPickOption[]
): { ok: true; sheet: Record<string, unknown> } | { ok: false; reason: string } {
  if (!sheet.pendingHoloTattoo) {
    return { ok: false, reason: 'Нет ожидающего выбора голо-тату.' };
  }
  if (holoTattooAlreadyChosen(sheet)) {
    return { ok: false, reason: 'Голо-тату уже выбрана — повторный выбор недоступен.' };
  }
  const list = options ?? buildHoloTattooOptions(
    { originId: typeof sheet.originId === 'string' ? sheet.originId : undefined },
    factions
  );
  const option = list.find((o) => o.id === optionId);
  if (!option) return { ok: false, reason: 'Неизвестный вариант татуировки.' };

  const tattoo = createTattooFromOption(option, factions, 'holo_implant');
  const prev = parseSheetTattoos(sheet.tattoos);
  return {
    ok: true,
    sheet: {
      ...sheet,
      tattoos: [...prev, tattoo],
      pendingHoloTattoo: false,
      holoTattooChosen: true,
    },
  };
}

function archetypeTattooBias(archetypeId?: string): TattooKind[] {
  const map: Record<string, TattooKind[]> = {
    gang: ['gang', 'street'],
    corp: ['corp', 'street'],
    military: ['military', 'corp'],
    nomad: ['nomads', 'ethnic'],
    cult: ['cult', 'street'],
    fixer: ['street', 'corp'],
    civilian: ['ethnic', 'street'],
    robot: ['street', 'corp'],
  };
  return map[archetypeId ?? ''] ?? ['street', 'ethnic'];
}

export function rollNpcTattoos(
  params: TattooGenParams & { augmentations?: { cyber?: { blueprint?: unknown } }[] },
  factions: FactionRef[],
  chance = 0.55,
  seed = Math.random()
): SheetTattoo[] {
  const hasHolo = sheetHasHoloTattooAug({ augmentations: params.augmentations });
  const hasInk = seed < chance || hasHolo;
  if (!hasInk && !hasHolo) return [];

  const tattoos: SheetTattoo[] = [];
  const bias = archetypeTattooBias(params.archetypeId);

  if (params.factionId) {
    const f = factions.find((x) => x.id === params.factionId);
    if (f) {
      const kind = kindForFaction(f);
      const { label, description } = describeOrgTattoo(f, kind);
      tattoos.push({
        id: `tattoo_npc_${Date.now()}_org`,
        kind,
        label,
        description,
        placement: pick(PLACEMENTS, seed),
        source: 'ink',
        factionId: f.id,
      });
      return tattoos;
    }
  }

  const orgPool = factions.filter((f) => bias.includes(kindForFaction(f)));
  if (orgPool.length > 0 && seed < 0.7) {
    const f = pick(orgPool, seed * 0.9);
    const kind = kindForFaction(f);
    const { label, description } = describeOrgTattoo(f, kind);
    tattoos.push({
      id: `tattoo_npc_${Date.now()}_org`,
      kind,
      label,
      description,
      placement: pick(PLACEMENTS, seed),
      source: 'ink',
      factionId: f.id,
    });
    return tattoos;
  }

  const kind = pick(bias, seed);
  let label: string;
  let description: string;
  if (kind === 'ethnic') {
    ({ label, description } = describeEthnicTattoo(params.originId));
  } else if (kind === 'military') {
    ({ label, description } = describeMilitaryTattoo());
  } else {
    ({ label, description } = describeStreetTattoo());
  }
  tattoos.push({
    id: `tattoo_npc_${Date.now()}_ink`,
    kind,
    label,
    description,
    placement: pick(PLACEMENTS, seed),
    source: 'ink',
  });

  if (hasHolo && !tattoos.some((t) => t.source === 'holo_implant')) {
    const holoOpts = buildHoloTattooOptions(params, factions);
    const holoPick = holoOpts[0];
    if (holoPick) tattoos.push(createTattooFromOption(holoPick, factions, 'holo_implant'));
  }

  return tattoos;
}

export function formatTattoosLine(tattoos: SheetTattoo[]): string {
  if (!tattoos.length) return '';
  return tattoos.map((t) => `${t.label} (${t.placement}) — ${t.description}`).join('\n');
}
