/**
 * Генерация полного чарника C2185: происхождение, деятельность, бэкстори, мета-поля.
 */

import type { NriClassId } from './nriClasses';
import { getC2185ClassTemplate } from './nriCarbon2185';
import {
  getBloodToxLimit,
  parseAugmentedSheet,
  type AugmentedSheet,
  type InstalledAugmentation,
} from './nriCyberInstall';
import {
  blueprintToInventoryItem,
  bloodToxLimitFromCon,
  CYBER_BLUEPRINT_PRESETS,
  type CyberBlueprint,
} from './nriCyberware';
import {
  abilityModifier,
  buildSheetForClass,
  parseNriSheet,
  rollAbilityScores,
  rollNpcName,
  type NriSheetData,
} from './nriNpcGenerator';
import { enrichSheetCombat } from './nriSheetCombat';
import { defaultSkillsForClass } from './nriSkillPick';

export type NriOriginId =
  | 'neo_tokyo'
  | 'hong_kong'
  | 'los_angeles'
  | 'london'
  | 'moscow'
  | 'sao_paulo'
  | 'offworld';

export type NriActivityId =
  | 'street'
  | 'corp'
  | 'military'
  | 'medical'
  | 'criminal'
  | 'tech'
  | 'media'
  | 'nomad';

export type NriNpcArchetypeId =
  | 'civilian'
  | 'street_bum'
  | 'addict'
  | 'merchant'
  | 'ripperdoc'
  | 'gang'
  | 'corp_exec'
  | 'robot'
  | 'cop'
  | 'fixer'
  | 'netrunner'
  | 'mercenary';

export const NRI_ORIGINS: { id: NriOriginId; label: string; blurb: string }[] = [
  { id: 'neo_tokyo', label: 'Нео-Токио', blurb: 'Плотный мегаполис, корпы и якудза.' },
  { id: 'hong_kong', label: 'Гонконг', blurb: 'Порты, контрабанда, триады.' },
  { id: 'los_angeles', label: 'Лос-Анджелес', blurb: 'Студии, банды, шоссе.' },
  { id: 'london', label: 'Лондон', blurb: 'Серый туман, финансы, подполье.' },
  { id: 'moscow', label: 'Москва', blurb: 'Силовики, хакеры, снег и неон.' },
  { id: 'sao_paulo', label: 'Сан-Паулу', blurb: 'Фавелы, дроны, жара.' },
  { id: 'offworld', label: 'Колония', blurb: 'Орбита или Марс — чужая атмосфера.' },
];

export const NRI_ACTIVITIES: { id: NriActivityId; label: string }[] = [
  { id: 'street', label: 'Улица / выживание' },
  { id: 'corp', label: 'Корпорация' },
  { id: 'military', label: 'Армия / охрана' },
  { id: 'medical', label: 'Медицина' },
  { id: 'criminal', label: 'Криминал' },
  { id: 'tech', label: 'Тех / инженерия' },
  { id: 'media', label: 'Медиа / инфлюенс' },
  { id: 'nomad', label: 'Кочевник / караван' },
];

export const NRI_NPC_ARCHETYPES: {
  id: NriNpcArchetypeId;
  label: string;
  blurb: string;
  defaultClass?: NriClassId;
  isRobot?: boolean;
}[] = [
  { id: 'civilian', label: 'Гражданский', blurb: 'Обычный житель мегаполиса.', defaultClass: 'fixer' },
  { id: 'street_bum', label: 'Бомж / уличный', blurb: 'Нет дома, есть история и нож.', defaultClass: 'merc' },
  { id: 'addict', label: 'Торчок', blurb: 'Зависимость, долги, отчаяние.', defaultClass: 'fixer' },
  { id: 'merchant', label: 'Торговец', blurb: 'Лавка, контакты, товар.', defaultClass: 'fixer' },
  { id: 'ripperdoc', label: 'Риппердок', blurb: 'Импланты, подпольная клиника.', defaultClass: 'doc' },
  { id: 'gang', label: 'Бандит / якудза', blurb: 'Территория, кодекс, насилие.', defaultClass: 'merc' },
  { id: 'corp_exec', label: 'Корп-менеджер', blurb: 'Костюм, доступ, интриги.', defaultClass: 'daimyo' },
  { id: 'robot', label: 'Робот / андроид', blurb: 'Синтетическое тело, прошивка.', defaultClass: 'hacker', isRobot: true },
  { id: 'cop', label: 'Коп / силовик', blurb: 'Закон на стороне того, кто платит.', defaultClass: 'merc' },
  { id: 'fixer', label: 'Фиксер', blurb: 'Связи, сделки, информация.', defaultClass: 'fixer' },
  { id: 'netrunner', label: 'Нетраннер', blurb: 'ICE, деки, цифровые тени.', defaultClass: 'hacker' },
  { id: 'mercenary', label: 'Наёмник', blurb: 'Контракт, ствол, репутация.', defaultClass: 'merc' },
];

