/** Каталог icebreaker-мини-игр для защищённых файлов (17 × 3 сложности). */

export type IceDifficulty = 'easy' | 'medium' | 'hard';
export type IceEngine =
  | 'gibson'
  | 'sequence'
  | 'scan'
  | 'breach'
  | 'stack'
  | 'constraint'
  | 'handshake'
  | 'wordle'
  | 'logwipe'
  | 'toggle'
  | 'dodge'
  | 'balance'
  | 'circuit'
  | 'likeness'
  | 'capture'
  | 'rings'
  | 'mines';

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
  /** Ширина зелёной зоны Noise Floor / legacy Signal Lock, % полосы. */
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
  /** Краткие отличия тиров — для UI карточки. */
  diffHints: Record<IceDifficulty, string>;
  engine: IceEngine;
  difficulties: Record<IceDifficulty, { label: string; params: IceGameParams }>;
};

const BASE: Record<IceDifficulty, IceGameParams> = {
  easy: {
    sequenceLen: 3,
    scanRounds: 2,
    tapTarget: 4,
    traceSpeed: 0.4,
    memoryPairs: 3,
    maxMistakes: 5,
    wordLength: 4,
    wordleAttempts: 12,
    hashLen: 4,
    sniffRounds: 3,
    dodgeWaves: 8,
    logDurationSec: 30,
    meshNodes: 4,
    flashMs: 680,
    peekMs: 1000,
    signalZonePct: 26,
  },
  medium: {
    sequenceLen: 4,
    scanRounds: 4,
    tapTarget: 5,
    traceSpeed: 0.85,
    memoryPairs: 4,
    maxMistakes: 4,
    wordLength: 5,
    wordleAttempts: 10,
    hashLen: 6,
    sniffRounds: 4,
    dodgeWaves: 10,
    logDurationSec: 26,
    meshNodes: 5,
    flashMs: 480,
    peekMs: 700,
    signalZonePct: 18,
  },
  hard: {
    sequenceLen: 6,
    scanRounds: 5,
    tapTarget: 6,
    traceSpeed: 1.35,
    memoryPairs: 5,
    maxMistakes: 3,
    wordLength: 6,
    wordleAttempts: 8,
    hashLen: 8,
    sniffRounds: 6,
    dodgeWaves: 14,
    logDurationSec: 20,
    meshNodes: 6,
    flashMs: 360,
    peekMs: 480,
    signalZonePct: 13,
  },
};

function game(
  id: string,
  title: string,
  blurb: string,
  engine: IceEngine,
  guide: IceGameGuide,
  diffHints: Record<IceDifficulty, string>,
  scale: Partial<Record<IceDifficulty, Partial<IceGameParams>>> = {},
): IceGameDef {
  const diffs = (['easy', 'medium', 'hard'] as IceDifficulty[]).reduce(
    (acc, d) => {
      acc[d] = {
        label: d === 'easy' ? 'Лёгкий' : d === 'medium' ? 'Средний' : 'Сложный',
        params: { ...BASE[d], ...scale[d] },
      };
      return acc;
    },
    {} as IceGameDef['difficulties'],
  );
  return { id, title, blurb, guide, diffHints, engine, difficulties: diffs };
}

