import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { IceGameParams } from '../../logic/nriGameCatalog';
import {
  bitSweepCleared,
  bitSweepHitMine,
  canLockCipherRing,
  cipherMarkerGlyph,
  cipherTargetGlyph,
  deadSectorCleared,
  generateBitSweep,
  generateCipherRings,
  generateDeadSector,
  generateHandshake,
  generateKeyspaceSecret,
  generateNoiseTargets,
  generateOpcodeForge,
  keyspaceScore,
  noiseInLock,
  noiseSnr,
  OPCODE_POOL,
  opcodePickCorrect,
  revealBitCell,
  rotateCipherRing,
  toggleBitFlag,
  toggleDeadSector,
  type CipherRing,
  type OpcodeToken,
} from '../../logic/iceRewriteLogic';

const OPCODE_GLOSSARY: Record<string, string> = {
  PUSH: 'положить значение в стек',
  POP: 'снять со стека',
  LOAD: 'загрузить из памяти',
  STORE: 'записать в память',
  XOR: 'побитовое исключающее ИЛИ',
  AND: 'побитовое И',
  JMP: 'безусловный переход',
  CALL: 'вызов подпрограммы',
  RET: 'возврат',
  NOP: 'пустая операция',
  SCAN: 'просканировать сегмент',
  MASK: 'наложить маску битов',
  FORK: 'разветвить процесс',
  KILL: 'убить процесс/ICE',
  SYNC: 'синхронизация канала',
};
import {
  IceMiniFooter,
  IceMiniHint,
  IceMiniShell,
  IceMiniTag,
} from './IceMiniChrome';
import { IcePressureHUD } from './IcePressureHUD';
import { useIcePressure } from './useIcePressure';

export type IceWinMeta = { qualityPct: number; tracePct: number };

type Props = {
  params: IceGameParams;
  onWin: (meta?: IceWinMeta) => void;
  onFail: () => void;
};

function qualityFromIce(trace: number, mistakes: number, maxMistakes: number): IceWinMeta {
  const mistakePenalty =
    maxMistakes > 0 ? Math.min(40, (mistakes / Math.max(1, maxMistakes)) * 40) : 0;
  const qualityPct = Math.max(5, Math.min(100, Math.round(100 - trace * 0.7 - mistakePenalty)));
  return { qualityPct, tracePct: Math.round(trace) };
}

/** Dead Sector — Lights Out по сетке ICE. */
export const DeadSectorGame: React.FC<Props> = ({ params, onWin, onFail }) => {
  const ice = useIcePressure(params, onFail);
  const cols = Math.max(3, Math.min(6, params.meshNodes || 4));
  const rows = Math.max(3, Math.min(6, params.sequenceLen || 3));
  const seed = useMemo(() => Date.now(), []);
  const [grid, setGrid] = useState(() => generateDeadSector(cols, rows, seed));
  const [done, setDone] = useState(false);

  useEffect(() => {
    ice.setPaused(ice.locked || done);
  }, [ice.locked, done, ice.setPaused]);

  const click = (idx: number) => {
    if (done || ice.locked) return;
    setGrid((prev) => {
      const next = toggleDeadSector(prev, cols, idx);
      if (deadSectorCleared(next)) {
        queueMicrotask(() => {
          setDone(true);
          ice.rewardTrace(10);
          onWin(qualityFromIce(ice.trace, ice.mistakes, params.maxMistakes));
        });
      }
      return next;
    });
  };

  return (
    <IceMiniShell variant="mesh">
      <IcePressureHUD
        trace={ice.trace}
        alertLevel={ice.alertLevel}
        countermeasure={ice.countermeasure}
        flash={ice.flash}
        mistakes={ice.mistakes}
        maxMistakes={params.maxMistakes}
      />
      <IceMiniHint pulse={!done}>
        Гаси все сектора ICE — клик переключает клетку и соседей.
      </IceMiniHint>
      <div
        className="ice-mini__dead-grid"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {grid.map((on, i) => (
          <button
            key={i}
            type="button"
            className={`ice-mini__dead-cell ${on ? 'ice-mini__dead-cell--on' : ''}`}
            onClick={() => click(i)}
            disabled={done || ice.locked}
          >
            {on ? 'ICE' : '·'}
          </button>
        ))}
      </div>
      <IceMiniFooter>
        WIN: все OFF · FAIL: TRACE 100% · сетка {cols}×{rows}
      </IceMiniFooter>
    </IceMiniShell>
  );
};

