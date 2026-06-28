import { describe, expect, it } from 'vitest';
import { getSheetCombatView } from '../../src/logic/nriSheetCombat';
import type { InstalledAugmentation } from '../../src/logic/nriCyberInstall';

const baseSheet = {
  abilities: { STR: 14, DEX: 12, CON: 10, INT: 10, TEC: 10, PEO: 10 },
  level: 1,
  proficiencyBonus: 2,
  hpMax: 10,
  hp: 10,
  ac: 12,
};

describe('nriSheetCombat cyber attacks', () => {
  it('derives weapon attacks from augmentation blueprint partIds', () => {
    const aug: InstalledAugmentation = {
      itemId: 'cyber_prod_123',
      name: 'Клинок руки',
      slot: 'arm',
      bloodTox: 2,
      cyber: {
        slot: 'arm',
        blueprint: {
          name: 'Клинок',
          slot: 'arm',
          partIds: ['chassis_limb_std', 'w_arm_blade', 'power_cell_s'],
        },
        features: ['1d6 рубящ, ближний'],
      },
      installedAt: Date.now(),
    };
    const view = getSheetCombatView(baseSheet, 'merc', [aug]);
    const blade = view.attacks.find((a) => a.name === 'Клинок руки');
    expect(blade).toBeDefined();
    expect(blade?.damage).toContain('1d8');
  });
});