export type CharacterMetaDraft = {
  characterName?: string;
  level?: number;
  originId?: NriOriginId;
  activityId?: NriActivityId;
  age?: string;
  career?: string;
  yearsServed?: string;
  streetInfluence?: string;
  corporateInfluence?: string;
  backstory?: string;
  npcArchetypeId?: NriNpcArchetypeId;
};

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function stableHash(...parts: (string | number | undefined)[]): number {
  let h = 2166136261;
  for (const p of parts) {
    const s = String(p ?? '');
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
  }
  return h >>> 0;
}

class SeededRng {
  private state: number;

  constructor(seed: number) {
    this.state = seed || 1;
  }

  next(): number {
    this.state = (this.state * 1664525 + 1013904223) >>> 0;
    return this.state / 0x100000000;
  }

  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)]!;
  }

  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }
}

function resolveOriginId(originLabel?: string): NriOriginId {
  if (!originLabel) return 'neo_tokyo';
  const hit = NRI_ORIGINS.find((o) => o.label === originLabel || o.id === originLabel);
  return hit?.id ?? 'neo_tokyo';
}

export function activityForClass(classId: NriClassId): NriActivityId {
  return (
    {
      daimyo: 'military',
      doc: 'medical',
      merc: 'military',
      hacker: 'tech',
      detective: 'street',
      fixer: 'criminal',
    } as const
  )[classId];
}

export function archetypeForClass(classId: NriClassId): NriNpcArchetypeId {
  return (
    {
      hacker: 'netrunner',
      merc: 'mercenary',
      fixer: 'fixer',
      daimyo: 'corp_exec',
      doc: 'civilian',
      detective: 'cop',
    } as const
  )[classId];
}

const SKIN_BY_ORIGIN: Record<NriOriginId, string[]> = {
  neo_tokyo: ['бледная', 'оливковая', 'светлая с неон-тату', 'загорелая'],
  hong_kong: ['жёлтая', 'смуглая', 'бледная', 'с шрамами на руках'],
  los_angeles: ['загорелая', 'оливковая', 'светлая', 'солнечные ожоги'],
  london: ['бледная', 'серая', 'фарфоровая', 'веснушки'],
  moscow: ['бледная', 'смуглая', 'румяная', 'синяки под глазами'],
  sao_paulo: ['смуглая', 'оливковая', 'тёмная', 'загорелая'],
  offworld: ['бледная от рециркуляции', 'сероватая', 'синтетическая', 'обожжённая радиацией'],
};

const CULTURE_BY_ORIGIN: Record<NriOriginId, string> = {
  neo_tokyo: 'Japanese',
  hong_kong: 'Cantonese',
  los_angeles: 'American',
  london: 'British',
  moscow: 'Russian',
  sao_paulo: 'Brazilian',
  offworld: 'Colonial',
};

const HAIR_OPTIONS = [
  'чёрные',
  'белые подкрашенные',
  'бритая голова',
  'неон-синие',
  'рыжие',
  'серебристые синтетические',
  'короткие',
  'дреды',
] as const;

const EYE_OPTIONS = [
  'карие',
  'янтарные',
  'голубые',
  'кибернетические красные',
  'зелёные',
  'фиолетовые имплант',
  'серые',
] as const;