/** Opcode Forge — собери exploit-цепочку; glossary + decoys. */
export const OpcodeForgeGame: React.FC<Props> = ({ params, onWin, onFail }) => {
  const ice = useIcePressure(params, onFail);
  const seed = useMemo(() => Date.now(), []);
  const decoys = Math.max(1, (params.tapTarget || 3) - 1);
  const { target, pool } = useMemo(
    () => generateOpcodeForge(params.sequenceLen || 4, decoys, seed),
    [params.sequenceLen, decoys, seed],
  );
  const [placed, setPlaced] = useState<OpcodeToken[]>([]);
  const [used, setUsed] = useState<Set<number>>(() => new Set());
  const [done, setDone] = useState(false);
  const [showGloss, setShowGloss] = useState(true);
  const nextNeed = target[placed.length];

  useEffect(() => {
    ice.setPaused(ice.locked || done);
  }, [ice.locked, done, ice.setPaused]);

  const pick = (token: OpcodeToken, poolIdx: number) => {
    if (done || ice.locked || used.has(poolIdx)) return;
    if (!opcodePickCorrect(target, placed, token)) {
      ice.recordMistake('ICE: opcode mismatch · stack corrupt');
      return;
    }
    const next = [...placed, token];
    setPlaced(next);
    setUsed((u) => new Set(u).add(poolIdx));
    ice.rewardTrace(4);
    if (next.length >= target.length) {
      setDone(true);
      onWin(qualityFromIce(ice.trace, ice.mistakes, params.maxMistakes));
    }
  };

  return (
    <IceMiniShell variant="tap">
      <IcePressureHUD
        trace={ice.trace}
        alertLevel={ice.alertLevel}
        countermeasure={ice.countermeasure}
        flash={ice.flash}
        mistakes={ice.mistakes}
        maxMistakes={params.maxMistakes}
      />
      <IceMiniHint pulse={!done}>
        Собираем exploit payload для corp ICE: кликай opcodes строго по порядку blueprint.
        Сейчас нужен: <strong>{nextNeed ?? 'DONE'}</strong>
        {nextNeed ? ` — ${OPCODE_GLOSSARY[nextNeed] ?? ''}` : ''}
      </IceMiniHint>
      <p className="mono-text ice-mini__opcode-target">
        BLUEPRINT :: {target.map((t, i) => (i < placed.length ? t : '····')).join(' → ')}
      </p>
      <button
        type="button"
        className="ice-mini__gloss-toggle mono-text"
        onClick={() => setShowGloss((v) => !v)}
      >
        {showGloss ? '▾ glossary' : '▸ glossary opcodes'}
      </button>
      {showGloss && (
        <ul className="ice-mini__opcode-gloss mono-text">
          {OPCODE_POOL.map((op) => (
            <li key={op}>
              <strong>{op}</strong> — {OPCODE_GLOSSARY[op]}
            </li>
          ))}
        </ul>
      )}
      <div className="ice-mini__opcode-pool">
        {pool.map((tok, i) => (
          <button
            key={`${tok}-${i}`}
            type="button"
            className={`ice-mini__opcode-chip ${used.has(i) ? 'ice-mini__opcode-chip--used' : ''} ${tok === nextNeed ? 'ice-mini__opcode-chip--need' : ''}`}
            disabled={used.has(i) || done || ice.locked}
            onClick={() => pick(tok, i)}
            title={OPCODE_GLOSSARY[tok]}
          >
            {tok}
          </button>
        ))}
      </div>
      <IceMiniFooter>
        WIN: цепочка {target.length} · FAIL: TRACE / ошибки · шаг {placed.length}/{target.length}
      </IceMiniFooter>
    </IceMiniShell>
  );
};

