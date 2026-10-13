/**
 * Контекст «живого» листа для бэкстори / одежды / карманов.
 * Best practice: личные мелочи + 1–2 крючка от хрома/оружия, не роман.
 */

import type { NriClassId } from './nriClasses';
import type { NriActivityId, NriNpcArchetypeId, NriOriginId } from './nriCharacterGen';
import type { NriInventoryItem } from './nriInventory';
import { catalogToInventoryItem } from './nriItemCatalog';
import { pickOne } from './nriProse';

export type FlavorChrome = { name: string; slot?: string };

export type CharacterFlavorInput = {
  name: string;
  nickname?: string;
  originId: NriOriginId;
  activityId: NriActivityId;
  archetypeId?: NriNpcArchetypeId;
  classId: NriClassId;
  career?: string;
  vice?: string;
  factionLabel?: string;
  chrome?: FlavorChrome[];
  weapons?: string[];
  /** Имена уже сгенерированной мелочи — можно упомянуть в бэкстори. */
  pocketNames?: string[];
};

const TRANSIT_BY_ORIGIN: Record<NriOriginId, { name: string; blurb: string }[]> = {
  neo_tokyo: [
    { name: 'Проездной Maglev (7 дней)', blurb: 'Стираный QR на пластике. Ещё действует.' },
    { name: 'Жетон метро Синдзюку', blurb: 'Старый жетон — турникеты уже QR, но привычка.' },
  ],
  hong_kong: [
    { name: 'Карта парома (месяц)', blurb: 'Между островами без лишних вопросов.' },
    { name: 'Проездной вертикального лифта', blurb: 'Доступ к жилым уровням B–F.' },
  ],
  los_angeles: [
    { name: 'Проездной автобуса LAX-loop', blurb: 'Заляпан солнцем и чужой жвачкой.' },
    { name: 'Талон skyway (разовый)', blurb: 'Ещё не пробит — или уже?' },
  ],
  london: [
    { name: 'Oyster-чип (подделка?)', blurb: 'Работает на трёх линиях из пяти.' },
    { name: 'Билет на ночной автобус', blurb: 'Дата — вчера. Не выбросил.' },
  ],
  moscow: [
    { name: 'Тройка (потрёпанная)', blurb: 'Баланс на три поездки. Имя не совпадает.' },
    { name: 'Проездной МЦК', blurb: 'Стикер «не проверять» — шутка, но иногда работает.' },
  ],
  sao_paulo: [
    { name: 'Карта Bilhete Único', blurb: 'Царапины от турникетов фавелы.' },
    { name: 'Талон метролинии-4', blurb: 'Одноразовый, ещё не использован.' },
  ],
  offworld: [
    { name: 'Пропуск шлюза станции', blurb: 'Сектор C, срок истёк — но сканер глючит.' },
    { name: 'Талон лифта 0g→1g', blurb: 'Для новичков с Земли. Он уже не новичок.' },
  ],
};

const FOOD_CATALOG = ['cons_cola', 'cons_noodles'] as const;

const FOOD_FALLBACK: { name: string; blurb: string }[] = [
  { name: 'Стикер-пачка синто-орешков', blurb: 'Соль и глутамат. Завтрак выживальщика.' },
  { name: 'Батончик «Калория-900»', blurb: 'На вкус как картон. Держит до вечера.' },
  { name: 'Жевательная резинка с никотином', blurb: 'Половина пластинок уже нет.' },
  { name: 'Банка холодного чая из автомата', blurb: 'Ещё чуть холодная.' },
];

