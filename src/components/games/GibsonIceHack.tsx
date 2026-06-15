import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { iceRewardBits, rollIceRun, type IceRunPhase, type IceService } from '../../logic/gibsonIceRun';
import type { IceDifficulty } from '../../logic/nriGameCatalog';

type Props = {
  onFinish: (bitsEarned: number) => void;
  onBack?: () => void;
  icebreakerMode?: boolean;
  difficulty?: IceDifficulty;
};

const TRACE_MULT: Record<IceDifficulty, number> = { easy: 0.75, medium: 1, hard: 1.45 };

const GibsonIceHack: React.FC<Props> = ({ onFinish, onBack, icebreakerMode, difficulty = 'medium' }) => {
  const [phase, setPhase] = useState<IceRunPhase>('intro');
  const [runSeed, setRunSeed] = useState(() => Date.now());
  const run = useMemo(() => rollIceRun(runSeed), [runSeed]);
  const [scanPick, setScanPick] = useState<string | null>(null);
  const [crackStep, setCrackStep] = useState(0);
  const [flashPort, setFlashPort] = useState<number | null>(null);
  const [flashPlaying, setFlashPlaying] = useState(false);
  const flashTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [exfil, setExfil] = useState(0);
  const [iceTrace, setIceTrace] = useState(0);
  const [statusLine, setStatusLine] = useState('Подключение к периметру…');
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const exfilRef = useRef(0);
  const traceRef = useRef(0);

  const stopTick = () => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  };

  const clearFlashTimers = () => {
    flashTimersRef.current.forEach(clearTimeout);
    flashTimersRef.current = [];
  };

  const triggerBusted = useCallback((line: string) => {
    stopTick();
    clearFlashTimers();
    setFlashPlaying(false);
    setFlashPort(null);
    setPhase('busted');
    setStatusLine(line);
  }, []);

  const applyIcePenalty = useCallback(
    (delta: number) => {
      setIceTrace((t) => {
        const next = Math.min(100, t + delta);
        if (next >= 100) {
          triggerBusted('ICE TRACE MAX — соединение оборвано, данные уничтожены.');
        }
        return next;
      });
    },
    [triggerBusted]
  );

  const playCrackFlash = useCallback(() => {
    clearFlashTimers();
    setFlashPlaying(true);
    setFlashPort(null);
    setCrackStep(0);
    setStatusLine('Смотри: порты вспыхнут по очереди — запомни порядок.');
    const seq = run.crackSequence;
    seq.forEach((port, idx) => {
      const onTimer = setTimeout(() => {
        setFlashPort(port);
        const offTimer = setTimeout(() => setFlashPort(null), 420);
        flashTimersRef.current.push(offTimer);
      }, idx * 520);
      flashTimersRef.current.push(onTimer);
    });
    const doneTimer = setTimeout(() => {
      setFlashPlaying(false);
      setFlashPort(null);
      setStatusLine('Повтори порядок — жми PORT по одному.');
    }, seq.length * 520 + 300);
    flashTimersRef.current.push(doneTimer);
  }, [run.crackSequence]);

  const startExfil = useCallback(() => {
    stopTick();
    exfilRef.current = 0;
    traceRef.current = 8;
    setExfil(0);
    setIceTrace(8);
    setPhase('exfil');
    setStatusLine('Эксfil активен — качай данные, пока ICE не проснулся!');
    tickRef.current = setInterval(() => {
      traceRef.current = Math.min(100, traceRef.current + 1.8 * TRACE_MULT[difficulty]);
      setIceTrace(traceRef.current);
      if (traceRef.current >= 100) {
        stopTick();
        setPhase('busted');
        setStatusLine('ICE TRACE MAX — соединение оборвано, данные уничтожены.');
      } else if (exfilRef.current >= 100) {
        stopTick();
        setPhase('win');
        setStatusLine('Пакет ушёл в тень. Gibson бы одобрил.');
      }
    }, 120);
  }, [difficulty]);

  const beginCrack = () => {
    setPhase('crack');
    playCrackFlash();
  };

  const handleScan = (svc: IceService) => {
    if (phase !== 'scan') return;
    if (iceTrace >= 100) return;
    setScanPick(svc.id);
    if (svc.vulnerable) {
      setStatusLine(`CVE найден на ${svc.label}:${svc.port} — внедряем эксплойт…`);
      setTimeout(beginCrack, 700);
    } else {
      setStatusLine('Ложная цель — ICE поднял тревогу +10%');
      applyIcePenalty(10);
      setTimeout(() => setScanPick(null), 600);
    }
  };

  const handleCrackTap = (port: number) => {
    if (phase !== 'crack' || flashPlaying) return;
    const expected = run.crackSequence[crackStep];
    if (port !== expected) {
      setIceTrace((t) => {
        const next = Math.min(100, t + 12);
        if (next >= 100) {
          triggerBusted('ICE TRACE MAX — соединение оборвано, данные уничтожены.');
        } else {
          setStatusLine('Неверный порт — смотри последовательность ещё раз.');
          playCrackFlash();
        }
        return next;
      });
      return;
    }
    const next = crackStep + 1;
    setCrackStep(next);
    setStatusLine(`Верно (${next}/${run.crackSequence.length})`);
    if (next >= run.crackSequence.length) {
      setTimeout(startExfil, 400);
    }
  };

  const pumpExfil = () => {
    if (phase !== 'exfil') return;
    exfilRef.current = Math.min(100, exfilRef.current + 6);
    setExfil(exfilRef.current);
  };

  useEffect(() => () => {
    stopTick();
    clearFlashTimers();
  }, []);

  const reward = iceRewardBits(exfil, iceTrace);

  return (
    <div className="ice-run">
      <header className="ice-run-head">
        <div>
          <h2 className="ice-run-title">GIBSON_ICE_RUN</h2>
          <p className="ice-run-sub mono-text">{statusLine}</p>
        </div>
        {onBack && (
          <button type="button" className="ice-run-back" onClick={onBack}>
            ← НАЗАД
          </button>
        )}
      </header>

      <div className="ice-trace-bar">
        <span className="mono-text">ICE TRACE</span>
        <div className="ice-trace-track">
          <div className="ice-trace-fill" style={{ width: `${iceTrace}%` }} />
        </div>
        <span className="mono-text">{Math.round(iceTrace)}%</span>
      </div>

      {phase === 'intro' && (
        <div className="ice-panel">
          <p className="ice-brief">
            Три фазы: <strong>SCAN</strong> — найди дырявый сервис (anon OK, open bind);
            <strong> CRACK</strong> — порты вспыхнут по очереди, повтори;
            <strong> EXFIL</strong> — жми «PUMP», пока ICE TRACE не 100%.
          </p>
          <button
            type="button"
            className="ice-btn primary"
            onClick={() => {
              setPhase('scan');
              setStatusLine('Сканируй периметр — ищи уязвимость.');
            }}
          >
            [ JACK IN ]
          </button>
        </div>
      )}

      {phase === 'scan' && (
        <div className="ice-panel">
          <p className="ice-hint mono-text">SCAN :: выбери сервис с утечкой</p>
          <div className="ice-service-grid">
            {run.services.map((svc) => (
              <button
                key={svc.id}
                type="button"
                className={`ice-service ${scanPick === svc.id ? 'picked' : ''}`}
                onClick={() => handleScan(svc)}
              >
                <span className="ice-svc-label">{svc.label}</span>
                <span className="mono-text">:{svc.port}</span>
                <span className="ice-svc-banner">{svc.banner}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === 'crack' && (
        <div className="ice-panel">
          <p className="ice-hint mono-text">
            CRACK :: шаг {crackStep}/{run.crackSequence.length}
            {flashPlaying ? ' — смотри, порты мигают по очереди!' : ' — твой ход, жми PORT'}
          </p>
          <div className="ice-port-grid">
            {[1, 2, 3, 4].map((p) => (
              <button
                key={p}
                type="button"
                className={`ice-port ${flashPort === p ? 'flash' : ''} ${!flashPlaying ? 'ready' : ''}`}
                disabled={flashPlaying}
                onClick={() => handleCrackTap(p)}
              >
                PORT_{p}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === 'exfil' && (
        <div className="ice-panel">
          <p className="ice-hint mono-text">EXFIL :: {Math.round(exfil)}% данных</p>
          <div className="ice-exfil-track">
            <div className="ice-exfil-fill" style={{ width: `${exfil}%` }} />
          </div>
          <button type="button" className="ice-btn pump" onPointerDown={pumpExfil}>
            ▼ PUMP DATA ▼
          </button>
          <p className="ice-touch-hint">Жми и держи на телефоне</p>
        </div>
      )}

      {(phase === 'win' || phase === 'busted') && (
        <div className="ice-panel ice-result">
          <h3 className={phase === 'win' ? 'neon-green' : 'neon-red'}>
            {phase === 'win' ? 'DATA EXFIL OK' : 'ICE BUSTED YOU'}
          </h3>
          <p className="mono-text">
            Эксfil: {Math.round(exfil)}% · ICE: {Math.round(iceTrace)}%
          </p>
          {phase === 'win' && !icebreakerMode && <p className="ice-reward">+{reward} BITS</p>}
          <div className="ice-result-actions">
            {phase === 'win' && (
              <button type="button" className="ice-btn primary" onClick={() => onFinish(icebreakerMode ? 1 : reward)}>
                {icebreakerMode ? '[ ФАЙЛ РАЗБЛОКИРОВАН ]' : '[ ЗАБРАТЬ LOOT ]'}
              </button>
            )}
            <button
              type="button"
              className="ice-btn"
              onClick={() => {
                stopTick();
                setRunSeed(Date.now());
                setPhase('intro');
                setScanPick(null);
                setCrackStep(0);
                setFlashPort(null);
                setFlashPlaying(false);
                clearFlashTimers();
                setExfil(0);
                setIceTrace(0);
                exfilRef.current = 0;
                traceRef.current = 0;
                setStatusLine('Подключение к периметру…');
              }}
            >
              [ ЕЩЁ РАЗ ]
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GibsonIceHack;
