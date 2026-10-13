import { describe, expect, it } from 'vitest';
import { asSentence, joinSentences } from './nriProse';
import { generateRichBackstory } from './nriBackstories';
import { generateRichClothing } from './nriClothing';
import { buildFullCharacter } from './nriCharacterGen';

describe('nriProse', () => {
  it('capitalizes and ends with a period', () => {
    expect(asSentence('имеет связи, о которых не говорят вслух')).toBe(
      'Имеет связи, о которых не говорят вслух.'
    );
  });

  it('joins without smashing clauses', () => {
    const text = joinSentences(
      'имя — фиксер из Нео-Токио',
      'умеет исчезнуть в толпе за три секунды',
      'Связывает тех, кто не должен встречаться.'
    );
    expect(text).toBe(
      'Имя — фиксер из Нео-Токио. Умеет исчезнуть в толпе за три секунды. Связывает тех, кто не должен встречаться.'
    );
  });
});

describe('rich flavor generation', () => {
  it('backstory is 2–4 sentences with punctuation', () => {
    const samples = Array.from({ length: 20 }, (_, i) =>
      generateRichBackstory({
        name: 'Нова Парк',
        nickname: 'Сейф',
        originId: i % 2 === 0 ? 'moscow' : 'neo_tokyo',
        activityId: 'criminal',
        archetypeId: 'fixer',
        classId: 'fixer',
        career: 'Связной синдиката',
        vice: 'Зависим от дневного ТВ — не могу оторваться от тупых шоу.',
        weapons: ['SMG'],
        pocketNames: ['Значок «ВДНХ»'],
      })
    );
    for (const text of samples) {
      expect(text).toMatch(/^[А-ЯЁ]/u);
      expect(text.endsWith('.')).toBe(true);
      expect(text).not.toMatch(/\b(Enforcer|Scoundrel|Vice|SMG)\b/);
      expect(text).not.toMatch(/vice тянет/i);
      expect(text).not.toMatch(/из Москва\b/);
      expect(text).not.toMatch(/«[^»]*«/);
      const sentences = text.split(/(?<=\.)\s+/).filter(Boolean);
      expect(sentences.length).toBeGreaterThanOrEqual(2);
      expect(sentences.length).toBeLessThanOrEqual(4);
      expect(text).not.toMatch(/\.\s+[а-яё]/u);
      for (const s of sentences) {
        expect(s.trim().charAt(0)).toMatch(/[А-ЯЁA-Z«]/u);
      }
    }
  });

  it('clothing stays glance-sized', () => {
    const text = generateRichClothing({
      originId: 'neo_tokyo',
      activityId: 'street',
      archetypeId: 'fixer',
      classId: 'fixer',
      career: 'Связной синдиката',
    });
    expect(text.length).toBeGreaterThan(30);
    expect(text.length).toBeLessThan(420);
    expect(text).toMatch(/[.!]/);
    expect(text).not.toContain('elsewhere');
  });

  it('buildFullCharacter uses filled career/name/origin in backstory', () => {
    const built = buildFullCharacter({
      classId: 'fixer',
      originId: 'moscow',
      activityId: 'criminal',
      archetypeId: 'fixer',
      characterName: 'Иван Тестов',
      nickname: 'Сейф',
      career: 'Связной синдиката',
      rollStats: false,
    });
    expect(built.meta.career).toBe('Связной синдиката');
    expect(built.sheet.career).toBe('Связной синдиката');
    expect(built.meta.backstory).toMatch(/Связной синдиката/);
    expect(built.meta.backstory).toMatch(/Москва|Сейф|Тестов|Иван/i);
    expect(built.sheet.origin).toMatch(/Москва/i);
  });
});
