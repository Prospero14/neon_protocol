import type { Trait } from './traits';
import type { GameItem, ItemRarity } from './items';
import { ITEM_LIBRARY } from './items';
import { randomInt, weightedPick } from './random';

export type LootSource = 'npc_contract' | 'combat' | 'terminal' | 'district_container';

const rarityWeightsBySource: Record<LootSource, Record<ItemRarity, number>> = {
  npc_contract: { common: 58, uncommon: 30, rare: 10, epic: 2 },
  combat: { common: 35, uncommon: 35, rare: 22, epic: 8 },
  terminal: { common: 40, uncommon: 34, rare: 20, epic: 6 },
  district_container: { common: 64, uncommon: 25, rare: 9, epic: 2 },
};

function rarityPool(rarity: ItemRarity): GameItem[] {
  return ITEM_LIBRARY.filter((i) => i.rarity === rarity);
}

export function rollLoot(source: LootSource, tier: number, traits: Trait[] = []): GameItem {
  const hasLucky = traits.some((t) => t.id === 'hobby_pentesting' || t.id === 'trait_deep_packet_analyst');
  const weights = { ...rarityWeightsBySource[source] };

  if (tier >= 3) {
    weights.rare += 6;
    weights.epic += 2;
    weights.common = Math.max(20, weights.common - 6);
  }
  if (hasLucky) {
    weights.rare += 4;
    weights.epic += 2;
    weights.common = Math.max(15, weights.common - 4);
  }

  const rarity = weightedPick<ItemRarity>([
    { value: 'common', weight: weights.common },
    { value: 'uncommon', weight: weights.uncommon },
    { value: 'rare', weight: weights.rare },
    { value: 'epic', weight: weights.epic },
  ]);

  const pool = rarityPool(rarity);
  return pool[randomInt(0, pool.length - 1)];
}
