import { describe, expect, it } from 'vitest';
import { generateNeonCityZones } from '../../src/logic/nriNeonCityMapGen';
import { overviewLabelLines } from './cityMapOverview';
import { zoneOverviewRect } from '../../src/logic/nriCityMapVisual';

describe('corpo plaza grid', () => {
  it('fills corpo_plaza bounds with 10 integer corp tiles', () => {
    const zones = generateNeonCityZones();
    const corps = zones.filter((z) => z.zoneKey.startsWith('corp_'));
    expect(corps).toHaveLength(10);

    const minX = Math.min(...corps.map((z) => z.x));
    const minY = Math.min(...corps.map((z) => z.y));
    const maxX = Math.max(...corps.map((z) => z.x + z.w));
    const maxY = Math.max(...corps.map((z) => z.y + z.h));

    expect(minX).toBe(118);
    expect(minY).toBe(22);
    expect(maxX).toBe(188);
    expect(maxY).toBe(53);

    for (const z of corps) {
      expect(Number.isInteger(z.x)).toBe(true);
      expect(Number.isInteger(z.y)).toBe(true);
      expect(Number.isInteger(z.w)).toBe(true);
      expect(Number.isInteger(z.h)).toBe(true);
    }
  });

  it('zoneOverviewRect keeps districts flush on shared edges', () => {
    expect(zoneOverviewRect(188, 22, 52, 29)).toEqual({ x: 188, y: 22, w: 52, h: 29 });
    expect(zoneOverviewRect(118, 22, 14, 16)).toEqual({ x: 118, y: 22, w: 14, h: 16 });
  });
});

describe('overviewLabelLines', () => {
  it('splits corp names by words', () => {
    expect(overviewLabelLines('Kang Tao', 'corp', 'Kang Tao')).toEqual(['Kang', 'Tao']);
    expect(overviewLabelLines('Arasaka', 'corp')).toEqual(['Arasaka']);
  });
});
