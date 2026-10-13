import { describe, expect, it } from 'vitest';
import { iceOutcomeFlavor } from './iceOutcomeFlavor';
import { NRI_GAME_CATALOG } from './nriGameCatalog';

describe('iceOutcomeFlavor', () => {
  it('has win and fail stamps for every catalog game', () => {
    for (const g of NRI_GAME_CATALOG) {
      const win = iceOutcomeFlavor(g.id, true);
      const fail = iceOutcomeFlavor(g.id, false);
      expect(win.stamp.length).toBeGreaterThan(3);
      expect(win.line.length).toBeGreaterThan(8);
      expect(fail.stamp.length).toBeGreaterThan(3);
      expect(fail.line.length).toBeGreaterThan(8);
      expect(win.stamp).not.toBe(fail.stamp);
    }
  });

  it('auth / noise get thematic Russian stamps on win', () => {
    expect(iceOutcomeFlavor('auth_bypass', true).stamp).toMatch(/ВХОД|ДОСТУП/i);
    expect(iceOutcomeFlavor('noise_floor', true).stamp).toMatch(/ДАННЫЕ/i);
  });

  it('unknown id falls back without throw', () => {
    expect(iceOutcomeFlavor('totally_fake', true).stamp).toBeTruthy();
  });

  it('fail stamps mention ICE / IP / QRF pressure', () => {
    const fail = iceOutcomeFlavor('gibson_ice', false);
    expect(`${fail.stamp} ${fail.line}`).toMatch(/ICE|IP|QRF|безопасник/i);
    expect(iceOutcomeFlavor('proxy_dodge', false).stamp).toMatch(/IP/i);
    expect(iceOutcomeFlavor('log_wipe', false).line).toMatch(/быстрого реагирования|QRF/i);
  });
});
