import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { IceGameParams } from '../../logic/nriGameCatalog';
import {
  canCaptureNode,
  circuitPoweredIndices,
  circuitSolved,
  generateCaptureGraph,
  generateCircuitGrid,
  generateLikenessVault,
  likenessScore,
  likenessWordEliminated,
  rotatePipe,
  type PipeCell,
} from '../../logic/iceArcadeExtraLogic';
import {
  IceMiniFooter,
  IceMiniHint,
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

function pipeGlyph(kind: PipeCell['kind'], rot: number): string {
  if (kind === 'X') return '＋';
  if (kind === 'I') return rot % 2 === 0 ? '│' : '─';
  if (kind === 'T') {
    return ['┴', '├', '┬', '┤'][rot % 4]!;
  }
  return ['└', '┌', '┐', '┘'][rot % 4]!;
}

/** Circuit Splice — поверни пайпы, проведи сигнал ENTRY → CORE. */
export const CircuitSpliceGame: React.FC<Props> = ({ params, onWin, onFail }) => {
  const ice = useIcePressure(params, onFail);
  const cols = Math.max(4, Math.min(6, params.meshNodes || 4));
  const rows = Math.max(3, Math.min(5, params.sequenceLen || 3));
  const seed = useMemo(() => Date.now(), []);
  const initial = useMemo(() => generateCircuitGrid(cols, rows, seed), [cols, rows, seed]);
  const [grid, setGrid] = useState(initial.grid);
  const [done, setDone] = useState(false);

  const powered = useMemo(
    () => circuitPoweredIndices(grid, cols, rows, initial.entryRow),
    [grid, cols, rows, initial.entryRow]
  );

  useEffect(() => {
    ice.setPaused(ice.locked || done);
  }, [ice.locked, done, ice.setPaused]);

  // На hard ICE иногда сдвигает случайную плитку.
  useEffect(() => {
    if (params.traceSpeed < 1.2 || done || ice.locked) return;
    const iv = window.setInterval(() => {
      setGrid((prev) => {
        const next = [...prev];
        const idx = Math.floor(Math.random() * next.length);
        next[idx] = rotatePipe(next[idx]!);
        return next;
      });
      ice.spikeTrace(4, 'ICE: circuit jitter · tile desync');
    }, Math.max(4200, params.peekMs * 6));
    return () => window.clearInterval(iv);
  }, [params.traceSpeed, params.peekMs, done, ice.locked, ice.spikeTrace]);

  const rotateAt = (idx: number) => {
    if (done || ice.locked) return;
    setGrid((prev) => {
      const next = [...prev];
      next[idx] = rotatePipe(next[idx]!);
      const solved = circuitSolved(next, cols, rows, initial.entryRow, initial.coreRow);
      if (solved) {
        queueMicrotask(() => {
          setDone(true);
          ice.rewardTrace(12);
          onWin();
        });
      }
      return next;
    });
  };

  return (
    <IceMiniShell variant="circuit">
      <IcePressureHUD
        trace={ice.trace}
        alertLevel={ice.alertLevel}
        countermeasure={ice.countermeasure}
        flash={ice.flash}
        mistakes={ice.mistakes}
        maxMistakes={params.maxMistakes}
      />
      <IceMiniHint pulse={!done}>
        Крути пайпы · сигнал ENTRY → CORE {done ? '· LINK UP' : ''}
      </IceMiniHint>
      <div
        className="ice-mini__circuit"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(44px, 1fr))` }}
      >
        {grid.map((cell, idx) => {
          const x = idx % cols;
          const y = Math.floor(idx / cols);
          const isEntry = x === 0 && y === initial.entryRow;
          const isCore = x === cols - 1 && y === initial.coreRow;
          const lit = powered.has(idx);
          return (
            <button
              key={idx}
              type="button"
              className={`ice-mini__pipe ${lit ? 'ice-mini__pipe--lit' : ''} ${isEntry ? 'ice-mini__pipe--entry' : ''} ${isCore ? 'ice-mini__pipe--core' : ''}`}
              onClick={() => rotateAt(idx)}
              disabled={done || ice.locked}
              aria-label={`pipe ${cell.kind} rot ${cell.rot}`}
            >
              <span className="ice-mini__pipe-glyph">{pipeGlyph(cell.kind, cell.rot)}</span>
              {isEntry && <IceMiniTag tone="ok">IN</IceMiniTag>}
              {isCore && <IceMiniTag tone={lit ? 'ok' : 'ice'}>CORE</IceMiniTag>}
            </button>
          );
        })}
      </div>
      <IceMiniFooter>
        {cols}×{rows} · lit {powered.size}/{grid.length}
      </IceMiniFooter>
    </IceMiniShell>
  );
};

/** Likeness Vault — Fallout-terminal: угадай слово по LIKENESS. */
export const LikenessVaultGame: React.FC<Props> = ({ params, onWin, onFail }) => {
  const ice = useIcePressure(params, onFail);
  const listSize = Math.max(6, Math.min(12, 4 + params.scanRounds * 2));
  const vault = useMemo(
    () => generateLikenessVault(params.wordLength, listSize, Date.now()),
    [params.wordLength, listSize]
  );
  const [history, setHistory] = useState<Array<{ guess: string; likeness: number }>>([]);
  const [done, setDone] = useState(false);
  const attemptsLeft = params.wordleAttempts - history.length;

  useEffect(() => {
    ice.setPaused(ice.locked || done);
  }, [ice.locked, done, ice.setPaused]);

  const pick = (word: string) => {
    if (done || ice.locked || attemptsLeft <= 0) return;
    if (history.some((h) => h.guess === word)) return;
    if (word === vault.secret) {
      setDone(true);
      ice.rewardTrace(15);
      onWin();
      return;
    }
    const likeness = likenessScore(vault.secret, word);
    const nextHist = [...history, { guess: word, likeness }];
    setHistory(nextHist);
    ice.recordMistake(`LIKENESS ${likeness}/${word.length} · mismatch`);
    if (nextHist.length >= params.wordleAttempts) {
      setDone(true);
      onFail();
    }
  };

  return (
    <IceMiniShell variant="likeness">
      <IcePressureHUD
        trace={ice.trace}
        alertLevel={ice.alertLevel}
        countermeasure={ice.countermeasure}
        flash={ice.flash}
        mistakes={ice.mistakes}
        maxMistakes={params.maxMistakes}
      />
      <IceMiniHint pulse={attemptsLeft <= 2}>
        Vault dump · выбери пароль · LIKENESS = буквы на месте
      </IceMiniHint>
      <div className="ice-mini__likeness-hist mono-text">
        {history.length === 0 ? (
          <span className="opacity-50">нет проб · attempts {attemptsLeft}</span>
        ) : (
          history.map((h, i) => (
            <span key={`${h.guess}-${i}`} className="ice-mini__likeness-chip">
              {h.guess.toUpperCase()} · {h.likeness}/{vault.secret.length}
            </span>
          ))
        )}
      </div>
      <div className="ice-mini__likeness-list">
        {vault.words.map((w) => {
          const dead = likenessWordEliminated(w, history);
          const used = history.some((h) => h.guess === w);
          return (
            <button
              key={w}
              type="button"
              className={`ice-mini__btn ice-mini__likeness-word ${dead ? 'ice-mini__likeness-word--dead' : ''} ${used ? 'ice-mini__likeness-word--used' : ''}`}
              disabled={done || ice.locked || dead || used}
              onClick={() => pick(w)}
            >
              {w.toUpperCase()}
            </button>
          );
        })}
      </div>
      <IceMiniFooter>
        Попыток {attemptsLeft}/{params.wordleAttempts} · len {vault.secret.length}
      </IceMiniFooter>
    </IceMiniShell>
  );
};

/** Node Capture — захватывай смежные узлы probes до CORE. */
export const NodeCaptureGame: React.FC<Props> = ({ params, onWin, onFail }) => {
  const ice = useIcePressure(params, onFail);
  const graph = useMemo(
    () => generateCaptureGraph(params.meshNodes + 2, params.tapTarget + 4, Date.now()),
    [params.meshNodes, params.tapTarget]
  );
  const [captured, setCaptured] = useState(() => new Set<number>([graph.entryId]));
  const [probes, setProbes] = useState(graph.probes);
  const [done, setDone] = useState(false);

  useEffect(() => {
    ice.setPaused(ice.locked || done);
  }, [ice.locked, done, ice.setPaused]);

  const tryCapture = useCallback(
    (id: number) => {
      if (done || ice.locked) return;
      const check = canCaptureNode(graph, captured, id, probes);
      if (!check.ok) {
        if (check.reason === 'not_adjacent') {
          ice.recordMistake('ICE: remote node · no lateral path');
        } else if (check.reason === 'no_probes') {
          ice.recordMistake('ICE: probe budget exhausted');
        }
        return;
      }
      const node = graph.nodes.find((n) => n.id === id)!;
      const nextProbes = probes - node.cost;
      const nextCap = new Set(captured);
      nextCap.add(id);
      setProbes(nextProbes);
      setCaptured(nextCap);
      if (node.honeypot) {
        ice.recordMistake('HONEYPOT · corp telemetry spike');
      } else {
        ice.rewardTrace(5);
      }
      if (node.isCore) {
        setDone(true);
        onWin();
        return;
      }
      // Нет хода к незахваченным соседям и CORE не взят — soft-lock check.
      const anyMove = graph.nodes.some((n) => canCaptureNode(graph, nextCap, n.id, nextProbes).ok);
      if (!anyMove && !nextCap.has(graph.coreId)) {
        setDone(true);
        onFail();
      }
    },
    [captured, done, graph, ice, onFail, onWin, probes]
  );

  return (
    <IceMiniShell variant="capture">
      <IcePressureHUD
        trace={ice.trace}
        alertLevel={ice.alertLevel}
        countermeasure={ice.countermeasure}
        flash={ice.flash}
        mistakes={ice.mistakes}
        maxMistakes={params.maxMistakes}
      />
      <IceMiniHint>
        Захватывай смежные узлы · дойди до CORE · honeypot жжёт TRACE
      </IceMiniHint>
      <div className="ice-mini__capture">
        <svg className="ice-mini__capture-edges" viewBox="0 0 100 100" aria-hidden>
          {graph.edges.map(([a, b]) => {
            const na = graph.nodes[a]!;
            const nb = graph.nodes[b]!;
            const hot = captured.has(a) && captured.has(b);
            return (
              <line
                key={`${a}-${b}`}
                x1={na.x}
                y1={na.y}
                x2={nb.x}
                y2={nb.y}
                className={hot ? 'ice-mini__capture-edge--hot' : 'ice-mini__capture-edge'}
              />
            );
          })}
        </svg>
        {graph.nodes.map((n) => {
          const owned = captured.has(n.id);
          const reachable = canCaptureNode(graph, captured, n.id, probes).ok;
          return (
            <button
              key={n.id}
              type="button"
              className={`ice-mini__capture-node ${owned ? 'ice-mini__capture-node--owned' : ''} ${reachable ? 'ice-mini__capture-node--reach' : ''} ${n.honeypot ? 'ice-mini__capture-node--honey' : ''} ${n.isCore ? 'ice-mini__capture-node--core' : ''} ${n.isEntry ? 'ice-mini__capture-node--entry' : ''}`}
              style={{ left: `${n.x}%`, top: `${n.y}%` }}
              disabled={done || ice.locked || owned || n.isEntry}
              onClick={() => tryCapture(n.id)}
            >
              <span className="ice-mini__capture-label">{n.label}</span>
              {!n.isEntry && <span className="ice-mini__capture-cost">{n.cost}p</span>}
            </button>
          );
        })}
      </div>
      <IceMiniFooter>
        Probes {probes} · captured {captured.size}/{graph.nodes.length}
      </IceMiniFooter>
    </IceMiniShell>
  );
};
