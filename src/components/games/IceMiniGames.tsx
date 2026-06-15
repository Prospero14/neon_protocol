import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { IceGameParams } from '../../logic/nriGameCatalog';

type Props = {
  params: IceGameParams;
  onWin: () => void;
  onFail: () => void;
};

/** Запомни и повтори последовательность портов. */
export const PortSequenceGame: React.FC<Props> = ({ params, onWin, onFail }) => {
  const len = params.sequenceLen;
  const seq = useMemo(() => {
    const ports = [443, 8080, 22, 8443, 21, 3306, 11211, 5900];
    const out: number[] = [];
    let s = Date.now();
    for (let i = 0; i < len; i++) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      out.push(ports[s % ports.length]);
    }
    return out;
  }, [len]);
  const [phase, setPhase] = useState<'flash' | 'input' | 'done'>('flash');
  const [flashIdx, setFlashIdx] = useState(-1);
  const [input, setInput] = useState<number[]>([]);
  const [mistakes, setMistakes] = useState(0);

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
      timers.push(setTimeout(() => setFlashIdx(-1), 380));
      timers.push(setTimeout(() => { i++; run(); }, 520));
    };
    run();
    return () => timers.forEach(clearTimeout);
  }, [phase, seq]);

  const pick = (port: number) => {
    if (phase !== 'input') return;
    const next = [...input, port];
    setInput(next);
    const idx = next.length - 1;
    if (next[idx] !== seq[idx]) {
      const m = mistakes + 1;
      setMistakes(m);
      setInput([]);
      if (m >= 2) onFail();
      return;
    }
    if (next.length >= seq.length) {
      setPhase('done');
      onWin();
    }
  };

  const ports = [443, 8080, 22, 8443, 21, 3306];

  return (
    <div className="ice-mini">
      <p className="mono-text ice-mini__hint">
        {phase === 'flash' ? 'Запомни порядок портов…' : 'Повтори последовательность'}
      </p>
      <div className="ice-mini__flash">{flashIdx >= 0 ? `PORT ${seq[flashIdx]}` : '—'}</div>
      <div className="ice-mini__grid">
        {ports.map((p) => (
          <button key={p} type="button" className="ice-mini__btn" onClick={() => pick(p)} disabled={phase !== 'input'}>
            {p}
          </button>
        ))}
      </div>
      <p className="mono-text opacity-60">Шаг {input.length}/{len} · ошибок {mistakes}/2</p>
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
      { id: 'a', label: 'AUTH_GATE', vuln: false },
      { id: 'b', label: 'LEGACY_FTP', vuln: true },
      { id: 'c', label: 'SSH_BASTION', vuln: false },
      { id: 'd', label: 'MEMCACHE', vuln: true },
      { id: 'e', label: 'API_PROXY', vuln: false },
    ];
    let s = Date.now() + round * 991;
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      const j = s % (i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const vulnCount = round >= 1 ? 2 : 1;
    let v = 0;
    return shuffled.map((svc, i) => {
      const vulnerable = v < vulnCount && (i === shuffled.length - 1 || s % (i + 2) === 0);
      if (vulnerable) v++;
      return { ...svc, id: `${svc.id}-${round}`, vulnerable: i % 3 === 1 || vulnerable };
    });
  }, [round]);

  const pick = (vulnerable: boolean) => {
    if (vulnerable) {
      if (round + 1 >= rounds) onWin();
      else setRound((r) => r + 1);
    } else {
      const m = mistakes + 1;
      setMistakes(m);
      if (m >= 2) onFail();
    }
  };

  return (
    <div className="ice-mini">
      <p className="mono-text ice-mini__hint">Раунд {round + 1}/{rounds}: выбери уязвимый сервис</p>
      <div className="ice-mini__list">
        {services.map((s) => (
          <button key={s.id} type="button" className="ice-mini__row" onClick={() => pick(s.vulnerable)}>
            {s.label} · port scan OK
          </button>
        ))}
      </div>
      <p className="mono-text opacity-60">Ошибок {mistakes}/2</p>
    </div>
  );
};

/** Быстрые нажатия / удержание эксfil. */
export const TapRushGame: React.FC<Props> = ({ params, onWin, onFail }) => {
  const [taps, setTaps] = useState(0);
  const [trace, setTrace] = useState(0);
  const traceRef = useRef(0);

  useEffect(() => {
    const iv = setInterval(() => {
      setTrace((t) => {
        const next = Math.min(100, t + params.traceSpeed * 2.5);
        traceRef.current = next;
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
      <p className="mono-text ice-mini__hint">Залей канал — жми EXFIL</p>
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

/** Пары карточек dead drop. */
export const DeadDropGame: React.FC<Props> = ({ params, onWin, onFail }) => {
  const pairs = params.memoryPairs;
  const symbols = useMemo(() => {
    const sym = ['◈', '◇', '⬡', '⬢', '▣', '▤', '◆', '○'];
    const chosen = sym.slice(0, pairs);
    const deck = [...chosen, ...chosen];
    let s = Date.now();
    for (let i = deck.length - 1; i > 0; i--) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      const j = s % (i + 1);
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }, [pairs]);

  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [mistakes, setMistakes] = useState(0);

  const flip = useCallback(
    (idx: number) => {
      if (matched.has(idx) || open.includes(idx) || open.length >= 2) return;
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
          setTimeout(() => setOpen([]), 600);
          const err = mistakes + 1;
          setMistakes(err);
          if (err >= 4) onFail();
        }
      }
    },
    [open, matched, symbols, pairs, mistakes, onWin, onFail]
  );

  return (
    <div className="ice-mini">
      <p className="mono-text ice-mini__hint">Dead Drop: найди все пары</p>
      <div className="ice-mini__memory">
        {symbols.map((sym, i) => {
          const show = matched.has(i) || open.includes(i);
          return (
            <button key={i} type="button" className="ice-mini__card" onClick={() => flip(i)}>
              {show ? sym : '?'}
            </button>
          );
        })}
      </div>
      <p className="mono-text opacity-60">Ошибок {mistakes}/4</p>
    </div>
  );
};
