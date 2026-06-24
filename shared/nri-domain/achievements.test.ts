import { describe, expect, it } from 'vitest';
import {
  achievementsForClass,
  applyAchievementEvent,
  dossierFromSheet,
  emptyAchievementState,
  NRI_ACHIEVEMENTS,
  NRI_CLASS_ACHIEVEMENTS,
  NRI_DRUG_CATALOG_IDS,
  parseAchievementState,
} from './achievements.js';

describe('parseAchievementState — corrupt / hostile input', () => {
  it('returns empty state for null, undefined, primitives', () => {
    const empty = emptyAchievementState();
    expect(parseAchievementState(null)).toEqual(empty);
    expect(parseAchievementState(undefined)).toEqual(empty);
    expect(parseAchievementState(0)).toEqual(empty);
    expect(parseAchievementState('[]')).toEqual(empty);
    expect(parseAchievementState([])).toEqual(empty);
  });

  it('drops unknown achievement ids from unlocked', () => {
    const s = parseAchievementState({
      unlocked: ['survived_1hp', 'fake_ach', '', 42, null],
      unlockedAt: { survived_1hp: 1, fake_ach: 2, not_real: 3 },
      progress: {},
    });
    expect(s.unlocked).toEqual(['survived_1hp']);
    expect(s.unlockedAt).toEqual({ survived_1hp: 1 });
  });

  it('ignores non-array progress fields without throwing', () => {
    const s = parseAchievementState({
      unlocked: [],
      progress: {
        drugsUsed: {},
        zonesVisited: 'watson',
        medConsumablesUsed: 3,
        mercWeaponZones: null,
        equipWeapon: 'yes',
        equipArmor: 1,
      },
    });
    expect(s.progress.drugsUsed).toBeUndefined();
    expect(s.progress.zonesVisited).toBeUndefined();
    expect(s.progress.medConsumablesUsed).toBeUndefined();
    expect(s.progress.mercWeaponZones).toBeUndefined();
    expect(s.progress.equipWeapon).toBeUndefined();
    expect(s.progress.equipArmor).toBeUndefined();
  });

  it('filters NaN and non-finite unlockedAt timestamps', () => {
    const s = parseAchievementState({
      unlocked: ['quiet_hour'],
      unlockedAt: { quiet_hour: NaN, high_roller: Infinity, cartographer: '123' },
    });
    expect(s.unlockedAt).toEqual({});
  });
});

