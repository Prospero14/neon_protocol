import { useCallback, useEffect, useRef, useState } from 'react';
import type { IceGameParams } from '../../logic/nriGameCatalog';

const COUNTERMEASURES = [
  'ICE: аномальный паттерн трафика',
  'SIEM: корреляция событий · triangulation',
  'COUNTERMEASURE: honeypot активирован',
  'NETSEC: proxy ping · 34% lock',
  'BLACK ICE: session flagged',
  'AUDIT: corp trace relay engaged',
  'FIREWALL: adaptive rule deployed',
  'IDS: signature match · escalating',
] as const;

export type IceAlertLevel = 0 | 1 | 2 | 3;

/**
 * TRACE pressure: fair-hard curve.
 * Defeat always settles once (TRACE 100% or maxMistakes) — never call onFail from inside setState.
 * Hard ≈ ~28–38s active play before lockdown if no mistakes.
 */
export function useIcePressure(params: IceGameParams, onFail: () => void) {
  const [trace, setTrace] = useState(() => (params.traceSpeed > 1.2 ? 10 : 5));
  const [alertLevel, setAlertLevel] = useState<IceAlertLevel>(0);
  const [countermeasure, setCountermeasure] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [paused, setPaused] = useState(false);
  const [locked, setLocked] = useState(false);
  const bustedRef = useRef(false);
  const pausedRef = useRef(false);
  const onFailRef = useRef(onFail);
  onFailRef.current = onFail;

  const failOnce = useCallback(() => {
    if (bustedRef.current) return;
    bustedRef.current = true;
    setLocked(true);
    setPaused(true);
    setAlertLevel(3);
    setCountermeasure('ICE LOCKDOWN · NETRUNNER BUSTED');
    setFlash(true);
    window.setTimeout(() => onFailRef.current(), 480);
  }, []);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const iv = window.setInterval(() => {
      if (pausedRef.current || bustedRef.current) return;
      setTrace((t) => {
        const ramp = t >= 78 ? 1.4 : t >= 52 ? 1.12 : 0.92;
        const next = Math.min(100, t + params.traceSpeed * ramp * 0.58);
        if (next >= 100) {
          queueMicrotask(() => failOnce());
        }
        return next;
      });
    }, 260);
    return () => window.clearInterval(iv);
  }, [params.traceSpeed, failOnce]);

  useEffect(() => {
    if (bustedRef.current) return;
    const lvl: IceAlertLevel =
      trace >= 88 ? 3 : trace >= 68 ? 2 : trace >= 42 ? 1 : 0;
    setAlertLevel(lvl);
  }, [trace]);

  const spikeTrace = useCallback(
    (amount: number, msg?: string) => {
      if (bustedRef.current) return;
      setFlash(true);
      window.setTimeout(() => setFlash(false), 380);
      setCountermeasure(msg ?? COUNTERMEASURES[Math.floor(Math.random() * COUNTERMEASURES.length)]);
      setTrace((t) => {
        const next = Math.min(100, t + amount);
        if (next >= 100) {
          queueMicrotask(() => failOnce());
        }
        return next;
      });
    },
    [failOnce]
  );

  const recordMistake = useCallback(
    (msg?: string) => {
      if (bustedRef.current) return;
      setMistakes((m) => {
        const next = m + 1;
        if (params.maxMistakes > 0 && next > params.maxMistakes) {
          queueMicrotask(() => failOnce());
        }
        return next;
      });
      const base = params.traceSpeed > 1.3 ? 16 : params.traceSpeed < 0.85 ? 9 : 12;
      const surge = trace >= 55 ? base * 1.2 : base;
      spikeTrace(Math.round(surge), msg);
    },
    [spikeTrace, params.traceSpeed, params.maxMistakes, trace, failOnce]
  );

  const rewardTrace = useCallback((amount: number) => {
    if (bustedRef.current) return;
    setTrace((t) => Math.max(0, t - amount));
    setCountermeasure(null);
  }, []);

  return {
    trace,
    alertLevel,
    countermeasure,
    flash,
    mistakes,
    paused,
    locked,
    setPaused,
    recordMistake,
    rewardTrace,
    spikeTrace,
  };
}
