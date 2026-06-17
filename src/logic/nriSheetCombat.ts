/** Производные боевые поля листа Carbon 2185: saves, skills, attacks. */

import type { NriClassId } from './nriClasses';
import { C2185_SAVING_THROWS, C2185_SKILLS, getC2185ClassTemplate } from './nriCarbon2185';
import { CYBER_PARTS } from './nriCyberware';
import type { InstalledAugmentation } from './nriCyberInstall';
import { abilityModifier, type NriSheetData } from './nriNpcGenerator';

export type C2185SheetAttack = {
  name: string;
  atkBonus: number;
  damage: string;
};

export type SheetCombatView = {
  saves: Array<{ id: string; label: string; ability: string; modifier: number; proficient: boolean }>;
  skills: Array<{ name: string; ability: string; modifier: number; proficient: boolean }>;
  attacks: Array<{ name: string; atk: string; damage: string }>;
};

type AbilityKey = keyof NriSheetData['abilities'];

const CLASS_SKILL_DEFAULTS: Record<NriClassId, string[]> = {
  daimyo: ['Athletics', 'Intimidation'],
  doc: ['Medicine', 'Perception'],
  merc: ['Athletics', 'Perception'],
  hacker: ['Hacking', 'Investigation'],
  detective: ['Investigation', 'Streetwise'],
  fixer: ['Stealth', 'Streetwise'],
};

type WeaponDef = {
  name: string;
  ability: AbilityKey;
  damageDice: string;
  damageType: string;
  melee: boolean;
};

const CLASS_WEAPONS: Record<NriClassId, WeaponDef[]> = {
  daimyo: [{ name: 'Katana', ability: 'STR', damageDice: '1d8', damageType: 'slashing', melee: true }],
  doc: [{ name: 'Shock baton', ability: 'STR', damageDice: '1d4', damageType: 'blunt', melee: true }],
  merc: [{ name: 'SMG', ability: 'DEX', damageDice: '2d6', damageType: 'ballistic', melee: false }],
  hacker: [{ name: 'Mono-knife', ability: 'DEX', damageDice: '1d4', damageType: 'piercing', melee: true }],
  detective: [{ name: 'Pistol', ability: 'DEX', damageDice: '2d4', damageType: 'ballistic', melee: false }],
  fixer: [{ name: 'Mono-knife', ability: 'DEX', damageDice: '1d4', damageType: 'piercing', melee: true }],
};

export function formatSignedMod(n: number): string {
  if (n === 0) return '+0';
  return n > 0 ? `+${n}` : String(n);
}

function abilityKey(raw: string): AbilityKey | null {
  const keys: AbilityKey[] = ['STR', 'DEX', 'CON', 'INT', 'TEC', 'PEO'];
  return keys.includes(raw as AbilityKey) ? (raw as AbilityKey) : null;
}

function buildWeaponAttack(sheet: NriSheetData, weapon: WeaponDef): C2185SheetAttack {
  const abMod = abilityModifier(sheet.abilities[weapon.ability]);
  const atkBonus = sheet.proficiencyBonus + abMod;
  const damage = weapon.melee
    ? `${weapon.damageDice}${formatSignedMod(abMod)} ${weapon.damageType}`
    : `${weapon.damageDice} ${weapon.damageType}`;
  return { name: weapon.name, atkBonus, damage };
}

function parseCyberWeaponFeature(features: string[] | undefined): { dice: string; type: string; melee: boolean } | null {
  if (!features?.length) return null;
  for (const f of features) {
    const m = f.match(/(\d+d\d+)\s*(рубящ|колющ|дробящ|баллист|pierc|slash|blunt|ballistic)/i);
    if (m) {
      const dice = m[1]!;
      const raw = m[2]!.toLowerCase();
      const type =
        raw.includes('руб') || raw.includes('slash')
          ? 'slashing'
          : raw.includes('кол') || raw.includes('pierc')
            ? 'piercing'
            : raw.includes('дроб') || raw.includes('blunt')
              ? 'blunt'
              : 'ballistic';
      const melee = /ближн|melee/i.test(f);
      return { dice, type, melee };
    }
  }
  return null;
}

function attacksFromAugmentations(sheet: NriSheetData, augmentations: InstalledAugmentation[]): C2185SheetAttack[] {
  const out: C2185SheetAttack[] = [];
  for (const aug of augmentations) {
    const part = CYBER_PARTS.find((p) => p.id === aug.itemId);
    if (!part || part.kind !== 'weapon') continue;
    const parsed = parseCyberWeaponFeature(part.features);
    if (!parsed) continue;
    const ability: AbilityKey = parsed.melee ? 'STR' : 'DEX';
    const abMod = abilityModifier(sheet.abilities[ability]);
    out.push({
      name: aug.name,
      atkBonus: sheet.proficiencyBonus + abMod,
      damage: parsed.melee
        ? `${parsed.dice}${formatSignedMod(abMod)} ${parsed.type}`
        : `${parsed.dice} ${parsed.type}`,
    });
  }
  return out;
}

export function buildClassAttacks(sheet: NriSheetData, classId: NriClassId): C2185SheetAttack[] {
  return (CLASS_WEAPONS[classId] ?? []).map((w) => buildWeaponAttack(sheet, w));
}

export function enrichSheetCombat(sheet: NriSheetData, classId: NriClassId): NriSheetData {
  const tpl = getC2185ClassTemplate(classId);
  const classFeatures =
    sheet.classFeatures?.length ? sheet.classFeatures : tpl ? [tpl.signature, ...tpl.traits] : [];
  return {
    ...sheet,
    classFeatures,
    skillProficiencies: Array.isArray(sheet.skillProficiencies)
      ? sheet.skillProficiencies
      : [...CLASS_SKILL_DEFAULTS[classId]],
    attacks: sheet.attacks ?? buildClassAttacks(sheet, classId),
  };
}

export function getSheetCombatView(
  sheet: NriSheetData,
  classId: NriClassId,
  augmentations: InstalledAugmentation[] = []
): SheetCombatView {
  const enriched = enrichSheetCombat(sheet, classId);
  const tpl = getC2185ClassTemplate(classId);
  const proficiencies = new Set(Array.isArray(enriched.skillProficiencies) ? enriched.skillProficiencies : []);
  const saveProfs = new Set(Array.isArray(tpl?.saveProficiencies) ? tpl.saveProficiencies : []);

  const saves = C2185_SAVING_THROWS.map((s) => {
    const ab = abilityKey(s.ability);
    const abMod = ab ? abilityModifier(enriched.abilities[ab]) : 0;
    const proficient = saveProfs.has(s.label);
    const modifier = abMod + (proficient ? enriched.proficiencyBonus : 0);
    return { ...s, modifier, proficient };
  });

  const skills = C2185_SKILLS.map((sk) => {
    const ab = abilityKey(sk.ability);
    const abMod = ab ? abilityModifier(enriched.abilities[ab]) : 0;
    const proficient = proficiencies.has(sk.name);
    const modifier = abMod + (proficient ? enriched.proficiencyBonus : 0);
    return { name: sk.name, ability: sk.ability, modifier, proficient };
  });

  const baseAttacks = enriched.attacks ?? buildClassAttacks(enriched, classId);
  const cyberAttacks = attacksFromAugmentations(enriched, augmentations);
  const attacks = [...baseAttacks, ...cyberAttacks].map((a) => ({
    name: a.name,
    atk: formatSignedMod(a.atkBonus),
    damage: a.damage,
  }));

  return { saves, skills, attacks };
}
