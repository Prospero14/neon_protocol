/** Имена и клички по происхождению / деятельности (Carbon 2185). */

import type { NriActivityId, NriOriginId } from './nriCharacterGen';

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
  street: ['Скит', 'Тень', 'Шрам', 'Грязь', 'Песок', 'Ржавчина', 'Клык', 'Пепел', 'Дым', 'Шип'],
  corp: ['Костюм', 'Протокол', 'Логотип', 'Бюджет', 'Слайд', 'Отчёт', 'Коридор', 'Печать', 'Контракт', 'Акционер'],
  military: ['Калибр', 'Осколок', 'Патрон', 'Штурм', 'Корпус', 'Броня', 'Выстрел', 'Плац', 'Рубеж', 'Клин'],
  medical: ['Шов', 'Пульс', 'Сыворотка', 'Скальпель', 'Рентген', 'Шприц', 'Рана', 'Реаниматор', 'Доза', 'Триаж'],
  criminal: ['Контрабанда', 'Долг', 'Сейф', 'Отмыв', 'Сделка', 'Крыша', 'Маска', 'Слепок', 'Код', 'Схема'],
  tech: ['Патч', 'Баг', 'Прошивка', 'Кэш', 'Порт', 'Дек', 'Сигнал', 'Бит', 'Лог', 'Скрипт'],
  media: ['Кадр', 'Хедлайн', 'Линза', 'Фид', 'Сенсация', 'Микрофон', 'Сюжет', 'Пиксель', 'Эфир', 'Скандал'],
  nomad: ['Караван', 'Пыль', 'Маршрут', 'Колесо', 'Ветер', 'Горизонт', 'Трасса', 'Стоянка', 'Конвой', 'След'],
};

/** Полное имя с учётом происхождения. */
export function rollCharacterName(originId: NriOriginId = 'neo_tokyo'): string {
  const first = pick(FIRST_BY_ORIGIN[originId] ?? FIRST_BY_ORIGIN.neo_tokyo);
  const last = pick(LAST_BY_ORIGIN[originId] ?? LAST_BY_ORIGIN.neo_tokyo);
  return `${first} ${last}`;
}

/** Кличка / позывной по деятельности. */
export function rollNickname(activityId: NriActivityId = 'street'): string {
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