const KEEPSAKES: Record<string, { name: string; blurb: string }[]> = {
  neo_tokyo: [
    { name: 'Фигурка аниме (слепая капсула)', blurb: 'Редкая расцветка. Не для продажи — для удачи.' },
    { name: 'Полароид с крыши Синдзюку', blurb: 'На обороте дата и чужой номер.' },
    { name: 'Брелок с храмом Сэнсо-дзи', blurb: 'Туристический китч. Не снимает.' },
  ],
  hong_kong: [
    { name: 'Красный конверт с пустой купюрой', blurb: 'Осталась привычка — на удачу.' },
    { name: 'Мини-дракон из нефрита (подделка)', blurb: 'Тёплый от пальцев.' },
  ],
  los_angeles: [
    { name: 'Автограф звезды на салфетке', blurb: 'Или умелая подделка. Не проверял.' },
    { name: 'Кассета с демо-треком', blurb: 'Никто не слушает кассеты. Он слушает.' },
  ],
  london: [
    { name: 'Значок музея Виктории и Альберта', blurb: 'Визит был «по делу» — или так сказал.' },
    { name: 'Открытка с Туманным мостом', blurb: 'Не отправлена. Адрес зачёркнут.' },
  ],
  moscow: [
    { name: 'Фотография семьи (погнутая)', blurb: 'Лица выцвели. Дата на обороте — до блэкаута.' },
    { name: 'Икона в пакетике', blurb: 'Не обсуждает. Просто носит.' },
    { name: 'Значок «ВДНХ»', blurb: 'Сувенир с выходного, который не повторится.' },
  ],
  sao_paulo: [
    { name: 'Браслет с карнавала', blurb: 'Цвета уже серые. Не снимает с запястья.' },
    { name: 'Мини-футбольный мяч-брелок', blurb: 'Скрипит. Бесит напарников.' },
  ],
  offworld: [
    { name: 'Камень с астероида (лакированный)', blurb: 'Тяжелее, чем кажется. «Домой».' },
    { name: 'Фото Земли из иллюминатора', blurb: 'Распечатка. Пиксели крупнее воспоминаний.' },
  ],
  class_hacker: [
    { name: 'Флешка без маркировки', blurb: 'На наклейке только точка. Не вставлять в чужой порт.' },
  ],
  class_fixer: [
    { name: 'Визитка с одним именем', blurb: 'Номер выцарапан ногтем. «Только голос».' },
  ],
  class_detective: [
    { name: 'Диктофонная капсула (1 мин)', blurb: 'Последняя запись — чужой шёпот.' },
  ],
  class_doc: [
    { name: 'Старый жетон донора', blurb: 'Группа крови уже не совпадает с паспортом.' },
  ],
  class_merc: [
    { name: 'Жетон напарника', blurb: 'Имя стёрто. Оставляет в левом кармане.' },
  ],
  class_daimyo: [
    { name: 'Печать клана (мини)', blurb: 'Воск и металлическая матрица. Редко достаёт.' },
  ],
};

const RECEIPTS: { name: string; blurb: string }[] = [
  { name: 'Чек из прачечной «ЧистоНеон»', blurb: 'Пальто — срочно. Не забрал.' },
  { name: 'Билет в голо-кино (ряд 12)', blurb: 'Сеанс вчера. Попкорн на обороте.' },
  { name: 'Стик-талон музея корпоративного дизайна', blurb: 'Бесплатный вторник. Штамп на запястье смыл.' },
  { name: 'Чек клиники «ЛукоЛайт Экспресс»', blurb: '−BT, +долг. Квитанция смята.' },
  { name: 'Талон лотереи «Wonlong Dreams»', blurb: 'Не выиграл. Держит «на всякий».' },
  { name: 'Чек из автомата лапши №4', blurb: 'Время 03:17. Один стакан, без палочек.' },
  { name: 'Штемпель парковки дронов', blurb: 'Штраф не оплачен.' },
  { name: 'Талон гардероба клуба «Pulse»', blurb: 'Куртку так и не забрал.' },
];

const PRACTICAL: { name: string; blurb: string }[] = [
  { name: 'Одноразовая зажигалка', blurb: 'Почти пустая. Всё равно таскает.' },
  { name: 'Свёрток салфеток с логотипом корпа', blurb: 'Украл со стойки на встрече.' },
  { name: 'Резинки для волос / кабелей', blurb: 'Три штуки. Универсальный инструмент.' },
  { name: 'Маркер для меток', blurb: 'Чуть пахнет растворителем.' },
  { name: 'Жвачка-антисканер (слух)', blurb: 'На самом деле обычная. Но верит.' },
];

