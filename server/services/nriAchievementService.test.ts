import { describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '@prisma/client';
import {
  achievementEventsFromEquip,
  achievementEventsFromItemUse,
  achievementEventsFromSheetChange,
  inventoryHasEquippedWeapon,
  processPlayerAchievements,
  serializeAchievementState,
} from './nriAchievementService.js';

describe('inventoryHasEquippedWeapon — corrupt inventory', () => {
  it('returns false for non-array inventory', () => {
    expect(inventoryHasEquippedWeapon(null)).toBe(false);
    expect(inventoryHasEquippedWeapon(undefined)).toBe(false);
    expect(inventoryHasEquippedWeapon({})).toBe(false);
    expect(inventoryHasEquippedWeapon('[]')).toBe(false);
  });

  it('returns false when equipped flag is truthy but slot is not weapon', () => {
    expect(
      inventoryHasEquippedWeapon([{ id: 'a', slot: 'armor', equipped: true }]),
    ).toBe(false);
  });

  it('returns false for equipped weapon without boolean equipped', () => {
    expect(
      inventoryHasEquippedWeapon([{ id: 'a', slot: 'weapon', equipped: 'yes' as unknown as boolean }]),
    ).toBe(false);
  });
});

describe('achievementEventsFromSheetChange — type coercion', () => {
  it('does not emit events when sheet is null or non-object', () => {
    expect(achievementEventsFromSheetChange(null, null)).toEqual([]);
    expect(achievementEventsFromSheetChange('bad', 42)).toEqual([]);
  });

  it('ignores string hp and wonlongs fields', () => {
    const events = achievementEventsFromSheetChange(
      { hp: '1', bloodToxCurrent: '9', wonlongs: '99999' },
      { hp: '1', bloodToxCurrent: '9', wonlongs: '99999' },
    );
    expect(events.some((e) => e.type === 'hp_updated')).toBe(false);
    expect(events.some((e) => e.type === 'blood_tox')).toBe(false);
    expect(events.some((e) => e.type === 'wonlongs_balance')).toBe(false);
  });

  it('does not re-fire survived_1hp when hp was already 1', () => {
    const events = achievementEventsFromSheetChange({ hp: 1, hpMax: 20 }, { hp: 1, hpMax: 20 });
    expect(events.filter((e) => e.type === 'hp_updated')).toHaveLength(0);
  });

  it('does not fire blood_tox when tox drops or stays below threshold', () => {
    expect(
      achievementEventsFromSheetChange({ bloodToxCurrent: 9 }, { bloodToxCurrent: 5 }),
    ).toEqual([]);
    expect(
      achievementEventsFromSheetChange({ bloodToxCurrent: 7 }, { bloodToxCurrent: 7 }),
    ).toEqual([]);
  });

  it('hp_healed_to_max not emitted when already at max', () => {
    const events = achievementEventsFromSheetChange({ hp: 20, hpMax: 20 }, { hp: 20, hpMax: 20 });
    expect(events.some((e) => e.type === 'hp_healed_to_max')).toBe(false);
  });
});

describe('achievementEventsFromItemUse — missing catalog / sheet', () => {
  it('returns only hp/tox heal events when catalogId undefined', () => {
    const events = achievementEventsFromItemUse(undefined, { hp: 5, hpMax: 20 }, { hp: 20, hpMax: 20 });
    expect(events.some((e) => e.type === 'item_used')).toBe(false);
    expect(events.some((e) => e.type === 'hp_healed_to_max')).toBe(true);
  });

  it('does not throw for unknown catalogId', () => {
    expect(() =>
      achievementEventsFromItemUse('totally_fake_item', { hp: 10, hpMax: 20 }, { hp: 10, hpMax: 20 }),
    ).not.toThrow();
    const events = achievementEventsFromItemUse('totally_fake_item', { hp: 10, hpMax: 20 }, { hp: 10, hpMax: 20 });
    expect(events.some((e) => e.type === 'item_used' && e.catalogId === 'totally_fake_item')).toBe(true);
  });
});

describe('achievementEventsFromEquip — missing items', () => {
  it('returns empty array when item id missing or has no slot', () => {
    expect(achievementEventsFromEquip([], 'missing')).toEqual([]);
    expect(achievementEventsFromEquip([{ id: 'x', name: 'X' }], 'x')).toEqual([]);
  });
});

describe('serializeAchievementState — corrupt DB json', () => {
  it('never throws and returns empty progress arrays', () => {
    expect(() => serializeAchievementState(null)).not.toThrow();
    const s = serializeAchievementState({ unlocked: ['not_real'], progress: { drugsUsed: {} } });
    expect(s.unlocked).toEqual([]);
    expect(s.progress.drugsUsed).toEqual([]);
    expect(s.progress.zonesVisited).toEqual([]);
  });
});

describe('processPlayerAchievements — service guards', () => {
  it('returns [] when player missing', async () => {
    const prisma = {
      nriPlayer: { findUnique: vi.fn().mockResolvedValue(null), update: vi.fn() },
      nriIceScore: { findMany: vi.fn() },
    } as unknown as PrismaClient;
    const result = await processPlayerAchievements(prisma, 'missing-id', [{ type: 'antispam_paid' }]);
    expect(result).toEqual([]);
    expect(prisma.nriPlayer.update).not.toHaveBeenCalled();
  });

  it('returns [] for empty events without cybersportsman check', async () => {
    const prisma = {
      nriPlayer: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'p1',
          classId: 'merc',
          sessionId: 's1',
          userId: 'u1',
          achievementState: {},
        }),
        update: vi.fn(),
      },
      nriIceScore: { findMany: vi.fn() },
    } as unknown as PrismaClient;
    const result = await processPlayerAchievements(prisma, 'p1', []);
    expect(result).toEqual([]);
    expect(prisma.nriPlayer.update).not.toHaveBeenCalled();
  });

  it('skips DB write when corrupt state parses same as output', async () => {
    const prisma = {
      nriPlayer: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'p1',
          classId: 'merc',
          sessionId: 's1',
          userId: 'u1',
          achievementState: { unlocked: [], unlockedAt: {}, progress: {} },
        }),
        update: vi.fn(),
      },
      nriIceScore: { findMany: vi.fn() },
    } as unknown as PrismaClient;
    const result = await processPlayerAchievements(prisma, 'p1', [
      { type: 'wonlongs_balance', amount: 100 },
    ]);
    expect(result).toEqual([]);
    expect(prisma.nriPlayer.update).not.toHaveBeenCalled();
  });

  it('does not grant cybersportsman when any game board is empty', async () => {
    const prisma = {
      nriPlayer: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'p1',
          classId: 'hacker',
          sessionId: 's1',
          userId: 'u1',
          achievementState: {},
        }),
        update: vi.fn(),
      },
      nriIceScore: {
        findMany: vi.fn().mockResolvedValue([
          {
            userId: 'u1',
            displayName: 'Me',
            gameId: 'gibson_ice',
            difficulty: 'medium',
            score: 100,
            exfilPct: 100,
            tracePct: 0,
            createdAt: new Date(),
          },
        ]),
      },
    } as unknown as PrismaClient;
    const result = await processPlayerAchievements(prisma, 'p1', [], { checkCybersportsman: true });
    expect(result.some((a) => a.id === 'cybersportsman')).toBe(false);
  });
});