const VICE_BY_ARCH: Record<NriNpcArchetypeId, string[]> = {
  civilian: ['Synthohol', 'Nicotine', 'Gambling'],
  street_bum: ['Cheap synthohol', 'Nicotine patches', 'Scrap inhalants'],
  addict: ['Synthcoke', 'Neuro-stim', 'Black ICE trip'],
  merchant: ['Gambling', 'Nicotine', 'Corporate stim'],
  ripperdoc: ['Medical stims', 'Nicotine', 'Adrenaline shots'],
  gang: ['Combat stims', 'Synthcoke', 'Nicotine'],
  corp_exec: ['Corporate stim', 'Wine synth', 'Nicotine'],
  robot: ['Power surge', 'Firmware patches', 'None documented'],
  cop: ['Nicotine', 'Combat stims', 'Synthohol'],
  fixer: ['Gambling', 'Nicotine', 'Synthohol'],
  netrunner: ['ICE rush', 'Data binge', 'Neuro-stim'],
  mercenary: ['Combat stims', 'Nicotine', 'Synthohol'],
};

const ARCH_AUG_SLOTS: Record<NriNpcArchetypeId, string[]> = {
  civilian: [],
  street_bum: ['cosmetic'],
  addict: ['cosmetic'],
  merchant: ['cosmetic'],
  ripperdoc: ['cosmetic', 'torso'],
  gang: ['arm', 'cosmetic'],
  corp_exec: ['neural', 'head'],
  robot: ['arm', 'neural', 'head'],
  cop: ['torso'],
  fixer: ['neural'],
  netrunner: ['neural'],
  mercenary: ['arm'],
};

function pickBlueprint(slot: string, archetypeId?: NriNpcArchetypeId): CyberBlueprint | undefined {
  const candidates = CYBER_BLUEPRINT_PRESETS.filter((p) => p.slot === slot);
  if (!candidates.length) return undefined;
  if (slot === 'arm' && (archetypeId === 'gang' || archetypeId === 'mercenary')) {
    return candidates.find((c) => c.name.includes('базовый')) ?? candidates[0];
  }
  if (slot === 'arm' && archetypeId === 'robot') {
    return candidates.find((c) => c.name.includes('неон')) ?? candidates[0];
  }
  return candidates[0];
}

function installedFromBlueprint(bp: CyberBlueprint, idx: number): InstalledAugmentation {
  const item = blueprintToInventoryItem(bp);
  return {
    itemId: `gen_aug_${idx}_${Date.now()}`,
    name: item.name,
    slot: item.cyber!.slot,
    bloodTox: item.cyber!.bloodTox ?? 0,
    blurb: item.blurb,
    c2185Mods: item.c2185Mods,
    cyber: item.cyber,
    installedAt: Date.now() + idx,
  };
}

function generateAugmentations(
  archetypeId?: NriNpcArchetypeId,
  classId?: NriClassId
): InstalledAugmentation[] {
  const slots = new Set<string>();
  const blueprints: CyberBlueprint[] = [];

  const addSlot = (slot: string, arch?: NriNpcArchetypeId) => {
    if (slots.has(slot)) return;
    const bp = pickBlueprint(slot, arch ?? archetypeId);
    if (bp) {
      slots.add(slot);
      blueprints.push(bp);
    }
  };

  for (const slot of archetypeId ? ARCH_AUG_SLOTS[archetypeId] : []) addSlot(slot);

  const classSlots: Partial<Record<NriClassId, string[]>> = {
    hacker: ['neural'],
    merc: ['arm'],
    doc: ['torso'],
    daimyo: ['torso', 'head'],
    detective: ['head'],
    fixer: ['neural'],
  };
  if (classId) {
    for (const slot of classSlots[classId] ?? []) addSlot(slot);
  }

  return blueprints.map((bp, i) => installedFromBlueprint(bp, i));
}

