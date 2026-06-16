import { describe, it, expect } from 'vitest';
import { rollDice, formatDiceRollMessage } from './nriDice';

describe('nriDice', () => {
  it('rolls deterministic with injected rng', () => {
    let i = 0;
    const rng = () => [0, 0.5, 0.99][i++ % 3]!;
    const r = rollDice(3, 6, 2, rng);
    expect(r.rolls).toEqual([1, 4, 6]);
    expect(r.total).toBe(13);
  });

  it('clamps count to 1..20', () => {
    const r = rollDice(100, 6, 0, () => 0);
    expect(r.count).toBe(20);
    expect(r.rolls).toHaveLength(20);
  });

  it('formats message for chat', () => {
    const msg = formatDiceRollMessage({
      count: 2,
      sides: 6,
      rolls: [3, 4],
      total: 9,
      modifier: 2,
    });
    expect(msg).toContain('2d6+2');
    expect(msg).toContain('= 9');
  });
});
