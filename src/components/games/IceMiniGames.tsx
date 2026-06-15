import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { IceGameParams } from '../../logic/nriGameCatalog';

type Props = {
  params: IceGameParams;
  onWin: () => void;
  onFail: () => void;
};

function seededShuffle<T>(items: T[], seed: number): T[] {
  const arr = [...items];
  let s = seed;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function seqNoRepeat(len: number, poolSize: number, seed: number): number[] {
  const out: number[] = [];
  let s = seed;
  let prev = -1;
  for (let i = 0; i < len; i++) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    let pick = s % poolSize;
    let guard = 0;
    while (pick === prev && guard++ < 12) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      pick = s % poolSize;
    }
    out.push(pick);
    prev = pick;
  }
  return out;
}

/** Запомни и повтори последовательность портов. */
export const PortSequenceGame: React.FC<Props> = ({ params, onWin, onFail }) => {
  const ports = [443, 8080, 22, 8443, 21, 3306, 11211, 5900];
  const portIdx = useMemo(
    () => seqNoRepeat(params.sequenceLen, ports.length, Date.now()),
    [params.sequenceLen]
  );
  const seq = useMemo(() => portIdx.map((i) => ports[i]), [portIdx]);
  const [phase, setPhase] = useState<'flash' | 'input' | 'done'>('flash');
  const [flashIdx, setFlashIdx] = useState(-1);
  const [input, setInput] = useState<number[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const maxErr = params.maxMistakes;

  useEffect(() => {
    if (phase !== 'flash') return;
    let i = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const run = () => {
      if (i >= seq.length) {
        timers.push(setTimeout(() => setPhase('input'), 400));
        return;
      }
      setFlashIdx(i);
      timers.push(setTimeout(() => setFlashIdx(-1), params.flashMs * 0.65));
      timers.push(
        setTimeout(() => {
          i++;
          run();
        }, params.flashMs)
      );
    };
    run();
    return () => timers.forEach(clearTimeout);
  }, [phase, seq, params.flashMs]);

  const pick = (port: number) => {
    if (phase !== 'input') return;
    const next = [...input, port];
    setInput(next);
    const idx = next.length - 1;
    if (next[idx] !== seq[idx]) {
      const m = mistakes + 1;
      setMistakes(m);
      setInput([]);
      if (m > maxErr) onFail();
      return;
    }
    if (next.length >= seq.length) {
      setPhase('done');
      onWin();
    }
  };

  return (
    <div className="ice-mini">
      <p className="mono-text ice-mini__hint">
        {phase === 'flash' ? 'Запомни порядок портов…' : 'Повтори последовательность'}
      </p>
      <div className="ice-mini__flash">{flashIdx >= 0 ? `PORT ${seq[flashIdx]}` : '—'}</div>
      <div className="ice-mini__grid">
        {ports.slice(0, 6).map((p) => (
          <button key={p} type="button" className="ice-mini__btn" onClick={() => pick(p)} disabled={phase !== 'input'}>
            {p}
          </button>
        ))}
      </div>
      <p className="mono-text opacity-60">
        Шаг {input.length}/{seq.length} · ошибок {mistakes}/{maxErr}
      </p>
    </div>
  );
};

/** Найди уязвимый сервис. */
export const ScanPickGame: React.FC<Props> = ({ params, onWin, onFail }) => {
  const rounds = params.scanRounds;
  const [round, setRound] = useState(0);
  const [mistakes, setMistakes] = useState(0);

  const services = useMemo(() => {
    const pool = [
      { label: 'AUTH_GATE', status: 'TLS 1.3 · hardened', vuln: false },
      { label: 'LEGACY_FTP', status: 'anon OK · CVE-2019', vuln: true },
      { label: 'SSH_BASTION', status: 'key-only · fail2ban', vuln: false },
      { label: 'MEMCACHE', status: 'open bind · no auth', vuln: true },
      { label: 'API_PROXY', status: 'WAF active', vuln: false },
      { label: 'TELNET_RELAY', status: 'cleartext · default creds', vuln: true },
    ];
    const shuffled = seededShuffle(pool, Date.now() + round * 991);
    const vulnIdx = (Date.now() + round) % shuffled.length;
    return shuffled.map((svc, i) => ({
      ...svc,
      id: `${svc.label}-${round}-${i}`,
      vulnerable: i === vulnIdx || (round > 0 && svc.vuln && i % 4 === 1),
    }));
  }, [round]);

  const pick = (vulnerable: boolean) => {
    if (vulnerable) {
      if (round + 1 >= rounds) onWin();
      else setRound((r) => r + 1);
    } else {
      const m = mistakes + 1;
      setMistakes(m);
      if (m > params.maxMistakes) onFail();
    }
  };

  return (
    <div className="ice-mini">
      <p className="mono-text ice-mini__hint">Раунд {round + 1}/{rounds}: найди дырявый сервис</p>
      <div className="ice-mini__list">
        {services.map((s) => (
          <button key={s.id} type="button" className="ice-mini__row" onClick={() => pick(s.vulnerable)}>
            <span>{s.label}</span>
            <span className="ice-mini__row-meta mono-text">{s.status}</span>
          </button>
        ))}
      </div>
      <p className="mono-text opacity-60">Ошибок {mistakes}/{params.maxMistakes}</p>
    </div>
  );
};

/** Быстрые нажатия / удержание эксfil. */
export const TapRushGame: React.FC<Props> = ({ params, onWin, onFail }) => {
  const [taps, setTaps] = useState(0);
  const [trace, setTrace] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => {
      setTrace((t) => {
        const next = Math.min(100, t + params.traceSpeed * 2.5);
        if (next >= 100) onFail();
        return next;
      });
    }, 200);
    return () => clearInterval(iv);
  }, [params.traceSpeed, onFail]);

  useEffect(() => {
    if (taps >= params.tapTarget) onWin();
  }, [taps, params.tapTarget, onWin]);

  return (
    <div className="ice-mini">
      <p className="mono-text ice-mini__hint">Залей канал — жми EXFIL (скорость ICE ×{params.traceSpeed.toFixed(1)})</p>
      <div className="ice-mini__bars">
        <div className="ice-mini__bar">
          <span>EXFIL</span>
          <div className="ice-mini__fill" style={{ width: `${(taps / params.tapTarget) * 100}%` }} />
        </div>
        <div className="ice-mini__bar ice-mini__bar--danger">
          <span>TRACE</span>
          <div className="ice-mini__fill" style={{ width: `${trace}%` }} />
        </div>
      </div>
      <button type="button" className="ice-mini__action" onClick={() => setTaps((n) => n + 1)}>
        EXFIL +1
      </button>
      <p className="mono-text opacity-60">{taps}/{params.tapTarget}</p>
    </div>
  );
};