function generateBio(
  originId: NriOriginId,
  archetypeId?: NriNpcArchetypeId,
  isRobot?: boolean,
  rng: SeededRng = new SeededRng(Math.random() * 0x7fffffff)
): Pick<NriSheetData, 'height' | 'weight' | 'skin' | 'hair' | 'eyes' | 'culture'> {
  if (isRobot || archetypeId === 'robot') {
    return {
      height: `${175 + rng.int(0, 14)} cm (шасси)`,
      weight: `${80 + rng.int(0, 39)} kg`,
      skin: 'синтетическая оболочка',
      hair: rng.pick(['отсутствует', 'синтетические волокна', 'LED-полосы'] as const),
      eyes: 'оптика v3',
      culture: 'Machine',
    };
  }
  const h = 160 + rng.int(0, 34);
  const w = 55 + rng.int(0, 44);
  return {
    height: `${h} cm`,
    weight: `${w} kg`,
    skin: rng.pick(SKIN_BY_ORIGIN[originId] ?? SKIN_BY_ORIGIN.neo_tokyo),
    hair: rng.pick(HAIR_OPTIONS),
    eyes: rng.pick(EYE_OPTIONS),
    culture: CULTURE_BY_ORIGIN[originId] ?? 'Mixed',
  };
}

function generateVice(archetypeId?: NriNpcArchetypeId, rng: SeededRng = new SeededRng(Math.random() * 0x7fffffff)): string {
  if (archetypeId) return rng.pick(VICE_BY_ARCH[archetypeId]);
  return rng.pick(['Synthohol', 'Nicotine', 'Gambling', 'None documented'] as const);
}

function encumbranceFromStr(str: number): Pick<NriSheetData, 'encumberedLb' | 'heavilyEncumberedLb' | 'maxCarryLb'> {
  const max = str * 15;
  return {
    encumberedLb: String(Math.floor(max * 0.67)),
    heavilyEncumberedLb: String(Math.floor(max * 0.83)),
    maxCarryLb: String(max),
  };
}

function proficiencyForLevel(level: number): number {
  if (level >= 9) return 4;
  if (level >= 5) return 3;
  return 2;
}

function sheetNeedsGeneration(sheet: AugmentedSheet | null): boolean {
  if (!sheet) return true;
  if (!sheet.abilities) return true;
  return false;
}

/** Дозаполняет пропуски без перегенерации уже сохранённых полей (стабильный seed). */
function fillMissingSheetFields(
  sheet: AugmentedSheet,
  classId: NriClassId,
  displayName?: string
): AugmentedSheet {
  const seed = stableHash(displayName ?? sheet.characterName ?? '', classId, sheet.origin ?? '');
  const rng = new SeededRng(seed);
  const originId = resolveOriginId(sheet.origin);
  const archetypeId = archetypeForClass(classId);
  const arch = NRI_NPC_ARCHETYPES.find((a) => a.id === archetypeId);
  const bioNeeded = !sheet.height || !sheet.weight || !sheet.skin || !sheet.hair || !sheet.eyes || !sheet.culture;
  const bio = bioNeeded ? generateBio(originId, archetypeId, arch?.isRobot, rng) : null;
  const augmentations = sheet.augmentations ?? [];
  const bloodToxCurrent =
    sheet.bloodToxCurrent ?? augmentations.reduce((s, a) => s + a.bloodTox, 0);
  const enc =
    sheet.encumberedLb && sheet.maxCarryLb
      ? {}
      : encumbranceFromStr(sheet.abilities.STR);

  return {
    ...sheet,
    origin: sheet.origin ?? originLabel(originId),
    activity: sheet.activity ?? activityLabel(activityForClass(classId)),
    height: sheet.height ?? bio?.height,
    weight: sheet.weight ?? bio?.weight,
    skin: sheet.skin ?? bio?.skin,
    hair: sheet.hair ?? bio?.hair,
    eyes: sheet.eyes ?? bio?.eyes,
    culture: sheet.culture ?? bio?.culture,
    vice: sheet.vice ?? generateVice(archetypeId, rng),
    augmentations,
    bloodToxCurrent,
    bloodToxLimit: sheet.bloodToxLimit ?? getBloodToxLimit({ ...sheet, augmentations }),
    ...enc,
  };
}

