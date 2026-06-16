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

import type { C2185RulesSection } from './nriCarbon2185RulesExtended';

export type { C2185RulesSection };

/** Краткая сводка для игроков — Part IV + лист. */
export const C2185_RULES: C2185RulesSection[] = [
  {
    title: 'Словарь за 30 секунд',
    intro: 'Английские термины из книги — вот что они значат в игре.',
    lines: [
      'Проверка (ability check) — бросок d20 + мод характеристики, чтобы понять, получилось ли действие.',
      'Навык (skill) — та же формула, но мастер смотрит на конкретный навык (Stealth, Hacking…).',
      'Владение (proficiency) — бонус +2…+6 за уровень; добавляется, если вы обучены навыку, оружию или спасброску.',
      'Преимущество (advantage) — бросьте 2d20, возьмите лучший. Помеха (disadvantage) — худший.',
      'DC (сложность) — число, которое нужно набрать или превзойти.',
      'AC (класс брони) — порог попадания по вам; атака попала, если d20 + бонусы ≥ AC.',
      'HP (хиты) — запас здоровья; 0 HP — без сознания и спасброски от смерти.',
      'Спасбросок (save) — реакция на опасность: Fortitude (ВЫН), Reflex (ЛОВ), Mind (ИНТ).',
    ],
  },
  {
    title: 'Шесть характеристик',
    intro: 'Каждая характеристика даёт модификатор к броскам. На листе — score (число) и mod (бонус).',
    lines: [
      'СИЛ (STR) — грубая сила, урон в ближнем бою, угроза (Intimidation), Athletics.',
      'ЛОВ (DEX) — рефлексы, скрытность, стрельба; в лёгкой броне AC часто завязан на ЛОВ.',
      'ВЫН (CON) — здоровье, стойкость к яду и усталости; от неё растут HP и лимит Blood Tox.',
      'ИНТ (INT) — память, анализ, расследование; спасбросок Mind против психики и ICE.',
      'ТЕХ (TEC) — техника: взлом, медицина, механика, дроны, Computing.',
      'ЛЮД (PEO) — люди: убеждение, обман, присутствие, чтение мотивов.',
    ],
    examples: [
      'ЛОВ 16 → мод +3. Проверка Stealth: d20 + 3 (+2 владение, если навык есть) против DC мастера.',
      'Модификатор: 10–11 = +0; каждые +2 к score дают +1 к mod (12–13 → +1, 14–15 → +2 и т.д.).',
    ],
  },
  {
    title: 'Проверки и сложность',
    intro: 'Когда исход неочевиден, мастер просит бросок. Вы описываете действие — он называет навык и DC.',
    lines: [
      'Формула: d20 + мод характеристики + владение (если есть). Успех, если итог ≥ DC.',
      'Состязание: два персонажа бросают противоположные проверки — побеждает больший результат.',
      'Очень легко DC 5 · Легко 10 · Средне 15 · Сложно 20 · Очень сложно 25 · Почти невозможно 30.',
      'Преимущество и помеха не складываются: если есть оба — бросайте один обычный d20.',
    ],
    examples: [
      'Взломать дверь: мастер говорит «Mechanics или Athletics, DC 15». У вас ТЕХ 14 (+2) и владение Mechanics (+2) → бросаете d20+4.',
      'Убедить охранника: Persuasion (ЛЮД), DC зависит от настроения NPC — дружелюбный проще, враждебный сложнее.',
    ],
  },
  {
    title: 'Бой: атака и урон',
    intro: 'В свой ход вы можете двигаться и совершить одно действие (часто — Attack). Подробности — во вкладке «Бой».',
    lines: [
      'Бросок атаки: d20 + мод (СИЛ в ближнем, ЛОВ в дальнем) + владение оружием против AC цели.',
      'Попадание: бросьте кости урона оружия. Ближний бой: + мод СИЛ. Огнестрел: только кости, без мода характеристики.',
      'Натуральная 20 — крит: удваиваются кости урона (модификаторы не удваиваются).',
      'Натуральная 1 — промах, даже если математически хватало бонусов (кроме особых способностей).',
      'Владение оружием даёт +proficiency к атаке; без владения бьёте только модом характеристики.',
    ],
    examples: [
      'Пистолет 2d4, ЛОВ +3, владение +2, AC врага 14. Атака: d20+5 ≥ 14 — попадание; урон: 2d4 (без +3).',
      'Мононож 1d4+3 (СИЛ), крит: 2d4+3.',
    ],
  },
  {
    title: 'Спасброски',
    intro: 'Спасбросок — не ваш ход, а реакция на угрозу: взрыв, яд, психоатака.',
    lines: [
      'Fortitude (ВЫН) — токсины, болезни, истощение, жёсткий физический стресс.',
      'Reflex (ЛОВ) — увернуться от взрыва, ловушки, упасть с крыши помягче.',
      'Mind (ИНТ) — страх, киберпсихоз, ментальные эксплойты, давление на нейролинк.',
      'Формула: d20 + мод характеристики + владение (если класс владеет этим save).',
    ],
    examples: [
      'Граната: Reflex DC 15 — провал = полный урон, успех = половина (если мастер не указал иначе).',
      'Доза Crush: Fortitude против DC зависимости — провал ведёт к зависимости (см. вкладку «Жизнь»).',
    ],
  },
  {
    title: 'HP, броня, 0 хитов',
    intro: 'HP — не только «раны», но и удача и воля выжить. Броня и укрытия делают вас сложнее для попадания.',
    lines: [
      'AC = 10 + мод ЛОВ + бонус брони (тяжёлая броня может ограничивать ЛОВ — смотрите лист).',
      'DR (damage reduction) — вычитает фиксированный урон типа, напр. DR/2 Ballistic.',
      '0 HP — падение без сознания; в начале каждого хода — спасбросок от смерти (d20, 10+ успех).',
      '3 успеха — стабилизация; 3 провала — смерть. Натуральная 1 на death save = два провала; 20 = +1 HP.',
      'Урон, пока вы на 0 HP, = автоматический провал death save; урон ≥ max HP — мгновенная смерть.',
    ],
    examples: [
      'У вас 8 HP, получили 12 урона — 0 HP и два провала death save (урон больше 0).',
      'За укрытием наполовину: +2 к AC и Reflex — сложнее попасть и задеть взрывом.',
    ],
  },
  {
    title: 'Лист в Neon Protocol',
    intro: 'Сервис повторяет поля Carbon 2185 и считает часть значений автоматически.',
    lines: [
      'Происхождение и класс — откуда персонаж и чем зарабатывает на жизнь; задают навыки и HP.',
      'Порок — слабость из таблицы d100; влияет на ролевку и простой между миссиями.',
      'Влияние (Influence) — репутация у корпов или на улице; открывает рынки и контакты.',
      'Вонлонги (₩) — валюта; вес снаряжения — перегруз замедляет (encumbered / heavily encumbered).',
      'Blood Tox: лимит = 10 + мод ВЫН; текущий = сумма BT имплантов. Выше лимита — риск киберпсихоза (вкладка «Киберпсихоз»).',
    ],
  },
  {
    title: 'Импланты на столе',
    intro: 'Киберимпланты — отдельная подсистема в конструкторе NRI; здесь — только то, что важно игроку.',
    lines: [
      'Один функциональный имплант на слот тела (рука, нога, нейролинк, торс…).',
      'Косметика обычно не даёт BT, но не заменяет боевой модуль в том же месте без решения мастера.',
      'Сборка: корпус + модули; суммарный BT и питание должны влезать в лимиты персонажа и ячейки.',
      'Слишком мощный CPU/RAM без питания — перегруз и ghosting; детали — у риппердока и во вкладке «Киберпсихоз».',
    ],
  },
];
