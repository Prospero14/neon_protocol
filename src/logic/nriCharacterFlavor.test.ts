import { describe, expect, it } from 'vitest';
import { buildFullCharacter } from './nriCharacterGen';
import { generatePocketLoot, mergePocketLoot } from './nriCharacterFlavor';
import { generateRichBackstory } from './nriBackstories';

describe('pocket loot + flavor sync', () => {
  it('fills pockets with transit/food/keepsake style clutter', () => {
    const pockets = generatePocketLoot({
      originId: 'moscow',
      activityId: 'street',
      classId: 'fixer',
      archetypeId: 'fixer',
      career: 'Связной синдиката',
      chrome: [{ name: 'Neural Jack', slot: 'neural' }],
    });
    expect(pockets.length).toBeGreaterThanOrEqual(3);
    expect(pockets.every((p) => p.tags?.includes('карман') || p.tags?.includes('мелочь'))).toBe(true);
    expect(pockets.some((p) => /проезд|тройка|жетон|билет|талон/i.test(p.name))).toBe(true);
  });

  it('mergePocketLoot keeps weapons and replaces old pocket trash', () => {
    const merged = mergePocketLoot(
      [
        { id: 'w_1', name: 'SMG', slot: 'weapon', kind: 'gear' },
        { id: 'pocket_old', name: 'Старый мусор', tags: ['карман', 'мелочь'], kind: 'gear' },
      ],
      [{ id: 'pocket_new', name: 'Новый чек', tags: ['карман', 'мелочь'], kind: 'gear' }]
    );
    expect(merged.map((i) => i.name)).toEqual(['SMG', 'Новый чек']);
  });

  it('backstory can mention chrome and career', () => {
    const samples = Array.from({ length: 24 }, () =>
      generateRichBackstory({
        name: 'Нова Парк',
        nickname: 'Сейф',
        originId: 'neo_tokyo',
        activityId: 'criminal',
        archetypeId: 'fixer',
        classId: 'fixer',
        career: 'Связной синдиката',
        chrome: [{ name: 'Interface Plugs', slot: 'neural' }],
        weapons: ['Mono-knife'],
        pocketNames: ['Фигурка аниме (слепая капсула)'],
      })
    );
    const joined = samples.join('\n');
    expect(joined).toMatch(/Связной синдиката/);
    expect(joined).not.toMatch(/\b(Enforcer|Vice|SMG)\b/);
    expect(joined).toMatch(/Interface Plugs|мононож|Mono-knife|фигурка|джек|нейро|карман|порок/i);
  });

  it('buildFullCharacter returns inventory with pockets + class gear', () => {
    const built = buildFullCharacter({
      classId: 'fixer',
      originId: 'moscow',
      activityId: 'criminal',
      archetypeId: 'fixer',
      characterName: 'Тест Карман',
      career: 'Связной синдиката',
      rollStats: false,
    });
    expect(built.inventory.length).toBeGreaterThanOrEqual(3);
    expect(built.meta.backstory.length).toBeGreaterThan(40);
    expect(built.meta.clothing.length).toBeGreaterThan(20);
    const pocketish = built.inventory.filter(
      (i) => i.tags?.includes('карман') || i.id.startsWith('pocket_')
    );
    expect(pocketish.length).toBeGreaterThanOrEqual(2);
  });
});
