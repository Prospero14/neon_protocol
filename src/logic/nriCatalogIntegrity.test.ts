/** Контрактные проверки shared JSON (каталог, consume). */

import { describe, it, expect } from 'vitest';
import catalog from '../../shared/nri-item-catalog.json';
import consume from '../../shared/nri-consume-effects.json';
import { CONDITION_IDS } from '../../shared/nri-domain/conditionDefs';

type CatalogRow = { id: string; category?: string; slot?: string };
type ConsumeRow = {
  conditions?: string[];
  conditionRounds?: number;
  hpHeal?: number;
  hpDamage?: number;
  bloodToxDelta?: number;
};

const VALID_CONDITIONS = new Set(CONDITION_IDS);

describe('nri catalog integrity', () => {
  const items = catalog as CatalogRow[];

  it('has unique catalog ids', () => {
    const ids = items.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every consume effect references existing catalog id', () => {
    const catalogIds = new Set(items.map((i) => i.id));
    for (const catalogId of Object.keys(consume as Record<string, ConsumeRow>)) {
      expect(catalogIds.has(catalogId), `missing catalog id: ${catalogId}`).toBe(true);
    }
  });

  it('every consumable and drug has consume mapping', () => {
    const consumeIds = new Set(Object.keys(consume as Record<string, ConsumeRow>));
    const missing = items
      .filter((i) => i.category === 'consumable' || i.category === 'drug')
      .filter((i) => !consumeIds.has(i.id))
      .map((i) => i.id);
    expect(missing, `missing consume effects: ${missing.join(', ')}`).toEqual([]);
  });

  it('consume conditions use known condition ids', () => {
    for (const [itemId, spec] of Object.entries(consume as Record<string, ConsumeRow>)) {
      for (const c of spec.conditions ?? []) {
        expect(VALID_CONDITIONS.has(c as (typeof CONDITION_IDS)[number]), `${itemId}: unknown ${c}`).toBe(
          true
        );
      }
    }
  });
});
