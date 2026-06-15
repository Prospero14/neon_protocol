import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { iceRewardBits, rollIceRun, type IceRunPhase, type IceService } from '../../logic/gibsonIceRun';
import type { IceDifficulty } from '../../logic/nriGameCatalog';
import { readNeonAuthToken } from '../../logic/authTokenStorage';
import { useAuth } from '../../logic/AuthContext';
import {
  nriFetchIceStatus,
  nriReportIceResult,
  type NriIcePlayStatus,
} from '../../logic/nriApi';
import { IceHardwareBanPopup } from './IceHardwareBanPopup';

type Props = {
  onFinish: (bitsEarned: number) => void;
  onBack?: () => void;
  icebreakerMode?: boolean;
  difficulty?: IceDifficulty;
  nriInviteCode?: string;
  onOpenInventory?: () => void;
  /** НРИ-стол: не показывать BITS в награде (рейтинг отдельно). */
  tableLeaderboardMode?: boolean;
  onRunComplete?: (result: { bits: number; exfilPct: number; tracePct: number; won: boolean }) => void;
};

const TRACE_MULT: Record<IceDifficulty, number> = { easy: 0.75, medium: 1, hard: 1.45 };

const GibsonIceHack: React.FC<Props> = ({
  onFinish,
  onBack,
  icebreakerMode,
  difficulty = 'medium',
  nriInviteCode,
  onOpenInventory,
  tableLeaderboardMode,
  onRunComplete,
}) => {
  const { token } = useAuth();
  const authToken = readNeonAuthToken() ?? token;
  const [phase, setPhase] = useState<IceRunPhase>('intro');
  const [runSeed, setRunSeed] = useState(() => Date.now());
  const run = useMemo(() => rollIceRun(runSeed, difficulty), [runSeed, difficulty]);
  const [scanPick, setScanPick] = useState<string | null>(null);
  const [crackStep, setCrackStep] = useState(0);
  const [flashPort, setFlashPort] = useState<number | null>(null);
  const [flashPlaying, setFlashPlaying] = useState(false);
  const flashTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [exfil, setExfil] = useState(0);
  const [iceTrace, setIceTrace] = useState(0);
  const [statusLine, setStatusLine] = useState('Подключение к периметру…');
  const [iceStatus, setIceStatus] = useState<NriIcePlayStatus | null>(null);
  const [banPopup, setBanPopup] = useState(false);
  const [resultReported, setResultReported] = useState(false);
  const [runCompleteSent, setRunCompleteSent] = useState(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const exfilRef = useRef(0);
  const traceRef = useRef(0);

  useEffect(() => {
    traceRef.current = iceTrace;
  }, [iceTrace]);

  const loadIceStatus = useCallback(async () => {
    if (!nriInviteCode || !authToken) return null;
    const st = await nriFetchIceStatus(authToken, nriInviteCode);
    if (st) setIceStatus(st);
    return st;
  }, [authToken, nriInviteCode]);

  useEffect(() => {
    loadIceStatus();
  }, [loadIceStatus]);

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

  const reportResult = useCallback(
    async (won: boolean) => {
      if (!nriInviteCode || !authToken || resultReported) return;
      setResultReported(true);
      const res = await nriReportIceResult(authToken, nriInviteCode, won);
      if (res.ok) setIceStatus(res.status);
    },
    [authToken, nriInviteCode, resultReported]
  );

  const triggerBusted = useCallback(
    (line: string) => {
      stopTick();
      clearFlashTimers();
      setFlashPlaying(false);
      setFlashPort(null);
      setPhase('busted');
      setStatusLine(line);
      void reportResult(false);
    },
    [reportResult]
  );

  const applyIcePenalty = useCallback(
    (delta: number) => {
      setIceTrace((t) => {
        const next = Math.min(100, t + delta);
        traceRef.current = next;
        if (next >= 100) {
          triggerBusted('ICE TRACE MAX — соединение оборвано, данные уничтожены.');
        }
        return next;
      });
    },
    [triggerBusted]
  );

  const flashMs = difficulty === 'hard' ? 320 : difficulty === 'medium' ? 380 : 420;
  const flashGap = difficulty === 'hard' ? 420 : difficulty === 'medium' ? 480 : 520;

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
        const offTimer = setTimeout(() => setFlashPort(null), flashMs);
        flashTimersRef.current.push(offTimer);
      }, idx * flashGap);
      flashTimersRef.current.push(onTimer);
    });
    const doneTimer = setTimeout(() => {
      setFlashPlaying(false);
      setFlashPort(null);
      setStatusLine('Повтори порядок — жми PORT по одному.');
    }, seq.length * flashGap + 300);
    flashTimersRef.current.push(doneTimer);
  }, [run.crackSequence, flashMs, flashGap]);

  const startExfil = useCallback(() => {
    stopTick();
    exfilRef.current = 0;
    setExfil(0);
    const carryTrace = Math.min(99, traceRef.current);
    traceRef.current = carryTrace;
    setIceTrace(carryTrace);
    setPhase('exfil');
    setStatusLine(
      carryTrace > 0
        ? `Эксfil — ICE уже на ${Math.round(carryTrace)}%, качай быстрее!`
        : 'Эксfil активен — качай данные, пока ICE не проснулся!'
    );
    tickRef.current = setInterval(() => {
      traceRef.current = Math.min(100, traceRef.current + 1.8 * TRACE_MULT[difficulty]);
      setIceTrace(traceRef.current);
      if (traceRef.current >= 100) {
        stopTick();
        setPhase('busted');
        setStatusLine('ICE TRACE MAX — соединение оборвано, данные уничтожены.');
        void reportResult(false);
      } else if (exfilRef.current >= 100) {
        stopTick();
        setPhase('win');
        setStatusLine('Пакет ушёл в тень. Gibson бы одобрил.');
        void reportResult(true);
      }
    }, 120);
  }, [difficulty, reportResult]);

  const beginCrack = () => {
    setPhase('crack');
    playCrackFlash();
  };

  const resetRun = () => {
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
    setResultReported(false);
    setRunCompleteSent(false);
    setStatusLine('Подключение к периметру…');
  };

  const guardJackIn = async (): Promise<boolean> => {
    if (!nriInviteCode || !authToken) return true;
    const st = (await loadIceStatus()) ?? iceStatus;
    if (st && st.hardwareBanned && !st.canPlay) {
      setBanPopup(true);
      return false;
    }
    return true;
  };

  const tryJackIn = async () => {
    if (!(await guardJackIn())) return;
    setResultReported(false);
    setPhase('scan');
    setStatusLine('Сканируй периметр — ищи уязвимость.');
  };

  const tryAgain = async () => {
    if (!(await guardJackIn())) return;
    resetRun();
  };

  const handleScan = (svc: IceService) => {
    if (phase !== 'scan') return;
    if (iceTrace >= 100) return;
    setScanPick(svc.id);
    if (svc.vulnerable) {
      setStatusLine(`CVE найден на ${svc.label}:${svc.port} — внедряем эксплойт…`);
      setTimeout(beginCrack, 700);
    } else {
      const penalty = difficulty === 'hard' ? 14 : difficulty === 'medium' ? 12 : 10;
      setStatusLine(`Ложная цель — ICE +${penalty}%`);
      applyIcePenalty(penalty);
      setTimeout(() => setScanPick(null), 600);
    }
  };

  const handleCrackTap = (port: number) => {
    if (phase !== 'crack' || flashPlaying) return;
    const expected = run.crackSequence[crackStep];
    if (port !== expected) {
      const penalty = difficulty === 'hard' ? 15 : difficulty === 'medium' ? 12 : 10;
      setIceTrace((t) => {
        const next = Math.min(100, t + penalty);
        traceRef.current = next;
        if (next >= 100) {
          triggerBusted('ICE TRACE MAX — соединение оборвано, данные уничтожены.');
        } else {
          setStatusLine(`Неверный PORT — ICE +${penalty}%. Смотри последовательность ещё раз.`);
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

  useEffect(
    () => () => {
      stopTick();
      clearFlashTimers();
    },
    []
  );

  useEffect(() => {
    if (phase !== 'win' && phase !== 'busted') return;
    if (runCompleteSent) return;
    setRunCompleteSent(true);
    const won = phase === 'win';
    const bits = won ? iceRewardBits(exfil, iceTrace) : 0;
    onRunComplete?.({ bits, exfilPct: exfil, tracePct: iceTrace, won });
  }, [phase, exfil, iceTrace, runCompleteSent, onRunComplete]);

  const reward = iceRewardBits(exfil, iceTrace);
  const streakHint =
    nriInviteCode && iceStatus && !iceStatus.hardwareBanned && iceStatus.consecutiveFails > 0
      ? ` · серия провалов ${iceStatus.consecutiveFails}/3`
      : '';

  return (
    <div className="ice-run">
      <header className="ice-run-head">
        <div>
          <h2 className="ice-run-title">GIBSON_ICE_RUN</h2>
          <p className="ice-run-sub mono-text">
            {statusLine}
            {streakHint}
          </p>
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
            Три фазы: <strong>SCAN</strong> — найди дырявый сервис (баннеры врут);
            <strong> CRACK</strong> — порты вспыхнут по очереди, повтори (ошибка копит ICE);
            <strong> EXFIL</strong> — жми «PUMP»; ICE trace не сбрасывается между фазами.
          </p>
          {iceStatus?.hardwareBanned && iceStatus.canPlay && (
            <p className="ice-ban-cleared mono-text">
              Железо обновлено ({iceStatus.clearanceVia === 'deck' ? 'кибер-дека' : 'нейролинк'}) — можно
              джекаться.
            </p>
          )}
          <button type="button" className="ice-btn primary" onClick={tryJackIn}>
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
            {Array.from({ length: run.portCount }, (_, i) => i + 1).map((p) => (
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
          {phase === 'busted' && iceStatus?.hardwareBanned && !iceStatus.canPlay && (
            <p className="ice-ban-warn mono-text">Следующий джек-ин заблокирован — бан по железу.</p>
          )}
          {phase === 'win' && !icebreakerMode && !tableLeaderboardMode && (
            <p className="ice-reward">+{reward} BITS</p>
          )}
          {phase === 'win' && tableLeaderboardMode && (
            <p className="ice-reward mono-text">+{reward} pts в рейтинг стола</p>
          )}
          <div className="ice-result-actions">
            {phase === 'win' && (
              <button
                type="button"
                className="ice-btn primary"
                onClick={() => onFinish(icebreakerMode ? 1 : tableLeaderboardMode ? 0 : reward)}
              >
                {icebreakerMode ? '[ ФАЙЛ РАЗБЛОКИРОВАН ]' : tableLeaderboardMode ? '[ В РЕЙТИНГ ]' : '[ ЗАБРАТЬ LOOT ]'}
              </button>
            )}
            <button type="button" className="ice-btn" onClick={tryAgain}>
              [ ЕЩЁ РАЗ ]
            </button>
          </div>
        </div>
      )}

      {banPopup && (
        <IceHardwareBanPopup
          tableAllBanned={iceStatus?.tableAllBanned}
          onClose={() => setBanPopup(false)}
          onOpenInventory={onOpenInventory}
        />
      )}
    </div>
  );
};

export default GibsonIceHack;
