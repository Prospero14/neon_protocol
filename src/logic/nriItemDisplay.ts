import type { NriInventoryItem } from './nriInventory';

export function nriItemStatsLine(item: NriInventoryItem): string {
  const parts: string[] = [];
  if (item.c2185Mods) {
    for (const [k, v] of Object.entries(item.c2185Mods)) {
      if (typeof v === 'number') parts.push(`${k} ${v >= 0 ? '+' : ''}${v}`);
    }
  }
  if (typeof item.acBonus === 'number') parts.push(`AC +${item.acBonus}`);
  if (item.attack) parts.push(`${item.attack.damageDice} ${item.attack.damageType}`);
  if (item.blurb) parts.push(item.blurb);
  return parts.filter(Boolean).join(' · ') || 'без характеристик';
}

export type ItemTransferPayload = {
  type: 'item_transfer';
  fromDisplayName?: string;
  fromNpcId?: string | null;
  toDisplayName?: string;
  item?: NriInventoryItem;
  statsLine?: string;
  broadcasted?: boolean;
};

export function parseItemTransferPayload(raw: unknown): ItemTransferPayload | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (o.type !== 'item_transfer') return null;
  return o as ItemTransferPayload;
}