/** Keyspace Prune — Mastermind по hex. */
export const KeyspacePruneGame: React.FC<Props> = ({ params, onWin, onFail }) => {
  const ice = useIcePressure(params, onFail);
  const len = Math.max(3, Math.min(6, params.hashLen || params.wordLength || 4));
  const attempts = Math.max(4, params.wordleAttempts || 8);
  const seed = useMemo(() => Date.now(), []);
  const secret = useMemo(() => generateKeyspaceSecret(len, seed), [len, seed]);
  const [draft, setDraft] = useState('');
  const [rows, setRows] = useState<Array<{ guess: string; exact: number; present: number }>>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    ice.setPaused(ice.locked || done);
  }, [ice.locked, done, ice.setPaused]);

  const submit = () => {
    if (done || ice.locked) return;
    const g = draft.toLowerCase().replace(/[^0-9a-f]/g, '').slice(0, len);
    if (g.length !== len) {
      ice.recordMistake('ICE: malformed key · length mismatch');
      return;
    }
    const score = keyspaceScore(secret, g);
    const next = [...rows, { guess: g, ...score }];
    setRows(next);
    setDraft('');
    if (score.exact === len) {
      setDone(true);
      ice.rewardTrace(14);
      const leftover = attempts - next.length;
      const q = Math.max(
        10,
        Math.min(100, Math.round(100 - ice.trace * 0.5 - (1 - leftover / attempts) * 30)),
      );
      onWin({ qualityPct: q, tracePct: Math.round(ice.trace) });
      return;
    }
    ice.spikeTrace(6, `PRUNE · exact ${score.exact} · present ${score.present}`);
    if (next.length >= attempts) {
      setDone(true);
      onFail();
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
      <IceMiniHint pulse={!done}>
        Brute-force hex-ключа длины {len}. После каждой попытки:
        EXACT = цифра на своём месте · PRESENT = цифра есть, но в другой позиции.
      </IceMiniHint>
      <p className="mono-text ice-mini__keyspace-example">
        пример: секрет <code>a1f0</code>, догадка <code>a10f</code> → exact 2 (a,1) · present 2 (f и 0 переставлены)
      </p>
      <ul className="ice-mini__keyspace-log mono-text">
        {rows.map((r, i) => (
          <li key={`${r.guess}-${i}`}>
            <IceMiniTag tone="ice">{r.guess}</IceMiniTag>{' '}
            exact {r.exact} · present {r.present}
          </li>
        ))}
      </ul>
      <div className="ice-mini__keyspace-form">
        <input
          className="mono-text"
          value={draft}
          maxLength={len}
          placeholder={'0'.repeat(len)}
          disabled={done || ice.locked}
          onChange={(e) => setDraft(e.target.value.toLowerCase().replace(/[^0-9a-f]/g, ''))}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
        <button type="button" disabled={done || ice.locked} onClick={submit}>
          PRUNE
        </button>
      </div>
      <IceMiniFooter>
        WIN: точный ключ · FAIL: {attempts} попыток / TRACE · осталось {Math.max(0, attempts - rows.length)}
      </IceMiniFooter>
    </IceMiniShell>
  );
};

