import { describe, expect, it } from 'vitest';
import { computeNpcDispositionToViewer } from './disposition';
import { getFactionRelation, isFactionRelationsActive, relationKey } from './factionRelations';

describe('faction relations', () => {
  it('uses symmetric relation keys', () => {
    expect(relationKey('a', 'b')).toBe('a::b');
    expect(relationKey('b', 'a')).toBe('a::b');
  });

  it('activates only when enabled and non-neutral edges exist', () => {
    expect(isFactionRelationsActive({ enabled: true, edges: {} })).toBe(false);
    expect(isFactionRelationsActive({ enabled: true, edges: { 'a::b': 'hostile' } })).toBe(true);
    expect(isFactionRelationsActive({ enabled: false, edges: { 'a::b': 'hostile' } })).toBe(false);
  });

  it('reads stance between factions', () => {
    const matrix = { enabled: true, edges: { [relationKey('f1', 'f2')]: 'hostile' as const } };
    expect(getFactionRelation(matrix, 'f1', 'f2')).toBe('hostile');
    expect(getFactionRelation(matrix, 'f2', 'f1')).toBe('hostile');
  });
});

describe('npc disposition', () => {
  const factions = [{ id: 'f-gang', kind: 'gang', name: 'Maelstrom' }];
  const matrix = {
    enabled: true,
    edges: { [relationKey('f-gang', 'f-corp')]: 'hostile' as const },
  };

  it('applies tattoo penalty when relations active', () => {
    const npc = { factionId: 'f-corp', disposition: 10 };
    const viewer = {
      tattoos: [
        {
          id: 't1',
          kind: 'gang',
          label: 'tag',
          description: 'd',
          placement: 'arm',
          source: 'ink',
          factionId: 'f-gang',
        },
      ],
    };
    const res = computeNpcDispositionToViewer(npc, viewer, matrix, factions);
    expect(res.active).toBe(true);
    expect(res.tattooModifier).toBeLessThan(0);
    expect(res.total).toBeLessThan(res.base);
  });

  it('ignores tattoo modifier when matrix disabled', () => {
    const npc = { factionId: 'f-corp', disposition: 10 };
    const viewer = {
      tattoos: [
        {
          id: 't1',
          kind: 'gang',
          label: 'tag',
          description: 'd',
          placement: 'arm',
          source: 'ink',
          factionId: 'f-gang',
        },
      ],
    };
    const res = computeNpcDispositionToViewer(npc, viewer, { enabled: false, edges: matrix.edges }, factions);
    expect(res.tattooModifier).toBe(0);
    expect(res.total).toBe(10);
  });
});
