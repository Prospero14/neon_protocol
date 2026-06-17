/** Имена и клички по происхождению / деятельности / классу (Carbon 2185). */

import type { NriClassId } from './nriClasses';
import type { NriActivityId, NriNpcArchetypeId, NriOriginId } from './nriCharacterGen';

const pick = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]!;

const FIRST_BY_ORIGIN: Record<NriOriginId, readonly string[]> = {
  neo_tokyo: [
    'Yuki', 'Hiro', 'Kenji', 'Akira', 'Mei', 'Rin', 'Takeshi', 'Sora', 'Haruka', 'Daiki',
    'Naomi', 'Kaito', 'Aiko', 'Ren', 'Mika', 'Shin', 'Hana', 'Ryota', 'Emi', 'Kazuki',
  ],
  hong_kong: [
    'Wei', 'Ling', 'Jun', 'Mei-Lin', 'Ho', 'Chow', 'Ying', 'Pak', 'Siu', 'Wai',
    'Fen', 'Kwan', 'Lok', 'Hui', 'Yan', 'Cheung', 'Bao', 'Jie', 'Xiu', 'Ming',
  ],
  los_angeles: [
    'Jake', 'Mia', 'Tyler', 'Zoe', 'Marcus', 'Riley', 'Dante', 'Skye', 'Cole', 'Nova',
    'Ash', 'Blake', 'Jordan', 'Casey', 'Morgan', 'Quinn', 'Reed', 'Sage', 'Troy', 'Vera',
  ],
  london: [
    'Oliver', 'Poppy', 'Finn', 'Esme', 'Alfie', 'Cleo', 'Rupert', 'Ivy', 'Dex', 'Tamsin',
    'Gareth', 'Nell', 'Hugh', 'Sienna', 'Rory', 'Bea', 'Colin', 'Freya', 'Nigel', 'Lottie',
  ],
  moscow: [
    'Dmitri', 'Katya', 'Ivan', 'Nadia', 'Sergei', 'Anya', 'Pavel', 'Olga', 'Viktor', 'Masha',
    'Alexei', 'Irina', 'Nikolai', 'Svetlana', 'Boris', 'Lena', 'Grigori', 'Zoya', 'Roman', 'Daria',
  ],
  sao_paulo: [
    'Lucas', 'Beatriz', 'Rafael', 'Camila', 'Thiago', 'Juliana', 'Bruno', 'Larissa', 'Diego', 'Fernanda',
    'Gustavo', 'Mariana', 'Felipe', 'Aline', 'Rodrigo', 'Patricia', 'Andre', 'Carla', 'Henrique', 'Renata',
  ],
  offworld: [
    'Unit-7', 'Echo', 'Relay', 'Pilot', 'Ash', 'Null', 'Vector', 'Cipher', 'Orbit', 'Delta',
    'Proxy', 'Signal', 'Frame', 'Index', 'Pulse', 'Node', 'Scope', 'Drift', 'Latch', 'Phase',
  ],
};

const LAST_BY_ORIGIN: Record<NriOriginId, readonly string[]> = {
  neo_tokyo: [
    'Sato', 'Tanaka', 'Hayashi', 'Nakamura', 'Yamamoto', 'Kobayashi', 'Suzuki', 'Watanabe', 'Ito', 'Kato',
    'Shimizu', 'Mori', 'Aoki', 'Fujita', 'Okada', 'Matsui', 'Ishida', 'Hasegawa', 'Goto', 'Maeda',
  ],
  hong_kong: [
    'Chan', 'Wong', 'Lee', 'Lau', 'Ng', 'Cheung', 'Leung', 'Ho', 'Cheng', 'Tam',
    'Yip', 'Kwok', 'Tsang', 'Lam', 'Chow', 'Fong', 'Poon', 'Mak', 'Yuen', 'Tang',
  ],
  los_angeles: [
    'Vega', 'Stone', 'Reed', 'Cross', 'Mercer', 'Hayes', 'Brooks', 'Voss', 'Cruz', 'Palmer',
    'Wright', 'Diaz', 'Shaw', 'Cole', 'Ross', 'Blake', 'Ford', 'Grant', 'Holt', 'Pierce',
  ],
  london: [
    'Ashford', 'Wright', 'Clarke', 'Mercer', 'Bennett', 'Fletcher', 'Hawkins', 'Porter', 'Sinclair', 'Rowe',
    'Chapman', 'Barton', 'Greaves', 'Holland', 'Kerr', 'Langley', 'Monroe', 'Nash', 'Pritchard', 'Quinn',
  ],
  moscow: [
    'Volkov', 'Orlov', 'Petrov', 'Sokolov', 'Kuznetsov', 'Morozov', 'Vasiliev', 'Fedorov', 'Lebedev', 'Popov',
    'Novikov', 'Egorov', 'Pavlov', 'Romanov', 'Belov', 'Gusev', 'Kiselev', 'Makarov', 'Zaitsev', 'Borisov',
  ],
  sao_paulo: [
    'Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Costa', 'Ferreira', 'Almeida', 'Pereira', 'Ribeiro',
    'Carvalho', 'Gomes', 'Martins', 'Araujo', 'Barbosa', 'Rocha', 'Dias', 'Nunes', 'Melo', 'Cardoso',
  ],
  offworld: [
    'Relay', 'Dock-9', 'Habitat-C', 'Orbit-III', 'Sector-12', 'Bay-4', 'Grid-7', 'Node-A', 'Ring-2', 'Port-5',
    'Luna-6', 'Mars-1', 'Void-8', 'Hub-3', 'Arc-0', 'Spoke-11', 'Deck-7', 'Crew-9', 'Lab-2', 'Cargo-6',
  ],
};

