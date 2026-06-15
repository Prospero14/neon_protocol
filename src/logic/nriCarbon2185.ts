/** Carbon 2185 — поля листа и сводка правил (по Core Rulebook, стр. 283–284). */

import type { NriClassId } from './nriClasses';

export const C2185_ABILITIES = ['STR', 'DEX', 'CON', 'INT', 'TEC', 'PEO'] as const;

export const C2185_SAVING_THROWS = [
  { id: 'fort', label: 'Fortitude', ability: 'CON' },
  { id: 'ref', label: 'Reflex', ability: 'DEX' },
  { id: 'mind', label: 'Mind', ability: 'INT' },
] as const;

export const C2185_SKILLS: { name: string; ability: string }[] = [
  { name: 'Acrobatics', ability: 'DEX' },
  { name: 'Athletics', ability: 'STR' },
  { name: 'Bureaucracy', ability: 'PEO' },
  { name: 'Computing', ability: 'TEC' },
  { name: 'Deception', ability: 'PEO' },
  { name: 'Engineering', ability: 'INT' },
  { name: 'Gambling', ability: 'INT' },
  { name: 'Hacking', ability: 'TEC' },
  { name: 'History', ability: 'INT' },
  { name: 'Intimidation', ability: 'STR' },
  { name: 'Investigation', ability: 'INT' },
  { name: 'Mechanics', ability: 'TEC' },
  { name: 'Medicine', ability: 'TEC' },
  { name: 'Navigation', ability: 'INT' },
  { name: 'Perception', ability: 'INT' },
  { name: 'Performance', ability: 'PEO' },
  { name: 'Persuasion', ability: 'PEO' },
  { name: 'Presence', ability: 'PEO' },
  { name: 'Religion', ability: 'INT' },
  { name: 'Robotics', ability: 'TEC' },
  { name: 'Sense Motive', ability: 'PEO' },
  { name: 'Sleight of Hand', ability: 'DEX' },
  { name: 'Stealth', ability: 'DEX' },
  { name: 'Streetwise', ability: 'INT' },
  { name: 'Tracking', ability: 'INT' },
  { name: 'Vehicles (Aircraft)', ability: 'TEC' },
  { name: 'Vehicles (Land)', ability: 'DEX' },
];

export type C2185ClassTemplate = {
  carbonName: string;
  hitDie: string;
  hpAt1: string;
  saveProficiencies: string[];
  armor: string;
  weapons: string;
  skillsPick: string;
  signature: string;
  traits: string[];
};

export const C2185_CLASS_TEMPLATES: Record<NriClassId, C2185ClassTemplate> = {
  daimyo: {
    carbonName: 'Daimyo',
    hitDie: 'd12',
    hpAt1: '12 + CON',
    saveProficiencies: ['Fortitude'],
    armor: 'Medium, Heavy',
    weapons: 'Melee, Pistols, SMG, Shotguns, Heavy',
    skillsPick: '2 из Athletics, Intimidation, Perception, Persuasion, Presence, Vehicles',
    signature: 'Fury — бонусное действие, 1 мин: adv на STR и Fortitude; +2 урона оружием (STR); resist blunt/pierce/slash',
    traits: ['Fury ×2/день (1 ур.)', 'Rallying Cry (2 ур.)', 'Danger Sense (2 ур.)'],
  },
  doc: {
    carbonName: 'Doc',
    hitDie: 'd8',
    hpAt1: '8 + CON',
    saveProficiencies: ['Fortitude', 'Mind'],
    armor: 'Light, Medium + шлем',
    weapons: 'Melee, Pistols, SMG, Shotguns',
    skillsPick: '2 из Computing, Medicine, Mechanics, Perception, Persuasion, Sense Motive',
    signature: 'Basic Healing — лечение союзника (наноботы / медимплант)',
    traits: ['Basic Healing', 'Специализация: Combat Medic или Cybersurgeon (1 ур.)'],
  },
  merc: {
    carbonName: 'Enforcer',
    hitDie: 'd10',
    hpAt1: '10 + CON',
    saveProficiencies: ['Fortitude'],
    armor: 'Вся броня + шлем',
    weapons: 'Всё оружие',
    skillsPick: '2 из Acrobatics, Athletics, Intimidation, Navigation, Perception, Sense Motive, Vehicles (Land)',
    signature: 'Fighting Style + Second Wind — стиль боя и восстановление HP',
    traits: ['Fighting Style (1 ур.)', 'Second Wind (1 ур.)', 'Combat Archetype (3 ур.): Marine / Street Samurai / …'],
  },
  hacker: {
    carbonName: 'Hacker',
    hitDie: 'd8',
    hpAt1: '8 + CON',
    saveProficiencies: ['Reflex', 'Mind'],
    armor: 'Light + шлем',
    weapons: 'Melee, Pistols, SMG, Shotguns',
    skillsPick: '2 из Computing, Hacking, Investigation, Mechanics, Perception, Streetwise',
    signature: 'Exploits — девять хакерских эксплойтов с 1 уровня',
    traits: ['9 Exploits (1 ур.)', 'Специализация: Combat Hacker или Robomancer (3 ур.)'],
  },
  detective: {
    carbonName: 'Investigator',
    hitDie: 'd8',
    hpAt1: '8 + CON',
    saveProficiencies: ['Reflex'],
    armor: 'Light, Medium',
    weapons: 'Melee, Pistols, Shotguns',
    skillsPick: '2 из Bureaucracy, Investigation, Perception, Persuasion, Sense Motive, Streetwise',
    signature: 'Deduction — бонусы к расследованию и социальным проверкам',
    traits: ['Deduction (1 ур.)', 'Private Investigator или Journalist (3 ур.)'],
  },
  fixer: {
    carbonName: 'Scoundrel',
    hitDie: 'd8',
    hpAt1: '8 + CON',
    saveProficiencies: ['Reflex'],
    armor: 'Light',
    weapons: 'Melee, Pistols, SMG, Shotguns',
    skillsPick: '2 из Acrobatics, Deception, Sleight of Hand, Stealth, Streetwise, Vehicles (Land)',
    signature: 'Sneak Attack — доп. кость урона при преимуществе / неожиданности',
    traits: ['Sneak Attack (1 ур.)', 'Expertise (1 ур.)', 'Smuggler или Thief (3 ур.)'],
  },
};

