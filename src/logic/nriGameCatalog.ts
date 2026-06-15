/** Каталог icebreaker-мини-игр для защищённых файлов (12 × 3 сложности). */

export type IceDifficulty = 'easy' | 'medium' | 'hard';
export type IceEngine = 'gibson' | 'sequence' | 'scan' | 'tap' | 'memory';

export type IceGameParams = {
  sequenceLen: number;
  scanRounds: number;
  tapTarget: number;
  traceSpeed: number;
  memoryPairs: number;
};

export type IceGameDef = {
  id: string;
  title: string;
  blurb: string;
  engine: IceEngine;
  difficulties: Record<IceDifficulty, { label: string; params: IceGameParams }>;
};

const BASE: Record<IceDifficulty, IceGameParams> = {
  easy: { sequenceLen: 3, scanRounds: 1, tapTarget: 12, traceSpeed: 0.8, memoryPairs: 3 },
  medium: { sequenceLen: 4, scanRounds: 2, tapTarget: 18, traceSpeed: 1.2, memoryPairs: 4 },
  hard: { sequenceLen: 6, scanRounds: 3, tapTarget: 26, traceSpeed: 1.6, memoryPairs: 6 },
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
    hard: { tapTarget: 32 },
  }),
  game('hash_crack', 'Hash Crack', 'Длинная цепочка портов — без ошибок.', 'sequence', {
    hard: { sequenceLen: 8 },
  }),
  game('packet_sniff', 'Packet Sniff', 'Несколько раундов: выбери правильный пакет.', 'scan', {
    medium: { scanRounds: 3 },
    hard: { scanRounds: 4 },
  }),
  game('auth_bypass', 'Auth Bypass', 'Подбери рабочую цепочку эксплойтов.', 'scan'),
  game('log_wipe', 'Log Wipe', 'Сотри логи до прихода аудита.', 'tap'),
  game('mesh_jack', 'Mesh Jack', 'Соедини узлы сети в верном порядке.', 'sequence'),
  game('dead_drop', 'Dead Drop', 'Запомни пары карточек — dead drop протокол.', 'memory'),
  game('proxy_dodge', 'Proxy Dodge', 'Уворачивайся от прокси-трассировки.', 'tap', {
    easy: { traceSpeed: 0.6 },
    hard: { traceSpeed: 2.2, tapTarget: 28 },
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
