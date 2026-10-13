import { describe, expect, it } from 'vitest';
import {
  ICE_COUNTERHACK_THRESHOLD,
  applyCounterCommandPick,
  brickDecksInInventory,
  buildCounterStage,
  inventoryHasDeck,
  startCounterHack,
  readCounterHack,
} from './iceCounterHack.js';

describe('iceCounterHack', () => {
  it('threshold is in 5–7', () => {
    expect(ICE_COUNTERHACK_THRESHOLD).toBeGreaterThanOrEqual(5);
    expect(ICE_COUNTERHACK_THRESHOLD).toBeLessThanOrEqual(7);
  });

  it('startCounterHack writes active state', () => {
    const sheet = startCounterHack({}, { targetUserId: 'u', targetName: 'R' });
    const ch = readCounterHack(sheet);
    expect(ch?.active).toBe(true);
    expect(ch?.stageIndex).toBe(0);
  });

  it('stage has 10 commands and correct chain', () => {
    const stage = buildCounterStage(0, 42);
    expect(stage.commands.length).toBeLessThanOrEqual(10);
    expect(stage.commands.filter((c) => c.correct).length).toBe(stage.need);
  });

  it('correct picks advance; wrong increases mistakes', () => {
    const sheet = startCounterHack({}, { targetUserId: 'u', targetName: 'R', now: 1000 });
    let ch = readCounterHack(sheet)!;
    const stage = buildCounterStage(0, ch.startedAt);
    const ordered = stage.commands
      .filter((c) => c.correct)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const wrong = stage.commands.find((c) => !c.correct)!;
    const bad = applyCounterCommandPick(ch, stage, wrong.id, 1100);
    expect(bad.ok).toBe(false);
    ch = bad.state;
    expect(ch.stageMistakes).toBe(1);
    for (const cmd of ordered) {
      const r = applyCounterCommandPick(ch, stage, cmd.id, 1200);
      expect(r.ok).toBe(true);
      ch = r.state;
      if (r.stageComplete) break;
    }
    expect(ch.stageIndex).toBeGreaterThanOrEqual(1);
  });

  it('brickDecks removes all deck catalog ids', () => {
    const next = brickDecksInInventory([
      { catalogId: 'g_cyberdeck' },
      { catalogId: 'w_pistol' },
      { catalogId: 'g_cyberdeck_pro' },
    ]);
    expect(next).toEqual([{ catalogId: 'w_pistol' }]);
    expect(inventoryHasDeck([{ catalogId: 'g_cyberdeck_mid' }])).toBe(true);
    expect(inventoryHasDeck([{ catalogId: 'w_pistol' }])).toBe(false);
  });
});
