import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { IceGameParams } from '../../logic/nriGameCatalog';
import {
  breachPickAllowed,
  generateBreachMatrix,
  generateBreachRun,
  generateDaemonSequences,
  generateHexSecret,
  hashCrackChoices,
  scoreGuess,
  seededShuffle,
  seqNoRepeat,
  type LetterMark,
} from '../../logic/iceMiniGameLogic';
import {
  IceMiniFlashDisplay,
  IceMiniFooter,
  IceMiniHint,
  IceMiniMeter,
  IceMiniShell,
  IceMiniTag,
} from './IceMiniChrome';
import { IcePressureHUD } from './IcePressureHUD';
import { useIcePressure } from './useIcePressure';

type Props = {
  params: IceGameParams;
  onWin: () => void;
  onFail: () => void;
};

/** Запомни и повтори последовательность портов — несколько раундов под ICE. */
export const PortSequenceGame: React.FC<Props> = ({ params, onWin, onFail }) => {
  const ice = useIcePressure(params, onFail);
  const ports = [443, 8080, 22, 8443, 21, 3306, 11211, 5900];
  const totalRounds = params.scanRounds;
  const [round, setRound] = useState(0);
  const seqLen = params.sequenceLen + Math.min(round, 2);
  const portIdx = useMemo(
    () => seqNoRepeat(seqLen, ports.length, Date.now() + round * 997),
    [seqLen, round]
  );
  const seq = useMemo(() => portIdx.map((i) => ports[i]), [portIdx]);
  const flashMs = Math.max(220, params.flashMs - round * 40);
  const [phase, setPhase] = useState<'flash' | 'input' | 'done'>('flash');
  const [flashIdx, setFlashIdx] = useState(-1);
  const [input, setInput] = useState<number[]>([]);

  useEffect(() => {
    setPhase('flash');
    setInput([]);
    setFlashIdx(-1);
  }, [round, seqLen]);

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
      timers.push(setTimeout(() => setFlashIdx(-1), flashMs * 0.65));
      timers.push(
        setTimeout(() => {
          i++;
          run();
        }, flashMs)
      );
    };
    run();
    return () => timers.forEach(clearTimeout);
  }, [phase, seq, flashMs]);

  const pick = (port: number) => {
    if (phase !== 'input') return;
    const next = [...input, port];
    setInput(next);
    const idx = next.length - 1;
    if (next[idx] !== seq[idx]) {
      ice.recordMistake('ICE: неверный порт · port scan anomaly');
      setInput([]);
      if (round > 0) setPhase('flash');
      return;
    }
    if (next.length >= seq.length) {
      ice.rewardTrace(6);
      if (round + 1 >= totalRounds) {
        setPhase('done');
        onWin();
      } else {
        setRound((r) => r + 1);
      }
    }
  };

  return (
    <IceMiniShell variant="ports">
      <IcePressureHUD
        trace={ice.trace}
        alertLevel={ice.alertLevel}
        countermeasure={ice.countermeasure}
        flash={ice.flash}
        mistakes={ice.mistakes}
        maxMistakes={params.maxMistakes}
      />
      <IceMiniHint pulse={phase === 'flash'}>
        Раунд {round + 1}/{totalRounds} · {phase === 'flash' ? 'Запомни маршрут…' : 'Повтори порты'}
      </IceMiniHint>
      <IceMiniFlashDisplay active={flashIdx >= 0}>
        {flashIdx >= 0 ? (
          <>
            <IceMiniTag tone="warn">LISTEN</IceMiniTag>
            <span className="ice-mini__flash-port">:{seq[flashIdx]}</span>
          </>
        ) : (
          <span className="ice-mini__flash-idle">awaiting input…</span>
        )}
      </IceMiniFlashDisplay>
      <div className="ice-mini__grid ice-mini__grid--ports">
        {ports.slice(0, 6).map((p) => {
          const lit = phase === 'input' && input.includes(p) && input[input.length - 1] === p;
          return (
            <button
              key={p}
              type="button"
              className={`ice-mini__btn ice-mini__port-btn ${lit ? 'ice-mini__port-btn--lit' : ''}`}
              onClick={() => pick(p)}
              disabled={phase !== 'input'}
            >
              <span className="ice-mini__port-led" aria-hidden />
              <span className="ice-mini__port-num">{p}</span>
            </button>
          );
        })}
      </div>
      <IceMiniFooter>
        Шаг {input.length}/{seq.length} · длина {seqLen}
      </IceMiniFooter>
    </IceMiniShell>
  );
};

