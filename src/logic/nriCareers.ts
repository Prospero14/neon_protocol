/** Карьеры по классу и сектору: корпоративный / частный / государственный / уличный / подпольный. */

import type { NriClassId } from './nriClasses';
import type { NriActivityId, NriNpcArchetypeId } from './nriCharacterGen';

export type CareerSector = 'corp' | 'private' | 'state' | 'street' | 'underground';

type CareerDef = { title: string; sectors: CareerSector[] };

const pick = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]!;

const CAREERS_BY_CLASS: Record<NriClassId, CareerDef[]> = {
  detective: [
    { title: 'Корпоративный детектив', sectors: ['corp'] },
    { title: 'Аналитик внутренней безопасности', sectors: ['corp'] },
    { title: 'Следователь по экономическим преступлениям', sectors: ['corp'] },
    { title: 'Инспектор комплаенса', sectors: ['corp'] },
    { title: 'Агент корпоративной разведки', sectors: ['corp'] },
    { title: 'Офицер по защите данных', sectors: ['corp'] },
    { title: 'Аудитор рисков Arasaka', sectors: ['corp'] },
    { title: 'Частный сыщик', sectors: ['private'] },
    { title: 'Детектив по семейным делам', sectors: ['private'] },
    { title: 'Охотник за пропавшими', sectors: ['private'] },
    { title: 'Расследователь страховых махинаций', sectors: ['private'] },
    { title: 'Лицензированный частный детектив', sectors: ['private'] },
    { title: 'Сыщик на контракте с фиксером', sectors: ['private'] },
    { title: 'Инспектор NCPD', sectors: ['state'] },
    { title: 'Следователь городской прокуратуры', sectors: ['state'] },
    { title: 'Агент по киберпреступлениям мэрии', sectors: ['state'] },
    { title: 'Офицер внутренних расследований NCPD', sectors: ['state'] },
    { title: 'Следователь по убийствам', sectors: ['state'] },
    { title: 'Инспектор таможенной службы', sectors: ['state'] },
    { title: 'Районный информатор с бейджом', sectors: ['street'] },
    { title: 'Бывший коп на побегушках', sectors: ['street'] },
    { title: 'Сыщик подпольных аукционов', sectors: ['underground'] },
    { title: 'Долговой информатор синдиката', sectors: ['underground'] },
    { title: 'Следователь по делам триад', sectors: ['underground'] },
  ],
  merc: [
    { title: 'Корпоративный охранник', sectors: ['corp'] },
    { title: 'Телохранитель VIP', sectors: ['corp'] },
    { title: 'Сотрудник службы безопасности', sectors: ['corp'] },
    { title: 'Конвойный эскорт грузов', sectors: ['corp'] },
    { title: 'Инструктор корп-полигона', sectors: ['corp'] },
    { title: 'Оператор дронов-патрулей', sectors: ['corp'] },
    { title: 'Наёмник', sectors: ['private'] },
    { title: 'Контрактник частной военной компании', sectors: ['private'] },
    { title: 'Охранник объекта на смене', sectors: ['private'] },
    { title: 'Телохранитель медиа-звезды', sectors: ['private'] },
    { title: 'Боец сопровождения каравана', sectors: ['private'] },
    { title: 'Ветеран корп-армии', sectors: ['state'] },
    { title: 'Инструктор NCPD SWAT', sectors: ['state'] },
    { title: 'Резервист городской обороны', sectors: ['state'] },
    { title: 'Сапёр муниципальной службы', sectors: ['state'] },
    { title: 'Вышибала клуба', sectors: ['street'] },
    { title: 'Коллектор с кулаками', sectors: ['street'] },
    { title: 'Охранник ночного рынка', sectors: ['street'] },
    { title: 'Боец клана на районе', sectors: ['underground'] },
    { title: 'Долговой коллектор синдиката', sectors: ['underground'] },
    { title: 'Контрабандный конвой', sectors: ['underground'] },
  ],
  hacker: [
    { title: 'Инженер корп-сетей', sectors: ['corp'] },
    { title: 'Аналитик SOC', sectors: ['corp'] },
    { title: 'Тестировщик ICE на контракте', sectors: ['corp'] },
    { title: 'Администратор закрытого кластера', sectors: ['corp'] },
    { title: 'Разработчик корп-прошивок', sectors: ['corp'] },
    { title: 'Нетраннер на фрилансе', sectors: ['private'] },
    { title: 'Взломщик по заказу', sectors: ['private'] },
    { title: 'Пентестер без лицензии', sectors: ['private'] },
    { title: 'Архивариус цифровых теней', sectors: ['private'] },
    { title: 'Реставратор утерянных дек', sectors: ['private'] },
    { title: 'Специалист CERT мэрии', sectors: ['state'] },
    { title: 'Киберэксперт прокуратуры', sectors: ['state'] },
    { title: 'Оператор городского фаервола', sectors: ['state'] },
    { title: 'Техник уличных хабов', sectors: ['street'] },
    { title: 'Прошивальщик серого железа', sectors: ['street'] },
    { title: 'Крэкер пиратских фидов', sectors: ['street'] },
    { title: 'Нетраннер подпольного рынка', sectors: ['underground'] },
    { title: 'Архитектор чёрного ICE', sectors: ['underground'] },
    { title: 'Дроппер для синдиката', sectors: ['underground'] },
  ],
  doc: [
    { title: 'Корпоративный медик', sectors: ['corp'] },
    { title: 'Врач корп-клиники', sectors: ['corp'] },
    { title: 'Специалист по имплантам на контракте', sectors: ['corp'] },
    { title: 'Медик службы безопасности', sectors: ['corp'] },
    { title: 'Лаборант фарм-отдела', sectors: ['corp'] },
    { title: 'Частный хирург', sectors: ['private'] },
    { title: 'Парамедик на вызовах', sectors: ['private'] },
    { title: 'Киберхирург без лицензии', sectors: ['private'] },
    { title: 'Врач каравана', sectors: ['private'] },
    { title: 'Медик боевого отряда', sectors: ['private'] },
    { title: 'Фельдшер NCPD', sectors: ['state'] },
    { title: 'Врач скорой мегаполиса', sectors: ['state'] },
    { title: 'Инфекционист муниципальной больницы', sectors: ['state'] },
    { title: 'Уличный док', sectors: ['street'] },
    { title: 'Медик подпольного ринга', sectors: ['street'] },
    { title: 'Травматолог ночного рынка', sectors: ['street'] },
    { title: 'Риппердок в подвале', sectors: ['underground'] },
    { title: 'Стажёр у подпольного хирурга', sectors: ['underground'] },
    { title: 'Дилер стимов с медобразованием', sectors: ['underground'] },
  ],
  fixer: [
    { title: 'Корпоративный посредник', sectors: ['corp'] },
    { title: 'Менеджер теневых контрактов', sectors: ['corp'] },
    { title: 'Закупщик серых поставок', sectors: ['corp'] },
    { title: 'Координатор оффшорных сделок', sectors: ['corp'] },
    { title: 'Агент по слияниям и поглощениям', sectors: ['corp'] },
    { title: 'Независимый фиксер', sectors: ['private'] },
    { title: 'Брокер контрактов', sectors: ['private'] },
    { title: 'Организатор вылазок', sectors: ['private'] },
    { title: 'Сводник наёмников', sectors: ['private'] },
    { title: 'Агент по поиску таланта', sectors: ['private'] },
    { title: 'Муниципальный лоббист', sectors: ['state'] },
    { title: 'Координатор гуманитарных конвоев', sectors: ['state'] },
    { title: 'Связной районной администрации', sectors: ['state'] },
    { title: 'Барыга с репутацией', sectors: ['street'] },
    { title: 'Посредник на рынке', sectors: ['street'] },
    { title: 'Сводник уличных команд', sectors: ['street'] },
    { title: 'Куратор подпольных аукционов', sectors: ['underground'] },
    { title: 'Связной синдиката', sectors: ['underground'] },
    { title: 'Брокер украденных данных', sectors: ['underground'] },
  ],
  daimyo: [
    { title: 'Менеджер корп-подразделения', sectors: ['corp'] },
    { title: 'Руководитель силового отдела', sectors: ['corp'] },
    { title: 'Куратор корпоративного клана', sectors: ['corp'] },
    { title: 'Начальник охраны объекта', sectors: ['corp'] },
    { title: 'Командир корп-отряда', sectors: ['corp'] },
    { title: 'Лидер наёмной группы', sectors: ['private'] },
    { title: 'Капитан частного конвоя', sectors: ['private'] },
    { title: 'Основатель боевого клуба', sectors: ['private'] },
    { title: 'Инструктор телохранителей', sectors: ['private'] },
    { title: 'Офицер городской милиции', sectors: ['state'] },
    { title: 'Командир резервного батальона', sectors: ['state'] },
    { title: 'Инспектор силовых структур', sectors: ['state'] },
    { title: 'Глава уличной банды', sectors: ['street'] },
    { title: 'Старший на районе', sectors: ['street'] },
    { title: 'Капитан бойцовского дворика', sectors: ['street'] },
    { title: 'Капитан клана', sectors: ['underground'] },
    { title: 'Смотрящий синдиката', sectors: ['underground'] },
    { title: 'Военачальник триады', sectors: ['underground'] },
  ],
};