function uid(prefix: string): string {
  return `pocket_${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function makePocket(name: string, blurb: string, extraTags: string[] = []): NriInventoryItem {
  return {
    id: uid(name.slice(0, 12).replace(/\s+/g, '_')),
    name,
    blurb,
    kind: 'gear',
    slot: 'quick',
    qty: 1,
    priceWonlongs: 0,
    tags: ['мелочь', 'карман', ...extraTags],
  };
}

function isPocketItem(item: NriInventoryItem): boolean {
  return (
    item.id.startsWith('pocket_') ||
    (!!item.tags && (item.tags.includes('карман') || item.tags.includes('мелочь')))
  );
}

/** Убрать старую мелочь, добавить новую. Боевой/сидовый лут сохраняется. */
export function mergePocketLoot(base: NriInventoryItem[], pockets: NriInventoryItem[]): NriInventoryItem[] {
  const kept = (Array.isArray(base) ? base : []).filter((i) => !isPocketItem(i));
  return [...kept, ...pockets];
}

export function generatePocketLoot(input: {
  originId: NriOriginId;
  activityId: NriActivityId;
  classId: NriClassId;
  archetypeId?: NriNpcArchetypeId;
  career?: string;
  chrome?: FlavorChrome[];
}): NriInventoryItem[] {
  const out: NriInventoryItem[] = [];

  const transit = pickOne(TRANSIT_BY_ORIGIN[input.originId], TRANSIT_BY_ORIGIN.neo_tokyo[0]!);
  out.push(makePocket(transit.name, transit.blurb, ['транспорт']));

  if (Math.random() < 0.65) {
    const catId = pickOne([...FOOD_CATALOG], 'cons_cola');
    const fromCat = catalogToInventoryItem(catId);
    if (fromCat) {
      out.push({
        ...fromCat,
        id: uid(catId),
        tags: [...(fromCat.tags ?? []), 'мелочь', 'карман', 'еда'],
      });
    } else {
      const food = pickOne(FOOD_FALLBACK, FOOD_FALLBACK[0]!);
      out.push(makePocket(food.name, food.blurb, ['еда']));
    }
  } else {
    const food = pickOne(FOOD_FALLBACK, FOOD_FALLBACK[0]!);
    out.push(makePocket(food.name, food.blurb, ['еда']));
  }

  const keepPools = [
    ...(KEEPSAKES[input.originId] ?? []),
    ...(KEEPSAKES[`class_${input.classId}`] ?? []),
  ];
  if (keepPools.length) {
    const k = pickOne(keepPools, keepPools[0]!);
    out.push(makePocket(k.name, k.blurb, ['память']));
  }

  const receipt = pickOne(RECEIPTS, RECEIPTS[0]!);
  out.push(makePocket(receipt.name, receipt.blurb, ['чек']));

  if (Math.random() < 0.55) {
    const p = pickOne(PRACTICAL, PRACTICAL[0]!);
    out.push(makePocket(p.name, p.blurb));
  }

  // Хром → расходник/уход
  if (input.chrome?.some((c) => /neural|head/i.test(c.slot ?? ''))) {
    out.push(
      makePocket(
        'Салфетка для оптики / джеков',
        'Микрофибра с логотипом клиники. Пахнет спиртом.',
        ['хром']
      )
    );
  } else if (input.chrome?.length && Math.random() < 0.4) {
    out.push(
      makePocket(
        'Мини-тюбик геля для шарниров',
        `Для «${input.chrome[0]!.name}». Этикетка стёрта.`,
        ['хром']
      )
    );
  }

  if (input.activityId === 'medical' || input.classId === 'doc') {
    out.push(makePocket('Пластырь и две спички', 'Не медицина. Ритуал.', ['мелочь']));
  }

  // 3–6 предметов
  return out.slice(0, 3 + Math.floor(Math.random() * 3));
}

/** Имя для кавычек: без вложенных «…», чтобы не было «Значок «ВДНХ»». */
function quoteLabel(raw: string): string {
  const t = raw.trim().replace(/[«»„“"]/g, '');
  return t || raw.trim();
}

export function chromeHookLine(chrome: FlavorChrome[]): string | null {
  if (!chrome.length) return null;
  const c = chrome[0]!;
  const name = quoteLabel(c.name);
  const slot = (c.slot ?? '').toLowerCase();
  if (slot.includes('neural')) {
    return pickOne(
      [
        `под воротником — джеки «${name}»; привык не светить разъём`,
        `нейролинк «${name}» зудит, когда рядом чужой сетевой лёд`,
      ],
      `носит хром «${name}» и делает вид, что это норма`
    );
  }
  if (slot.includes('arm') || slot.includes('leg')) {
    return pickOne(
      [
        `конечность «${name}» прячет под одеждой — до первого рукопожатия`,
        `сервоприводы «${name}» щёлкают, когда нервничает`,
      ],
      `хром «${name}» уже часть походки`
    );
  }
  if (slot.includes('head') || slot.includes('sensor') || slot.includes('eye')) {
    return `оптика «${name}» выдаёт себя холодным бликом в темноте`;
  }
  if (slot.includes('torso') || slot.includes('internal')) {
    return `под рёбрами гудит «${name}» — врачи это называют «жизнью»`;
  }
  return `имплант «${name}» уже не снимают — только обслуживают`;
}

/** Англ. ярлыки оружия → русские (сиды / старые листы / каталог). */
const WEAPON_LABEL_RU: Record<string, string> = {
  SMG: 'ПП',
  'SMG + 2 mags': 'ПП',
  'ПП + 2 магазина': 'ПП',
  'Mono-knife': 'мононож',
  Мононож: 'мононож',
  Katana: 'катана',
  'Katana (melee)': 'катана',
  Катана: 'катана',
  Pistol: 'пистолет',
  'Pistol + silencer': 'пистолет',
  'Пистолет с глушителем': 'пистолет',
  'Shock baton': 'шокер-дубинка',
  Shotgun: 'дробовик',
  Rifle: 'винтовка',
};

export function localizeWeaponLabel(raw: string): string {
  const t = raw.trim();
  if (!t) return t;
  if (WEAPON_LABEL_RU[t]) return WEAPON_LABEL_RU[t]!;
  const base = t.replace(/\s*\+.*$/u, '').replace(/\s*\([^)]*\)\s*$/u, '').trim();
  const hit = Object.entries(WEAPON_LABEL_RU).find(([k]) => k.toLowerCase() === base.toLowerCase());
  if (hit) return hit[1];
  // уже по-русски — берём базу без «+ 2 mags»
  if (/[А-Яа-яЁё]/.test(base)) return base;
  return base || t;
}

export function weaponHookLine(weapons: string[]): string | null {
  if (!weapons.length) return null;
  const w = quoteLabel(localizeWeaponLabel(weapons[0]!));
  return pickOne(
    [
      `не расстаётся с «${w}» — это уже не инструмент, а привычка`,
      `«${w}» лежит ближе к телу, чем к закону`,
      `перед сном проверяет «${w}» так же, как пульс`,
    ],
    `«${w}» — аргумент, которому доверяет`
  );
}

export function pocketHookLine(pocketNames: string[]): string | null {
  if (!pocketNames.length) return null;
  const p = quoteLabel(pickOne(pocketNames, pocketNames[0]!));
  return pickOne(
    [
      `в кармане до сих пор лежит «${p}» — мелочь, которая говорит о человеке больше резюме`,
      `из карманов сыплется быт города, в том числе «${p}»`,
      `таскает «${p}» как талисман — смешно, пока не спросишь почему`,
    ],
    `таскает «${p}» как талисман`
  );
}

/**
 * Порок из таблицы C2185 часто от 1-го лица — в бэкстори даём как цитату
 * («про себя признаётся»), чтобы не смешивать лица и не ломать склонения.
 */
export function viceHookLine(vice: string): string | null {
  let t = vice.trim().replace(/^["«]|["»]$/g, '');
  if (!t) return null;
  t = t.replace(/[.!?…]+$/u, '');
  // одна клауза внутри кавычек — без внутренних точек
  t = t.replace(/[.!?…]+\s+/gu, ' — ');
  if (!t) return null;
  return pickOne(
    [
      `про себя признаётся: «${t}»`,
      `слабость не прячет: «${t}»`,
      `за что цепляется, когда город давит: «${t}»`,
    ],
    `порок: «${t}»`
  );
}