/** Handshake Drill — выбор верных ответов протокола. */
export const HandshakeDrillGame: React.FC<Props> = ({ params, onWin, onFail }) => {
  const ice = useIcePressure(params, onFail);
  const stepsN = Math.max(3, Math.min(8, params.sniffRounds || 4));
  const seed = useMemo(() => Date.now(), []);
  const steps = useMemo(() => generateHandshake(stepsN, seed), [stepsN, seed]);
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    ice.setPaused(ice.locked || done);
  }, [ice.locked, done, ice.setPaused]);

  const choose = (correct: boolean) => {
    if (done || ice.locked) return;
    if (!correct) {
      ice.recordMistake('ICE: protocol violation · handshake abort');
      return;
    }
    ice.rewardTrace(5);
    if (idx + 1 >= steps.length) {
      setDone(true);
      onWin(qualityFromIce(ice.trace, ice.mistakes, params.maxMistakes));
      return;
    }
    setIdx((i) => i + 1);
  };

  const step = steps[idx]!;

  return (
    <IceMiniShell variant="log">
      <IcePressureHUD
        trace={ice.trace}
        alertLevel={ice.alertLevel}
        countermeasure={ice.countermeasure}
        flash={ice.flash}
        mistakes={ice.mistakes}
        maxMistakes={params.maxMistakes}
      />
      <IceMiniHint pulse={!done}>{step.prompt}</IceMiniHint>
      <p className="mono-text ice-mini__handshake-hint">hint · {step.hint}</p>
      <div className="ice-mini__handshake-opts">
        {step.options.map((o) => (
          <button
            key={o.id}
            type="button"
            className="ice-mini__handshake-btn mono-text"
            disabled={done || ice.locked}
            onClick={() => choose(o.correct)}
          >
            {o.label}
          </button>
        ))}
      </div>
      <IceMiniFooter>
        WIN: все {steps.length} шагов · FAIL: TRACE / ошибки · шаг {idx + 1}/{steps.length}
      </IceMiniFooter>
    </IceMiniShell>
  );
};

/** Noise Floor — фаза синусоид carrier vs your tune. */
export const NoiseFloorGame: React.FC<Props> = ({ params, onWin, onFail }) => {
  const ice = useIcePressure(params, onFail);
  const needSec = Math.max(2, Math.min(8, params.sniffRounds || 3));
  const zonePct = Math.max(10, Math.min(30, params.signalZonePct || 18));
  const seed = useMemo(() => Date.now(), []);
  const [targets, setTargets] = useState(() => generateNoiseTargets(seed));
  const [gain, setGain] = useState(50);
  const [filter, setFilter] = useState(50);
  const [held, setHeld] = useState(0);
  const [phase, setPhase] = useState(0);
  const [done, setDone] = useState(false);
  const heldRef = useRef(0);

  const snr = noiseSnr(gain, filter, targets.gain, targets.filter, zonePct);
  const lockedOk = noiseInLock(snr, zonePct);

  useEffect(() => {
    ice.setPaused(ice.locked || done);
  }, [ice.locked, done, ice.setPaused]);

  useEffect(() => {
    if (done || ice.locked) return;
    const iv = window.setInterval(() => setPhase((p) => p + 0.18), 50);
    return () => window.clearInterval(iv);
  }, [done, ice.locked]);

  useEffect(() => {
    if (done || ice.locked) return;
    const iv = window.setInterval(() => {
      if (
        noiseInLock(
          noiseSnr(gain, filter, targets.gain, targets.filter, zonePct),
          zonePct,
        )
      ) {
        heldRef.current += 0.2;
        setHeld(heldRef.current);
        if (heldRef.current >= needSec) {
          setDone(true);
          ice.rewardTrace(12);
          onWin(qualityFromIce(ice.trace, ice.mistakes, params.maxMistakes));
        }
      } else {
        heldRef.current = Math.max(0, heldRef.current - 0.08);
        setHeld(heldRef.current);
      }
    }, 200);
    return () => window.clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gain, filter, targets, zonePct, needSec, done, ice.locked, onWin, params.maxMistakes]);

  useEffect(() => {
    if (params.traceSpeed < 1.15 || done || ice.locked) return;
    const iv = window.setInterval(() => {
      setTargets(generateNoiseTargets(Date.now()));
      ice.spikeTrace(3, 'ICE: carrier drift · retune');
    }, Math.max(5000, params.peekMs * 8));
    return () => window.clearInterval(iv);
  }, [params.traceSpeed, params.peekMs, done, ice.locked, ice.spikeTrace]);

  const wavePath = (amp: number, ph: number, colorPhase: number) => {
    const pts: string[] = [];
    for (let x = 0; x <= 200; x += 4) {
      const y = 28 + Math.sin(x * 0.08 + ph + colorPhase) * (8 + amp * 0.18);
      pts.push(`${x},${y.toFixed(1)}`);
    }
    return `M ${pts.join(' L ')}`;
  };

  return (
    <IceMiniShell variant="dodge">
      <IcePressureHUD
        trace={ice.trace}
        alertLevel={ice.alertLevel}
        countermeasure={ice.countermeasure}
        flash={ice.flash}
        mistakes={ice.mistakes}
        maxMistakes={params.maxMistakes}
      />
      <IceMiniHint pulse={!done && lockedOk}>
        RADIO_EXFIL · подстрой свою волну (розовая) к corp carrier (cyan). GAIN=амплитуда, FILTER=фаза.
        {lockedOk ? ' · LOCK — держи!' : ''}
      </IceMiniHint>
      <svg className="ice-mini__wave" viewBox="0 0 200 56" aria-hidden>
        <path
          d={wavePath(targets.gain, phase * 0.4 + targets.filter * 0.04, 0)}
          className="ice-mini__wave-target"
        />
        <path
          d={wavePath(gain, phase * 0.4 + filter * 0.04, 0.2)}
          className={`ice-mini__wave-you ${lockedOk ? 'is-lock' : ''}`}
        />
      </svg>
      <div className={`ice-mini__snr ${lockedOk ? 'ice-mini__snr--ok' : ''}`}>
        <span className="mono-text">SNR {snr}%</span>
        <div className="ice-mini__snr-bar">
          <div className="ice-mini__snr-fill" style={{ width: `${snr}%` }} />
        </div>
        <span className="mono-text opacity-70">
          hold {held.toFixed(1)}/{needSec}s
        </span>
      </div>
      <label className="ice-mini__slider mono-text">
        GAIN (амплитуда)
        <input
          type="range"
          min={0}
          max={100}
          value={gain}
          disabled={done || ice.locked}
          onChange={(e) => setGain(Number(e.target.value))}
        />
      </label>
      <label className="ice-mini__slider mono-text">
        FILTER (фаза)
        <input
          type="range"
          min={0}
          max={100}
          value={filter}
          disabled={done || ice.locked}
          onChange={(e) => setFilter(Number(e.target.value))}
        />
      </label>
      <IceMiniFooter>
        WIN: удержать lock {needSec}с · FAIL: TRACE 100%
        {params.traceSpeed >= 1.15 ? ' · hard: carrier drift' : ''}
      </IceMiniFooter>
    </IceMiniShell>
  );
};