describe('applyAchievementEvent — must not unlock on garbage / wrong class', () => {
  const expectNoUnlock = (
    ids: string[],
    event: Parameters<typeof applyAchievementEvent>[1],
    classId?: string,
  ) => {
    const { newlyUnlocked } = applyAchievementEvent(emptyAchievementState(), event, { classId });
    for (const id of ids) {
      expect(newlyUnlocked).not.toContain(id);
    }
  };

  it('hp=0 does not grant survived_1hp or daimyo_blood_rage', () => {
    expectNoUnlock(['survived_1hp', 'daimyo_blood_rage'], { type: 'hp_updated', hp: 0, hpMax: 20 });
    expectNoUnlock(['daimyo_blood_rage'], { type: 'hp_low_survived', hp: 0, hpMax: 40 }, 'daimyo');
  });

  it('hpMax=0 does not crash and does not grant daimyo_blood_rage', () => {
    expect(() =>
      applyAchievementEvent(emptyAchievementState(), { type: 'hp_low_survived', hp: 1, hpMax: 0 }, { classId: 'daimyo' }),
    ).not.toThrow();
    expectNoUnlock(['daimyo_blood_rage'], { type: 'hp_low_survived', hp: 1, hpMax: 0 }, 'daimyo');
  });

  it('26% HP does not grant daimyo_blood_rage (threshold is ≤25%)', () => {
    expectNoUnlock(['daimyo_blood_rage'], { type: 'hp_low_survived', hp: 11, hpMax: 40 }, 'daimyo');
  });

  it('class achievements blocked without classId or wrong classId casing', () => {
    expectNoUnlock(['doc_stim_shot'], { type: 'item_used', catalogId: 'g_medkit', category: 'gear' });
    expectNoUnlock(['doc_stim_shot'], { type: 'item_used', catalogId: 'g_medkit', category: 'gear' }, 'Doc');
    expectNoUnlock(['hacker_breached', 'hacker_clean_run'], { type: 'ice_won', won: true, tracePct: 5 }, 'merc');
  });

  it('hacker_clean_run requires tracePct ≤ 15', () => {
    const border = applyAchievementEvent(
      emptyAchievementState(),
      { type: 'ice_won', won: true, tracePct: 15 },
      { classId: 'hacker' },
    );
    expect(border.newlyUnlocked).toContain('hacker_clean_run');

    expectNoUnlock(['hacker_clean_run'], { type: 'ice_won', won: true, tracePct: 16 }, 'hacker');
    expectNoUnlock(['hacker_clean_run'], { type: 'ice_won', won: true }, 'hacker');
    expectNoUnlock(['hacker_breached', 'hacker_clean_run'], { type: 'ice_won', won: false, tracePct: 0 }, 'hacker');
  });

  it('fixer_paymaster requires ≥100 to player', () => {
    expectNoUnlock(['fixer_paymaster'], { type: 'transfer_sent', toPlayer: true, amount: 99, hasMemo: false }, 'fixer');
    expectNoUnlock(['fixer_paymaster'], { type: 'transfer_sent', toPlayer: false, amount: 500, hasMemo: true }, 'fixer');
  });

  it('detective_tip_line requires player transfer with memo', () => {
    expectNoUnlock(['detective_tip_line'], { type: 'transfer_sent', toPlayer: true, amount: 50, hasMemo: false }, 'detective');
    expectNoUnlock(['detective_tip_line'], { type: 'transfer_sent', toPlayer: false, amount: 50, hasMemo: true }, 'detective');
  });

  it('partial drug list never unlocks stoned_all_drugs', () => {
    let state = emptyAchievementState();
    for (const id of NRI_DRUG_CATALOG_IDS.slice(0, 5)) {
      state = applyAchievementEvent(state, { type: 'item_used', catalogId: id, category: 'drug' }).state;
    }
    expect(state.unlocked).not.toContain('stoned_all_drugs');
  });

  it('duplicate zone visits do not inflate cartographer progress', () => {
    let state = emptyAchievementState();
    for (let i = 0; i < 10; i++) {
      state = applyAchievementEvent(state, { type: 'zone_visited', zoneKey: 'watson' }).state;
    }
    expect(state.progress.zonesVisited).toEqual(['watson']);
    expect(state.unlocked).not.toContain('cartographer');
  });

  it('merc_battle_kit lost after unequip weapon even if already unlocked stays', () => {
    let state = emptyAchievementState();
    state = applyAchievementEvent(
      state,
      { type: 'item_equipped', slot: 'weapon', equipped: true },
      { classId: 'merc' },
    ).state;
    state = applyAchievementEvent(
      state,
      { type: 'item_equipped', slot: 'armor', equipped: true },
      { classId: 'merc' },
    ).state;
    expect(state.unlocked).toContain('merc_battle_kit');
    state = applyAchievementEvent(
      state,
      { type: 'item_equipped', slot: 'weapon', equipped: false },
      { classId: 'merc' },
    ).state;
    expect(state.progress.equipWeapon).toBe(false);
    const again = applyAchievementEvent(
      state,
      { type: 'item_equipped', slot: 'armor', equipped: true },
      { classId: 'merc' },
    );
    expect(again.newlyUnlocked).not.toContain('merc_battle_kit');
  });

  it('repeated identical events do not duplicate unlock ids', () => {
    let state = emptyAchievementState();
    for (let i = 0; i < 5; i++) {
      const r = applyAchievementEvent(state, { type: 'antispam_paid' });
      state = r.state;
      if (i > 0) expect(r.newlyUnlocked).toEqual([]);
    }
    expect(state.unlocked.filter((id) => id === 'quiet_hour')).toHaveLength(1);
  });

  it('wonlongs_balance below 5000 does not unlock high_roller', () => {
    expectNoUnlock(['high_roller'], { type: 'wonlongs_balance', amount: 4999 });
    expectNoUnlock(['high_roller'], { type: 'wonlongs_balance', amount: -100 });
  });

  it('blood_tox below 8 does not unlock chrome_tox', () => {
    expectNoUnlock(['chrome_tox'], { type: 'blood_tox', value: 7 });
  });
});

describe('achievementsForClass — visibility rules', () => {
  it('unknown class sees only universal achievements', () => {
    const list = achievementsForClass('not_a_class');
    expect(list.every((a) => !a.classId)).toBe(true);
    expect(list.length + NRI_CLASS_ACHIEVEMENTS.length).toBe(NRI_ACHIEVEMENTS.length);
  });

  it('each canonical class gets exactly 3 class achievements in filter', () => {
    for (const cls of ['daimyo', 'doc', 'merc', 'hacker', 'detective', 'fixer'] as const) {
      const classOnly = achievementsForClass(cls).filter((a) => a.classId);
      expect(classOnly).toHaveLength(3);
      expect(classOnly.every((a) => a.classId === cls)).toBe(true);
    }
  });
});

describe('dossierFromSheet — corrupt sheet shapes', () => {
  it('never throws on garbage input', () => {
    expect(() => dossierFromSheet(null)).not.toThrow();
    expect(() => dossierFromSheet(undefined)).not.toThrow();
    expect(() => dossierFromSheet(42)).not.toThrow();
    expect(() => dossierFromSheet([])).not.toThrow();
  });

  it('coerces non-string fields to em-dash placeholders', () => {
    const d = dossierFromSheet({
      characterName: 123,
      backstory: null,
      career: false,
      clothing: '',
      age: { y: 25 },
    });
    expect(d.characterName).toBe('—');
    expect(d.backstory).toBe('—');
    expect(d.career).toBe('—');
    expect(d.clothing).toBe('—');
    expect(d.age).toBe('[object Object]');
  });
});