export const NRI_GAME_CATALOG: IceGameDef[] = [
  game(
    'gibson_ice',
    'Gibson ICE Run',
    'Трёхфазный забег: скан → crack → exfil.',
    'gibson',
    {
      how: 'Проходи три фазы взлома: сканирование ICE, подбор ключа и вынос данных. На каждой фазе выбирай действия — ошибки и медлительность копят trace.',
      win: 'Успешно завершить exfil — чем чище забег (меньше trace), тем выше score.',
      fail: 'Trace 100%, провал фазы или hardware ban после серии неудач на столе.',
    },
    {
      easy: 'медленный TRACE · прощает ошибки',
      medium: 'давление TRACE · меньше запаса',
      hard: 'агрессивный TRACE · узкое окно на фазу',
    },
  ),
  game(
    'port_sweep',
    'Port Sweep',
    'Запомни портовый маршрут — ICE следит за аномалиями.',
    'sequence',
    {
      how: 'Порты мигают по очереди — запомни маршрут. Раунды чередуют ECHO (повтор), REVERSE (ввод с конца) и NOISE (ложный блик — игнорируй).',
      win: 'Пройти все раунды до TRACE 100% и в лимите аномалий.',
      fail: 'TRACE 100% или лимит аномалий — ICE локализовал netrunner.',
    },
    {
      easy: '3 порта · 2 раунда · flash 0.68с · 4 ошибки',
      medium: '4 порта · 3 раунда · flash 0.48с · 3 ошибки',
      hard: '5 портов · 4 раунда · flash 0.36с · 3 ошибки + быстрый TRACE',
    },
    {
      easy: { sequenceLen: 3, scanRounds: 2, flashMs: 680, maxMistakes: 4, traceSpeed: 0.5 },
      medium: { sequenceLen: 4, scanRounds: 3, flashMs: 480, maxMistakes: 3, traceSpeed: 0.95 },
      hard: { sequenceLen: 5, scanRounds: 4, flashMs: 320, maxMistakes: 2, traceSpeed: 1.45 },
    },
  ),
  game(
    'vuln_scan',
    'Firewall Sweep',
    'Поймай открытый слот до закрытия — ICE адаптируется.',
    'scan',
    {
      how: 'Слоты firewall циклически OPEN/CLOSED. Кликай только OPEN. BAIT (honeypot) — не трогай.',
      win: 'Пройти все волны sweep до TRACE max.',
      fail: 'TRACE 100% или слишком много промахов / кликов по BAIT.',
    },
    {
      easy: '4 волны · окно ~1.2с · 4 ошибки',
      medium: '5 волн · окно ~0.8с · 3 ошибки',
      hard: '7 волн · окно ~0.5с · 2 ошибки',
    },
    {
      easy: { scanRounds: 4, flashMs: 1200, maxMistakes: 4, traceSpeed: 0.65 },
      medium: { scanRounds: 5, flashMs: 800, maxMistakes: 3, traceSpeed: 1.1 },
      hard: { scanRounds: 7, flashMs: 500, maxMistakes: 2, traceSpeed: 1.6 },
    },
  ),
  game(
    'trace_rush',
    'Breach Matrix',
    'Матрица hex: чередуй строку и столбец (Breach Protocol).',
    'breach',
    {
      how: 'Слева матрица, справа цель. Первый код — верхняя строка, дальше чередуй ось столбец↔строка. Буфер ограничен.',
      win: 'Собрать всю целевую последовательность до TRACE 100%.',
      fail: 'Неверный код, буфер полный или TRACE 100%.',
    },
    {
      easy: 'цель 4 · буфер щедрый · медленный TRACE',
      medium: 'цель 5 · буфер туже',
      hard: 'цель 7 · узкий буфер · быстрый TRACE',
    },
    {
      easy: { tapTarget: 4, sequenceLen: 4, maxMistakes: 4, traceSpeed: 0.5 },
      medium: { tapTarget: 5, sequenceLen: 5, maxMistakes: 3, traceSpeed: 0.95 },
      hard: { tapTarget: 6, sequenceLen: 7, maxMistakes: 2, traceSpeed: 1.5 },
    },
  ),
  game(
    'opcode_forge',
    'Opcode Forge',
    'Собери payload из opcodes в точном порядке.',
    'stack',
    {
      how: 'На экране цель (маскируется по мере сборки) и пул чипов. Кликай следующий opcode. Ошибка — countermeasure, чип не тратится зря только если верный.',
      win: 'Собрать всю цепочку до TRACE 100%.',
      fail: 'TRACE max или лимит аномалий — stack corrupt, сессия сброшена.',
    },
    {
      easy: 'цепочка 3 · мало decoy · 4 ошибки',
      medium: 'цепочка 5 · +decoy · 3 ошибки',
      hard: 'цепочка 7 · много decoy · 2 ошибки · быстрый TRACE',
    },
    {
      easy: { sequenceLen: 3, tapTarget: 3, maxMistakes: 4, traceSpeed: 0.55 },
      medium: { sequenceLen: 5, tapTarget: 4, maxMistakes: 3, traceSpeed: 1.0 },
      hard: { sequenceLen: 7, tapTarget: 6, maxMistakes: 2, traceSpeed: 1.5 },
    },
  ),
  game(
    'keyspace_prune',
    'Keyspace Prune',
    'Mastermind по hex: exact / present без цветов Wordle.',
    'constraint',
    {
      how: 'Вводи hex-кандидат длины N. Ответ: сколько цифр на месте (exact) и сколько есть, но не там (present). Не путать с Auth Bypass и Likeness.',
      win: 'Угадать секрет за отведённые попытки до TRACE 100%.',
      fail: 'Попытки кончились или TRACE max — keyspace sealed.',
    },
    {
      easy: 'длина 3 · 10 попыток',
      medium: 'длина 4 · 8 попыток',
      hard: 'длина 5 · 6 попыток · быстрый TRACE',
    },
    {
      easy: { hashLen: 3, wordleAttempts: 10, maxMistakes: 5, traceSpeed: 0.45 },
      medium: { hashLen: 4, wordleAttempts: 8, maxMistakes: 4, traceSpeed: 0.9 },
      hard: { hashLen: 5, wordleAttempts: 6, maxMistakes: 3, traceSpeed: 1.35 },
    },
  ),
  game(
    'handshake_drill',
    'Handshake Drill',
    'Выбери верные ответы протокола шаг за шагом.',
    'handshake',
    {
      how: 'Каждый шаг — запрос peer/ICE и 3–4 ответа. Только один корректен для netrunner-сценария. Ошибка копит TRACE.',
      win: 'Пройти все шаги handshake до TRACE 100%.',
      fail: 'TRACE max или лимит ошибок протокола.',
    },
    {
      easy: '3 шага · 4 ошибки · медленный TRACE',
      medium: '5 шагов · 3 ошибки',
      hard: '7 шагов · 2 ошибки · быстрый TRACE',
    },
    {
      easy: { sniffRounds: 3, maxMistakes: 4, traceSpeed: 0.55 },
      medium: { sniffRounds: 5, maxMistakes: 3, traceSpeed: 1.0 },
      hard: { sniffRounds: 7, maxMistakes: 2, traceSpeed: 1.45 },
    },
  ),
  game(
    'auth_bypass',
    'Auth Bypass',
    'Подбери пароль как в Wordle (цвета букв).',
    'wordle',
    {
      how: 'Подсказка + длина. Цвета: на месте / есть в слове / нет. Это не Likeness и не Keyspace.',
      win: 'Угадать пароль за отведённые попытки.',
      fail: 'Попытки закончились — auth gate закрыт.',
    },
    {
      easy: '4 буквы · 12 попыток',
      medium: '5 букв · 9 попыток',
      hard: '6 букв · 6 попыток',
    },
    {
      easy: { wordLength: 4, wordleAttempts: 12, maxMistakes: 5 },
      medium: { wordLength: 5, wordleAttempts: 9, maxMistakes: 4 },
      hard: { wordLength: 6, wordleAttempts: 6, maxMistakes: 3 },
    },
  ),
  game(
    'log_wipe',
    'Log Wipe',
    'Сотри только красные строки аудита.',
    'logwipe',
    {
      how: 'Кликай красные (AUDIT/SIEM/ICE). Белые системные не трогай. Пропуск уехавшей красной — ошибка.',
      win: 'Стереть нужное число threat-строк до таймера.',
      fail: 'Время вышло, клик по белому или пропуск красной.',
    },
    {
      easy: '32с · 2 волны threat · 4 ошибки',
      medium: '24с · 3 волны · 3 ошибки',
      hard: '16с · 5 волн · 2 ошибки',
    },
    {
      easy: { logDurationSec: 32, sniffRounds: 2, maxMistakes: 4, traceSpeed: 0.35 },
      medium: { logDurationSec: 24, sniffRounds: 3, maxMistakes: 3, traceSpeed: 0.85 },
      hard: { logDurationSec: 16, sniffRounds: 5, maxMistakes: 2, traceSpeed: 1.3 },
    },
  ),
  game(
    'dead_sector',
    'Dead Sector',
    'Lights Out: погаси все сектора ICE.',
    'toggle',
    {
      how: 'Клик переключает клетку и соседей (крест). Цель — все OFF. Паттерн всегда решаем (seed от кликов по пустой сетке).',
      win: 'Все сектора OFF до TRACE 100%.',
      fail: 'TRACE 100% — corp NOC перебил wipe.',
    },
    {
      easy: 'сетка 3×3 · медленный TRACE',
      medium: '4×4 · средний TRACE',
      hard: '5×5 · быстрый TRACE · 2 ошибки запаса',
    },
    {
      easy: { meshNodes: 3, sequenceLen: 3, maxMistakes: 5, traceSpeed: 0.45 },
      medium: { meshNodes: 4, sequenceLen: 4, maxMistakes: 4, traceSpeed: 0.9 },
      hard: { meshNodes: 5, sequenceLen: 5, maxMistakes: 2, traceSpeed: 1.4 },
    },
  ),
  game(
    'proxy_dodge',
    'Proxy Dodge',
    'Переключай канал от прокси-сканеров.',
    'dodge',
    {
      how: 'Три полосы. SCAN падает сверху. ← → уводи ◉. Доживи до конца волн.',
      win: 'Пережить все волны без превышения лимита попаданий.',
      fail: 'Слишком много попаданий SCAN — IP слит ICE.',
    },
    {
      easy: '6 волн · 3 попадания',
      medium: '11 волн · 3 попадания · быстрее',
      hard: '16 волн · 2 попадания · агрессивный TRACE',
    },
    {
      easy: { dodgeWaves: 6, traceSpeed: 0.6, maxMistakes: 3 },
      medium: { dodgeWaves: 11, traceSpeed: 1.05, maxMistakes: 3 },
      hard: { dodgeWaves: 16, traceSpeed: 1.45, maxMistakes: 2 },
    },
  ),
  game(
    'noise_floor',
    'Noise Floor',
    'Два слайдера: удержи SNR в lock-зоне.',
    'balance',
    {
      how: 'GAIN и FILTER двигают SNR. Когда полоса зелёная — копится hold. На hard carrier дрейфует.',
      win: 'Удержать lock нужное число секунд до TRACE 100%.',
      fail: 'TRACE 100% — carrier засёк netrunner.',
    },
    {
      easy: 'hold 3с · широкая зона · без drift',
      medium: 'hold 5с · уже зона',
      hard: 'hold 7с · узкая зона · drift цели',
    },
    {
      easy: { sniffRounds: 3, signalZonePct: 28, maxMistakes: 4, traceSpeed: 0.55, peekMs: 1400 },
      medium: { sniffRounds: 5, signalZonePct: 18, maxMistakes: 3, traceSpeed: 1.0, peekMs: 1100 },
      hard: { sniffRounds: 7, signalZonePct: 12, maxMistakes: 2, traceSpeed: 1.4, peekMs: 800 },
    },
  ),
  game(
    'circuit_splice',
    'Circuit Splice',
    'Собери канал пайпами — ENTRY → CORE.',
    'circuit',
    {
      how: 'Кликай плитки, крути пайпы. Зелёные под током от ENTRY. Доведи сигнал до CORE. На hard ICE дёргает плитки.',
      win: 'CORE запитан до TRACE 100%.',
      fail: 'TRACE 100% — corp NOC перебил splice.',
    },
    {
      easy: 'auth conduit · 4×3 · без lock-плиток',
      medium: 'locked сегменты + jitter',
      hard: 'больше locked · частый jitter · быстрый TRACE',
    },
    {
      easy: { meshNodes: 4, sequenceLen: 3, maxMistakes: 5, traceSpeed: 0.45, peekMs: 900 },
      medium: { meshNodes: 5, sequenceLen: 4, maxMistakes: 4, traceSpeed: 0.95, peekMs: 650 },
      hard: { meshNodes: 6, sequenceLen: 5, maxMistakes: 2, traceSpeed: 1.45, peekMs: 480 },
    },
  ),
  game(
    'likeness_vault',
    'Likeness Vault',
    'Угадай пароль по LIKENESS (не Wordle-цвета).',
    'likeness',
    {
      how: 'Список кандидатов. Клик: LIKENESS = сколько букв на тех же местах. Несовместимые гаснут.',
      win: 'Угадать секрет до исчерпания попыток и TRACE.',
      fail: 'Попытки кончились или TRACE max — vault sealed.',
    },
    {
      easy: '4 буквы · 8 попыток',
      medium: '5 букв · 6 попыток',
      hard: '6 букв · 4 попытки · быстрый TRACE',
    },
    {
      easy: { wordLength: 4, wordleAttempts: 8, scanRounds: 2, maxMistakes: 5, traceSpeed: 0.4 },
      medium: { wordLength: 5, wordleAttempts: 6, scanRounds: 3, maxMistakes: 4, traceSpeed: 0.85 },
      hard: { wordLength: 6, wordleAttempts: 4, scanRounds: 4, maxMistakes: 2, traceSpeed: 1.3 },
    },
  ),
  game(
    'node_capture',
    'Node Capture',
    'Захвати сеть probes — дойди до CORE.',
    'capture',
    {
      how: 'Старт с ENTRY. Кликай смежные узлы за probes. HONEYPOT дёшев, но жжёт TRACE. Дойди до CORE.',
      win: 'Захватить CORE.',
      fail: 'Нет ходов / probes / TRACE 100%.',
    },
    {
      easy: 'граф 4 · запас probes',
      medium: 'граф 5 · туже бюджет',
      hard: 'граф 6 · мало probes · быстрый TRACE',
    },
    {
      easy: { meshNodes: 4, tapTarget: 4, maxMistakes: 4, traceSpeed: 0.45 },
      medium: { meshNodes: 5, tapTarget: 5, maxMistakes: 3, traceSpeed: 0.95 },
      hard: { meshNodes: 6, tapTarget: 6, maxMistakes: 2, traceSpeed: 1.4 },
    },
  ),
  game(
    'cipher_rings',
    'Cipher Rings',
    'Концентрический dial: совмести KEY с глифом под маркером ▲.',
    'rings',
    {
      how: 'Крути активное (внешнее→внутреннее) кольцо. KEY показывает нужный глиф — сравни с тем, что под ▲ сверху. Ответ на кольце не подсвечен. LOCK по порядку. Hard: scramble.',
      win: 'Залочить все кольца до TRACE 100%.',
      fail: 'TRACE 100% / неверный LOCK — corp cipher lockout.',
    },
    {
      easy: '3 кольца · lock по порядку · медленный TRACE',
      medium: '4 кольца · больше глифов',
      hard: '5 колец · scramble unlocked · быстрый TRACE',
    },
    {
      easy: { tapTarget: 2, sequenceLen: 5, maxMistakes: 4, traceSpeed: 0.55 },
      medium: { tapTarget: 3, sequenceLen: 7, maxMistakes: 3, traceSpeed: 1.0 },
      hard: { tapTarget: 4, sequenceLen: 8, maxMistakes: 2, traceSpeed: 1.45 },
    },
  ),
  game(
    'bit_sweep',
    'Bit Sweep',
    'Minesweeper по сегментам ICE: открой safe-биты, не нарвись на мину.',
    'mines',
    {
      how: 'Клик открывает бит. Число = сколько соседних ICE-мин. FLAG / ПКМ помечает мину. Не путать с Dead Sector (toggle) — здесь нет переключения соседей.',
      win: 'Все безопасные клетки открыты до TRACE 100%.',
      fail: 'Клик по мине или TRACE 100%.',
    },
    {
      easy: '5×5 · 5 мин · медленный TRACE',
      medium: '6×6 · 9 мин',
      hard: '7×7 · 14 мин · быстрый TRACE',
    },
    {
      easy: { meshNodes: 5, sequenceLen: 5, tapTarget: 5, maxMistakes: 4, traceSpeed: 0.45 },
      medium: { meshNodes: 6, sequenceLen: 6, tapTarget: 9, maxMistakes: 3, traceSpeed: 0.9 },
      hard: { meshNodes: 7, sequenceLen: 7, tapTarget: 14, maxMistakes: 2, traceSpeed: 1.4 },
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
