import { describe, it, expect } from 'vitest';
import { rollCharacterName, rollNickname, formatCharacterDisplayName } from './nriNames';
import { generateRichBackstory, getBackstoryPoolSize } from './nriBackstories';

describe('nriNames', () => {
  it('generates Tokyo-flavored names in Cyrillic', () => {
    const name = rollCharacterName('neo_tokyo');
    expect(name.split(' ')).toHaveLength(2);
    expect(name).toMatch(/[А-ЯЁа-яё]/);
    expect(name).not.toMatch(/[A-Za-z]{3,}/);
  });

  it('generates Moscow-flavored names in Cyrillic', () => {
    const name = rollCharacterName('moscow');
    expect(name).toMatch(/\S+\s+\S+/);
    expect(name).toMatch(/[А-ЯЁа-яё]/);
    expect(name).not.toMatch(/[A-Za-z]{3,}/);
  });

  it('formats display name with nickname', () => {
    expect(formatCharacterDisplayName('Иван Волков', 'Калибр')).toBe('Иван Волков «Калибр»');
  });

  it('rollNickname returns non-empty for military', () => {
    expect(rollNickname('military').length).toBeGreaterThan(0);
  });

  it('rollNickname prefers class-flavored callsigns', () => {
    const samples = Array.from({ length: 80 }, () =>
      rollNickname({ activityId: 'corp', classId: 'detective' })
    );
    expect(samples.some((s) => /Шпиль|Лупа|Досье|Следак/i.test(s))).toBe(true);
    expect(samples.every((s) => !/^(KPI|Ресурс|Синк|Апрув)$/i.test(s))).toBe(true);
  });
});

describe('nriBackstories', () => {
  it('builds pool after nriCharacterGen module graph loads', async () => {
    const mod = await import('./nriCharacterGen');
    expect(mod.NRI_ORIGINS).toHaveLength(7);
    expect(getBackstoryPoolSize()).toBeGreaterThanOrEqual(8);
  });

  it('has large template pool', () => {
    expect(getBackstoryPoolSize()).toBeGreaterThanOrEqual(12);
  });

  it('generates coherent backstory', () => {
    const text = generateRichBackstory({
      name: 'Иван Тестов',
      nickname: 'Тень',
      originId: 'moscow',
      activityId: 'military',
      archetypeId: 'mercenary',
      classId: 'merc',
      career: 'Ветеран корп-армии',
    });
    expect(text.length).toBeGreaterThan(40);
    expect(text).toMatch(/Иван|Тестов|Тень|наёмник|Москва|Ветеран/i);
  });

  it('rolls career when career omitted (no generic fallback phrase)', () => {
    const text = generateRichBackstory({
      name: 'Test User',
      originId: 'neo_tokyo',
      activityId: 'street',
      archetypeId: 'civilian',
      classId: 'merc',
    });
    expect(text).not.toContain('специалист без чёткой визитки');
    expect(text.length).toBeGreaterThan(30);
  });
});
