/**
 * Бэкстори для C2185 / NRI.
 *
 * Best practice (table-ready, не роман):
 * 1) кто и откуда (роль + рана карьеры);
 * 2) одно настоящее напряжение / умение;
 * 3) want / contradiction / крючок для мастера.
 * Без списков фактов подряд и без «Деятельность: … Класс: …».
 */

import { getNriClass, type NriClassId } from './nriClasses';
import type { NriActivityId, NriNpcArchetypeId, NriOriginId } from './nriCharacterGen';
import { NRI_NPC_ARCHETYPES, NRI_ORIGINS } from './nriCharacterGen';
import { careerSectorHint, rollCareer, type CareerSector } from './nriCareers';
import {
  chromeHookLine,
  pocketHookLine,
  viceHookLine,
  weaponHookLine,
  type CharacterFlavorInput,
} from './nriCharacterFlavor';
import { asSentence, joinSentences, pickOne } from './nriProse';

function originLabel(id: NriOriginId): string {
  return NRI_ORIGINS.find((o) => o.id === id)?.label ?? id;
}

/** «из …» — родительный / устойчивая форма для зачина. */
const ORIGIN_FROM: Record<NriOriginId, string> = {
  neo_tokyo: 'Нео-Токио',
  hong_kong: 'Гонконга',
  los_angeles: 'Лос-Анджелеса',
  london: 'Лондона',
  moscow: 'Москвы',
  sao_paulo: 'Сан-Паулу',
  offworld: 'колонии',
};

function originFrom(id: NriOriginId): string {
  return ORIGIN_FROM[id] ?? originLabel(id);
}

/** Короткая роль для текста: «наёмник», не «Бандит / якудза». */
function archRole(id: NriNpcArchetypeId): string {
  const raw = NRI_NPC_ARCHETYPES.find((a) => a.id === id)?.label ?? id;
  const short = raw.split('/')[0]?.trim() || raw;
  return short.toLocaleLowerCase('ru-RU');
}

function classRu(id: NriClassId): string {
  return getNriClass(id)?.name ?? id;
}

/** Прошлое / происхождение — уже как законченные фразы (подставляем имя отдельно). */
const ORIGIN_PAST: Record<NriOriginId, string[]> = {
  neo_tokyo: [
    'вырос в тени неоновых вывесок Синдзюку',
    'помнит блэкаут, после которого семья распалась',
    'сбежал из корп-академии, не выдержав протоколов',
    'должен якудза за старый долг отца',
    'пережил рейд Arasaka ещё ребёнком',
    'с детства гонял на маглеве без билета',
  ],
  hong_kong: [
    'переправлялся на лодках между островами',
    'видел, как сносили старый квартал под офисы',
    'торговал на ночном рынке с пелёнок',
    'связан с триадой через крёстного',
    'сбежал с контейнероверфи',
  ],
  los_angeles: [
    'рос в спрут-городе у автомагистрали',
    'мечтал о студии и получил контракт с ловушкой',
    'пережил пожар в трущобах Сан-Педро',
    'должен продюсеру за сорванный пилот',
    'видел, как Militech скупила родной район',
  ],
  london: [
    'жил у Темзы, когда подняли воду',
    'работал в архиве под Вестминстером',
    'должен банку за имплант матери',
    'служил в частной охране Сити',
    'пережил взрыв метро',
  ],
  moscow: [
    'рос в спальном районе у старых панелек',
    'помнит зиму без тепла',
    'работал на рынке серого железа',
    'сбежал из военкомата через подполье',
    'должен силовикам за чужой косяк',
  ],
  sao_paulo: [
    'рос в фавеле с видом на корп-башни',
    'пережил наводнение, смывшее квартал',
    'должен банде за защиту брата',
    'торговал на уличных фестивалях',
    'разбил первый байк в четырнадцать',
  ],
  offworld: [
    'родился в рециркуляторе орбитальной станции',
    'не видел настоящего неба до восемнадцати',
    'пережил разгерметизацию сектора',
    'должен корпорации за кислород детства',
    'сбежал с колониального транспорта',
  ],
};

