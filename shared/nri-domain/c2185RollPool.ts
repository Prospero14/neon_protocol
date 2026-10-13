/** Сбор пула броска Carbon 2185: d20 + термы (стат, prof, предметы, статусы, импланты). */

import { MAX_PSYCHOSIS_SCAR, PSYCHOSIS_SCAR_MODS } from './psychosisLogic.js';

export type AbilityKey = 'STR' | 'DEX' | 'CON' | 'INT' | 'TEC' | 'PEO';

export type RollTerm = { label: string; value: number };

export type RollKind =
  | 'ability'
  | 'skill'
  | 'save'
  | 'attack'
  | 'initiative'
  | 'death'
  | 'lockpick';

export type RollAdvantage = 'normal' | 'advantage' | 'disadvantage';

export type BuiltRollPool = {
  title: string;
  kind: RollKind;
  ability?: AbilityKey;
  terms: RollTerm[];
  advantage: RollAdvantage;
  /** Сумма термов без кости. */
  modifierTotal: number;
  /** Как сложился score характеристики (импланты / статусы). */
  scoreNotes?: string[];
};

export type ExecutedRoll = BuiltRollPool & {
  dice: number[];
  kept: number;
  total: number;
  breakdown: string;
};

export const C2185_SKILL_ABILITY: Record<string, AbilityKey> = {
  Acrobatics: 'DEX',
  Athletics: 'STR',
  Bureaucracy: 'PEO',
  Computing: 'TEC',
  Deception: 'PEO',
  Engineering: 'INT',
  Gambling: 'INT',
  Hacking: 'TEC',
  History: 'INT',
  Intimidation: 'STR',
  Investigation: 'INT',
  Mechanics: 'TEC',
  Medicine: 'TEC',
  Navigation: 'INT',
  Perception: 'INT',
  Performance: 'PEO',
  Persuasion: 'PEO',
  Presence: 'PEO',
  Religion: 'INT',
  Robotics: 'TEC',
  'Sense Motive': 'PEO',
  'Sleight of Hand': 'DEX',
  Stealth: 'DEX',
  Streetwise: 'INT',
  Tracking: 'INT',
  'Vehicles (Aircraft)': 'TEC',
  'Vehicles (Land)': 'DEX',
};

export const C2185_SAVE_ABILITY: Record<string, AbilityKey> = {
  Fortitude: 'CON',
  fort: 'CON',
  Reflex: 'DEX',
  ref: 'DEX',
  Mind: 'INT',
  mind: 'INT',
};

export function abilityModifier(score: number): number {
  if (!Number.isFinite(score)) return 0;
  return Math.floor((Number(score) - 10) / 2);
}

function sheetAbilities(sheet: unknown): Record<AbilityKey, number> {
  const raw =
    sheet && typeof sheet === 'object'
      ? (sheet as { abilities?: Partial<Record<AbilityKey, number>> }).abilities
      : undefined;
  const out: Record<AbilityKey, number> = { STR: 10, DEX: 10, CON: 10, INT: 10, TEC: 10, PEO: 10 };
  for (const k of Object.keys(out) as AbilityKey[]) {
    const v = raw?.[k];
    if (typeof v === 'number' && Number.isFinite(v)) out[k] = v;
  }
  return out;
}

function proficiencyBonus(sheet: unknown): number {
  if (!sheet || typeof sheet !== 'object') return 2;
  const p = (sheet as { proficiencyBonus?: unknown }).proficiencyBonus;
  return typeof p === 'number' && Number.isFinite(p) ? Math.max(0, Math.floor(p)) : 2;
}

