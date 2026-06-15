/** Каталог icebreaker-мини-игр для защищённых файлов (12 × 3 сложности). */

export type IceDifficulty = 'easy' | 'medium' | 'hard';
export type IceEngine =
  | 'gibson'
  | 'sequence'
  | 'scan'
  | 'tap'
  | 'mesh'
  | 'memory'
  | 'dodge'
  | 'logwipe'
  | 'wordle'
  | 'sniff'
  | 'hash';

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
};

export type IceGameDef = {
  id: string;
  title: string;
  blurb: string;
  engine: IceEngine;
  difficulties: Record<IceDifficulty, { label: string; params: IceGameParams }>;
};

const BASE: Record<IceDifficulty, IceGameParams> = {
  easy: {
    sequenceLen: 3,
    scanRounds: 1,
    tapTarget: 12,
    traceSpeed: 0.8,
    memoryPairs: 3,
    maxMistakes: 3,
    wordLength: 4,
    wordleAttempts: 12,
    hashLen: 4,
    sniffRounds: 3,
    dodgeWaves: 8,
    logDurationSec: 28,
    meshNodes: 4,
    flashMs: 580,
    peekMs: 900,
  },
  medium: {
    sequenceLen: 4,
    scanRounds: 2,
    tapTarget: 18,
    traceSpeed: 1.2,
    memoryPairs: 4,
    maxMistakes: 2,
    wordLength: 5,
    wordleAttempts: 10,
    hashLen: 6,
    sniffRounds: 4,
    dodgeWaves: 12,
    logDurationSec: 22,
    meshNodes: 5,
    flashMs: 420,
    peekMs: 650,
  },
  hard: {
    sequenceLen: 6,
    scanRounds: 3,
    tapTarget: 26,
    traceSpeed: 1.6,
    memoryPairs: 5,
    maxMistakes: 1,
    wordLength: 6,
    wordleAttempts: 8,
    hashLen: 8,
    sniffRounds: 5,
    dodgeWaves: 16,
    logDurationSec: 16,
    meshNodes: 6,
    flashMs: 300,
    peekMs: 450,
  },
};

function game(
  id: string,
  title: string,
  blurb: string,
  engine: IceEngine,
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
  return { id, title, blurb, engine, difficulties: diffs };
}

export const NRI_GAME_CATALOG: IceGameDef[] = [
  game('gibson_ice', 'Gibson ICE Run', 'Скан → crack → exfil по мотивам Neuromancer.', 'gibson'),
  game('port_sweep', 'Port Sweep', 'Запомни и повтори последовательность портов.', 'sequence'),
  game('vuln_scan', 'Vuln Scan', 'Найди уязвимый сервис среди ложных.', 'scan'),
  game('trace_rush', 'Trace Rush', 'Удержи эксfil, пока ICE не догнал.', 'tap', {
    hard: { tapTarget: 30, traceSpeed: 2 },
  }),
  game('buffer_flood', 'Buffer Flood', 'Залей буфер быстрыми нажатиями.', 'tap', {
    easy: { tapTarget: 10 },
    hard: { tapTarget: 32, traceSpeed: 2.2 },
  }),
  game('hash_crack', 'Hash Crack', 'Подбери hex-цифры хэша по одной — без промахов.', 'hash', {
    easy: { hashLen: 4, maxMistakes: 2 },
    hard: { hashLen: 10, maxMistakes: 1 },
  }),
  game('packet_sniff', 'Packet Sniff', 'Поймай пакет с верной контрольной суммой.', 'sniff', {
    medium: { sniffRounds: 4 },
    hard: { sniffRounds: 6, maxMistakes: 1 },
  }),
  game('auth_bypass', 'Auth Bypass', 'Wordle-подбор пароля по подсказке и цветам букв.', 'wordle', {
    easy: { wordLength: 4, wordleAttempts: 12 },
    medium: { wordLength: 6, wordleAttempts: 10 },
    hard: { wordLength: 9, wordleAttempts: 7, maxMistakes: 0 },
  }),
  game('log_wipe', 'Log Wipe', 'Сотри красные строки аудита до дна — не трогай белые.', 'logwipe', {
    easy: { logDurationSec: 30, maxMistakes: 4 },
    hard: { logDurationSec: 14, maxMistakes: 1 },
  }),
  game('mesh_jack', 'Mesh Jack', 'Маршрут по узлам mesh-сети — запомни подсветку.', 'mesh', {
    easy: { meshNodes: 4, sequenceLen: 3, maxMistakes: 2 },
    hard: { meshNodes: 7, sequenceLen: 7, flashMs: 260, maxMistakes: 1 },
  }),
  game('dead_drop', 'Dead Drop', 'Пары ключей в ячейках — ограниченный просмотр.', 'memory', {
    easy: { memoryPairs: 3, peekMs: 1000 },
    hard: { memoryPairs: 6, peekMs: 400, maxMistakes: 2 },
  }),
  game('proxy_dodge', 'Proxy Dodge', 'Переключай канал — уворачивайся от прокси-сканеров.', 'dodge', {
    easy: { dodgeWaves: 6, traceSpeed: 0.7 },
    hard: { dodgeWaves: 18, traceSpeed: 2.4, maxMistakes: 1 },
  }),
];

export function getIceGame(gameId: string): IceGameDef | undefined {
  return NRI_GAME_CATALOG.find((g) => g.id === gameId);
}

export function resolveIceParams(gameId: string, difficulty: IceDifficulty): IceGameParams | null {
  const g = getIceGame(gameId);
  if (!g) return null;
  return g.difficulties[difficulty]?.params ?? g.difficulties.medium.params;
}
