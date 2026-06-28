/** Каталог icebreaker-мини-игр для защищённых файлов (13 × 3 сложности). */

export type IceDifficulty = 'easy' | 'medium' | 'hard';
export type IceEngine =
  | 'gibson'
  | 'sequence'
  | 'scan'
  | 'breach'
  | 'daemon'
  | 'mesh'
  | 'memory'
  | 'dodge'
  | 'logwipe'
  | 'wordle'
  | 'sniff'
  | 'hash'
  | 'signallock';

export type IceGameParams = {
  sequenceLen: number;
  scanRounds: number;
  tapTarget: number;
  traceSpeed: number;
  memoryPairs: number;
  maxMistakes: number;
  wordLength: number;
  wordleAttempts: number;
  hashLen: number;
  sniffRounds: number;
  dodgeWaves: number;
  logDurationSec: number;
  meshNodes: number;
  flashMs: number;
  peekMs: number;
  /** Ширина зелёной зоны Signal Lock, % полосы. */
  signalZonePct: number;
};

export type IceGameGuide = {
  how: string;
  win: string;
  fail: string;
};

export type IceGameDef = {
  id: string;
  title: string;
  blurb: string;
  guide: IceGameGuide;
  engine: IceEngine;
  difficulties: Record<IceDifficulty, { label: string; params: IceGameParams }>;
};

const BASE: Record<IceDifficulty, IceGameParams> = {
  easy: {
    sequenceLen: 3,
    scanRounds: 2,
    tapTarget: 4,
    traceSpeed: 0.45,
    memoryPairs: 3,
    maxMistakes: 5,
    wordLength: 4,
    wordleAttempts: 12,
    hashLen: 4,
    sniffRounds: 3,
    dodgeWaves: 8,
    logDurationSec: 28,
    meshNodes: 4,
    flashMs: 620,
    peekMs: 950,
    signalZonePct: 24,
  },
  medium: {
    sequenceLen: 5,
    scanRounds: 4,
    tapTarget: 5,
    traceSpeed: 1.15,
    memoryPairs: 4,
    maxMistakes: 3,
    wordLength: 5,
    wordleAttempts: 10,
    hashLen: 6,
    sniffRounds: 5,
    dodgeWaves: 12,
    logDurationSec: 22,
    meshNodes: 5,
    flashMs: 420,
    peekMs: 620,
    signalZonePct: 16,
  },
  hard: {
    sequenceLen: 7,
    scanRounds: 6,
    tapTarget: 6,
    traceSpeed: 2.6,
    memoryPairs: 5,
    maxMistakes: 2,
    wordLength: 6,
    wordleAttempts: 8,
    hashLen: 10,
    sniffRounds: 7,
    dodgeWaves: 16,
    logDurationSec: 16,
    meshNodes: 6,
    flashMs: 260,
    peekMs: 380,
    signalZonePct: 10,
  },
};

function game(
  id: string,
  title: string,
  blurb: string,
  engine: IceEngine,
  guide: IceGameGuide,
  scale: Partial<Record<IceDifficulty, Partial<IceGameParams>>> = {}
): IceGameDef {
  const diffs = (['easy', 'medium', 'hard'] as IceDifficulty[]).reduce(
    (acc, d) => {
      acc[d] = {
        label: d === 'easy' ? 'Лёгкий' : d === 'medium' ? 'Средний' : 'Сложный',
        params: { ...BASE[d], ...scale[d] },
      };
      return acc;
    },
    {} as IceGameDef['difficulties']
  );
  return { id, title, blurb, guide, engine, difficulties: diffs };
}