/** Firewall Sweep — поймай открытый слот до закрытия. */
export const ScanPickGame: React.FC<Props> = ({ params, onWin, onFail }) => {
  const ice = useIcePressure(params, onFail);
  const slotCount = 5;
  const [wave, setWave] = useState(0);
  const [cleared, setCleared] = useState(0);
  const [openSlot, setOpenSlot] = useState(0);
  const [windowOpen, setWindowOpen] = useState(true);
  const windowMs = Math.max(400, params.flashMs - cleared * 30);

  useEffect(() => {
    setOpenSlot((Date.now() + wave * 313) % slotCount);
    setWindowOpen(true);
    const closeT = window.setTimeout(() => {
      setWindowOpen(false);
      ice.recordMistake('ICE: слот закрыт · sweep timeout');
      setWave((w) => w + 1);
    }, windowMs);
    return () => window.clearTimeout(closeT);
  }, [wave, windowMs, slotCount]);

  const slots = useMemo(
    () =>
      Array.from({ length: slotCount }, (_, i) => ({
        id: `FW_${1000 + i * 11}`,
        label: ['AUTH', 'DMZ', 'API', 'BASTION', 'RELAY'][i],
      })),
    []
  );

  const pick = (idx: number) => {
    if (!windowOpen) {
      ice.recordMistake('ICE: поздний клик · adaptive firewall');
      return;
    }
    if (idx === openSlot) {
      ice.rewardTrace(5);
      const nc = cleared + 1;
      setCleared(nc);
      if (nc >= params.scanRounds) onWin();
      else setWave((w) => w + 1);
    } else {
      ice.recordMistake('COUNTERMEASURE: ложный слот · triangulation');
    }
  };

  return (
    <IceMiniShell variant="scan">
      <IcePressureHUD
        trace={ice.trace}
        alertLevel={ice.alertLevel}
        countermeasure={ice.countermeasure}
        flash={ice.flash}
        mistakes={ice.mistakes}
        maxMistakes={params.maxMistakes}
      />
      <IceMiniHint pulse={windowOpen}>
        Успешно {cleared}/{params.scanRounds} · {windowOpen ? 'OPEN — жми уязвимый слот!' : 'CLOSED…'}
      </IceMiniHint>
      <div className="ice-mini__firewall">
        {slots.map((s, i) => {
          const isOpen = windowOpen && i === openSlot;
          return (
            <button
              key={s.id}
              type="button"
              className={`ice-mini__fw-slot ${isOpen ? 'ice-mini__fw-slot--open' : ''} ${!windowOpen && i === openSlot ? 'ice-mini__fw-slot--missed' : ''}`}
              onClick={() => pick(i)}
            >
              <span className="mono-text ice-mini__fw-label">{s.label}</span>
              <span className="ice-mini__fw-bar">
                <span className={`ice-mini__fw-fill ${isOpen ? 'ice-mini__fw-fill--open' : ''}`} />
              </span>
              <IceMiniTag tone={isOpen ? 'ok' : 'ice'}>{isOpen ? 'OPEN' : 'HARDENED'}</IceMiniTag>
            </button>
          );
        })}
      </div>
      <IceMiniFooter>Окно {Math.round(windowMs / 100) / 10}с · TRACE давит постоянно</IceMiniFooter>
    </IceMiniShell>
  );
};

