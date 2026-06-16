import { describe, it, expect } from 'vitest';
import { rollCharacterName, rollNickname, formatCharacterDisplayName } from './nriNames';
import { generateRichBackstory, BACKSTORY_POOL_SIZE } from './nriBackstories';

describe('nriNames', () => {
  it('generates Tokyo-flavored names', () => {
    const name = rollCharacterName('neo_tokyo');
    expect(name.split(' ')).toHaveLength(2);
    expect(name.length).toBeGreaterThan(3);
  });

  it('generates Moscow-flavored names', () => {
    const name = rollCharacterName('moscow');
    expect(name).toMatch(/\S+\s+\S+/);
  });

  it('formats display name with nickname', () => {
    expect(formatCharacterDisplayName('Ivan Volkov', 'Калибр')).toBe('Ivan Volkov «Калибр»');
  });

  it('rollNickname returns non-empty for military', () => {
    expect(rollNickname('military').length).toBeGreaterThan(0);
  });
});

describe('nriBackstories', () => {
  it('has large template pool', () => {
    expect(BACKSTORY_POOL_SIZE).toBeGreaterThanOrEqual(60);
  });

  it('generates coherent backstory', () => {
    const text = generateRichBackstory({
      name: 'Test User',
      nickname: 'Тень',
      originId: 'moscow',
      activityId: 'military',
      archetypeId: 'mercenary',
      classId: 'merc',
    });
    expect(text.length).toBeGreaterThan(40);
    expect(text).toMatch(/Test User|Тень|мерк|Enforcer|наёмник/i);
  });
});