const NICKNAME_BY_ACTIVITY: Record<NriActivityId, readonly string[]> = {
  street: [
    'Тень', 'Шрам', 'Ржавчина', 'Клык', 'Пепел', 'Дым', 'Шип', 'Сквозняк', 'Чек', 'Боксер',
    'Лютая Смена', 'Кеды', 'Мелочь', 'Скам', 'Карман', 'Граффити', 'Ноль-Сдачи', 'Вендинг', 'Штраф', 'Параллель',
  ],
  corp: [
    'Костюм', 'Протокол', 'Логотип', 'Печать', 'Контракт', 'Акционер', 'Таблица',
    'Согласовано', 'Срочный Колл', 'Скриптум', 'Овертайм', 'Досье', 'Штамп', 'Коридор',
    'Этаж', 'Стекло', 'Лазурь', 'Бумажник', 'Лифт', 'Паркинг', 'Бейдж', 'Кабинет',
  ],
  military: [
    'Калибр', 'Осколок', 'Патрон', 'Штурм', 'Броня', 'Выстрел', 'Рубеж', 'Клин', 'Сапёр', 'Шомпол',
    'Сухпаёк', 'ТриДня', 'Тревога', 'Сектор', 'Бастион', 'Рикошет', 'Казарма', 'Гильза', 'Порох', 'Хриплый',
  ],
  medical: [
    'Шов', 'Пульс', 'Сыворотка', 'Скальпель', 'Рентген', 'Шприц', 'Триаж', 'Пинцет', 'Санация', 'Наркоз',
    'Медбрат', 'Док-Фаст', 'Гематома', 'Пластырь', 'Капельница', 'Ремиссия', 'Тонзилла', 'Реаниматор', 'Бинт', 'Белый Шум',
  ],
  criminal: [
    'Контрабанда', 'Долг', 'Сейф', 'Сделка', 'Крыша', 'Маска', 'Код', 'Схема', 'Фомка', 'Переучёт',
    'БезЧека', 'Подписант', 'Чернила', 'Товарняк', 'Псевдоним', 'Ночной Кассир', 'Отмыв', 'Рынок', 'Тихий Взлом', 'Переулок',
  ],
  tech: [
    'Патч', 'Баг', 'Прошивка', 'Кэш', 'Порт', 'Дек', 'Сигнал', 'Бит', 'Лог', 'Скрипт',
    'Пинг', 'Нулевой День', 'Драйвер', 'Компилятор', 'Ребут', 'Сокет', 'Интеграл', 'ТехДолг', 'Чёрный Экран', 'Бэкдор',
  ],
  media: [
    'Кадр', 'Хедлайн', 'Линза', 'Фид', 'Сенсация', 'Микрофон', 'Сюжет', 'Пиксель', 'Эфир', 'Скандал',
    'Монтаж', 'Кликбейт', 'Эксклюзив', 'Режиссёрка', 'Озвучка', 'Нарезка', 'Студия', 'Титры', 'Промо', 'Крупный План',
  ],
  nomad: [
    'Караван', 'Пыль', 'Маршрут', 'Колесо', 'Ветер', 'Горизонт', 'Трасса', 'Стоянка', 'Конвой', 'След',
    'Запаска', 'Фаркоп', 'Бак', 'Полночь', 'Бродяга', 'Шторм', 'Километр', 'Тупик', 'Радар', 'Палатка',
  ],
};

