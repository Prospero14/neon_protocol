import { describe, expect, it } from 'vitest';
import { emptyFieldDossier, sanitizeFieldDossiers } from './fieldDossiers';

describe('sanitizeFieldDossiers', () => {
  it('returns [] for corrupt shapes', () => {
    expect(sanitizeFieldDossiers(undefined)).toEqual([]);
    expect(sanitizeFieldDossiers({})).toEqual([]);
    expect(sanitizeFieldDossiers('x')).toEqual([]);
  });

  it('keeps valid rows and drops junk', () => {
    const out = sanitizeFieldDossiers([
      { id: 'a1', name: 'Пётр', affiliation: 'Серебряные Глаза', importance: 'топ', belongings: 'пистолет', marks: 'тату' },
      null,
      { id: 'bad space', name: 'x' },
      { id: 'a1', name: 'dup' },
    ]);
    expect(out).toHaveLength(2);
    expect(out[0]!.name).toBe('Пётр');
    expect(out[0]!.importance).toBe('топ');
    expect(out[1]!.id).not.toBe('a1');
  });
});

describe('emptyFieldDossier', () => {
  it('creates blank card with id', () => {
    const d = emptyFieldDossier();
    expect(d.id).toMatch(/^fd_/);
    expect(d.name).toBe('');
  });
});
