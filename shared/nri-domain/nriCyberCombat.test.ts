import { describe, expect, it } from 'vitest';
import { getSheetCombatView } from '../../src/logic/nriSheetCombat';
import type { InstalledAugmentation } from '../../src/logic/nriCyberInstall';
import {
  buildCyberCombatProfile,
  smartlinkBonusAgainstTarget,
  concealBonusAgainstSearcher,
  storyHookContested,
} from '../../src/logic/nriCyberCombat';
import type { NriInventoryItem } from '../../src/logic/nriInventory';
import { attacksFromEquippedGear } from '../../src/logic/nriItemEquip';

const baseSheet = {
  abilities: { STR: 14, DEX: 12, CON: 10, INT: 10, TEC: 10, PEO: 10 },
  level: 1,
  proficiencyBonus: 2,
  hpMax: 10,
  hp: 10,
  ac: 12,
};

function pistolAug(): InstalledAugmentation {
  return {
    itemId: 'cyber_pistol',
    name: 'Смарт-пистолет',
    slot: 'arm',
    bloodTox: 8,
    cyber: {
      slot: 'arm',
      blueprint: {
        name: 'Смарт-пистолет',
        slot: 'arm',
        partIds: ['chassis_limb_std', 'w_arm_pistol', 'fw_smartlink', 'power_cell_s'],
      },
      effects: ['weapon_smartlink'],
      features: ['2d6 баллистика', '+1 к атаке умным оружием'],
    },
    installedAt: Date.now(),
  };
}

function jamVestAug(): InstalledAugmentation {
  return {
    itemId: 'cyber_jam',
    name: 'Анти-смартлинк жилет',
    slot: 'torso',
    bloodTox: 3,
    cyber: {
      slot: 'torso',
      blueprint: {
        name: 'Анти-смартлинк жилет',
        slot: 'torso',
        partIds: ['armor_reactive_weave', 'power_cell_m'],
      },
      effects: ['smartlink_jam', 'optic_flare'],
    },
    installedAt: Date.now(),
  };
}

describe('smartlink combat rules', () => {
  it('adds +1 once to cyber weapon attack when attacker has smartlink', () => {
    const view = getSheetCombatView(baseSheet, 'merc', [pistolAug()], []);
    const atk = view.attacks.find((a) => a.name === 'Смарт-пистолет');
    // DEX 12 → +1, prof +2, smartlink +1 = +4
    expect(atk?.atk).toBe('+4');
    expect(atk?.note).toContain('смартлинк');
  });

  it('does not stack smartlink from a second implant beyond +1', () => {
    const eye: InstalledAugmentation = {
      itemId: 'eye',
      name: 'Смартлинк-глаз',
      slot: 'head',
      bloodTox: 5,
      cyber: {
        slot: 'head',
        blueprint: {
          name: 'eye',
          slot: 'head',
          partIds: ['sensor_optics', 'fw_smartlink', 'power_cell_s'],
        },
        effects: ['weapon_smartlink', 'vision_night'],
      },
      installedAt: Date.now(),
    };
    const view = getSheetCombatView(baseSheet, 'merc', [pistolAug(), eye], []);
    const atk = view.attacks.find((a) => a.name === 'Смарт-пистолет');
    expect(atk?.atk).toBe('+4');
  });

  it('smartlink_jam on defender zeroes the +1', () => {
    const attacker = buildCyberCombatProfile([], [pistolAug()]);
    const defender = buildCyberCombatProfile([], [jamVestAug()]);
    expect(smartlinkBonusAgainstTarget(attacker, defender)).toBe(0);
    const view = getSheetCombatView(baseSheet, 'merc', [pistolAug()], [], defender);
    const atk = view.attacks.find((a) => a.name === 'Смарт-пистолет');
    expect(atk?.atk).toBe('+3');
    expect(atk?.note).toMatch(/глуш/i);
  });

  it('optic_flare raises AC vs smartlink on defender profile', () => {
    const view = getSheetCombatView(baseSheet, 'merc', [jamVestAug()], []);
    expect(view.acVsSmartlink).toBe(13);
  });

  it('equipped gear with cyber: tags applies jam', () => {
    const vest: NriInventoryItem = {
      id: 'v1',
      name: 'Жилет',
      equipped: true,
      slot: 'armor',
      acBonus: 2,
      tags: ['cyber:smartlink_jam', 'cyber:optic_flare'],
    };
    const attacker = buildCyberCombatProfile([], [pistolAug()]);
    const defender = buildCyberCombatProfile([vest], []);
    expect(smartlinkBonusAgainstTarget(attacker, defender)).toBe(0);
    expect(defender.acVsSmartlink).toBe(1);
  });

  it('smart tagged inventory weapon gets +1 with implant smartlink', () => {
    const gun: NriInventoryItem = {
      id: 'g1',
      name: 'Смарт-пистолет',
      equipped: true,
      slot: 'weapon',
      tags: ['smart'],
      attack: { damageDice: '2d6', damageType: 'ballistic', ability: 'DEX' },
    };
    const eye: InstalledAugmentation = {
      itemId: 'eye',
      name: 'eye',
      slot: 'head',
      bloodTox: 5,
      cyber: {
        slot: 'head',
        effects: ['weapon_smartlink'],
        blueprint: { name: 'e', slot: 'head', partIds: ['fw_smartlink', 'power_cell_s'] },
      },
      installedAt: 1,
    };
    const attacks = attacksFromEquippedGear(baseSheet, [gun], [eye]);
    expect(attacks[0]?.atkBonus).toBe(4);
  });

  it('conceal_scan strips conceal bonus', () => {
    const owner = buildCyberCombatProfile([], [
      {
        itemId: '1',
        name: 'blade',
        slot: 'arm',
        bloodTox: 1,
        cyber: { slot: 'arm', effects: ['weapon_conceal'] },
        installedAt: 1,
      },
    ]);
    const searcher = buildCyberCombatProfile([], [
      {
        itemId: '2',
        name: 'scan',
        slot: 'head',
        bloodTox: 1,
        cyber: { slot: 'head', effects: ['conceal_scan'] },
        installedAt: 1,
      },
    ]);
    expect(concealBonusAgainstSearcher(owner, null)).toBe(2);
    expect(concealBonusAgainstSearcher(owner, searcher)).toBe(0);
  });

  it('story hooks are contested by matching counters', () => {
    const def = buildCyberCombatProfile([], [
      {
        itemId: '1',
        name: 'auth',
        slot: 'head',
        bloodTox: 1,
        cyber: { slot: 'head', effects: ['voice_auth', 'biometric_lock'] },
        installedAt: 1,
      },
    ]);
    expect(storyHookContested('voice_synth_fake', def).contested).toBe(true);
    expect(storyHookContested('face_scrambler', def).contested).toBe(true);
    expect(storyHookContested('black_market_ping', def).contested).toBe(false);
  });
});