export function ensureCompleteSheet(
  raw: unknown,
  classId: NriClassId,
  displayName?: string
): AugmentedSheet {
  const parsed = parseAugmentedSheet(raw);
  if (parsed && !sheetNeedsGeneration(parsed)) {
    return fillMissingSheetFields(parsed, classId, displayName);
  }

  const built = buildFullCharacter({
    classId,
    originId: 'neo_tokyo',
    activityId: activityForClass(classId),
    archetypeId: archetypeForClass(classId),
    characterName: displayName ?? parsed?.characterName,
    rollStats: !parsed?.abilities,
  });

  if (!parsed) return { ...built.sheet, augmentations: built.sheet.augmentations ?? [] };

  return fillMissingSheetFields(
    {
      ...built.sheet,
      ...parsed,
      abilities: parsed.abilities ?? built.sheet.abilities,
      hp: parsed.hp ?? built.sheet.hp,
      hpMax: parsed.hpMax ?? built.sheet.hpMax,
      ac: parsed.ac ?? built.sheet.ac,
      augmentations: parsed.augmentations?.length ? parsed.augmentations : (built.sheet.augmentations ?? []),
    },
    classId,
    displayName
  );
}

export function isValidPlayerSheet(raw: unknown): raw is NriSheetData {
  return parseNriSheet(raw) !== null;
}

function originLabel(id: NriOriginId): string {
  return NRI_ORIGINS.find((o) => o.id === id)?.label ?? id;
}

function activityLabel(id: NriActivityId): string {
  return NRI_ACTIVITIES.find((a) => a.id === id)?.label ?? id;
}

function archetypeLabel(id: NriNpcArchetypeId): string {
  return NRI_NPC_ARCHETYPES.find((a) => a.id === id)?.label ?? id;
}

const CAREER_BY_ACTIVITY: Record<NriActivityId, string[]> = {
  street: ['Сборщик металлолома', 'Уличный музыкант', 'Вышибала', 'Курьер'],
  corp: ['Менеджер среднего звена', 'Аналитик', 'Охрана объекта', 'HR-бот'],
  military: ['Ветеран корп-армии', 'Частная охрана', 'Инструктор полигона'],
  medical: ['Парамедик', 'Лаборант', 'Уличный док'],
  criminal: ['Сборщик долгов', 'Взломщик', 'Контрабандист'],
  tech: ['Техник сетей', 'Механик дронов', 'Сборщик кибердек'],
  media: ['Блогер', 'Папарацци', 'Редактор фида'],
  nomad: ['Водитель каравана', 'Скаут маршрута', 'Механик конвоя'],
};

function rollInfluence(activity: NriActivityId): { street: string; corp: string } {
  const d6 = () => Math.floor(Math.random() * 6) + 1;
  const base = { street: d6(), corp: d6() };
  if (activity === 'street' || activity === 'criminal' || activity === 'nomad') base.street += 2;
  if (activity === 'corp' || activity === 'media') base.corp += 2;
  if (activity === 'military') {
    base.corp += 1;
    base.street += 1;
  }
  return { street: String(Math.min(10, base.street)), corp: String(Math.min(10, base.corp)) };
}

function rollAge(archetype: NriNpcArchetypeId): string {
  if (archetype === 'robot') return `${18 + Math.floor(Math.random() * 5)} (корпус)`;
  if (archetype === 'street_bum' || archetype === 'addict') return String(28 + Math.floor(Math.random() * 25));
  return String(22 + Math.floor(Math.random() * 28));
}

function rollYears(activity: NriActivityId): string {
  const d6 = () => Math.floor(Math.random() * 6) + 1;
  if (activity === 'military') return String(d6() + d6() + 2);
  if (activity === 'corp') return String(d6() + 2);
  return String(d6());
}

