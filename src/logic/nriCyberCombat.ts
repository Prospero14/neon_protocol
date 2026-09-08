/**
 * Честные боевые правила кибер-эффектов: смартлинк, маскировка, контры брони/снаряги.
 */

import type { InstalledAugmentation } from './nriCyberInstall';
import type { NriInventoryItem } from './nriInventory';
import {
  collectActiveCyberEffects,
  hasCyberEffect,
  type CyberEffectId,
} from './nriCyberEffects';
import { CYBER_PARTS, type CyberPartDef } from './nriCyberware';

/** +1 к атаке, не стакается с несколькими смартлинками. */
export const SMARTLINK_ATK_BONUS = 1;
/** +2 к скрытому ношению встроенного оружия. */
export const WEAPON_CONCEAL_STEALTH_BONUS = 2;
/** +1 AC vs дальнобой с смартлинком (optic_flare). */
export const OPTIC_FLARE_AC_BONUS = 1;

export type CyberCombatProfile = {
  effects: CyberEffectId[];
  /** 0 или SMARTLINK_ATK_BONUS — сам по себе, до контры цели. */
  smartlinkAtk: number;
  concealStealthBonus: number;
  /** Бонус AC против атак со смартлинком. */
  acVsSmartlink: number;
  notes: string[];
};

export function buildCyberCombatProfile(
  inventory: NriInventoryItem[],
  augmentations: InstalledAugmentation[]
): CyberCombatProfile {
  const effects = collectActiveCyberEffects(inventory, augmentations);
  const notes: string[] = [];
  const smartlinkAtk = hasCyberEffect(effects, 'weapon_smartlink') ? SMARTLINK_ATK_BONUS : 0;
  const concealStealthBonus = hasCyberEffect(effects, 'weapon_conceal')
    ? WEAPON_CONCEAL_STEALTH_BONUS
    : 0;
  const acVsSmartlink = hasCyberEffect(effects, 'optic_flare') ? OPTIC_FLARE_AC_BONUS : 0;

  if (smartlinkAtk) {
    notes.push(`Смартлинк: +${smartlinkAtk} к атаке встроенным/smart-оружием (не стакается).`);
  }
  if (concealStealthBonus) {
    notes.push(`Маскировка оружия: +${concealStealthBonus} к скрытому ношению (пока нет conceal_scan у обыскивающего).`);
  }
  if (hasCyberEffect(effects, 'smartlink_jam')) {
    notes.push('Глушилка смартлинка: атакующий не получает +1 смартлинка по тебе.');
  }
  if (acVsSmartlink) {
    notes.push(`Оптический flare: +${acVsSmartlink} AC против дальнобойных атак со смартлинком.`);
  }
  if (hasCyberEffect(effects, 'thermal_baffle')) {
    notes.push('Тепловой экран: тепловизор не даёт бесплатный контур по тебе.');
  }
  if (hasCyberEffect(effects, 'mesh_faraday')) {
    notes.push('Faraday: глушит RF-детект / ghost-handshake рядом.');
  }

  return { effects, smartlinkAtk, concealStealthBonus, acVsSmartlink, notes };
}

/** Смартлинк-бонус атакующего по конкретной цели (с учётом jam). */
export function smartlinkBonusAgainstTarget(
  attacker: CyberCombatProfile,
  defender?: CyberCombatProfile | null
): number {
  if (attacker.smartlinkAtk <= 0) return 0;
  if (defender && hasCyberEffect(defender.effects, 'smartlink_jam')) return 0;
  return attacker.smartlinkAtk;
}

export function effectiveAcAgainstSmartlinkAttack(
  baseAc: number,
  defender: CyberCombatProfile,
  attackerHasSmartlinkBonus: boolean
): number {
  if (!attackerHasSmartlinkBonus) return baseAc;
  return baseAc + defender.acVsSmartlink;
}

export function weaponPartsFromAug(aug: InstalledAugmentation): CyberPartDef[] {
  const blueprint = aug.cyber?.blueprint as { partIds?: string[] } | undefined;
  const partIds = blueprint?.partIds;
  if (!Array.isArray(partIds)) return [];
  return partIds
    .map((id) => CYBER_PARTS.find((p) => p.id === id))
    .filter((p): p is CyberPartDef => !!p && p.kind === 'weapon');
}

/** Встроенное оружие считается smart, если на части/ауге есть weapon_smartlink или есть смартлинк у атакующего. */
export function isSmartLinkedCyberWeapon(
  part: CyberPartDef | null,
  aug: InstalledAugmentation,
  attackerHasSmartlink: boolean
): boolean {
  if (part?.effects?.includes('weapon_smartlink')) return true;
  const augEffects = Array.isArray(aug.cyber?.effects) ? aug.cyber!.effects! : [];
  if (augEffects.includes('weapon_smartlink')) return true;
  // Смартлинк на атакующем (глаз/нейро) ведёт любое его встроенное оружие
  return attackerHasSmartlink && part != null;
}

export function inventoryItemIsSmartWeapon(item: NriInventoryItem): boolean {
  const tags = item.tags;
  if (!Array.isArray(tags)) return false;
  return tags.includes('smart') || tags.includes('cyber:weapon_smartlink');
}

/** Conceal bonus vs searcher with conceal_scan → 0. */
export function concealBonusAgainstSearcher(
  owner: CyberCombatProfile,
  searcher?: CyberCombatProfile | null
): number {
  if (owner.concealStealthBonus <= 0) return 0;
  if (searcher && hasCyberEffect(searcher.effects, 'conceal_scan')) return 0;
  return owner.concealStealthBonus;
}

/** Сюжетные контры: атакующий hook vs защита цели. */
export function storyHookContested(
  attackerHook: CyberEffectId,
  defender: CyberCombatProfile
): { contested: boolean; by?: CyberEffectId; note: string } {
  const pairs: Partial<Record<CyberEffectId, CyberEffectId>> = {
    voice_synth_fake: 'voice_auth',
    face_scrambler: 'biometric_lock',
    corp_badge_spoof: 'biometric_lock',
    scent_mask: 'scent_flare',
    lie_pulse: 'pulse_shield',
    evidence_wire: 'evidence_scrub',
    vision_thermal: 'thermal_baffle',
    vision_uv: 'uv_cloak',
    currency_uv: 'uv_cloak',
    surveillance_detect: 'mesh_faraday',
    ghost_handshake: 'mesh_faraday',
    weapon_conceal: 'conceal_scan',
  };
  const counter = pairs[attackerHook];
  if (counter && hasCyberEffect(defender.effects, counter)) {
    return {
      contested: true,
      by: counter,
      note: `${attackerHook} блокируется / глушится ${counter} на цели.`,
    };
  }
  return { contested: false, note: '' };
}