/** Cipher Rings — концентрические кольца SVG, lock outer→inner. */
export const CipherRingsGame: React.FC<Props> = ({ params, onWin, onFail }) => {
  const ice = useIcePressure(params, onFail);
  const ringCount = Math.max(3, Math.min(5, (params.tapTarget || 3) + 1));
  const size = Math.max(7, Math.min(12, (params.sequenceLen || 6) + 2));
  const seed = useMemo(() => Date.now(), []);
  const [rings, setRings] = useState(() => generateCipherRings(ringCount, size, seed));
  const [lockedCount, setLockedCount] = useState(0);
  const [done, setDone] = useState(false);

  const active = lockedCount;
  const activeRing = rings[active];
  const cx = 120;
  const cy = 120;
  const maxR = 108;

  useEffect(() => {
    ice.setPaused(ice.locked || done);
  }, [ice.locked, done, ice.setPaused]);

  useEffect(() => {
    if (params.traceSpeed < 1.15 || done || ice.locked) return;
    const iv = window.setInterval(() => {
      setRings((prev) =>
        prev.map((r, i) => (i >= lockedCount ? rotateCipherRing(r, 1 + (i % 2)) : r)),
      );
      ice.spikeTrace(4, 'ICE: cipher scramble · ring desync');
    }, Math.max(4500, params.peekMs * 7));
    return () => window.clearInterval(iv);
  }, [params.traceSpeed, params.peekMs, done, ice.locked, ice.spikeTrace, lockedCount]);

  const turn = (delta: number) => {
    if (done || ice.locked || active >= rings.length) return;
    setRings((prev) => prev.map((r, i) => (i === active ? rotateCipherRing(r, delta) : r)));
  };

  const tryLock = () => {
    if (done || ice.locked || !activeRing) return;
    if (!canLockCipherRing(rings, lockedCount, active)) {
      ice.recordMistake('CIPHER: misaligned · lock rejected');
      return;
    }
    const next = lockedCount + 1;
    setLockedCount(next);
    ice.rewardTrace(8);
    if (next >= rings.length) {
      setDone(true);
      onWin(qualityFromIce(ice.trace, ice.mistakes, params.maxMistakes));
    }
  };

  return (
    <IceMiniShell variant="mesh">
      <IcePressureHUD
        trace={ice.trace}
        alertLevel={ice.alertLevel}
        countermeasure={ice.countermeasure}
        flash={ice.flash}
        mistakes={ice.mistakes}
        maxMistakes={params.maxMistakes}
      />
      <IceMiniHint pulse={!done}>
        CORP CIPHER VAULT · крути активное кольцо, пока глиф под ▲ совпадёт с KEY.
        LOCK только по порядку outer→inner. На кольце ответ не подсвечивается.
      </IceMiniHint>

      <div className="ice-mini__cipher-dial-wrap">
        <div className="ice-mini__cipher-key mono-text">
          <span>KEY R{active + 1}</span>
          <strong className="ice-mini__cipher-key-glyph">
            {activeRing ? cipherTargetGlyph(activeRing) : '—'}
          </strong>
          <span className="opacity-60">under marker now:</span>
          <span>{activeRing ? cipherMarkerGlyph(activeRing) : '—'}</span>
        </div>

        <svg className="ice-mini__cipher-dial" viewBox="0 0 240 240" aria-hidden>
          <defs>
            <radialGradient id="cipherGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(255,0,128,0.18)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>
          </defs>
          <circle cx={cx} cy={cy} r={maxR + 6} fill="url(#cipherGlow)" />
          {/* marker at 12 o'clock */}
          <polygon points="120,6 114,18 126,18" className="ice-mini__cipher-dial-marker" />

          {rings.map((ring: CipherRing, ri) => {
            const isLocked = ri < lockedCount;
            const isActive = ri === active;
            const radius = maxR - ri * ((maxR - 36) / Math.max(1, rings.length));
            const n = ring.glyphs.length;
            return (
              <g
                key={ri}
                className={`ice-mini__cipher-dial-ring ${isLocked ? 'is-locked' : ''} ${isActive ? 'is-active' : ''}`}
              >
                <circle
                  cx={cx}
                  cy={cy}
                  r={radius}
                  fill="none"
                  className="ice-mini__cipher-dial-track"
                />
                {ring.glyphs.map((g, gi) => {
                  // rot=0 means targetIdx glyph... wait: aligned when rot === targetIdx
                  // glyph at marker (top) is glyphs[rot]
                  // place glyph gi at angle: (gi - rot) * (360/n) from top
                  const angle = ((gi - ring.rot) / n) * Math.PI * 2 - Math.PI / 2;
                  const x = cx + Math.cos(angle) * radius;
                  const y = cy + Math.sin(angle) * radius;
                  const atMarker = gi === ring.rot;
                  return (
                    <text
                      key={`${ri}-${gi}`}
                      x={x}
                      y={y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className={`ice-mini__cipher-dial-glyph ${atMarker ? 'is-marker' : ''} ${isActive ? 'is-ring-active' : ''}`}
                    >
                      {g}
                    </text>
                  );
                })}
              </g>
            );
          })}
          <circle cx={cx} cy={cy} r={28} className="ice-mini__cipher-dial-core" />
          <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" className="ice-mini__cipher-dial-core-txt">
            {lockedCount}/{rings.length}
          </text>
        </svg>

        <ul className="ice-mini__cipher-ring-status mono-text">
          {rings.map((_, ri) => (
            <li
              key={ri}
              className={
                ri < lockedCount ? 'is-locked' : ri === active ? 'is-active' : ''
              }
            >
              R{ri + 1}
              {ri < lockedCount ? ' LOCKED' : ri === active ? ' ACTIVE' : ''}
            </li>
          ))}
        </ul>

        <div className="ice-mini__cipher-dial-controls">
          <button type="button" disabled={done || ice.locked} onClick={() => turn(-1)}>
            ◀ ROT
          </button>
          <button
            type="button"
            className="ice-mini__cipher-lock"
            disabled={done || ice.locked}
            onClick={tryLock}
          >
            LOCK R{active + 1}
          </button>
          <button type="button" disabled={done || ice.locked} onClick={() => turn(1)}>
            ROT ▶
          </button>
        </div>
      </div>

      <IceMiniFooter>
        WIN: lock всех {ringCount} · FAIL: TRACE · active R{active + 1}
        {params.traceSpeed >= 1.15 ? ' · hard scramble' : ''}
      </IceMiniFooter>
    </IceMiniShell>
  );
};

/** Bit Sweep — minesweeper по сегментам ICE. */
export const BitSweepGame: React.FC<Props> = ({ params, onWin, onFail }) => {
  const ice = useIcePressure(params, onFail);
  const cols = Math.max(4, Math.min(8, params.meshNodes || 5));
  const rows = Math.max(4, Math.min(8, params.sequenceLen || 5));
  const mines = Math.max(3, Math.min(cols * rows - 4, params.tapTarget || 6));
  const seed = useMemo(() => Date.now(), []);
  const [grid, setGrid] = useState(() => generateBitSweep(cols, rows, mines, seed));
  const [done, setDone] = useState(false);
  const [flagMode, setFlagMode] = useState(false);

  useEffect(() => {
    ice.setPaused(ice.locked || done);
  }, [ice.locked, done, ice.setPaused]);

  const open = (idx: number) => {
    if (done || ice.locked) return;
    if (flagMode) {
      setGrid((g) => toggleBitFlag(g, idx));
      return;
    }
    if (grid[idx]?.flagged) return;
    if (bitSweepHitMine(grid, idx)) {
      setDone(true);
      ice.spikeTrace(40, 'ICE MINE · segment detonated');
      window.setTimeout(() => onFail(), 420);
      return;
    }
    setGrid((prev) => {
      const next = revealBitCell(prev, cols, idx);
      if (bitSweepCleared(next)) {
        queueMicrotask(() => {
          setDone(true);
          ice.rewardTrace(12);
          onWin(qualityFromIce(ice.trace, ice.mistakes, params.maxMistakes));
        });
      }
      return next;
    });
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
      <IceMiniHint pulse={!done}>
        Открой безопасные биты. Цифра = соседние мины. FLAG помечает мину без взрыва.
      </IceMiniHint>
      <div className="ice-mini__bitsweep-toolbar">
        <button
          type="button"
          className={!flagMode ? 'is-active' : ''}
          disabled={done || ice.locked}
          onClick={() => setFlagMode(false)}
        >
          REVEAL
        </button>
        <button
          type="button"
          className={flagMode ? 'is-active' : ''}
          disabled={done || ice.locked}
          onClick={() => setFlagMode(true)}
        >
          FLAG
        </button>
        <IceMiniTag tone="warn">{mines} mines</IceMiniTag>
      </div>
      <div
        className="ice-mini__bitsweep-grid"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {grid.map((cell, i) => (
          <button
            key={i}
            type="button"
            className={`ice-mini__bitsweep-cell ${cell.revealed ? 'is-open' : ''} ${cell.flagged ? 'is-flag' : ''}`}
            disabled={done || ice.locked || cell.revealed}
            onClick={() => open(i)}
            onContextMenu={(e) => {
              e.preventDefault();
              if (done || ice.locked) return;
              setGrid((g) => toggleBitFlag(g, i));
            }}
          >
            {cell.revealed
              ? cell.mine
                ? 'X'
                : cell.adj > 0
                  ? cell.adj
                  : ''
              : cell.flagged
                ? 'F'
                : ''}
          </button>
        ))}
      </div>
      <IceMiniFooter>
        WIN: все safe-биты открыты · FAIL: мина / TRACE · ПКМ = flag · {cols}×{rows}
      </IceMiniFooter>
    </IceMiniShell>
  );
};