const BACKSTORY_HOOKS: Record<NriNpcArchetypeId, string[]> = {
  civilian: ['Потерял работу после блэкаута сети', 'Ищет пропавшего родственника', 'Свидетель корп-аварии'],
  street_bum: ['Спит в переулке у станции', 'Когда-то служил в корп-армии', 'Собирает хабы для перепродажи'],
  addict: ['Должен банде за «усиление»', 'Гоняется за последним дозой нейро-стима', 'Бывший медик, сломался после войны'],
  merchant: ['Торгует серым железом без лицензии', 'Долг перед поставщиком из Гонконга', 'Клиенты — только по рекомендации'],
  ripperdoc: ['Клиника без вывески в подвале', 'Отказался ставить военный имплант — сбежал', 'Работает на пол-легальных контрактах'],
  gang: ['Метка клана на шее', 'Собирает дань с рынка', 'Мечтает выбить себе место у капитана'],
  corp_exec: ['Ведёт теневой проект', 'Подставлен конкурентом', 'Ищет компромат на совет директоров'],
  robot: ['Память стёрта после инцидента', 'Серийный номер снят', 'Прошивка с багом эмпатии'],
  cop: ['На payroll корпорации', 'Расследует серию убийств в Undercity', 'Продаёт информацию фиксерам'],
  fixer: ['Знает всех в районе', 'Посредник между бандами и корпами', 'Должен крупную сумму синдикату'],
  netrunner: ['Оставил цифровой след в ICE', 'Работает только за крипто', 'Ищет легендарный архив'],
  mercenary: ['Контракт сорван — нужны кредиты', 'Команда погибла на вылазке', 'Дискредитирован бывшим работодателем'],
};

export function generateBackstory(params: {
  name: string;
  originId: NriOriginId;
  activityId: NriActivityId;
  archetypeId?: NriNpcArchetypeId;
  classId: NriClassId;
}): string {
  const origin = originLabel(params.originId);
  const activity = activityLabel(params.activityId);
  const arch = params.archetypeId ? archetypeLabel(params.archetypeId) : 'персонаж';
  const tpl = getC2185ClassTemplate(params.classId);
  const hook = params.archetypeId ? pick(BACKSTORY_HOOKS[params.archetypeId]) : 'Ищет своё место в мегаполисе';
  return (
    `${params.name} — ${arch.toLowerCase()} из ${origin}. ` +
    `Деятельность: ${activity.toLowerCase()}. ` +
    `Класс: ${tpl?.carbonName ?? params.classId}. ` +
    `${hook}.`
  );
}

export type FullCharacterBuild = {
  sheet: NriSheetData;
  meta: Required<Pick<CharacterMetaDraft, 'characterName' | 'level' | 'age' | 'career' | 'yearsServed' | 'streetInfluence' | 'corporateInfluence' | 'backstory'>> & {
    originId: NriOriginId;
    activityId: NriActivityId;
    npcArchetypeId?: NriNpcArchetypeId;
  };
};

export function buildFullCharacter(params: {
  classId: NriClassId;
  originId: NriOriginId;
  activityId: NriActivityId;
  archetypeId?: NriNpcArchetypeId;
  characterName?: string;
  level?: number;
  rollStats?: boolean;
  skillProficiencies?: string[];
}): FullCharacterBuild {
  const arch = params.archetypeId ? NRI_NPC_ARCHETYPES.find((a) => a.id === params.archetypeId) : undefined;
  const abilities = params.rollStats !== false ? rollAbilityScores() : undefined;
  const base = buildSheetForClass(params.classId, abilities);
  const level = params.level ?? 1;
  const name = params.characterName?.trim() || rollNpcName();
  const influence = rollInfluence(params.activityId);
  const career = pick(CAREER_BY_ACTIVITY[params.activityId]);
  const age = params.archetypeId ? rollAge(params.archetypeId) : rollAge('civilian');
  const yearsServed = rollYears(params.activityId);
  const backstory = generateBackstory({
    name,
    originId: params.originId,
    activityId: params.activityId,
    archetypeId: params.archetypeId,
    classId: params.classId,
  });
  const bio = generateBio(params.originId, params.archetypeId, arch?.isRobot);
  const augmentations = generateAugmentations(params.archetypeId, params.classId);
  const bloodToxCurrent = augmentations.reduce((s, a) => s + a.bloodTox, 0);
  const bloodToxLimit = bloodToxLimitFromCon(base.abilities.CON);
  const vice = generateVice(params.archetypeId);
  const dr = augmentations.some((a) => a.slot === 'torso') ? '1' : '0';
  const tpl = getC2185ClassTemplate(params.classId);
  const classFeatures = tpl ? [tpl.signature, ...tpl.traits] : [];
  const skillProficiencies = params.skillProficiencies?.length
    ? params.skillProficiencies
    : defaultSkillsForClass(params.classId);

  let sheet: NriSheetData = enrichSheetCombat(
    {
      ...base,
      ...bio,
      level,
      proficiencyBonus: proficiencyForLevel(level),
      origin: originLabel(params.originId),
      activity: activityLabel(params.activityId),
      npcArchetype: arch?.label,
      characterName: name,
      age,
      career,
      yearsServed,
      streetInfluence: influence.street,
      corporateInfluence: influence.corp,
      backstory,
      vice,
      dr,
      xp: 0,
      deathSaveSuccesses: 0,
      deathSaveFailures: 0,
      augmentations,
      bloodToxCurrent,
      bloodToxLimit,
      classFeatures,
      skillProficiencies,
      ...encumbranceFromStr(base.abilities.STR),
      notes: arch?.isRobot ? 'Синтетик — уточните у мастера иммунитеты и ремонт.' : undefined,
    },
    params.classId
  );

  if (arch?.isRobot) {
    sheet.abilities.CON = Math.max(sheet.abilities.CON, 12);
  }

  return {
    sheet,
    meta: {
      characterName: name,
      level,
      originId: params.originId,
      activityId: params.activityId,
      npcArchetypeId: params.archetypeId,
      age,
      career,
      yearsServed,
      streetInfluence: influence.street,
      corporateInfluence: influence.corp,
      backstory,
    },
  };
}

