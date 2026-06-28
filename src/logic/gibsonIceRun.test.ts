import { describe, expect, it } from 'vitest';
import { rollIceRun, iceRewardBits } from './gibsonIceRun.js';

describe('rollIceRun — позитивные сценарии', () => {
  it('детерминирован при фиксированном seed', () => {
    const a = rollIceRun(12345, 'medium');
    const b = rollIceRun(12345, 'medium');
    expect(a).toEqual(b);
  });

  it('ровно один vulnerable сервис', () => {
    for (const d of ['easy', 'medium', 'hard'] as const) {
      const run = rollIceRun(999, d);
      expect(run.services.filter((s) => s.vulnerable)).toHaveLength(1);
      expect(run.services.length).toBeGreaterThan(0);
    }
  });

  it('crackSequence в пределах portCount', () => {
    const run = rollIceRun(42, 'hard');
    for (const p of run.crackSequence) {
      expect(p).toBeGreaterThanOrEqual(1);
      expect(p).toBeLessThanOrEqual(run.portCount);
    }
  });

  it('сложность влияет на длину crackSequence', () => {
    const easy = rollIceRun(1, 'easy');
    const hard = rollIceRun(1, 'hard');
    expect(hard.crackSequence.length).toBeGreaterThan(easy.crackSequence.length);
  });
});

describe('rollIceRun — edge cases', () => {
  it('seed 0 не падает', () => {
    expect(() => rollIceRun(0, 'easy')).not.toThrow();
  });

  it('отрицательный seed не падает', () => {
    expect(() => rollIceRun(-1, 'medium')).not.toThrow();
  });
});

describe('iceRewardBits', () => {
  it('exfil < 100 → 0 bits', () => {
    expect(iceRewardBits(0, 0)).toBe(0);
    expect(iceRewardBits(99, 0)).toBe(0);
  });

  it('exfil 100 + низкий trace → больше bits', () => {
    const clean = iceRewardBits(100, 5);
    const hot = iceRewardBits(100, 95);
    expect(clean).toBeGreaterThan(hot);
    expect(clean).toBeGreaterThan(0);
  });

  it('trace 100 при exfil 100 всё равно даёт минимум', () => {
    expect(iceRewardBits(100, 100)).toBe(15);
  });

  it('NaN exfil не проходит guard (NaN < 100 → false) → считается «полным»', () => {
    expect(iceRewardBits(Number.NaN, 0)).toBe(115);
  });
});
