/** Инвентарь персонажа НРИ (предметы влияют на лист — синхронизация через statMods / c2185Mods). */

export type NriItemStatMods = Partial<{
  body: number;
  reflex: number;
  intelligence: number;
  tech: number;
  cool: number;
  hp: number;
  armor: number;
}>;

export type NriC2185Mods = Partial<Record<'STR' | 'DEX' | 'CON' | 'INT' | 'TEC' | 'PEO', number>>;

export type NriInventoryItem = {
  id: string;
  catalogId?: string;
  name: string;
  blurb?: string;
  kind?: 'gear' | 'cyberware';
  slot?: 'weapon' | 'armor' | 'accessory' | 'quick';
  equipped?: boolean;
  acBonus?: number;
  attack?: { damageDice: string; damageType: string; ability: 'STR' | 'DEX' };
  statMods?: NriItemStatMods;
  c2185Mods?: NriC2185Mods;
  cyber?: {
    slot: string;
    blueprint?: unknown;
    bloodTox?: number;
    powerDrawW?: number;
    powerWh?: number;
    cpuMhz?: number;
    ramGb?: number;
    features?: string[];
    effects?: string[];
  };
  priceWonlongs?: number;
  qty?: number;
};

export function parseNriInventory(raw: unknown): NriInventoryItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (x): x is NriInventoryItem =>
      !!x &&
      typeof x === 'object' &&
      typeof (x as NriInventoryItem).id === 'string' &&
      typeof (x as NriInventoryItem).name === 'string'
  );
}

export function applyStatMods(
  base: NriItemStatMods & { special?: string },
  items: NriInventoryItem[]
): NriItemStatMods {
  const out: NriItemStatMods = { ...base };
  for (const item of items) {
    const m = item.statMods;
    if (!m) continue;
    for (const key of ['body', 'reflex', 'intelligence', 'tech', 'cool', 'hp', 'armor'] as const) {
      if (typeof m[key] === 'number') {
        out[key] = (out[key] ?? 0) + m[key]!;
      }
    }
  }
  return out;
}
