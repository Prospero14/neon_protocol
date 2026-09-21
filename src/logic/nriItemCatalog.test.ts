import { describe, expect, it } from 'vitest';
import {
  VEHICLE_LICENSE_ID,
  canInscribeInventoryItem,
  canTransferInventoryItem,
  catalogToInventoryItem,
  getCatalogItem,
  isInscribableCatalogItem,
} from './nriItemCatalog';

describe('nriItemCatalog transfer rules', () => {
  it('underhive passport remains transferable without personal tag', () => {
    const item = catalogToInventoryItem('g_underhive_passport');
    expect(item).toBeTruthy();
    expect(item ? canTransferInventoryItem(item) : false).toBe(true);
  });

  it('vehicle license can be inscribed exactly once', () => {
    const catalog = getCatalogItem(VEHICLE_LICENSE_ID);
    expect(isInscribableCatalogItem(catalog)).toBe(true);
    const item = catalogToInventoryItem(VEHICLE_LICENSE_ID);
    expect(item).toBeTruthy();
    expect(item ? canInscribeInventoryItem(item) : false).toBe(true);
    expect(
      item
        ? canInscribeInventoryItem({ ...item, inscribedName: 'V. Martinez', inscriptionLocked: true })
        : true
    ).toBe(false);
  });
});
