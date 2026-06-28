import { describe, expect, it } from 'vitest';
import {
  ICE_FAIL_STREAK_LIMIT,
  applyIceRunResult,
  buildIcePlayStatus,
  detectIceClearance,
  hasLeftDeck,
  maybeAutoClearIceBan,
  readIceBan,
  writeIceBan,
} from './nriIceBan.js';

describe('readIceBan — corrupt sheet', () => {
  it('null/undefined/primitive → дефолт', () => {
    expect(readIceBan(null)).toEqual({ consecutiveFails: 0, hardwareBanned: false });
    expect(readIceBan(undefined)).toEqual({ consecutiveFails: 0, hardwareBanned: false });
    expect(readIceBan('string')).toEqual({ consecutiveFails: 0, hardwareBanned: false });
    expect(readIceBan(42)).toEqual({ consecutiveFails: 0, hardwareBanned: false });
  });

  it('{} без iceBan → дефолт', () => {
    expect(readIceBan({})).toEqual({ consecutiveFails: 0, hardwareBanned: false });
  });

  it('iceBan: {} → sanitized defaults', () => {
    const b = readIceBan({ iceBan: {} });
    expect(b.consecutiveFails).toBe(0);
    expect(b.hardwareBanned).toBe(false);
  });

  it('отрицательный consecutiveFails → 0', () => {
    expect(readIceBan({ iceBan: { consecutiveFails: -5, hardwareBanned: false } }).consecutiveFails).toBe(0);
  });

  it('NaN consecutiveFails → 0', () => {
    expect(readIceBan({ iceBan: { consecutiveFails: NaN, hardwareBanned: true } }).consecutiveFails).toBe(0);
  });

  it('hardwareBanned truthy string → true', () => {
    expect(readIceBan({ iceBan: { consecutiveFails: 0, hardwareBanned: 'yes' } }).hardwareBanned).toBe(true);
  });
});

describe('applyIceRunResult — streak и ban', () => {
  it('win сбрасывает streak', () => {
    const sheet = writeIceBan({}, { consecutiveFails: 2, hardwareBanned: false });
    const { ban } = applyIceRunResult(sheet, true);
    expect(ban.consecutiveFails).toBe(0);
    expect(ban.hardwareBanned).toBe(false);
  });

  it(`${ICE_FAIL_STREAK_LIMIT} проигрыша подряд → hardware ban`, () => {
    let sheet: unknown = {};
    for (let i = 0; i < ICE_FAIL_STREAK_LIMIT; i++) {
      const r = applyIceRunResult(sheet, false);
      sheet = r.sheet;
      if (i < ICE_FAIL_STREAK_LIMIT - 1) {
        expect(r.ban.hardwareBanned).toBe(false);
      }
    }
    const final = readIceBan(sheet);
    expect(final.hardwareBanned).toBe(true);
    expect(final.consecutiveFails).toBe(ICE_FAIL_STREAK_LIMIT);
  });
});

describe('hasLeftDeck + detectIceClearance', () => {
  it('inventory не массив → false', () => {
    expect(hasLeftDeck(null)).toBe(false);
    expect(hasLeftDeck({})).toBe(false);
  });

  it('left deck снимает ban', () => {
    const sheet = writeIceBan({}, { consecutiveFails: 3, hardwareBanned: true, bannedAt: 1000 });
    const inv = [{ catalogId: 'g_left_deck' }];
    expect(detectIceClearance(sheet, inv)).toEqual({ cleared: true, via: 'deck' });
  });

  it('без clearance ban остаётся', () => {
    const sheet = writeIceBan({}, { consecutiveFails: 3, hardwareBanned: true, bannedAt: 1000 });
    expect(detectIceClearance(sheet, [])).toEqual({ cleared: false });
  });
});

describe('buildIcePlayStatus', () => {
  it('tableAllBanned + canPlay false при ban без clearance', () => {
    const sheet = writeIceBan({}, { consecutiveFails: 3, hardwareBanned: true });
    const st = buildIcePlayStatus(sheet, [], true);
    expect(st.canPlay).toBe(false);
    expect(st.tableAllBanned).toBe(true);
    expect(st.failsUntilBan).toBe(0);
  });

  it('failsUntilBan корректен при 1 fail', () => {
    const sheet = writeIceBan({}, { consecutiveFails: 1, hardwareBanned: false });
    const st = buildIcePlayStatus(sheet, [], false);
    expect(st.failsUntilBan).toBe(ICE_FAIL_STREAK_LIMIT - 1);
  });
});

describe('maybeAutoClearIceBan', () => {
  it('не banned → null (нет патча)', () => {
    expect(maybeAutoClearIceBan({}, [])).toBeNull();
  });

  it('banned + deck → cleared sheet', () => {
    const sheet = writeIceBan({}, { consecutiveFails: 3, hardwareBanned: true });
    const next = maybeAutoClearIceBan(sheet, [{ catalogId: 'g_left_deck' }]);
    expect(next).not.toBeNull();
    expect(readIceBan(next).hardwareBanned).toBe(false);
  });
});