export function getC2185ClassTemplate(classId: string): C2185ClassTemplate | undefined {
  return C2185_CLASS_TEMPLATES[classId as NriClassId];
}

export type C2185RulesSection = { title: string; lines: string[] };

/** Краткая сводка для игроков — Part IV + бой. */
export const C2185_RULES: C2185RulesSection[] = [
  {
    title: 'Характеристики',
    lines: [
      'STR — сила, ближний бой, Athletics, Intimidation.',
      'DEX — ловкость, AC (лёгкая броня), Reflex, Acrobatics, Stealth, Vehicles (Land).',
      'CON — выносливость, HP, Fortitude.',
      'INT — логика, Mind save, Investigation, Perception, Streetwise.',
      'TEC — техника, Hacking, Medicine, Mechanics, Computing.',
      'PEO — социалка, Persuasion, Deception, Presence, Sense Motive.',
      'Модификатор: 10–11 → +0; каждые ±2 к score → ±1 mod (см. таблицу в книге).',
    ],
  },
  {
    title: 'Проверки и DC',
    lines: [
      'Проверка: d20 + модификатор характеристики [+ proficiency, если владение навыком].',
      'Успех, если результат ≥ DC мастера.',
      'DC: Very Easy 5 · Easy 10 · Medium 15 · Hard 20 · Very Hard 25 · Nearly Impossible 30.',
      'Contest: оба бросают, побеждает больший результат.',
      'Advantage / Disadvantage: брось 2d20, возьми лучший / худший.',
    ],
  },
  {
    title: 'Proficiency & атаки',
    lines: [
      'Proficiency Bonus зависит от уровня (+2 на 1–4 ур., дальше растёт).',
      'Добавляется к владению навыком, saving throw (если proficient) и attack roll.',
      'Атака: d20 + mod + proficiency (если владение оружием) vs AC цели.',
      'Урон ближним: кости оружия + STR mod. Огнестрел: кости оружия без mod характеристики.',
      'Natural 20 = critical hit — удвоенные кости урона.',
    ],
  },
  {
    title: 'Saving throws',
    lines: [
      'Fortitude (CON) — яд, болезнь, выносливость.',
      'Reflex (DEX) — ловкость, взрывы, укрытие.',
      'Mind (INT) — психика, ghosting, ментальные эффекты.',
      'Save: d20 + mod характеристики [+ proficiency].',
    ],
  },
  {
    title: 'HP, броня, смерть',
    lines: [
      'HP = физическая и ментальная стойкость; 0 HP → unconscious + death saves.',
      'Death save: d20, 10+ = success; 3 успеха = stable, 3 провала = смерть.',
      'AC = 10 + DEX (+ броня). D/R снимает фикс. урон типа (напр. DR/2 Ballistic).',
      'Half cover +2 AC/Reflex; Three-quarters +5; Total cover — нельзя таргетить.',
    ],
  },
  {
    title: 'Лист персонажа',
    lines: [
      'Заполняйте поля листа Carbon 2185 (стр. 283–284): Origin, Influence, Vice, Augmentations.',
      'Blood Tox Limit = 10 + мод ВЫН; Current — сумма BT всех имплантов. Превышение → киберпсихоз / ghosting.',
      'Wonlongs (₩) — валюта; Equipment + Weight — перегруз.',
      'Класс задаёт Hit Die, saves, владения и Features — см. свой лист класса.',
    ],
  },
  {
    title: 'Киберимпланты (Augmentations)',
    lines: [
      'Один функциональный имплант на анатомический слот (рука, нога, нейролинк…).',
      'Косметика — отдельно, обычно BT 0; не заменяет боевые модули без согласия мастера.',
      'Питание: расход не выше ёмкости ячейки. Высокий CPU/RAM у нейроимплантов повышает риск ghosting.',
      'Конструктор стола проверяет лимиты сборки; итоговый BT суммируется на листе персонажа.',
    ],
  },
];
