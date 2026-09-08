/** Производные боевые поля листа Carbon 2185: saves, skills, attacks. */

import type { NriClassId } from './nriClasses';
import { C2185_SAVING_THROWS, C2185_SKILLS, getC2185ClassTemplate } from './nriCarbon2185';
import type { CyberPartDef } from './nriCyberware';
import type { InstalledAugmentation } from './nriCyberInstall';
import type { NriInventoryItem } from './nriInventory';
import { abilityModifier, type NriSheetData } from './nriNpcGenerator';
import {
  buildCyberCombatProfile,
  effectiveAcAgainstSmartlinkAttack,
  isSmartLinkedCyberWeapon,
  smartlinkBonusAgainstTarget,
  weaponPartsFromAug,
  type CyberCombatProfile,
} from './nriCyberCombat';

export type C2185SheetAttack = {
  name: string;
  atkBonus: number;
  damage: string;
  /** Пояснение бонусов (смартлинк и т.д.). */
  note?: string;
};

export type SheetCombatView = {
  saves: Array<{ id: string; label: string; ability: string; modifier: number; proficient: boolean }>;
  skills: Array<{ name: string; ability: string; modifier: number; proficient: boolean }>;
  attacks: Array<{ name: string; atk: string; damage: string; note?: string }>;
  /** Эффективный AC vs атаки со смартлинком (база + optic_flare). */
  acVsSmartlink: number;
  combatNotes: string[];
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
    const m = f.match(
      /(\d+d\d+)\s*(рубящ|колющ|дробящ|баллист|энерг|pierc|slash|blunt|ballistic|energy|автоматич)/i
    );
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
              : raw.includes('энерг') || raw.includes('energy')
                ? 'energy'
                : 'ballistic';
      const melee = /ближн|melee|рубящ|колющ|дробящ/i.test(f) && !/баллист|энерг|авто/i.test(f);
      return { dice, type, melee };
    }
    // «1d8 + Mind save» / «1d4 + яд»
    const soft = f.match(/(\d+d\d+)\s*\+/i);
    if (soft) {
      return { dice: soft[1]!, type: 'special', melee: true };
    }
  }
  return null;
}

function attacksFromAugmentations(
  sheet: NriSheetData,
  augmentations: InstalledAugmentation[],
  attackerProfile: CyberCombatProfile,
  defenderProfile?: CyberCombatProfile | null
): C2185SheetAttack[] {
  const out: C2185SheetAttack[] = [];
  const linkBonus = smartlinkBonusAgainstTarget(attackerProfile, defenderProfile);
  const attackerHasLink = attackerProfile.smartlinkAtk > 0;

  for (const aug of augmentations) {
    const weapons = weaponPartsFromAug(aug);
    const pushAttack = (part: CyberPartDef | null, parsed: { dice: string; type: string; melee: boolean }) => {
      const ability: AbilityKey = parsed.melee ? 'STR' : 'DEX';
      const abMod = abilityModifier(sheet.abilities[ability]);
      let atkBonus = sheet.proficiencyBonus + abMod;
      let note: string | undefined;
      const smart = isSmartLinkedCyberWeapon(part, aug, attackerHasLink);
      if (smart && linkBonus > 0) {
        atkBonus += linkBonus;
        note = `смартлинк +${linkBonus}`;
      } else if (smart && attackerHasLink && linkBonus === 0 && defenderProfile) {
        note = 'смартлинк глушится целью';
      }
      out.push({
        name: aug.name,
        atkBonus,
        damage: parsed.melee
          ? `${parsed.dice}${formatSignedMod(abMod)} ${parsed.type}`
          : `${parsed.dice} ${parsed.type}`,
        note,
      });
    };

    for (const part of weapons) {
      const parsed = parseCyberWeaponFeature(part.features);
      if (!parsed) continue;
      pushAttack(part, parsed);
    }
    if (weapons.length === 0 && aug.cyber?.features) {
      const parsed = parseCyberWeaponFeature(aug.cyber.features);
      if (!parsed) continue;
      pushAttack(null, parsed);
    }
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
  augmentations: InstalledAugmentation[] = [],
  inventory: NriInventoryItem[] = [],
  /** Профиль цели (для превью «по этой броне смартлинк не работает»). */
  defenderProfile?: CyberCombatProfile | null
): SheetCombatView {
  const enriched = enrichSheetCombat(sheet, classId);
  const tpl = getC2185ClassTemplate(classId);
  const proficiencies = new Set(Array.isArray(enriched.skillProficiencies) ? enriched.skillProficiencies : []);
  const saveProfs = new Set(Array.isArray(tpl?.saveProficiencies) ? tpl.saveProficiencies : []);
  const selfProfile = buildCyberCombatProfile(inventory, augmentations);

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
  const cyberAttacks = attacksFromAugmentations(enriched, augmentations, selfProfile, defenderProfile);
  const attacks = [...baseAttacks, ...cyberAttacks].map((a) => ({
    name: a.name,
    atk: formatSignedMod(a.atkBonus),
    damage: a.damage,
    note: a.note,
  }));

  const baseAc = typeof enriched.ac === 'number' ? enriched.ac : 10;
  const acVsSmartlink = effectiveAcAgainstSmartlinkAttack(baseAc, selfProfile, true);

  return {
    saves,
    skills,
    attacks,
    acVsSmartlink,
    combatNotes: selfProfile.notes,
  };
}

export type { CyberCombatProfile };
