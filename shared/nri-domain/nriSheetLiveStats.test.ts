import { describe, expect, it } from 'vitest';
import {
  applyLevelProgressToSheet,
  classFeaturesForLevel,
  computeHpMaxForLevel,
} from '../../src/logic/nriCharacterGen';
import { applyAugmentationsToSheet, type InstalledAugmentation } from '../../src/logic/nriCyberInstall';
import { applyEquippedToSheet } from '../../src/logic/nriItemEquip';
import { applyConditionsToSheet } from '../../src/logic/nriConditions';
import { getSheetCombatView } from '../../src/logic/nriSheetCombat';
import { buildCyberImplant } from '../../src/logic/nriCyberware';
import { catalogToInventoryItem } from '../../src/logic/nriItemCatalog';
import type { NriSheetData } from '../../src/logic/nriNpcGenerator';

const baseSheet: NriSheetData = {
  abilities: { STR: 10, DEX: 12, CON: 10, INT: 10, TEC: 10, PEO: 10 },
  level: 1,
  proficiencyBonus: 2,
  hpMax: 10,
  hp: 10,
  ac: 12,
};

describe('live sheet stats from catalog / cyber / level', () => {
  it('equip reactive weave vest applies AC + ability mods and cyber tags', () => {
    const item = catalogToInventoryItem('a_reactive_weave_vest');
    expect(item).toBeTruthy();
    expect(item!.tags).toContain('cyber:smartlink_jam');
    expect(item!.acBonus).toBe(2);
    const equipped = { ...item!, equipped: true };
    const next = applyEquippedToSheet(baseSheet, [equipped]);
    expect(next.ac).toBe(14);
    expect(next.abilities.DEX).toBe(11);
  });

  it('installed cyber armor КБ raises AC on sheet', () => {
    const build = buildCyberImplant({
      slot: 'torso',
      name: 'Анти-смартлинк жилет',
      partIds: ['armor_reactive_weave', 'power_cell_m'],
    });
    expect(build.acBonus).toBeGreaterThanOrEqual(1);
    const aug: InstalledAugmentation = {
      itemId: 'aug1',
      name: build.name,
      slot: 'torso',
      bloodTox: build.bloodTox,
      acBonus: build.acBonus,
      c2185Mods: build.c2185Mods,
      cyber: { slot: 'torso', features: build.features, effects: build.effects },
      installedAt: Date.now(),
    };
    const next = applyAugmentationsToSheet(baseSheet, [aug]);
    expect(next.ac).toBe(baseSheet.ac! + build.acBonus);
    expect(next.abilities.DEX).toBe(11);
  });

  it('class attacks rebuild from current DEX after gear buff', () => {
    const buffed = applyEquippedToSheet(baseSheet, [
      {
        id: 'dex_ring',
        name: 'Кольцо',
        slot: 'accessory',
        equipped: true,
        c2185Mods: { DEX: 2 },
      },
    ]);
    const view = getSheetCombatView(buffed, 'detective', [], []);
    const pistol = view.attacks.find((a) => a.name === 'Pistol');
    expect(pistol?.atk).toBe('+4'); // prof 2 + DEX mod 2 (14)
  });

  it('level progress unlocks features and bumps HP / proficiency', () => {
    const at3 = applyLevelProgressToSheet(baseSheet, 'daimyo', 3);
    expect(at3.level).toBe(3);
    expect(at3.proficiencyBonus).toBe(2);
    expect(at3.hpMax).toBe(computeHpMaxForLevel(at3, 'daimyo'));
    const feats = classFeaturesForLevel('daimyo', 3);
    expect(feats.some((f) => /Danger Sense|Rallying Cry|Daimyo Focus/i.test(f))).toBe(true);
    expect(feats.length).toBeGreaterThan(classFeaturesForLevel('daimyo', 1).length);
  });

  it('condition mods stack into effective abilities for combat view', () => {
    const withCond: NriSheetData = {
      ...baseSheet,
      activeConditions: [
        {
          id: 'boosted',
          label: 'Boosted',
          appliedAt: Date.now(),
          abilityMods: { DEX: 2 },
        },
      ],
    };
    const conditioned = applyConditionsToSheet(withCond);
    expect(conditioned.abilities.DEX).toBe(14);
    const view = getSheetCombatView(conditioned, 'fixer', [], []);
    const knife = view.attacks.find((a) => a.name === 'Mono-knife');
    // DEX 14 → +2, proficiency +2
    expect(knife?.atk).toBe('+4');
  });
});