/** Пресет из сида класса с полным чарником. */
export function enrichClassSeed(
  classId: NriClassId,
  label: string,
  originId: NriOriginId = 'neo_tokyo',
  activityId?: NriActivityId
): FullCharacterBuild {
  const activity =
    activityId ??
    ({
      daimyo: 'military',
      doc: 'medical',
      merc: 'military',
      hacker: 'tech',
      detective: 'street',
      fixer: 'criminal',
    }[classId] as NriActivityId);
  return buildFullCharacter({
    classId,
    originId,
    activityId: activity,
    characterName: label.split('—')[0]?.trim() || label,
    rollStats: false,
  });
}

export function applyMetaToSheet(sheet: NriSheetData, meta: CharacterMetaDraft): NriSheetData {
  const origin = meta.originId ? originLabel(meta.originId) : sheet.origin;
  const activity = meta.activityId ? activityLabel(meta.activityId) : sheet.activity;
  const arch = meta.npcArchetypeId ? archetypeLabel(meta.npcArchetypeId) : sheet.npcArchetype;
  const level = meta.level ?? sheet.level;
  return {
    ...sheet,
    level,
    characterName: meta.characterName ?? sheet.characterName,
    origin,
    activity,
    npcArchetype: arch,
    age: meta.age ?? sheet.age,
    career: meta.career ?? sheet.career,
    yearsServed: meta.yearsServed ?? sheet.yearsServed,
    streetInfluence: meta.streetInfluence ?? sheet.streetInfluence,
    corporateInfluence: meta.corporateInfluence ?? sheet.corporateInfluence,
    backstory: meta.backstory ?? sheet.backstory,
    proficiencyBonus: proficiencyForLevel(level),
  };
}

export function sheetToMetaDraft(sheet: NriSheetData | null | undefined, fallbackName?: string): CharacterMetaDraft {
  return {
    characterName: sheet?.characterName ?? fallbackName,
    level: sheet?.level ?? 1,
    age: sheet?.age,
    career: sheet?.career,
    yearsServed: sheet?.yearsServed,
    streetInfluence: sheet?.streetInfluence,
    corporateInfluence: sheet?.corporateInfluence,
    backstory: sheet?.backstory,
  };
}

export function sheetHpForLevel(sheet: NriSheetData, classId: NriClassId): NriSheetData {
  const tpl = getC2185ClassTemplate(classId);
  const conMod = abilityModifier(sheet.abilities.CON);
  const hitDie = tpl?.hitDie ?? 'd8';
  const perLevel = hitDie === 'd12' ? 7 : hitDie === 'd10' ? 6 : 5;
  const base = (hitDie === 'd12' ? 12 : hitDie === 'd10' ? 10 : 8) + conMod;
  const hpMax = base + perLevel * Math.max(0, sheet.level - 1);
  return { ...sheet, hpMax, hp: hpMax };
}