function skillProfs(sheet: unknown): Set<string> {
  if (!sheet || typeof sheet !== 'object') return new Set();
  const arr = (sheet as { skillProficiencies?: unknown }).skillProficiencies;
  return new Set(Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string') : []);
}

function saveProfs(sheet: unknown): Set<string> {
  if (!sheet || typeof sheet !== 'object') return new Set();
  const arr = (sheet as { saveProficiencies?: unknown }).saveProficiencies;
  return new Set(Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string') : []);
}

function activeConditions(sheet: unknown): Array<{ id?: string; label?: string; abilityMods?: Partial<Record<AbilityKey, number>> }> {
  if (!sheet || typeof sheet !== 'object') return [];
  const arr = (sheet as { activeConditions?: unknown }).activeConditions;
  return Array.isArray(arr) ? (arr as Array<{ id?: string; label?: string; abilityMods?: Partial<Record<AbilityKey, number>> }>) : [];
}

type SheetAug = {
  name?: string;
  c2185Mods?: Partial<Record<AbilityKey, number>>;
  cyber?: { effects?: unknown };
};

function sheetAugmentations(sheet: unknown): SheetAug[] {
  if (!sheet || typeof sheet !== 'object') return [];
  const arr = (sheet as { augmentations?: unknown }).augmentations;
  return Array.isArray(arr) ? (arr.filter((x) => x && typeof x === 'object') as SheetAug[]) : [];
}

function inventoryList(inventory: unknown): Array<{
  catalogId?: string;
  name?: string;
  tags?: string[];
  equipped?: boolean;
  c2185Mods?: Partial<Record<AbilityKey, number>>;
}> {
  if (!Array.isArray(inventory)) return [];
  return inventory.filter((x) => x && typeof x === 'object') as Array<{
    catalogId?: string;
    name?: string;
    tags?: string[];
    equipped?: boolean;
    c2185Mods?: Partial<Record<AbilityKey, number>>;
  }>;
}

function hasCatalog(inv: ReturnType<typeof inventoryList>, id: string): boolean {
  return inv.some((i) => i.catalogId === id);
}

function hasTag(inv: ReturnType<typeof inventoryList>, tag: string): boolean {
  return inv.some((i) => Array.isArray(i.tags) && i.tags.includes(tag));
}

function hasAugSmartlink(augs: SheetAug[]): boolean {
  return augs.some((a) => {
    const fx = a.cyber?.effects;
    return Array.isArray(fx) && fx.includes('weapon_smartlink');
  });
}

/**
 * Score = base + conditions + psychosis scar + implants + equipped gear (c2185Mods).
 * В бросок идёт abilityModifier(score), не сырые +score как +к d20.
 */
export function resolveAbilityForRoll(
  sheet: unknown,
  ability: AbilityKey,
  inventory?: unknown,
): { score: number; mod: number; scoreNote: string | null } {
  const base = sheetAbilities(sheet)[ability];
  let score = base;
  const bits: string[] = [`${base}`];

  for (const c of activeConditions(sheet)) {
    const d = c.abilityMods?.[ability];
    if (typeof d === 'number' && d !== 0) {
      score += d;
      bits.push(`${(c.label || c.id || 'status').slice(0, 16)}${d >= 0 ? '+' : ''}${d}`);
    }
  }

  const scarRaw =
    sheet && typeof sheet === 'object' ? (sheet as { psychosisScarLevel?: unknown }).psychosisScarLevel : 0;
  const scarLevel = Math.max(
    0,
    Math.min(MAX_PSYCHOSIS_SCAR, typeof scarRaw === 'number' && Number.isFinite(scarRaw) ? Math.floor(scarRaw) : 0),
  );
  const scarDelta = PSYCHOSIS_SCAR_MODS[scarLevel]?.[ability];
  if (typeof scarDelta === 'number' && scarDelta !== 0) {
    score += scarDelta;
    bits.push(`scar${scarDelta >= 0 ? '+' : ''}${scarDelta}`);
  }

  for (const aug of sheetAugmentations(sheet)) {
    const d = aug.c2185Mods?.[ability];
    if (typeof d === 'number' && d !== 0) {
      score += d;
      const nm = (typeof aug.name === 'string' && aug.name.trim() ? aug.name.trim() : 'implant').slice(0, 18);
      bits.push(`${nm}${d >= 0 ? '+' : ''}${d}`);
    }
  }

  for (const item of inventoryList(inventory)) {
    if (!item.equipped) continue;
    const d = item.c2185Mods?.[ability];
    if (typeof d === 'number' && d !== 0) {
      score += d;
      const nm = (typeof item.name === 'string' && item.name.trim() ? item.name.trim() : 'gear').slice(0, 18);
      bits.push(`${nm}${d >= 0 ? '+' : ''}${d}`);
    }
  }

  const mod = abilityModifier(score);
  const scoreNote =
    bits.length > 1 ? `${ability} ${bits.join('+')}=${score}→mod${mod >= 0 ? '+' : ''}${mod}` : null;
  return { score, mod, scoreNote };
}

function exhaustedDisadvantage(conditions: ReturnType<typeof activeConditions>): boolean {
  return conditions.some((c) => c.id === 'exhausted_1' || c.id === 'exhausted_2' || c.id === 'frightened');
}

function pushAbilityTerm(
  terms: RollTerm[],
  notes: string[],
  sheet: unknown,
  ability: AbilityKey,
  inventory?: unknown,
): void {
  const { mod, scoreNote } = resolveAbilityForRoll(sheet, ability, inventory);
  terms.push({ label: ability, value: mod });
  if (scoreNote) notes.push(scoreNote);
}

export type BuildRollInput = {
  kind: RollKind;
  sheet: unknown;
  inventory?: unknown;
  /** Ability key for ability checks. */
  ability?: AbilityKey;
  /** Skill name for skill / lockpick. */
  skillName?: string;
  /** Save label/id. */
  saveId?: string;
  /** Attack display name + precomputed atk bonus from sheet combat (optional). */
  attackName?: string;
  attackBonus?: number;
  /** Override advantage. */
  advantage?: RollAdvantage;
};

export function buildRollPool(input: BuildRollInput): BuiltRollPool {
  const prof = proficiencyBonus(input.sheet);
  const skills = skillProfs(input.sheet);
  const saves = saveProfs(input.sheet);
  const conditions = activeConditions(input.sheet);
  const augs = sheetAugmentations(input.sheet);
  const inv = inventoryList(input.inventory);
  const terms: RollTerm[] = [];
  const scoreNotes: string[] = [];
  let advantage: RollAdvantage = input.advantage ?? 'normal';
  if (exhaustedDisadvantage(conditions) && !input.advantage) advantage = 'disadvantage';

  const finish = (partial: Omit<BuiltRollPool, 'terms' | 'advantage' | 'modifierTotal' | 'scoreNotes'>): BuiltRollPool => ({
    ...partial,
    terms,
    advantage,
    modifierTotal: terms.reduce((s, t) => s + t.value, 0),
    scoreNotes: scoreNotes.length ? scoreNotes : undefined,
  });

  if (input.kind === 'death') {
    return {
      title: 'Death save',
      kind: 'death',
      terms: [],
      advantage: 'normal',
      modifierTotal: 0,
    };
  }

  if (input.kind === 'initiative') {
    const ab: AbilityKey = 'DEX';
    pushAbilityTerm(terms, scoreNotes, input.sheet, ab, input.inventory);
    return finish({ title: 'Initiative', kind: 'initiative', ability: ab });
  }

  if (input.kind === 'ability') {
    const ab = input.ability ?? 'TEC';
    pushAbilityTerm(terms, scoreNotes, input.sheet, ab, input.inventory);
    return finish({ title: `Check ${ab}`, kind: 'ability', ability: ab });
  }

  if (input.kind === 'save') {
    const label = input.saveId ?? 'Fortitude';
    const ab = C2185_SAVE_ABILITY[label] ?? 'CON';
    pushAbilityTerm(terms, scoreNotes, input.sheet, ab, input.inventory);
    const saveLabel = label === 'fort' ? 'Fortitude' : label === 'ref' ? 'Reflex' : label === 'mind' ? 'Mind' : label;
    if (saves.has(saveLabel) || saves.has(label)) {
      terms.push({ label: 'prof', value: prof });
    }
    return finish({ title: `Save ${saveLabel}`, kind: 'save', ability: ab });
  }

  if (input.kind === 'attack') {
    const name = input.attackName?.trim() || 'Attack';
    if (typeof input.attackBonus === 'number' && Number.isFinite(input.attackBonus)) {
      terms.push({ label: 'atk', value: Math.floor(input.attackBonus) });
    } else {
      const dex = resolveAbilityForRoll(input.sheet, 'DEX', input.inventory);
      if (dex.scoreNote) scoreNotes.push(dex.scoreNote);
      terms.push({ label: 'atk', value: proficiencyBonus(input.sheet) + dex.mod });
      if (hasTag(inv, 'smartlink') || hasCatalog(inv, 'g_smartlink') || hasAugSmartlink(augs)) {
        terms.push({ label: 'smartlink', value: 1 });
      }
    }
    return finish({ title: name, kind: 'attack' });
  }

  // skill or lockpick
  const skillName =
    input.kind === 'lockpick' ? input.skillName?.trim() || 'Mechanics' : input.skillName?.trim() || 'Perception';
  const ab = C2185_SKILL_ABILITY[skillName] ?? (input.kind === 'lockpick' ? 'TEC' : 'INT');
  pushAbilityTerm(terms, scoreNotes, input.sheet, ab, input.inventory);
  if (skills.has(skillName)) terms.push({ label: 'prof', value: prof });

  if (input.kind === 'lockpick' || skillName === 'Mechanics' || skillName === 'Sleight of Hand') {
    if (hasCatalog(inv, 'g_lockpick') || hasTag(inv, 'lockpick') || hasTag(inv, 'взлом')) {
      terms.push({ label: 'lockpick', value: 2 });
    }
  }
  if (
    (skillName === 'Hacking' || skillName === 'Computing') &&
    (hasCatalog(inv, 'g_cyberdeck') ||
      hasCatalog(inv, 'g_cyberdeck_mid') ||
      hasCatalog(inv, 'g_cyberdeck_pro') ||
      hasCatalog(inv, 'g_left_deck') ||
      hasTag(inv, 'deck'))
  ) {
    terms.push({ label: 'deck', value: 1 });
  }

  return finish({
    title: input.kind === 'lockpick' ? `Lockpick (${skillName})` : skillName,
    kind: input.kind === 'lockpick' ? 'lockpick' : 'skill',
    ability: ab,
  });
}

function rollD20(rng: () => number): number {
  return 1 + Math.floor(rng() * 20);
}

export function executeRoll(pool: BuiltRollPool, rng: () => number = Math.random): ExecutedRoll {
  let dice: number[];
  let kept: number;
  if (pool.advantage === 'advantage') {
    const a = rollD20(rng);
    const b = rollD20(rng);
    dice = [a, b];
    kept = Math.max(a, b);
  } else if (pool.advantage === 'disadvantage') {
    const a = rollD20(rng);
    const b = rollD20(rng);
    dice = [a, b];
    kept = Math.min(a, b);
  } else {
    const a = rollD20(rng);
    dice = [a];
    kept = a;
  }
  const total = kept + pool.modifierTotal;
  const dicePart =
    dice.length === 1
      ? `d20(${kept})`
      : `d20(${dice.join('|')}→${kept}${pool.advantage === 'advantage' ? ' adv' : ' dis'})`;
  const termPart = pool.terms
    .map((t) => `${t.label}(${t.value >= 0 ? '+' : ''}${t.value})`)
    .join(' + ');
  const breakdown = termPart ? `${dicePart} + ${termPart} = ${total}` : `${dicePart} = ${total}`;
  return { ...pool, dice, kept, total, breakdown };
}

export function formatRollChatText(roll: ExecutedRoll, opts?: { secret?: boolean; who?: string }): string {
  const who = opts?.who?.trim() || 'Runner';
  const secret = opts?.secret ? ' · secret' : '';
  const notes =
    Array.isArray(roll.scoreNotes) && roll.scoreNotes.length ? `\n(${roll.scoreNotes.join('; ')})` : '';
  return `🎲 ${who}: ${roll.title} → ${roll.total}${secret}\n${roll.breakdown}${notes}`;
}