const NICKNAME_BY_CLASS: Record<NriClassId, readonly string[]> = {
  detective: [
    'Шпиль', 'Лупа', 'Досье', 'Ночной', 'Следак', 'Дымка', 'Хвост', 'Сводка', 'Архив', 'След',
    'Мокрый Плащ', 'Третий Этаж', 'Кадр', 'Сигнал', 'Тень на Лестнице', 'Пепельный', 'Субъект', 'Протокол-7',
  ],
  merc: [
    'Калибр', 'Осколок', 'Патрон', 'Штурм', 'Броня', 'Выстрел', 'Рубеж', 'Клин', 'Сапёр', 'Шомпол',
    'Рикошет', 'Гильза', 'Порох', 'Хриплый', 'Бастион', 'Сектор', 'Тревога', 'Сухпаёк',
  ],
  hacker: [
    'Патч', 'Баг', 'Прошивка', 'Кэш', 'Порт', 'Дек', 'Сигнал', 'Бит', 'Лог', 'Скрипт',
    'Пинг', 'Нулевой День', 'Драйвер', 'Ребут', 'Сокет', 'ТехДолг', 'Чёрный Экран', 'Бэкдор',
  ],
  doc: [
    'Шов', 'Пульс', 'Сыворотка', 'Скальпель', 'Рентген', 'Шприц', 'Триаж', 'Пинцет', 'Санация', 'Наркоз',
    'Гематома', 'Пластырь', 'Капельница', 'Реаниматор', 'Бинт', 'Белый Шум', 'Ремиссия', 'Шовный',
  ],
  fixer: [
    'Сделка', 'Процент', 'Мост', 'Сводка', 'Контакт', 'Канал', 'Комиссия', 'Связной', 'Брокер', 'Счёт',
    'Кошелёк', 'Переговоры', 'Схема', 'Посредник', 'Квитанция', 'Маршрут', 'Сейф', 'Код',
  ],
  daimyo: [
    'Капитан', 'Клинок', 'Тотем', 'Штандарт', 'Кулак', 'Коготь', 'Клык', 'Смотрящий', 'Старший', 'Барьер',
    'Щит', 'Удар', 'Рубеж', 'Клан', 'Знамя', 'Печать', 'Голос', 'Сталь',
  ],
};

const NICKNAME_BY_ARCHETYPE: Partial<Record<NriNpcArchetypeId, readonly string[]>> = {
  cop: ['Патруль', 'Участковый', 'Наряд', 'Сирена', 'Дежурный', 'Погоня', 'Рейд', 'Протокол'],
  gang: ['Клык', 'Шрам', 'Метка', 'Крыша', 'Сбор', 'Район', 'Цепь', 'Кровь'],
  netrunner: ['ICE', 'Пакет', 'Поток', 'Архив', 'Прокси', 'Туннель', 'Фрейм', 'Нуль'],
  mercenary: ['Контракт', 'Депозит', 'Вылазка', 'Операция', 'Фронт', 'Отряд', 'Смена', 'Выстрел'],
  ripperdoc: ['Резец', 'Шов', 'Имплант', 'Стериль', 'Клиника', 'Наркоз', 'Скальпель', 'Пластина'],
  fixer: ['Сводка', 'Процент', 'Мост', 'Сделка', 'Канал', 'Контакт', 'Брокер', 'Счёт'],
  corp_exec: ['Кабинет', 'Совет', 'Портфель', 'Акция', 'Этаж', 'Бейдж', 'Протокол', 'Повестка'],
  street_bum: ['Угол', 'Картон', 'Пепел', 'Скамейка', 'Дождь', 'Теплотрасса', 'Миска', 'Тень'],
  addict: ['Доза', 'Стим', 'Тремор', 'Синяк', 'Игла', 'Провал', 'Откат', 'Петля'],
  merchant: ['Прилавок', 'Скидка', 'Весы', 'Чек', 'Товар', 'Склад', 'Касса', 'Обмен'],
  robot: ['Юнит', 'Серийник', 'Прошивка', 'Корпус', 'Реле', 'Цикл', 'Модуль', 'Кадр'],
  civilian: ['Сосед', 'Прохожий', 'Билет', 'Очередь', 'Маршрут', 'Квитанция', 'Пакет', 'Смена'],
};

