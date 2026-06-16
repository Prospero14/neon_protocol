import type { ConditionDef, ConditionId } from './types.js';

export const CONDITION_DEFS: ConditionDef[] = [
  {
    id: 'intoxicated_mild',
    label: 'Лёгкое опьянение',
    blurb: '−1 ЛОВ, помеха на Perception и Stealth.',
    abilityMods: { DEX: -1 },
    defaultRounds: 10,
    escalateTo: 'intoxicated',
  },
  {
    id: 'intoxicated',
    label: 'Опьянение',
    blurb: '−2 ЛОВ, помеха на атаки дальнего боя и проверки ЛОВ.',
    abilityMods: { DEX: -2 },
    defaultRounds: 20,
    escalateTo: 'intoxicated_severe',
  },
  {
    id: 'intoxicated_severe',
    label: 'Сильное опьянение',
    blurb: '−3 ЛОВ, −1 ТЕЛ, помеха на все проверки ЛОВ и ВОЛ.',
    abilityMods: { DEX: -3, CON: -1 },
    defaultRounds: 30,
  },
  {
    id: 'poisoned',
    label: 'Отравление',
    blurb: '−1 ТЕЛ, помеха на спасброски ТЕЛ.',
    abilityMods: { CON: -1 },
    defaultRounds: 10,
  },
  {
    id: 'stunned',
    label: 'Оглушение',
    blurb: 'Не может действовать; падает prone.',
    defaultRounds: 1,
  },
  {
    id: 'frightened',
    label: 'Страх',
    blurb: 'Помеха на проверки пока видит источник.',
    defaultRounds: 5,
  },
  {
    id: 'exhausted_1',
    label: 'Усталость 1',
    blurb: 'Помеха на все проверки характеристик.',
    defaultRounds: 60,
    escalateTo: 'exhausted_2',
  },
  {
    id: 'exhausted_2',
    label: 'Усталость 2',
    blurb: 'Скорость −50%, помеха на все проверки.',
    abilityMods: { STR: -1, DEX: -1 },
    defaultRounds: 120,
  },
  {
    id: 'boosted',
    label: 'Стим-буст',
    blurb: '+1 ЛОВ от стима (временно).',
    abilityMods: { DEX: 1 },
    defaultRounds: 10,
  },
  {
    id: 'sedated',
    label: 'Седатив',
    blurb: '−2 ЛОВ, −1 ВОЛ, сонливость.',
    abilityMods: { DEX: -2, PEO: -1 },
    defaultRounds: 15,
  },
  {
    id: 'bleeding',
    label: 'Кровотечение',
    blurb: '1d4 урона в начале каждого хода без лечения.',
    defaultRounds: 5,
  },
  {
    id: 'prone',
    label: 'Сбит с ног',
    blurb: 'Помеха на атаки; вставание — половина скорости.',
    defaultRounds: 1,
  },
  {
    id: 'blinded',
    label: 'Ослепление',
    blurb: 'Помеха на атаки; враги с преимуществом.',
    defaultRounds: 3,
  },
  {
    id: 'high',
    label: 'Кайф / наркотический приход',
    blurb: '−1 ВОЛ, +1 ТЕХ на хакинг (мастер).',
    abilityMods: { PEO: -1, TEC: 1 },
    defaultRounds: 15,
  },
];

const DEF_BY_ID = new Map(CONDITION_DEFS.map((d) => [d.id, d]));

export const CONDITION_IDS = CONDITION_DEFS.map((d) => d.id);

export function getConditionDef(id: ConditionId): ConditionDef | undefined {
  return DEF_BY_ID.get(id);
}

export const CONDITION_LABELS: Record<ConditionId, string> = Object.fromEntries(
  CONDITION_DEFS.map((d) => [d.id, d.label])
) as Record<ConditionId, string>;
