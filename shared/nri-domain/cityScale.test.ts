import { describe, expect, it } from 'vitest';
import { defaultPopulationBand, formatCityScaleLine, resolveCityScale } from './cityScale';

describe('cityScale', () => {
  it('defaults corp to high population band', () => {
    const scale = resolveCityScale({ zoneType: 'corp' });
    expect(scale.populationBand).toBe('500k_2m');
    expect(scale.trafficLevel).toBe(2);
  });

  it('formats readable scale line', () => {
    const line = formatCityScaleLine(resolveCityScale({ zoneType: 'slum' }));
    expect(line).toContain('население');
    expect(line).toContain('трафик');
  });

  it('respects stored population band', () => {
    expect(defaultPopulationBand('park')).toBe('under_50k');
    const scale = resolveCityScale({ zoneType: 'park', populationBand: 'megablock' });
    expect(scale.populationBand).toBe('megablock');
  });
});