const CULT_REFERENCE_BY_ACTIVITY: Partial<Record<NriActivityId, readonly string[]>> = {
  tech: ['Мотоко', 'Лейн', 'Гайвер', 'Кубрик', 'Киану', 'Нейромант', 'Case', 'Zero Cool'],
  street: ['Спайк', 'Вулф', 'Такеши', 'Рэмбо', 'Бельмондо', 'Соло', 'V', 'Джокер'],
  military: ['Рипли', 'Рэмбо', 'Терминатор', 'Снейк', 'Курт Рассел', 'Dutch', 'Soap'],
  media: ['Нуар', 'Кэмерон', 'Кусто', 'Тарантино', 'Моне', 'Холст', 'Праймтайм'],
  criminal: ['Кайзер', 'Донни', 'Нео-Нуар', 'Гудфелла', 'Скала', 'Тихий', 'Крючок'],
  corp: ['Тайлер', 'Патрик', 'Арасака', 'Милitech', 'Синий Лед', 'Бейдж-99'],
  medical: ['Док', 'Хаус', 'Триаж', 'Скальпель', 'Рана'],
  nomad: ['Макс', 'Фуриоза', 'Дорожный', 'Караван'],
};

const COMPOUND_ADJ = [
  'Пепельный', 'Хромовой', 'Нулевой', 'Мокрый', 'Ржавый', 'Ночной', 'Багровый', 'Тихий',
  'Ледяной', 'Слепой', 'Кислотный', 'Грязный', 'Стальной', 'Мёртвый', 'Серый', 'Чёрный',
  'Неоновый', 'Синий', 'Голодный', 'Сломанный', 'Пустой', 'Дикий',
] as const;

const COMPOUND_NOUN = [
  'Призрак', 'Клык', 'Шрам', 'Поток', 'Сигнал', 'Клинок', 'Пепел', 'Шторм', 'Канал',
  'Патрон', 'Эхо', 'Дым', 'Рубеж', 'След', 'Порт', 'Маршрут', 'Глитч', 'Перегруз',
  'Корпус', 'Прокси', 'Сбой', 'Каскад', 'Импульс', 'Фантом',
] as const;

const CYBER_SUFFIX = ['v2', '0x', 'MK-II', 'Prime', 'EX', 'Neo', 'Alt', 'Ghost', 'Cold', '404', 'X'] as const;

function rollCompoundNickname(): string {
  const roll = Math.random();
  if (roll < 0.4) {
    return `${pick(COMPOUND_ADJ)} ${pick(COMPOUND_NOUN)}`;
  }
  if (roll < 0.65) {
    const pools = [
      ...NICKNAME_BY_ACTIVITY.street,
      ...NICKNAME_BY_ACTIVITY.criminal,
      ...NICKNAME_BY_ACTIVITY.tech,
    ];
    return `${pick(pools)}-${pick(CYBER_SUFFIX)}`;
  }
  return `${pick(COMPOUND_NOUN)} ${String(Math.floor(Math.random() * 90) + 10)}`;
}

/** Полное имя с учётом происхождения. */
export function rollCharacterName(originId: NriOriginId = 'neo_tokyo'): string {
  const first = pick(FIRST_BY_ORIGIN[originId] ?? FIRST_BY_ORIGIN.neo_tokyo);
  const last = pick(LAST_BY_ORIGIN[originId] ?? LAST_BY_ORIGIN.neo_tokyo);
  return `${first} ${last}`;
}

export type RollNicknameParams = {
  activityId?: NriActivityId;
  classId?: NriClassId;
  archetypeId?: NriNpcArchetypeId;
};

/** Кличка / позывной: приоритет классу и архетипу, без корпоративного жаргона. */
export function rollNickname(activityOrParams: NriActivityId | RollNicknameParams = 'street'): string {
  const params: RollNicknameParams =
    typeof activityOrParams === 'string' ? { activityId: activityOrParams } : activityOrParams;
  const activityId = params.activityId ?? 'street';
  const refs = CULT_REFERENCE_BY_ACTIVITY[activityId] ?? [];
  if (refs.length > 0 && Math.random() < 0.12) return pick(refs);

  const roll = Math.random();
  if (params.classId && roll < 0.38) {
    const fromClass = pick(NICKNAME_BY_CLASS[params.classId] ?? NICKNAME_BY_ACTIVITY[activityId]);
    if (Math.random() < 0.35) return `${fromClass}-${pick(CYBER_SUFFIX)}`;
    return fromClass;
  }
  if (params.archetypeId && roll < 0.62) {
    const arch = NICKNAME_BY_ARCHETYPE[params.archetypeId];
    if (arch?.length) return pick(arch);
  }
  if (roll < 0.78) {
    return rollCompoundNickname();
  }
  return pick(NICKNAME_BY_ACTIVITY[activityId] ?? NICKNAME_BY_ACTIVITY.street);
}

/** Имя + кличка в одной строке для листа. */
export function formatCharacterDisplayName(name: string, nickname?: string): string {
  const n = name.trim();
  const k = nickname?.trim();
  if (!k) return n;
  if (n.toLowerCase().includes(k.toLowerCase())) return n;
  return `${n} «${k}»`;
}
