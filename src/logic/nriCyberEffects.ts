/** Активные способности с киберимплантов (сенсоры, оружие, сеть). */

import type { InstalledAugmentation } from './nriCyberInstall';
import type { NriInventoryItem } from './nriInventory';

export type CyberEffectId =
  | 'vision_uv'
  | 'currency_uv'
  | 'vision_thermal'
  | 'vision_night'
  | 'weapon_smartlink'
  | 'weapon_conceal'
  | 'surveillance_detect'
  | 'net_deep_scan';

export const CYBER_EFFECT_LABELS: Record<CyberEffectId, string> = {
  vision_uv: 'УФ-зрение — скрытые метки и чернила',
  currency_uv: 'Скан ₩ — видны УФ-метки на валюте',
  vision_thermal: 'Тепловизор — тепловые следы и засады',
  vision_night: 'Ночное зрение без штрафа в темноте',
  weapon_smartlink: 'Смартлинк — +1 к атаке умным оружием',
  weapon_conceal: 'Маскировка оружия — +2 к скрытому ношению',
  surveillance_detect: 'RF-детектор — жучки и маяки',
  net_deep_scan: 'Глубокий сетевой скан — скрытые узлы ICE',
};

function readItemEffects(item: { cyber?: { effects?: unknown } } | null | undefined): CyberEffectId[] {
  const raw = item?.cyber?.effects;
  if (!Array.isArray(raw)) return [];
  return raw.filter((e): e is CyberEffectId => typeof e === 'string' && e in CYBER_EFFECT_LABELS);
}

export function collectCyberEffectsFromInventory(inventory: NriInventoryItem[]): CyberEffectId[] {
  const set = new Set<CyberEffectId>();
  for (const item of inventory) {
    if (item.kind !== 'cyberware') continue;
    readItemEffects(item).forEach((e) => set.add(e));
  }
  return [...set];
}

export function collectCyberEffectsFromAugmentations(augmentations: InstalledAugmentation[]): CyberEffectId[] {
  const set = new Set<CyberEffectId>();
  for (const aug of augmentations) {
    readItemEffects(aug).forEach((e) => set.add(e));
  }
  return [...set];
}

export function collectPlayerCyberEffects(
  inventory: NriInventoryItem[],
  augmentations: InstalledAugmentation[]
): CyberEffectId[] {
  const set = new Set<CyberEffectId>([
    ...collectCyberEffectsFromInventory(inventory),
    ...collectCyberEffectsFromAugmentations(augmentations),
  ]);
  return [...set];
}

export function hasCyberEffect(effects: CyberEffectId[], id: CyberEffectId): boolean {
  return effects.includes(id);
}
