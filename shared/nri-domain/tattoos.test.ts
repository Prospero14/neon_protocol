import { describe, expect, it } from 'vitest';
import {
  applyHoloTattooPick,
  buildHoloTattooOptions,
  holoTattooAlreadyChosen,
  inventoryItemHasHoloTattoo,
  markPendingHoloTattooAfterInstall,
  rollNpcTattoos,
} from './tattoos';

describe('nri tattoos', () => {
  const factions = [
    { id: 'f-gang', kind: 'gang', name: 'Maelstrom', displayName: '[Банда] Maelstrom' },
    { id: 'f-corp', kind: 'corp', name: 'Arasaka', displayName: '[Корпорация] Arasaka' },
  ];

  it('detects holo tattoo part in blueprint', () => {
    expect(
      inventoryItemHasHoloTattoo({
        cyber: { blueprint: { partIds: ['cosm_holo_tattoo', 'power_cell_s'] } },
      })
    ).toBe(true);
    expect(inventoryItemHasHoloTattoo({ cyber: { blueprint: { partIds: ['power_cell_s'] } } })).toBe(false);
  });

  it('marks pending holo tattoo once', () => {
    const sheet = markPendingHoloTattooAfterInstall(
      { originId: 'neo_tokyo' },
      { cyber: { blueprint: { partIds: ['cosm_holo_tattoo'] } } }
    );
    expect(sheet.pendingHoloTattoo).toBe(true);
    const locked = { ...sheet, holoTattooChosen: true };
    const again = markPendingHoloTattooAfterInstall(
      locked,
      { cyber: { blueprint: { partIds: ['cosm_holo_tattoo'] } } }
    );
    expect(again.pendingHoloTattoo).toBeUndefined();
  });

  it('builds options from lore factions', () => {
    const opts = buildHoloTattooOptions({ originId: 'neo_tokyo' }, factions);
    expect(opts.some((o) => o.factionId === 'f-gang')).toBe(true);
    expect(opts.some((o) => o.id === 'generic:ethnic')).toBe(true);
  });

  it('applies one-time holo tattoo pick', () => {
    const sheet = { pendingHoloTattoo: true, originId: 'neo_tokyo', tattoos: [] };
    const opts = buildHoloTattooOptions({ originId: 'neo_tokyo' }, factions);
    const gang = opts.find((o) => o.factionId === 'f-gang');
    expect(gang).toBeTruthy();
    const res = applyHoloTattooPick(sheet, gang!.id, factions, opts);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.sheet.pendingHoloTattoo).toBe(false);
    expect(res.sheet.holoTattooChosen).toBe(true);
    expect(Array.isArray(res.sheet.tattoos) && res.sheet.tattoos.length).toBe(1);
    expect(holoTattooAlreadyChosen(res.sheet)).toBe(true);
    const retry = applyHoloTattooPick(res.sheet, gang!.id, factions, opts);
    expect(retry.ok).toBe(false);
  });

  it('rolls npc tattoos with faction bias', () => {
    const tattoos = rollNpcTattoos(
      { archetypeId: 'gang', originId: 'night_city', factionId: 'f-gang' },
      factions,
      1
    );
    expect(tattoos.length).toBeGreaterThan(0);
    expect(tattoos[0]?.factionId).toBe('f-gang');
  });
});