const ACTIVITY_SECTOR_BIAS: Record<NriActivityId, Partial<Record<CareerSector, number>>> = {
  street: { street: 3, underground: 2, private: 1 },
  corp: { corp: 4, private: 1, state: 1 },
  military: { state: 3, corp: 2, private: 1 },
  medical: { state: 2, corp: 2, private: 2, street: 1 },
  criminal: { underground: 4, street: 2, private: 1 },
  tech: { corp: 2, private: 2, street: 1, state: 1 },
  media: { private: 2, corp: 2, street: 1, state: 1 },
  nomad: { private: 3, street: 2, underground: 1 },
};

const ARCHETYPE_SECTOR_BIAS: Partial<Record<NriNpcArchetypeId, Partial<Record<CareerSector, number>>>> = {
  cop: { state: 3 },
  corp_exec: { corp: 4 },
  gang: { underground: 3, street: 2 },
  fixer: { private: 2, underground: 2 },
  netrunner: { underground: 2, private: 2 },
  mercenary: { private: 2, state: 1 },
  ripperdoc: { underground: 2, street: 1 },
  street_bum: { street: 3 },
  merchant: { private: 2, street: 1 },
};

function sectorWeight(
  sector: CareerSector,
  activityId: NriActivityId,
  archetypeId?: NriNpcArchetypeId
): number {
  let w = 1;
  w += ACTIVITY_SECTOR_BIAS[activityId]?.[sector] ?? 0;
  if (archetypeId) w += ARCHETYPE_SECTOR_BIAS[archetypeId]?.[sector] ?? 0;
  return w;
}

/** Случайная карьера с учётом класса, деятельности и архетипа. */
export function rollCareer(params: {
  classId: NriClassId;
  activityId: NriActivityId;
  archetypeId?: NriNpcArchetypeId;
}): string {
  const pool = CAREERS_BY_CLASS[params.classId] ?? CAREERS_BY_CLASS.merc;
  const weighted: CareerDef[] = [];
  for (const career of pool) {
    const w = career.sectors.reduce(
      (sum, sector) => sum + sectorWeight(sector, params.activityId, params.archetypeId),
      0
    );
    for (let i = 0; i < w; i++) weighted.push(career);
  }
  return pick(weighted.length ? weighted : pool).title;
}

export function careersForClass(classId: NriClassId): readonly string[] {
  return (CAREERS_BY_CLASS[classId] ?? []).map((c) => c.title);
}

export function careerSectorHint(career: string): CareerSector | null {
  for (const list of Object.values(CAREERS_BY_CLASS)) {
    const hit = list.find((c) => c.title === career);
    if (hit) return hit.sectors[0] ?? null;
  }
  return null;
}