/** Breach Matrix — hex-сетка с чередованием строки/столбца. */
export const BreachMatrixGame: React.FC<Props> = ({ params, onWin, onFail }) => {
  const ice = useIcePressure(params, onFail);
  const rows = params.traceSpeed > 1.5 ? 6 : 5;
  const cols = 5;
  const targetLen = params.sequenceLen;
  const bufferMax = params.tapTarget + 1;
  const seed = Date.now();

  const matrix = useMemo(() => generateBreachMatrix(rows, cols, seed), [rows, cols, seed]);
  const run = useMemo(() => generateBreachRun(matrix, targetLen, seed + 17), [matrix, targetLen, seed]);

  const [step, setStep] = useState(0);
  const [buffer, setBuffer] = useState<string[]>([]);
  const [lastPick, setLastPick] = useState<{ row: number; col: number; code: string } | null>(null);
  const [started, setStarted] = useState(false);

  const pick = (row: number, col: number) => {
    const code = matrix[row]![col]!;
    if (!breachPickAllowed(row, col, step, lastPick)) {
      ice.recordMistake('ICE: неверная ось · breach anomaly');
      return;
    }
    if (!started) setStarted(true);
    const nextBuf = [...buffer, code];
    setBuffer(nextBuf);
    setLastPick({ row, col, code });

    const expected = run.target[step];
    if (code !== expected) {
      ice.recordMistake('COUNTERMEASURE: неверный код в буфере');
      if (nextBuf.length >= bufferMax) onFail();
      return;
    }

    ice.rewardTrace(4);
    const ns = step + 1;
    setStep(ns);
    if (ns >= targetLen) onWin();
    else if (nextBuf.length >= bufferMax) onFail();
  };

  return (
    <IceMiniShell variant="breach">
      <IcePressureHUD
        trace={ice.trace}
        alertLevel={ice.alertLevel}
        countermeasure={ice.countermeasure}
        flash={ice.flash}
        mistakes={ice.mistakes}
        maxMistakes={params.maxMistakes}
      />
      <IceMiniHint pulse={!started}>
        {started ? 'Чередуй строку ↔ столбец · собери TARGET' : 'Первый код — только верхняя строка'}
      </IceMiniHint>
      <div className="ice-mini__breach-layout">
        <div className="ice-mini__breach-matrix">
          {matrix.map((row, r) => (
            <div key={r} className="ice-mini__breach-row">
              {row.map((code, c) => {
                const allowed = breachPickAllowed(r, c, step, lastPick);
                const picked = lastPick?.row === r && lastPick.col === c;
                return (
                  <button
                    key={`${r}-${c}`}
                    type="button"
                    className={`ice-mini__breach-cell ${allowed ? 'ice-mini__breach-cell--ok' : ''} ${picked ? 'ice-mini__breach-cell--picked' : ''}`}
                    disabled={!allowed}
                    onClick={() => pick(r, c)}
                  >
                    {code}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <div className="ice-mini__breach-side">
          <span className="mono-text ice-mini__breach-label">TARGET</span>
          <ul className="ice-mini__breach-target mono-text">
            {run.target.map((code, i) => (
              <li key={i} className={i < step ? 'done' : i === step ? 'active' : ''}>
                {code}
              </li>
            ))}
          </ul>
          <span className="mono-text ice-mini__breach-label">BUFFER</span>
          <p className="ice-mini__breach-buffer mono-text">
            {buffer.length ? buffer.join(' → ') : '—'}
          </p>
          <span className="mono-text opacity-60">
            {buffer.length}/{bufferMax} · шаг {step}/{targetLen}
          </span>
        </div>
      </div>
    </IceMiniShell>
  );
};

/** Daemon Upload — загрузи hex-цепочки из потока кодов. */
export const DaemonUploadGame: React.FC<Props> = ({ params, onWin, onFail }) => {
  const ice = useIcePressure(params, onFail);
  const daemonCount = params.tapTarget;
  const seqLen = params.sequenceLen;
  const daemons = useMemo(
    () => generateDaemonSequences(daemonCount, seqLen, Date.now()),
    [daemonCount, seqLen]
  );
  const [daemonIdx, setDaemonIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [streamTick, setStreamTick] = useState(0);

  const stream = useMemo(() => {
    const hex = '0123456789ABCDEF'.split('');
    return seededShuffle(hex, Date.now() + streamTick + daemonIdx * 31).slice(0, 8);
  }, [streamTick, daemonIdx]);

  useEffect(() => {
    const ms = Math.max(600, params.peekMs - daemonIdx * 120);
    const iv = window.setInterval(() => setStreamTick((t) => t + 1), ms);
    return () => window.clearInterval(iv);
  }, [params.peekMs, daemonIdx]);

  const current = daemons[daemonIdx] ?? [];
  const need = current[charIdx];

  const pick = (ch: string) => {
    if (ch === need) {
      ice.rewardTrace(5);
      const nc = charIdx + 1;
      if (nc >= current.length) {
        const nd = daemonIdx + 1;
        if (nd >= daemons.length) onWin();
        else {
          setDaemonIdx(nd);
          setCharIdx(0);
        }
      } else {
        setCharIdx(nc);
      }
    } else {
      ice.recordMistake('ICE: неверный daemon chunk · upload rejected');
    }
  };

  return (
    <IceMiniShell variant="daemon">
      <IcePressureHUD
        trace={ice.trace}
        alertLevel={ice.alertLevel}
        countermeasure={ice.countermeasure}
        flash={ice.flash}
        mistakes={ice.mistakes}
        maxMistakes={params.maxMistakes}
      />
      <IceMiniHint pulse>
        DAEMON {daemonIdx + 1}/{daemonCount} · символ {charIdx + 1}/{seqLen}
      </IceMiniHint>
      <div className="ice-mini__daemon-target mono-text">
        {current.map((ch, i) => (
          <span key={i} className={i < charIdx ? 'done' : i === charIdx ? 'active' : ''}>
            {ch}
          </span>
        ))}
      </div>
      <div className="ice-mini__daemon-stream">
        <span className="mono-text ice-mini__daemon-stream-label">LIVE STREAM</span>
        <div className="ice-mini__daemon-chips">
          {stream.map((ch, i) => (
            <button key={`${streamTick}-${i}-${ch}`} type="button" className="ice-mini__hex-btn" onClick={() => pick(ch)}>
              {ch}
            </button>
          ))}
        </div>
      </div>
      <IceMiniFooter>Поток ускоряется · нужен следующий символ цели</IceMiniFooter>
    </IceMiniShell>
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
    <IceMiniShell variant="mesh">
      <IceMiniHint pulse={phase === 'flash'}>
        {phase === 'flash' ? 'Смотри маршрут по узлам…' : `Повтори путь · ${step}/${path.length}`}
      </IceMiniHint>
      <div className="ice-mini__mesh-wrap">
        <div className="ice-mini__mesh-grid" aria-hidden />
        <div className="ice-mini__mesh">
          {nodes.map((label, i) => (
            <button
              key={label}
              type="button"
              className={`ice-mini__mesh-node ${flashIdx === i ? 'flash' : ''} ${phase === 'input' && step > 0 && path[step - 1] === i ? 'ice-mini__mesh-node--path' : ''}`}
              disabled={phase !== 'input'}
              onClick={() => pick(i)}
            >
              <span className="ice-mini__mesh-ring" aria-hidden />
              {label}
            </button>
          ))}
        </div>
      </div>
      <IceMiniFooter>Узлов {nodeCount} · ошибок {mistakes}/{params.maxMistakes}</IceMiniFooter>
    </IceMiniShell>
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
    <IceMiniShell variant="memory">
      <IceMiniHint>Dead Drop: открой все пары ключей</IceMiniHint>
      <div className="ice-mini__memory" style={{ gridTemplateColumns: `repeat(${cols}, minmax(64px, 1fr))` }}>
        {symbols.map((sym, i) => {
          const show = matched.has(i) || open.includes(i);
          const flipping = open.includes(i) && !matched.has(i);
          return (
            <button
              key={i}
              type="button"
              className={`ice-mini__card ${matched.has(i) ? 'matched' : ''} ${flipping ? 'ice-mini__card--flip' : ''} ${show ? 'ice-mini__card--face' : ''}`}
              onClick={() => flip(i)}
            >
              <span className="ice-mini__card-back">▓▓</span>
              <span className="ice-mini__card-face">{sym}</span>
            </button>
          );
        })}
      </div>
      <IceMiniFooter>Пар {pairs} · ошибок {mistakes}/{params.maxMistakes}</IceMiniFooter>
    </IceMiniShell>
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
    <IceMiniShell variant="dodge">
      <IceMiniHint>Уклоняйся от прокси · волна {wave}/{params.dodgeWaves}</IceMiniHint>
      <div className="ice-mini__dodge">
        <div className="ice-mini__dodge-hud mono-text">
          <span>PROXY_LANE</span>
          <span className={hits > 0 ? 'ice-mini__dodge-hits--warn' : ''}>HITS {hits}</span>
        </div>
        {Array.from({ length: lanes }, (_, l) => (
          <div key={l} className={`ice-mini__dodge-lane ${lane === l ? 'active' : ''}`}>
            <div className="ice-mini__dodge-grid" aria-hidden />
            {threats
              .filter((t) => t.lane === l)
              .map((t) => (
                <span key={t.id} className="ice-mini__dodge-threat" style={{ top: `${t.y}%` }}>
                  <IceMiniTag tone="err">SCAN</IceMiniTag>
                </span>
              ))}
            {lane === l && <span className="ice-mini__dodge-player">◉</span>}
          </div>
        ))}
      </div>
      <div className="ice-mini__dodge-controls">
        <button type="button" className="ice-mini__btn ice-mini__btn--lane" onClick={() => setLane((x) => Math.max(0, x - 1))}>
          ← КАНАЛ
        </button>
        <button type="button" className="ice-mini__btn ice-mini__btn--lane" onClick={() => setLane((x) => Math.min(lanes - 1, x + 1))}>
          КАНАЛ →
        </button>
      </div>
      <IceMiniFooter>Попаданий {hits}/{params.maxMistakes}</IceMiniFooter>
    </IceMiniShell>
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
    <IceMiniShell variant="log">
      <IceMiniHint pulse={timeLeft <= 8}>
        Сотри красные логи · {wiped}/{targetWipes} · {timeLeft}с
      </IceMiniHint>
      <div className="ice-mini__log-frame">
        <div className="ice-mini__log-titlebar mono-text">
          <span>syslog · tail -f /var/log/audit</span>
          <span className={`ice-mini__log-timer ${timeLeft <= 8 ? 'ice-mini__log-timer--urgent' : ''}`}>
            {timeLeft}s
          </span>
        </div>
        <div className="ice-mini__log">
          {lines.map((l) => (
            <button
              key={l.id}
              type="button"
              className={`ice-mini__log-line ice-mini__log-line--enter ${l.threat ? 'threat' : ''}`}
              onClick={() => tapLine(l)}
            >
              <span className="ice-mini__log-ts mono-text">
                {String(Math.floor(Date.now() / 1000) % 100000).padStart(5, '0')}
              </span>
              {l.text}
            </button>
          ))}
        </div>
      </div>
      <IceMiniFooter>Ложных кликов {mistakes}/{params.maxMistakes}</IceMiniFooter>
    </IceMiniShell>
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
    <IceMiniShell variant="auth">
      <IceMiniHint>Подсказка: «{target.hint}»</IceMiniHint>
      <div className="ice-mini__auth-gate mono-text">
        <IceMiniTag tone="warn">AUTH_GATE</IceMiniTag>
        <span>passwd len={params.wordLength} · attempts {attemptsLeft}</span>
      </div>
      <div className="ice-mini__wordle">
        {guesses.map((row, ri) => (
          <div key={ri} className="ice-mini__wordle-row ice-mini__wordle-row--settled">
            {row.word.split('').map((ch, ci) => (
              <span key={ci} className={`ice-mini__wordle-cell ice-mini__wordle-cell--${row.marks[ci]}`}>
                {ch}
              </span>
            ))}
          </div>
        ))}
        {guesses.length < params.wordleAttempts && (
          <div className="ice-mini__wordle-row ice-mini__wordle-row--edit">
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
        placeholder="root@ice:~# введите пароль…"
        autoComplete="off"
      />
      <button type="button" className="ice-mini__action ice-mini__action--auth" disabled={input.length !== params.wordLength} onClick={submit}>
        AUTH TRY
      </button>
    </IceMiniShell>
  );
};

/** Packet Sniff — перехвати пакет с верной CRC из потока. */
export const PacketSniffGame: React.FC<Props> = ({ params, onWin, onFail }) => {
  const ice = useIcePressure(params, onFail);
  const [round, setRound] = useState(0);
  const [tick, setTick] = useState(0);
  const streamRef = useRef<HTMLDivElement>(null);

  const roundData = useMemo(() => {
    const targetCrc = ((Date.now() + round * 313) % 0xff00).toString(16).padStart(4, '0');
    const decoys = seededShuffle(
      ['a1b2', 'c3d4', 'e5f6', '0bad', 'feed', 'dead', 'beef', 'c0de'],
      Date.now() + round + tick
    ).slice(0, 4);
    return {
      targetCrc,
      packets: seededShuffle(
        [
          { id: 'PKT_A', proto: 'TCP/443', crc: targetCrc },
          ...decoys.map((crc, i) => ({ id: `PKT_${i}`, proto: i % 2 ? 'UDP/53' : 'TCP/22', crc })),
        ],
        Date.now() + round * 7 + tick
      ),
    };
  }, [round, tick]);

  useEffect(() => {
    const ms = Math.max(900, 2200 - params.traceSpeed * 400);
    const iv = window.setInterval(() => setTick((t) => t + 1), ms);
    return () => window.clearInterval(iv);
  }, [params.traceSpeed, round]);

  useEffect(() => {
    streamRef.current?.scrollTo({ top: streamRef.current.scrollHeight, behavior: 'smooth' });
  }, [tick, round]);

  const pick = (crc: string) => {
    if (crc === roundData.targetCrc) {
      ice.rewardTrace(6);
      if (round + 1 >= params.sniffRounds) onWin();
      else setRound((r) => r + 1);
    } else {
      ice.recordMistake('ICE: decoy packet · signature mismatch');
    }
  };

  return (
    <IceMiniShell variant="sniff">
      <IcePressureHUD
        trace={ice.trace}
        alertLevel={ice.alertLevel}
        countermeasure={ice.countermeasure}
        flash={ice.flash}
        mistakes={ice.mistakes}
        maxMistakes={params.maxMistakes}
      />
      <IceMiniHint>Раунд {round + 1}/{params.sniffRounds} · перехвати CRC={roundData.targetCrc}</IceMiniHint>
      <div className="ice-mini__sniff-head mono-text">
        <span>tcpdump -i eth0 --live</span>
        <IceMiniTag tone="ice">TARGET {roundData.targetCrc}</IceMiniTag>
      </div>
      <div className="ice-mini__sniff-stream" ref={streamRef}>
        {roundData.packets.map((p) => (
          <button key={`${p.id}-${tick}`} type="button" className="ice-mini__row ice-mini__pkt-row" onClick={() => pick(p.crc)}>
            <span className="ice-mini__pkt-id">{p.id}</span>
            <span className="ice-mini__row-meta mono-text">
              {p.proto} · crc=<span className="ice-mini__pkt-crc">{p.crc}</span>
            </span>
          </button>
        ))}
      </div>
      <IceMiniFooter>Поток обновляется · промах = countermeasure</IceMiniFooter>
    </IceMiniShell>
  );
};

/** Hash Crack — подбор hex по позициям с автопрокруткой. */
export const HashCrackGame: React.FC<Props> = ({ params, onWin, onFail }) => {
  const ice = useIcePressure(params, onFail);
  const secret = useMemo(() => generateHexSecret(params.hashLen, Date.now()), [params.hashLen]);
  const hashPanelRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);

  const [pos, setPos] = useState(0);
  const [built, setBuilt] = useState('');

  useEffect(() => {
    cursorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    hashPanelRef.current?.scrollTo({
      left: Math.max(0, pos * 18 - 40),
      behavior: 'smooth',
    });
  }, [pos]);

  const pick = (ch: string) => {
    if (ch === secret[pos]) {
      const next = built + ch;
      setBuilt(next);
      const np = pos + 1;
      setPos(np);
      ice.rewardTrace(3);
      if (np >= secret.length) onWin();
    } else {
      ice.recordMistake('ICE: неверный nibble · brute-force flagged');
    }
  };

  const choices = useMemo(() => hashCrackChoices(secret, pos, Date.now()), [secret, pos]);

  return (
    <IceMiniShell variant="hash">
      <IcePressureHUD
        trace={ice.trace}
        alertLevel={ice.alertLevel}
        countermeasure={ice.countermeasure}
        flash={ice.flash}
        mistakes={ice.mistakes}
        maxMistakes={params.maxMistakes}
      />
      <IceMiniHint>Восстанови хэш · ошибки поднимают TRACE</IceMiniHint>
      <div className="ice-mini__hash-panel ice-mini__hash-panel--scroll" ref={hashPanelRef}>
        <span className="mono-text ice-mini__hash-label">SHA256::partial</span>
        <p className="ice-mini__hash-target mono-text">
          {built.split('').map((ch, i) => (
            <span key={i} className="ice-mini__hash-char ice-mini__hash-char--ok">
              {ch}
            </span>
          ))}
          <span ref={cursorRef} className="ice-mini__hash-cursor">{pos < secret.length ? '_' : ''}</span>
          {Array.from({ length: Math.max(0, secret.length - pos - (pos < secret.length ? 1 : 0)) }, (_, i) => (
            <span key={`d${i}`} className="ice-mini__hash-char ice-mini__hash-char--dim">
              ·
            </span>
          ))}
        </p>
        <div className="ice-mini__hash-progress">
          <div className="ice-mini__hash-progress-fill" style={{ width: `${(pos / secret.length) * 100}%` }} />
        </div>
      </div>
      <div className="ice-mini__grid ice-mini__grid--hex">
        {choices.map((ch) => (
          <button key={ch} type="button" className="ice-mini__btn ice-mini__hex-btn" onClick={() => pick(ch)}>
            {ch}
          </button>
        ))}
      </div>
      <IceMiniFooter>
        Позиция {pos}/{secret.length}
      </IceMiniFooter>
    </IceMiniShell>
  );
};

const SIGNAL_CHANNELS = ['CARRIER_A', 'CARRIER_B', 'PHANTOM_SYNC'];

/** Signal Lock — поймай фазу осциллирующего сигнала (тайминг, не память и не выбор из списка). */
export const SignalLockGame: React.FC<Props> = ({ params, onWin, onFail }) => {
  const syncsNeeded = params.sniffRounds;
  const zoneWidth = params.signalZonePct;
  const periodMs = params.flashMs;

  const [synced, setSynced] = useState(0);
  const [channel, setChannel] = useState(0);
  const [cursor, setCursor] = useState(0);
  const [zoneStart, setZoneStart] = useState(35);
  const [mistakes, setMistakes] = useState(0);
  const [trace, setTrace] = useState(5);
  const startRef = useRef(Date.now());

  useEffect(() => {
    startRef.current = Date.now();
  }, [synced, channel]);

  useEffect(() => {
    const iv = setInterval(() => {
      setTrace((t) => {
        const next = Math.min(100, t + params.traceSpeed * 1.4);
        if (next >= 100) onFail();
        return next;
      });
    }, 300);
    return () => clearInterval(iv);
  }, [params.traceSpeed, onFail]);

  useEffect(() => {
    const iv = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const phase = (elapsed % periodMs) / periodMs;
      setCursor(Math.sin(phase * Math.PI * 2) * 0.5 + 0.5);
    }, 16);
    return () => clearInterval(iv);
  }, [periodMs, synced, channel]);

  const trySync = () => {
    const pos = cursor * 100;
    const inZone = pos >= zoneStart && pos <= zoneStart + zoneWidth;
    if (inZone) {
      setTrace((t) => Math.max(0, t - 4));
      const nextSync = synced + 1;
      if (nextSync >= syncsNeeded) {
        onWin();
        return;
      }
      setSynced(nextSync);
      setChannel((c) => (c + 1) % SIGNAL_CHANNELS.length);
      setZoneStart(12 + ((Date.now() + nextSync * 47) % (88 - zoneWidth)));
    } else {
      const m = mistakes + 1;
      setMistakes(m);
      setTrace((t) => Math.min(100, t + 16));
      if (m > params.maxMistakes) onFail();
    }
  };

  const chLabel = SIGNAL_CHANNELS[channel % SIGNAL_CHANNELS.length];

  return (
    <IceMiniShell variant="signal">
      <IceMiniHint pulse>
        SYNC {synced + 1}/{syncsNeeded} · канал {chLabel}
      </IceMiniHint>
      <IceMiniMeter label="ICE TRACE" value={trace} variant="trace" />
      <div className="ice-mini__scope">
        <div className="ice-mini__scope-grid" aria-hidden />
        <div className="ice-mini__scope-wave" aria-hidden />
        <div className="ice-mini__signal-track">
          <div
            className="ice-mini__signal-zone"
            style={{ left: `${zoneStart}%`, width: `${zoneWidth}%` }}
          />
          <span className="ice-mini__signal-beam" style={{ left: `${cursor * 100}%` }} />
        </div>
      </div>
      <button type="button" className="ice-mini__action ice-mini__action--sync" onClick={trySync}>
        <span className="ice-mini__action-glow" aria-hidden />
        SYNC
      </button>
      <IceMiniFooter>
        Промахов {mistakes}/{params.maxMistakes} · TRACE {Math.round(trace)}%
      </IceMiniFooter>
    </IceMiniShell>
  );
};
