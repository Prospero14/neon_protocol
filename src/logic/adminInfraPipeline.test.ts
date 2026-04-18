import { describe, it, expect } from 'vitest';
import { sortInfraCardsForAdminSupply } from './adminInfraPipeline';
import { getCardById } from './combatCards';

describe('sortInfraCardsForAdminSupply', () => {
  it('orders known infra before unknown', () => {
    const a = getCardById('infra_lb_nginx')!;
    const b = getCardById('infra_vpc_network')!;
    const c = getCardById('infra_old_hw')!;
    const out = sortInfraCardsForAdminSupply([a, b, c]);
    expect(out.map((x) => x.id)).toEqual(['infra_old_hw', 'infra_vpc_network', 'infra_lb_nginx']);
  });
});
