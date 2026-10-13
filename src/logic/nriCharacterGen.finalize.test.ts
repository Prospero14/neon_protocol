import { describe, it, expect } from 'vitest';
import {
  buildFullCharacter,
  ensureCompleteSheet,
  finalizeCharacterSheet,
  isPlayableSheet,
  isSheetFinalized,
} from './nriCharacterGen';

describe('sheet finalize / no auto-regen', () => {
  it('finalize sets sheetFinalized and ensureComplete does not reshuffle', () => {
    const built = buildFullCharacter({
      classId: 'merc',
      originId: 'neo_tokyo',
      activityId: 'military',
      characterName: 'Тест Фикс',
    });
    const locked = finalizeCharacterSheet({
      ...built.sheet,
      backstory: 'Ручной бэкстори — не трогать',
      abilities: { ...built.sheet.abilities, STR: 18 },
    });
    expect(isSheetFinalized(locked)).toBe(true);
    expect(isPlayableSheet(locked)).toBe(true);

    const a = ensureCompleteSheet(locked, 'merc', 'Тест Фикс');
    const b = ensureCompleteSheet(locked, 'merc', 'Тест Фикс');
    expect(a.backstory).toBe('Ручной бэкстори — не трогать');
    expect(a.abilities.STR).toBe(18);
    expect(a.abilities).toEqual(b.abilities);
    expect(a.backstory).toBe(b.backstory);
    expect(a.augmentations).toEqual(b.augmentations);
  });

  it('playable sheet without flag still skips random rebuild path in ensureComplete', () => {
    const sheet = {
      abilities: { STR: 14, DEX: 12, CON: 11, INT: 10, TEC: 10, PEO: 10 },
      level: 1,
      proficiencyBonus: 2,
      hpMax: 12,
      hp: 12,
      ac: 12,
      characterName: 'Старый сейв',
      backstory: 'legacy',
      height: '180 cm',
      weight: '70 kg',
      skin: 'светлая',
      hair: 'чёрные',
      eyes: 'карие',
      culture: 'японская',
    };
    expect(isPlayableSheet(sheet)).toBe(true);
    const once = ensureCompleteSheet(sheet, 'fixer', 'Старый сейв');
    const twice = ensureCompleteSheet(sheet, 'fixer', 'Старый сейв');
    expect(once.backstory).toBe('legacy');
    expect(once.abilities.STR).toBe(14);
    expect(once.characterName).toBe(twice.characterName);
    expect(once.vice).toBe(twice.vice);
  });
});
