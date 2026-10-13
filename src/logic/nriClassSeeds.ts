/** Готовые пресеты по классам Carbon 2185 (лист стр. 283 — статы placeholder). */

import type { NriClassId } from './nriClasses';
import { getC2185ClassTemplate } from './nriCarbon2185';
import { abilityModifier, type NriSheetData } from './nriNpcGenerator';
import { enrichSheetCombat } from './nriSheetCombat';

export type ClassSeedPreset = {
  label: string;
  classId: NriClassId;
  sheet: NriSheetData;
  inventory: { id: string; name: string; qty?: number }[];
};

const SEED_ABILITIES: Record<NriClassId, NriSheetData['abilities']> = {
  daimyo: { STR: 15, DEX: 12, CON: 14, INT: 10, TEC: 9, PEO: 11 },
  doc: { STR: 9, DEX: 11, CON: 12, INT: 14, TEC: 15, PEO: 10 },
  merc: { STR: 13, DEX: 13, CON: 12, INT: 10, TEC: 11, PEO: 9 },
  hacker: { STR: 8, DEX: 12, CON: 10, INT: 14, TEC: 16, PEO: 9 },
  detective: { STR: 10, DEX: 13, CON: 11, INT: 15, TEC: 12, PEO: 11 },
  fixer: { STR: 10, DEX: 14, CON: 11, INT: 13, TEC: 11, PEO: 14 },
};

function sheetFor(classId: NriClassId): NriSheetData {
  const tpl = getC2185ClassTemplate(classId);
  const abilities = SEED_ABILITIES[classId];
  const conMod = abilityModifier(abilities.CON);
  const dexMod = abilityModifier(abilities.DEX);
  const hitDie = tpl?.hitDie ?? 'd8';
  const hpBase = hitDie === 'd12' ? 12 : hitDie === 'd10' ? 10 : 8;
  const hpMax = hpBase + conMod;
  return enrichSheetCombat(
    {
      abilities,
      level: 1,
      proficiencyBonus: 2,
      hpMax: Math.max(1, hpMax),
      hp: Math.max(1, hpMax),
      ac: 10 + dexMod,
      origin: 'Neo-Tokyo',
      notes: `Стартовый ${tpl?.carbonName ?? classId} — правьте статы на столе.`,
    },
    classId
  );
}

export const NRI_CLASS_SEEDS: ClassSeedPreset[] = [
  {
    label: 'Даймё',
    classId: 'daimyo',
    sheet: sheetFor('daimyo'),
    inventory: [
      { id: 'w_katana', name: 'Катана', qty: 1 },
      { id: 'a_medium', name: 'Средний бронежилет', qty: 1 },
    ],
  },
  {
    label: 'Док',
    classId: 'doc',
    sheet: sheetFor('doc'),
    inventory: [
      { id: 'g_medkit', name: 'Набор MediStim', qty: 2 },
      { id: 'a_light', name: 'Лёгкая броня и шлем', qty: 1 },
    ],
  },
  {
    label: 'Наёмник',
    classId: 'merc',
    sheet: sheetFor('merc'),
    inventory: [
      { id: 'w_smg', name: 'ПП + 2 магазина', qty: 1 },
      { id: 'a_light', name: 'Лёгкая броня', qty: 1 },
    ],
  },
  {
    label: 'Хакер',
    classId: 'hacker',
    sheet: sheetFor('hacker'),
    inventory: [
      { id: 'd_deck', name: 'Кибердека (базовая)', qty: 1 },
      { id: 'g_interface', name: 'Интерфейс-джеки', qty: 1 },
    ],
  },
  {
    label: 'Детектив',
    classId: 'detective',
    sheet: sheetFor('detective'),
    inventory: [
      { id: 'w_pistol', name: 'Пистолет с глушителем', qty: 1 },
      { id: 'g_binoc', name: 'Оптический бинокль', qty: 1 },
    ],
  },
  {
    label: 'Пройдоха',
    classId: 'fixer',
    sheet: sheetFor('fixer'),
    inventory: [
      { id: 'w_knife', name: 'Мононож', qty: 1 },
      { id: 'g_lockpick', name: 'Отмычки', qty: 1 },
    ],
  },
];