/** Настоящее напряжение — одно на лист. */
const PRESENT_TENSION: Record<NriActivityId, string[]> = {
  street: [
    'сейчас живёт мелкими сделками и уличной хитростью',
    'знает каждую камеру в радиусе трёх кварталов',
    'умеет исчезнуть в толпе за три секунды',
    'собирает слухи быстрее, чем обновляется фид',
  ],
  corp: [
    'привык к KPI, NDA и «несчастным случаям» в балансе',
    'знает, как выглядит увольнение одним письмом',
    'умеет говорить «синергия» с абсолютно серьёзным лицом',
  ],
  military: [
    'прошёл контракты, о которых не пишут в резюме',
    'привык спать с одним глазом открытым',
    'верит только напарнику, проверенному в бою',
  ],
  medical: [
    'видел слишком много, чтобы верить в «лёгкие ранения»',
    'умеет шить раны без стерильной палаты',
    'спасал людей, которых потом искали силовики',
  ],
  criminal: [
    'живёт по правилу: долги возвращаются с процентами',
    'не оставляет цифровых следов без нужды',
    'знает, где продают паспорта нового поколения',
  ],
  tech: [
    'чинит то, что производители уже списали',
    'пишет скрипты быстрее, чем охрана успевает среагировать',
    'ненавидит облачные подписки на прошивки',
  ],
  media: [
    'вытаскивает правду из одного кадра',
    'держит архив компромата на пол-города',
    'не верит официальным пресс-релизам',
  ],
  nomad: [
    'не привязан к адресу дольше месяца',
    'знает безопасные маршруты между мегаполисами',
    'торгует топливом и слухами на стоянках',
  ],
};

/** Классовый «инструмент» — как действует за столом. */
const CLASS_EDGE: Record<NriClassId, string[]> = {
  detective: [
    'собирает улики там, где камеры «случайно» глючат',
    'читает ложь по паузам и микродвижениям',
    'не верит совпадениям — только цепочкам фактов',
  ],
  merc: [
    'считает дистанцию до укрытия быстрее, чем шаги',
    'доверяет только оружию, которое чистил сам',
    'вытаскивал людей из перестрелок, о которых не пишут',
  ],
  hacker: [
    'видит в любом терминале дверь, а не экран',
    'оставил цифровые шрамы в чужих сетях',
    'знает, где сетевой лёд тоньше всего',
  ],
  doc: [
    'не паникует у крови — видел хуже',
    'знает, какие стимы убивают, а какие спасают',
    'носит в кармане инструмент, которого нет в каталоге',
  ],
  fixer: [
    'сводит тех, кто не должен встречаться в одном кадре',
    'берёт процент с каждой сделки — и с каждой ошибки',
    'умеет превратить проблему в контракт',
  ],
  daimyo: [
    'привык, что комната затихает, когда он входит',
    'несёт ответственность за людей, которых не выбирал',
    'не путает уважение со страхом — использует оба',
  ],
};

const SECTOR_PRESSURE: Record<CareerSector, string[]> = {
  corp: [
    'корп-бейдж ещё чешется на лацкане — даже когда его давно нет',
    'помнит запах закрытых переговорок лучше, чем запах улицы',
  ],
  private: [
    'клиенты приходят по рекомендации, не по рекламе',
    'меняет заказчика чаще, чем квартиру',
  ],
  state: [
    'видел, как закон гнётся под заказ',
    'имеет досье, которого официально не существует',
  ],
  street: [
    'не доверяет никому с чистыми ботинками',
    'зарабатывает там, где нет расписания и выходных',
  ],
  underground: [
    'должен тем, кто знает настоящее имя',
    'однажды перешёл черту — и не нашёл обратной дороги',
  ],
};

/** Want / contradiction — крючок для мастера (уже предложения). */
const ARCHETYPE_CLOSERS: Record<NriNpcArchetypeId, string[]> = {
  civilian: [
    'Сейчас ищет стабильности — или хотя бы одну тихую неделю.',
    'Хочет просто пережить следующий цикл зарплат.',
  ],
  street_bum: [
    'Спит там, где не видят дроны, и мечтает о горячей еде.',
    'Единственная валюта — слухи и долги.',
  ],
  addict: [
    'Гоняется за следующей дозой — или за прощением, если хватит сил.',
    'Тело помнит стим сильнее, чем разум помнит имена.',
  ],
  merchant: [
    'Репутация дороже товара — и это тоже продаётся.',
    'Всегда ищет покупателя с толстым кошельком и тонкой совестью.',
  ],
  ripperdoc: [
    'Руки помнят каждый разрез; вопросов «зачем» не задаёт.',
    'Клиника открыта, пока платят — мораль потом.',
  ],
  gang: [
    'Верность клану — единственный закон, который ещё держит.',
    'Ждёт шанса подняться — или сбежать до рассвета.',
  ],
  corp_exec: [
    'Улыбается на совещаниях и считает ходы на три квартала вперёд.',
    'Играет в шахматы, где фигуры — чужие жизни.',
  ],
  robot: [
    'Память фрагментирована; цели размыты, серийник стёрт.',
    'Ищет, кто стёр прошлую прошивку — и зачем.',
  ],
  cop: [
    'Закон для него — инструмент, не идеал.',
    'Знает, кому можно, а кому нельзя — и берёт за это цену.',
  ],
  fixer: [
    'Связывает тех, кто не должен встречаться — и берёт процент за тишину.',
    'Контракт важнее дружбы; дружба иногда дороже контракта.',
  ],
  netrunner: [
    'Оставил цифровой след и ждёт, кто первым потянет за нитку.',
    'Сетевой лёд для такого — головоломка, а не стена.',
  ],
  mercenary: [
    'Контракт есть контракт — пока депозит на счету.',
    'Доверяет только оружию, напарнику и предоплате.',
  ],
};

