/** Карьеры по классу и сектору + фильтр по годам / влиянию / фракции / происхождению. */

import type { NriClassId } from './nriClasses';
import type { NriActivityId, NriNpcArchetypeId, NriOriginId } from './nriCharacterGen';

export type CareerSector = 'corp' | 'private' | 'state' | 'street' | 'underground';

type CareerDef = { title: string; sectors: CareerSector[] };

export type CareerRollParams = {
  classId: NriClassId;
  activityId: NriActivityId;
  archetypeId?: NriNpcArchetypeId;
  originId?: NriOriginId;
  /** kind / name / displayName фракции — для секторального уклона */
  factionKind?: string;
  factionName?: string;
  yearsServed?: number;
  streetInfluence?: number;
  corporateInfluence?: number;
};

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

const ORIGIN_SECTOR_BIAS: Partial<Record<NriOriginId, Partial<Record<CareerSector, number>>>> = {
  neo_tokyo: { underground: 2, corp: 1, street: 1 },
  hong_kong: { underground: 2, private: 1 },
  los_angeles: { private: 2, street: 1, corp: 1 },
  london: { state: 1, corp: 1, private: 1 },
  moscow: { street: 2, state: 1, underground: 1 },
  sao_paulo: { street: 2, underground: 1 },
  offworld: { corp: 2, private: 1 },
};

export type CareerReqs = { minYears: number; minStreet: number; minCorp: number };

/** Порог «ранга» по названию — капитан банды не с 1 годом службы. */
export function careerRequirements(title: string, sectors: CareerSector[]): CareerReqs {
  const t = title.toLowerCase();
  const streetish = sectors.some((s) => s === 'street' || s === 'underground');
  const corpish = sectors.some((s) => s === 'corp' || s === 'state');

  if (/стажёр|резервист|бывший коп на побегушках|лаборант/.test(t)) {
    return { minYears: 0, minStreet: 0, minCorp: 0 };
  }
  if (
    /капитан|глава|смотрящ|военачальник|командир|начальник|руководитель|лидер|основатель|куратор корпоратив/.test(
      t
    )
  ) {
    return {
      minYears: 6,
      minStreet: streetish ? 5 : 2,
      minCorp: corpish ? 5 : streetish ? 0 : 3,
    };
  }
  if (/старший|ветеран|инструктор|офицер|инспектор|менеджер|аудитор|агент корпоратив|смотря/.test(t)) {
    return {
      minYears: 3,
      minStreet: streetish ? 3 : 1,
      minCorp: corpish ? 3 : 1,
    };
  }
  if (/коллектор|конвой|телохранитель|охранник|боец|сыщик|детектив|нетраннер|фиксер|посредник/.test(t)) {
    return { minYears: 1, minStreet: streetish ? 1 : 0, minCorp: corpish ? 1 : 0 };
  }
  return { minYears: 1, minStreet: 0, minCorp: 0 };
}

export function parseCareerStat(raw: string | number | undefined | null): number {
  if (typeof raw === 'number' && Number.isFinite(raw)) return Math.max(0, Math.floor(raw));
  const m = String(raw ?? '').match(/\d+/);
  return m ? Math.max(0, parseInt(m[0]!, 10)) : 0;
}

export function factionSectorBias(kind?: string, name?: string): Partial<Record<CareerSector, number>> {
  const blob = `${kind ?? ''} ${name ?? ''}`.toLowerCase();
  if (!blob.trim()) return {};
  if (/corp|корпорац|arasaka|militech|kang|mega|biotech|zaibatsu/.test(blob)) {
    return { corp: 5, private: 1 };
  }
  if (/gang|банд|якудз|триад|синдикат|mafia|мафи|underground|клан|тифф|tyger/.test(blob)) {
    return { underground: 5, street: 2 };
  }
  if (/cop|полиц|ncpd|воен|militia|state|мэр|правител|арми|swat/.test(blob)) {
    return { state: 5, corp: 1 };
  }
  if (/fixer|market|торг|nomad|караван|медиа|media|студи/.test(blob)) {
    return { private: 3, street: 2 };
  }
  return { private: 1 };
}