export const NRI_GAME_CATALOG: IceGameDef[] = [
  game(
    'gibson_ice',
    'Gibson ICE Run',
    'Трёхфазный забег: скан → crack → exfil.',
    'gibson',
    {
      how: 'Проходи три фазы взлома: сканирование ICE, подбор ключа и вынос данных. На каждой фазе выбирай действия — ошибки и медлительность копят trace.',
      win: 'Успешно завершить exfil с минимальным trace — чем чище забег, тем выше score в рейтинге стола.',
      fail: 'Trace доходит до 100%, провал фазы или hardware ban после серии неудачных забегов на столе.',
    },
  ),
  game(
    'port_sweep',
    'Port Sweep',
    'Запомни портовый маршрут — ICE следит за аномалиями.',
    'sequence',
    {
      how: 'Порты мигают по очереди — запомни маршрут. Повтори кликами. Несколько раундов, окно показа сжимается. Ошибка — всплеск TRACE, не мгновенный провал.',
      win: 'Пройти все раунды с допустимым числом аномалий до заполнения TRACE.',
      fail: 'TRACE 100% — ICE локализовал netrunner и поднял тревогу.',
    },
    {
      easy: { sequenceLen: 3, scanRounds: 2, flashMs: 700, maxMistakes: 5, traceSpeed: 0.4 },
      medium: { sequenceLen: 5, scanRounds: 3, flashMs: 450, maxMistakes: 3, traceSpeed: 1.1 },
      hard: { sequenceLen: 7, scanRounds: 4, flashMs: 280, maxMistakes: 2, traceSpeed: 2.4 },
    },
  ),
  game(
    'vuln_scan',
    'Firewall Sweep',
    'Поймай открытый слот до закрытия — ICE адаптируется.',
    'scan',
    {
      how: 'Слоты firewall циклически открываются и закрываются. Только один слот уязвим в каждый момент — кликни в окно OPEN. Промах или опоздание — countermeasure и рост TRACE.',
      win: 'Успешно пройти все волны sweep до исчерпания TRACE.',
      fail: 'TRACE max или слишком много промахов под давлением ICE.',
    },
    {
      easy: { scanRounds: 4, flashMs: 1400, maxMistakes: 5, traceSpeed: 0.5 },
      medium: { scanRounds: 6, flashMs: 900, maxMistakes: 3, traceSpeed: 1.2 },
      hard: { scanRounds: 8, flashMs: 550, maxMistakes: 2, traceSpeed: 2.5 },
    },
  ),
  game(
    'trace_rush',
    'Breach Matrix',
    'Матрица hex-кодов: чередуй строку и столбец как в Breach Protocol.',
    'breach',
    {
      how: 'Слева — матрица кодов. Справа — целевая последовательность. Первый код только из верхней строки, дальше чередуй ось: столбец → строка → столбец. Буфер ограничен. Таймер TRACE тикает с первого клика.',
      win: 'Собрать всю целевую последовательность до заполнения TRACE.',
      fail: 'Неверный код, исчерпан буфер или TRACE 100%.',
    },
    {
      easy: { tapTarget: 4, sequenceLen: 4, maxMistakes: 4, traceSpeed: 0.5 },
      medium: { tapTarget: 5, sequenceLen: 5, maxMistakes: 3, traceSpeed: 1.15 },
      hard: { tapTarget: 6, sequenceLen: 6, maxMistakes: 2, traceSpeed: 2.6 },
    },
  ),
  game(
    'buffer_flood',
    'Daemon Upload',
    'Загрузи daemons по hex-последовательности под давлением ICE.',
    'daemon',
    {
      how: 'Три daemon-цели с hex-цепочками. В потоке кодов выбирай следующий нужный символ. Неверный код — countermeasure. Поток ускоряется каждый daemon.',
      win: 'Загрузить все daemons до TRACE 100%.',
      fail: 'TRACE max или критическая серия ошибок.',
    },
    {
      easy: { tapTarget: 3, sequenceLen: 3, peekMs: 2200, maxMistakes: 5, traceSpeed: 0.55 },
      medium: { tapTarget: 3, sequenceLen: 4, peekMs: 1600, maxMistakes: 3, traceSpeed: 1.2 },
      hard: { tapTarget: 4, sequenceLen: 5, peekMs: 1100, maxMistakes: 2, traceSpeed: 2.7 },
    },
  ),
  game(
    'hash_crack',
    'Hash Crack',
    'Восстанови hex-хэш по одной цифре.',
    'hash',
    {
      how: 'На каждой позиции хэша выбирай hex-цифру. Правильная закрепляется. Ошибка — всплеск TRACE и countermeasure, не мгновенный game over.',
      win: 'Собрать весь хэш до TRACE 100%.',
      fail: 'TRACE max — brute-force прерван ICE.',
    },
    {
      easy: { hashLen: 4, maxMistakes: 5, traceSpeed: 0.45 },
      medium: { hashLen: 7, maxMistakes: 3, traceSpeed: 1.1 },
      hard: { hashLen: 10, maxMistakes: 2, traceSpeed: 2.5 },
    },
  ),
  game(
    'packet_sniff',
    'Packet Sniff',
    'Поймай пакет с нужной CRC.',
    'sniff',
    {
      how: 'Пакеты пролетают в потоке — перехвати тот, у которого CRC совпадает с целью. Промах — ICE countermeasure.',
      win: 'Перехватить все целевые пакеты до TRACE 100%.',
      fail: 'TRACE max или критические ошибки перехвата.',
    },
    { easy: { sniffRounds: 3, maxMistakes: 5, traceSpeed: 0.5 }, medium: { sniffRounds: 5, maxMistakes: 3 }, hard: { sniffRounds: 7, maxMistakes: 2, traceSpeed: 2.4 } },
  ),
  game(
    'auth_bypass',
    'Auth Bypass',
    'Подбери пароль как в Wordle.',
    'wordle',
    {
      how: 'Есть текстовая подсказка и длина пароля. Вводи слово — цвет букв покажет: на месте, есть в слове, или нет.',
      win: 'Угадать пароль за отведённые попытки (7–12).',
      fail: 'Попытки закончились — auth gate закрыт, сессия сброшена.',
    },
    {
      easy: { wordLength: 4, wordleAttempts: 12 },
      medium: { wordLength: 6, wordleAttempts: 10 },
      hard: { wordLength: 9, wordleAttempts: 7, maxMistakes: 0 },
    },
  ),
  game(
    'log_wipe',
    'Log Wipe',
    'Сотри красные строки аудита.',
    'logwipe',
    {
      how: 'В поток логов падают строки. Кликай только по красным (AUDIT, SIEM, ICE…) — они исчезают. Белые системные строки не трогай.',
      win: 'Стереть нужное число threat-строк до истечения таймера (14–30 с).',
      fail: 'Время вышло, клик по белому логу или пропуск красной строки (она «убегает» и считается ошибкой).',
    },
    {
      easy: { logDurationSec: 30, maxMistakes: 4 },
      hard: { logDurationSec: 14, maxMistakes: 1 },
    },
  ),
  game(
    'mesh_jack',
    'Mesh Jack',
    'Запомни маршрут по узлам mesh.',
    'mesh',
    {
      how: 'Узлы MESH_A, MESH_B… подсвечиваются по очереди. После показа повтори тот же маршрут кликами.',
      win: 'Пройти весь маршрут (3–7 узлов) с допустимым числом ошибок.',
      fail: 'Ошибка в пути сбрасывает прогресс; на hard одна ошибка = провал.',
    },
    {
      easy: { meshNodes: 4, sequenceLen: 3, maxMistakes: 2 },
      hard: { meshNodes: 7, sequenceLen: 7, flashMs: 260, maxMistakes: 1 },
    },
  ),
  game(
    'dead_drop',
    'Dead Drop',
    'Открой все пары ключей.',
    'memory',
    {
      how: 'Поле закрытых ячеек. Открывай по две — если символы совпали, пара остаётся. Несовпадение закрывает обе через короткую паузу.',
      win: 'Найти все пары (3–6 пар) до исчерпания ошибок.',
      fail: 'Слишком много неверных пар — dead drop скомпрометирован.',
    },
    {
      easy: { memoryPairs: 3, peekMs: 1000 },
      hard: { memoryPairs: 6, peekMs: 400, maxMistakes: 2 },
    },
  ),
  game(
    'proxy_dodge',
    'Proxy Dodge',
    'Переключай канал от прокси-сканеров.',
    'dodge',
    {
      how: 'Три полосы. Метки SCAN падают сверху. Стрелками ← → переставляй ◉ в свободную полосу. Доживи до конца волн.',
      win: 'Пережить все волны (6–18) без превышения лимита попаданий.',
      fail: 'SCAN наехал на тебя слишком много раз — прокси выдал IP ICE.',
    },
    {
      easy: { dodgeWaves: 6, traceSpeed: 0.7 },
      hard: { dodgeWaves: 18, traceSpeed: 2.4, maxMistakes: 1 },
    },
  ),
  game(
    'signal_lock',
    'Signal Lock',
    'Поймай фазу сигнала кнопкой SYNC.',
    'signallock',
    {
      how: 'Розовый луч бегает по полосе. Зелёная зона — окно захвата. Жми SYNC, когда луч внутри зоны. После успеха зона смещается, канал меняется.',
      win: 'Сделать 3–5 успешных SYNC подряд.',
      fail: 'PROMах по SYNC или TRACE до 100% — carrier засёк netrunner.',
    },
    {
      easy: { sniffRounds: 3, signalZonePct: 24, traceSpeed: 0.7, maxMistakes: 2, flashMs: 1400 },
      medium: { sniffRounds: 4, signalZonePct: 17, traceSpeed: 1.0, maxMistakes: 2, flashMs: 1100 },
      hard: { sniffRounds: 5, signalZonePct: 12, traceSpeed: 1.35, maxMistakes: 1, flashMs: 850 },
    },
  ),
];

/** Каждый id и engine в каталоге должны быть уникальны. */
export function assertUniqueIceCatalog(games: IceGameDef[] = NRI_GAME_CATALOG): void {
  const ids = games.map((g) => g.id);
  const engines = games.map((g) => g.engine);
  if (new Set(ids).size !== ids.length) throw new Error('Duplicate ICE game ids');
  if (new Set(engines).size !== engines.length) throw new Error('Duplicate ICE game engines');
}

export function getIceGame(gameId: string): IceGameDef | undefined {
  return NRI_GAME_CATALOG.find((g) => g.id === gameId);
}

export function resolveIceParams(gameId: string, difficulty: IceDifficulty): IceGameParams | null {
  const g = getIceGame(gameId);
  if (!g) return null;
  return g.difficulties[difficulty]?.params ?? g.difficulties.medium.params;
}