/**
 * Зачин от 3-го лица, без англ. классовых ярлыков.
 * Одна клауза без внутренней точки (иначе joinSentences раздувает счёт).
 * {arch} — короткая роль; {classRu} — русское имя класса.
 */
const LEAD_TEMPLATES: string[] = [
  '{name} — {arch} из {originFrom}, в бумагах значится как «{career}»',
  '{name}, {classRu}, не любит вспоминать годы в роли «{career}»',
  'Из {originFrom} — {name}: визитка когда-то гласила «{career}», теперь это шрам, не строка резюме',
  '{name} почти не представляется: бывший «{career}» из {originFrom}',
  'В досье — {name}, {classRu}; на улице — {arch} с прошлым «{career}»',
  'Из роли «{career}» {name} вырвали не по своей воле — и до сих пор оглядывается',
  'Кличка известнее паспорта: {name}, {arch} из {originFrom}, когда-то — «{career}»',
  '{name} по бумагам ещё {classRu}, хотя улица зовёт иначе — «{career}» из {originFrom}',
];

/** Если роль и класс совпадают («наёмник»/«Наёмник») — не дублировать. */
function streetRole(arch: string, classRu: string): string {
  if (arch.toLocaleLowerCase('ru-RU') === classRu.toLocaleLowerCase('ru-RU')) {
    return pickOne(
      ['контрактник без вывески', 'одиночка с улицы', 'человек без чистой визитки'],
      'одиночка с улицы'
    );
  }
  return arch;
}

function displayNameForStory(raw: string): string {
  return raw.trim() || 'Без имени';
}

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? '');
}

export function getBackstoryPoolSize(): number {
  return LEAD_TEMPLATES.length * 3;
}

export function generateRichBackstory(params: CharacterFlavorInput): string {
  const arch = params.archetypeId ?? 'civilian';
  const localizedName = displayNameForStory(params.name);
  const display = params.nickname?.trim()
    ? `${localizedName} «${params.nickname.trim()}»`
    : localizedName;
  const career =
    params.career?.trim() ||
    rollCareer({
      classId: params.classId,
      activityId: params.activityId,
      archetypeId: params.archetypeId,
    });
  const sector = careerSectorHint(career) ?? 'private';

  const classLabel = classRu(params.classId);
  const role = streetRole(archRole(arch), classLabel);
  const vars = {
    name: display,
    origin: originLabel(params.originId),
    originFrom: originFrom(params.originId),
    arch: role,
    classRu: classLabel,
    career,
  };

  const lead = asSentence(fill(pickOne(LEAD_TEMPLATES, LEAD_TEMPLATES[0]!), vars));

  const chromeLine = chromeHookLine(params.chrome ?? []);
  const weaponLine = weaponHookLine(params.weapons ?? []);
  const pocketLine = pocketHookLine(params.pocketNames ?? []);
  const viceLine = viceHookLine(params.vice ?? '');
  const gearPool = [chromeLine, weaponLine].filter(Boolean) as string[];
  const personalPool = [viceLine, pocketLine].filter(Boolean) as string[];

  // 2) Настоящее — всегда 3-е лицо; чаще личная деталь (хром/ствол), чем абстрактный навык
  let middleRaw: string;
  if (gearPool.length && Math.random() < 0.72) {
    middleRaw = pickOne(gearPool, gearPool[0]!);
  } else if (Math.random() < 0.5) {
    middleRaw = pickOne(CLASS_EDGE[params.classId], 'умеет держать лицо при любой сделке');
  } else {
    middleRaw = pickOne(PRESENT_TENSION[params.activityId], 'умеет выживать в городе');
  }

  // 3) Цвет: порок только в кавычках (1-е лицо внутри «…»); остальное — 3-е лицо
  let color: string | null = null;
  const colorRoll = Math.random();
  if (personalPool.length && colorRoll < 0.45) {
    color = pickOne(personalPool, personalPool[0]!);
  } else if (params.factionLabel?.trim() && colorRoll < 0.55) {
    color = `с «${params.factionLabel.trim()}» связан крепче, чем признаёт вслух`;
  } else if (colorRoll < 0.78) {
    color = pickOne(ORIGIN_PAST[params.originId], 'помнит город иначе, чем туристы');
  } else if (colorRoll < 0.92) {
    color = pickOne(SECTOR_PRESSURE[sector], 'должен тем, кого лучше не называть');
  } else if (gearPool.length && !gearPool.includes(middleRaw)) {
    color = pickOne(gearPool, gearPool[0]!);
  }

  const closer = pickOne(ARCHETYPE_CLOSERS[arch], 'Ищет следующий контракт — или выход.');

  return joinSentences(lead, middleRaw, color, closer);
}