/** Mesh Jack — узлы сети, без повторяющейся подсветки подряд. */
export const MeshJackGame: React.FC<Props> = ({ params, onWin, onFail }) => {
  const nodeCount = params.meshNodes;
  const pathLen = params.sequenceLen;
  const nodes = useMemo(
    () => Array.from({ length: nodeCount }, (_, i) => `MESH_${String.fromCharCode(65 + i)}`),
    [nodeCount]
  );
  const path = useMemo(() => seqNoRepeat(pathLen, nodeCount, Date.now()), [pathLen, nodeCount]);
  const [phase, setPhase] = useState<'flash' | 'input'>('flash');
  const [flashIdx, setFlashIdx] = useState(-1);
  const [step, setStep] = useState(0);
  const [mistakes, setMistakes] = useState(0);

  useEffect(() => {
    if (phase !== 'flash') return;
    let i = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const run = () => {
      if (i >= path.length) {
        timers.push(setTimeout(() => setPhase('input'), 350));
        return;
      }
      setFlashIdx(path[i]);
      timers.push(setTimeout(() => setFlashIdx(-1), params.flashMs * 0.7));
      timers.push(
        setTimeout(() => {
          i++;
          run();
        }, params.flashMs)
      );
    };
    run();
    return () => timers.forEach(clearTimeout);
  }, [phase, path, params.flashMs]);

  const pick = (idx: number) => {
    if (phase !== 'input') return;
    if (idx !== path[step]) {
      const m = mistakes + 1;
      setMistakes(m);
      setStep(0);
      if (m > params.maxMistakes) onFail();
      else setPhase('flash');
      return;
    }
    const next = step + 1;
    setStep(next);
    if (next >= path.length) onWin();
  };

  return (
    <div className="ice-mini">
      <p className="mono-text ice-mini__hint">
        {phase === 'flash' ? 'Смотри маршрут по узлам…' : `Повтори путь · ${step}/${path.length}`}
      </p>
      <div className="ice-mini__mesh">
        {nodes.map((label, i) => (
          <button
            key={label}
            type="button"
            className={`ice-mini__mesh-node ${flashIdx === i ? 'flash' : ''}`}
            disabled={phase !== 'input'}
            onClick={() => pick(i)}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="mono-text opacity-60">Узлов {nodeCount} · ошибок {mistakes}/{params.maxMistakes}</p>
    </div>
  );
};

/** Dead Drop — пары с нормальной сеткой. */
export const DeadDropGame: React.FC<Props> = ({ params, onWin, onFail }) => {
  const pairs = params.memoryPairs;
  const symbols = useMemo(() => {
    const sym = ['◈', '◇', '⬡', '⬢', '▣', '▤', '◆', '○', '◎', '▲', '▼', '◉'];
    const chosen = sym.slice(0, pairs);
    return seededShuffle([...chosen, ...chosen], Date.now());
  }, [pairs]);

  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [mistakes, setMistakes] = useState(0);
  const [lock, setLock] = useState(false);

  const flip = useCallback(
    (idx: number) => {
      if (lock || matched.has(idx) || open.includes(idx) || open.length >= 2) return;
      const next = [...open, idx];
      setOpen(next);
      if (next.length === 2) {
        const [a, b] = next;
        if (symbols[a] === symbols[b]) {
          const m = new Set(matched);
          m.add(a);
          m.add(b);
          setMatched(m);
          setOpen([]);
          if (m.size >= pairs * 2) onWin();
        } else {
          setLock(true);
          setTimeout(() => {
            setOpen([]);
            setLock(false);
          }, params.peekMs);
          const err = mistakes + 1;
          setMistakes(err);
          if (err > params.maxMistakes) onFail();
        }
      }
    },
    [lock, open, matched, symbols, pairs, mistakes, onWin, onFail, params.peekMs, params.maxMistakes]
  );

  const cols = pairs <= 3 ? 3 : pairs <= 4 ? 4 : pairs <= 6 ? 4 : 5;

  return (
    <div className="ice-mini">
      <p className="mono-text ice-mini__hint">Dead Drop: открой все пары ключей</p>
      <div className="ice-mini__memory" style={{ gridTemplateColumns: `repeat(${cols}, minmax(64px, 1fr))` }}>
        {symbols.map((sym, i) => {
          const show = matched.has(i) || open.includes(i);
          return (
            <button
              key={i}
              type="button"
              className={`ice-mini__card ${matched.has(i) ? 'matched' : ''}`}
              onClick={() => flip(i)}
            >
              {show ? sym : '▓'}
            </button>
          );
        })}
      </div>
      <p className="mono-text opacity-60">
        Пар {pairs} · ошибок {mistakes}/{params.maxMistakes}
      </p>
    </div>
  );
};

/** Proxy Dodge — 3 полосы, падающие сканеры. */
export const ProxyDodgeGame: React.FC<Props> = ({ params, onWin, onFail }) => {
  const lanes = 3;
  const [lane, setLane] = useState(1);
  const [wave, setWave] = useState(0);
  const [hits, setHits] = useState(0);
  const [threats, setThreats] = useState<{ id: number; lane: number; y: number }[]>([]);
  const idRef = useRef(0);

  useEffect(() => {
    const spawnIv = setInterval(() => {
      setThreats((prev) => {
        if (prev.length > 6) return prev;
        const l = Math.floor(Math.random() * lanes);
        return [...prev, { id: idRef.current++, lane: l, y: 0 }];
      });
    }, Math.max(400, 900 - params.traceSpeed * 200));
    return () => clearInterval(spawnIv);
  }, [params.traceSpeed]);

  useEffect(() => {
    const waveIv = setInterval(() => {
      setWave((w) => {
        const nw = w + 1;
        if (nw >= params.dodgeWaves) onWin();
        return nw;
      });
    }, Math.max(800, 1400 - params.traceSpeed * 200));
    return () => clearInterval(waveIv);
  }, [params.dodgeWaves, params.traceSpeed, onWin]);

  useEffect(() => {
    const moveIv = setInterval(() => {
      setThreats((prev) => {
        const next: typeof prev = [];
        for (const t of prev) {
          const y = t.y + 4 + params.traceSpeed * 3;
          if (y >= 92 && t.lane === lane) {
            setHits((h) => {
              const nh = h + 1;
              if (nh > params.maxMistakes) onFail();
              return nh;
            });
          } else if (y < 100) {
            next.push({ ...t, y });
          }
        }
        return next;
      });
    }, 80);
    return () => clearInterval(moveIv);
  }, [lane, params.traceSpeed, params.maxMistakes, onFail]);

  return (
    <div className="ice-mini">
      <p className="mono-text ice-mini__hint">
        Уклоняйся от прокси · волна {wave}/{params.dodgeWaves}
      </p>
      <div className="ice-mini__dodge">
        {Array.from({ length: lanes }, (_, l) => (
          <div key={l} className={`ice-mini__dodge-lane ${lane === l ? 'active' : ''}`}>
            {threats
              .filter((t) => t.lane === l)
              .map((t) => (
                <span key={t.id} className="ice-mini__dodge-threat" style={{ top: `${t.y}%` }}>
                  SCAN
                </span>
              ))}
            {lane === l && <span className="ice-mini__dodge-player">◉</span>}
          </div>
        ))}
      </div>
      <div className="ice-mini__dodge-controls">
        <button type="button" className="ice-mini__btn" onClick={() => setLane((x) => Math.max(0, x - 1))}>
          ← КАНАЛ
        </button>
        <button type="button" className="ice-mini__btn" onClick={() => setLane((x) => Math.min(lanes - 1, x + 1))}>
          КАНАЛ →
        </button>
      </div>
      <p className="mono-text opacity-60">Попаданий {hits}/{params.maxMistakes}</p>
    </div>
  );
};

type LogLine = { id: number; text: string; threat: boolean };

/** Log Wipe — сотри красные строки, не трогай белые. */
export const LogWipeGame: React.FC<Props> = ({ params, onWin, onFail }) => {
  const [lines, setLines] = useState<LogLine[]>([]);
  const [wiped, setWiped] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [timeLeft, setTimeLeft] = useState(params.logDurationSec);
  const idRef = useRef(0);
  const targetWipes = 8 + params.sniffRounds * 2;

  useEffect(() => {
    const iv = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (wiped >= targetWipes) onWin();
      else onFail();
    }
  }, [timeLeft, wiped, targetWipes, onWin, onFail]);

  useEffect(() => {
    const spawnIv = setInterval(() => {
      const threat = Math.random() < 0.38 + params.traceSpeed * 0.08;
      const texts = threat
        ? ['AUDIT_HOOK :: corp trace', 'SIEM_ALERT :: exfil sig', 'CORP_SEC :: node ping', 'ICE_PROBE :: active']
        : ['kernel: ok', 'sshd: session open', 'cron: daily', 'nginx: 200 GET /'];
      setLines((prev) => [
        ...prev.slice(-7),
        { id: idRef.current++, text: texts[Math.floor(Math.random() * texts.length)], threat },
      ]);
    }, Math.max(500, 1100 - params.traceSpeed * 150));
    return () => clearInterval(spawnIv);
  }, [params.traceSpeed]);

  useEffect(() => {
    const fallIv = setInterval(() => {
      setLines((prev) => {
        const next = prev.map((l) => ({ ...l, id: l.id }));
        const escaped = prev.filter(() => Math.random() < 0.15);
        for (const e of escaped) {
          if (e.threat) {
            setMistakes((m) => {
              const nm = m + 1;
              if (nm > params.maxMistakes) onFail();
              return nm;
            });
          }
        }
        return next.length > 8 ? next.slice(1) : next;
      });
    }, 700);
    return () => clearInterval(fallIv);
  }, [params.maxMistakes, onFail]);

  const tapLine = (line: LogLine) => {
    setLines((prev) => prev.filter((l) => l.id !== line.id));
    if (line.threat) setWiped((w) => w + 1);
    else {
      const m = mistakes + 1;
      setMistakes(m);
      if (m > params.maxMistakes) onFail();
    }
  };

  return (
    <div className="ice-mini">
      <p className="mono-text ice-mini__hint">
        Сотри красные логи · {wiped}/{targetWipes} · {timeLeft}с
      </p>
      <div className="ice-mini__log">
        {lines.map((l) => (
          <button
            key={l.id}
            type="button"
            className={`ice-mini__log-line ${l.threat ? 'threat' : ''}`}
            onClick={() => tapLine(l)}
          >
            {l.text}
          </button>
        ))}
      </div>
      <p className="mono-text opacity-60">Ложных кликов {mistakes}/{params.maxMistakes}</p>
    </div>
  );
};

const AUTH_WORDS: { word: string; hint: string }[] = [
  { word: 'root', hint: 'слишком очевидно' },
  { word: 'дека', hint: 'левое железо' },
  { word: 'пароль', hint: 'определённо не пароль' },
  { word: 'нейромант', hint: 'гибсон' },
  { word: 'взлом', hint: 'легально, честно' },
  { word: 'токен', hint: 'не JWT' },
  { word: 'матрица', hint: 'морфеус не одобрит' },
  { word: 'гибсон', hint: 'автор льда' },
  { word: 'брут', hint: 'грубая сила' },
  { word: 'прокси', hint: 'не dodge' },
  { word: 'ice', hint: 'холодный протокол' },
  { word: 'backdoor', hint: 'классика жанра' },
  { word: 'нейролинк', hint: 'слот neural' },
];

type LetterMark = 'exact' | 'present' | 'absent';

function scoreGuess(secret: string, guess: string): LetterMark[] {
  const s = secret.toLowerCase();
  const g = guess.toLowerCase();
  const marks: LetterMark[] = Array(g.length).fill('absent');
  const used = Array(s.length).fill(false);
  for (let i = 0; i < g.length; i++) {
    if (g[i] === s[i]) {
      marks[i] = 'exact';
      used[i] = true;
    }
  }
  for (let i = 0; i < g.length; i++) {
    if (marks[i] === 'exact') continue;
    const idx = s.split('').findIndex((ch, j) => !used[j] && ch === g[i]);
    if (idx >= 0) {
      marks[i] = 'present';
      used[idx] = true;
    }
  }
  return marks;
}

/** Auth Bypass — Wordle с подсказкой. */
export const AuthBypassGame: React.FC<Props> = ({ params, onWin, onFail }) => {
  const target = useMemo(() => {
    const pool = AUTH_WORDS.filter((w) => w.word.length === params.wordLength);
    const list = pool.length ? pool : AUTH_WORDS;
    return list[Date.now() % list.length];
  }, [params.wordLength]);

  const [guesses, setGuesses] = useState<{ word: string; marks: LetterMark[] }[]>([]);
  const [input, setInput] = useState('');
  const attemptsLeft = params.wordleAttempts - guesses.length;

  const submit = () => {
    const g = input.trim().toLowerCase();
    if (g.length !== target.word.length) return;
    const marks = scoreGuess(target.word, g);
    const next = [...guesses, { word: g, marks }];
    setGuesses(next);
    setInput('');
    if (g === target.word.toLowerCase()) onWin();
    else if (next.length >= params.wordleAttempts) onFail();
  };

  return (
    <div className="ice-mini">
      <p className="mono-text ice-mini__hint">Подсказка: «{target.hint}»</p>
      <p className="mono-text opacity-70">Длина пароля: {params.wordLength} · попыток {attemptsLeft}</p>
      <div className="ice-mini__wordle">
        {guesses.map((row, ri) => (
          <div key={ri} className="ice-mini__wordle-row">
            {row.word.split('').map((ch, ci) => (
              <span key={ci} className={`ice-mini__wordle-cell ice-mini__wordle-cell--${row.marks[ci]}`}>
                {ch}
              </span>
            ))}
          </div>
        ))}
        {guesses.length < params.wordleAttempts && (
          <div className="ice-mini__wordle-row">
            {Array.from({ length: params.wordLength }, (_, i) => (
              <span key={i} className="ice-mini__wordle-cell ice-mini__wordle-cell--edit">
                {input[i] ?? ''}
              </span>
            ))}
          </div>
        )}
      </div>
      <input
        className="ice-mini__wordle-input"
        value={input}
        maxLength={params.wordLength}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="введите пароль…"
        autoComplete="off"
      />
      <button type="button" className="ice-mini__action" disabled={input.length !== params.wordLength} onClick={submit}>
        AUTH TRY
      </button>
    </div>
  );
};

/** Packet Sniff — выбери пакет с верной CRC. */
export const PacketSniffGame: React.FC<Props> = ({ params, onWin, onFail }) => {
  const [round, setRound] = useState(0);
  const [mistakes, setMistakes] = useState(0);

  const roundData = useMemo(() => {
    const targetCrc = ((Date.now() + round * 313) % 0xff00).toString(16).padStart(4, '0');
    const decoys = seededShuffle(
      ['a1b2', 'c3d4', 'e5f6', '0bad', 'feed', 'dead', 'beef', 'c0de'],
      Date.now() + round
    ).slice(0, 3);
    const packets = seededShuffle(
      [
        { id: 'PKT_A', proto: 'TCP/443', crc: targetCrc },
        ...decoys.map((crc, i) => ({ id: `PKT_${i}`, proto: i % 2 ? 'UDP/53' : 'TCP/22', crc })),
      ],
      Date.now() + round * 7
    );
    return { targetCrc, packets };
  }, [round]);

  const pick = (crc: string) => {
    if (crc === roundData.targetCrc) {
      if (round + 1 >= params.sniffRounds) onWin();
      else setRound((r) => r + 1);
    } else {
      const m = mistakes + 1;
      setMistakes(m);
      if (m > params.maxMistakes) onFail();
    }
  };

  return (
    <div className="ice-mini">
      <p className="mono-text ice-mini__hint">
        Раунд {round + 1}/{params.sniffRounds} · ищи CRC={roundData.targetCrc}
      </p>
      <div className="ice-mini__list">
        {roundData.packets.map((p) => (
          <button key={p.id} type="button" className="ice-mini__row" onClick={() => pick(p.crc)}>
            <span>{p.id}</span>
            <span className="ice-mini__row-meta mono-text">
              {p.proto} · crc={p.crc}
            </span>
          </button>
        ))}
      </div>
      <p className="mono-text opacity-60">Ошибок {mistakes}/{params.maxMistakes}</p>
    </div>
  );
};

/** Hash Crack — подбор hex по позициям. */
export const HashCrackGame: React.FC<Props> = ({ params, onWin, onFail }) => {
  const secret = useMemo(() => {
    const hex = '0123456789abcdef';
    let s = Date.now();
    let out = '';
    for (let i = 0; i < params.hashLen; i++) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      out += hex[s % 16];
    }
    return out;
  }, [params.hashLen]);

  const [pos, setPos] = useState(0);
  const [built, setBuilt] = useState('');
  const [mistakes, setMistakes] = useState(0);

  const pick = (ch: string) => {
    if (ch === secret[pos]) {
      const next = built + ch;
      setBuilt(next);
      const np = pos + 1;
      setPos(np);
      if (np >= secret.length) onWin();
    } else {
      const m = mistakes + 1;
      setMistakes(m);
      if (m > params.maxMistakes) onFail();
    }
  };

  const choices = useMemo(() => {
    const hex = '0123456789abcdef'.split('');
    const correct = secret[pos];
    const others = seededShuffle(
      hex.filter((c) => c !== correct),
      Date.now() + pos
    ).slice(0, 3);
    return seededShuffle([correct, ...others], Date.now() + pos * 13);
  }, [secret, pos]);

  return (
    <div className="ice-mini">
      <p className="mono-text ice-mini__hint">Восстанови хэш по нибблам</p>
      <p className="ice-mini__hash-target mono-text">
        {built}
        <span className="ice-mini__hash-cursor">{pos < secret.length ? '_' : ''}</span>
        {'·'.repeat(Math.max(0, secret.length - pos - 1))}
      </p>
      <div className="ice-mini__grid ice-mini__grid--hex">
        {choices.map((ch) => (
          <button key={ch} type="button" className="ice-mini__btn" onClick={() => pick(ch)}>
            {ch}
          </button>
        ))}
      </div>
      <p className="mono-text opacity-60">
        Позиция {pos}/{secret.length} · ошибок {mistakes}/{params.maxMistakes}
      </p>
    </div>
  );
};