function sectorWeight(
  sector: CareerSector,
  params: CareerRollParams
): number {
  let w = 1;
  w += ACTIVITY_SECTOR_BIAS[params.activityId]?.[sector] ?? 0;
  if (params.archetypeId) w += ARCHETYPE_SECTOR_BIAS[params.archetypeId]?.[sector] ?? 0;
  if (params.originId) w += ORIGIN_SECTOR_BIAS[params.originId]?.[sector] ?? 0;
  const fb = factionSectorBias(params.factionKind, params.factionName);
  w += fb[sector] ?? 0;
  return w;
}

function meetsReqs(reqs: CareerReqs, params: CareerRollParams, strict: boolean): boolean {
  const years = parseCareerStat(params.yearsServed);
  const street = parseCareerStat(params.streetInfluence);
  const corp = parseCareerStat(params.corporateInfluence);
  if (strict) {
    return years >= reqs.minYears && street >= reqs.minStreet && corp >= reqs.minCorp;
  }
  // мягкий режим: только годы + половина влияния
  return (
    years >= Math.max(0, Math.floor(reqs.minYears * 0.5)) &&
    street >= Math.max(0, Math.floor(reqs.minStreet * 0.5)) &&
    corp >= Math.max(0, Math.floor(reqs.minCorp * 0.5))
  );
}

export function careerEligible(
  title: string,
  sectors: CareerSector[],
  stats: Pick<CareerRollParams, 'yearsServed' | 'streetInfluence' | 'corporateInfluence'>
): boolean {
  return meetsReqs(careerRequirements(title, sectors), stats as CareerRollParams, true);
}

function decorateWithFaction(title: string, factionName?: string): string {
  const name = factionName?.trim();
  if (!name) return title;
  if (title.includes(name)) return title;
  // короткая привязка к фракции, без «капитан банды X» если уже капитан
  if (/синдикат|клан|триад|NCPD|Arasaka|корп/i.test(title)) return title;
  return `${title} («${name}»)`;
}

/** Случайная карьера с учётом класса, среды, фракции и «ранга» (годы/влияние). */
export function rollCareer(params: CareerRollParams): string {
  const pool = CAREERS_BY_CLASS[params.classId] ?? CAREERS_BY_CLASS.merc;
  const yearsKnown = params.yearsServed != null && String(params.yearsServed).trim() !== '';
  const influenceKnown =
    (params.streetInfluence != null && String(params.streetInfluence).trim() !== '') ||
    (params.corporateInfluence != null && String(params.corporateInfluence).trim() !== '');

  const weightCareer = (career: CareerDef): number =>
    career.sectors.reduce((sum, sector) => sum + sectorWeight(sector, params), 0);

  const buildWeighted = (list: CareerDef[]): CareerDef[] => {
    const weighted: CareerDef[] = [];
    for (const career of list) {
      const w = Math.max(1, weightCareer(career));
      for (let i = 0; i < w; i++) weighted.push(career);
    }
    return weighted;
  };

  let candidates = pool;
  if (yearsKnown || influenceKnown) {
    const strict = pool.filter((c) =>
      meetsReqs(careerRequirements(c.title, c.sectors), params, true)
    );
    if (strict.length) {
      candidates = strict;
    } else {
      const soft = pool.filter((c) =>
        meetsReqs(careerRequirements(c.title, c.sectors), params, false)
      );
      candidates = soft.length ? soft : pool.filter((c) => {
        const r = careerRequirements(c.title, c.sectors);
        return r.minYears <= 2;
      });
      if (!candidates.length) candidates = pool;
    }
  }

  const weighted = buildWeighted(candidates);
  const picked = pick(weighted.length ? weighted : candidates);
  return decorateWithFaction(picked.title, params.factionName);
}

export function careersForClass(classId: NriClassId): readonly string[] {
  return (CAREERS_BY_CLASS[classId] ?? []).map((c) => c.title);
}

export function careerSectorHint(career: string): CareerSector | null {
  const bare = career.replace(/\s*\(«[^»]+»\)\s*$/u, '').trim();
  for (const list of Object.values(CAREERS_BY_CLASS)) {
    const hit = list.find((c) => c.title === bare || c.title === career);
    if (hit) return hit.sectors[0] ?? null;
  }
  return null;
}
