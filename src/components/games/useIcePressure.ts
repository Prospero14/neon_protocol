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
 * CP2077-style: pause during plan/flash so skill (not RNG timer) decides.
 * Hard ≈ ~45–55s of active play before lockdown if no mistakes.
 */
export function useIcePressure(params: IceGameParams, onFail: () => void) {
  const [trace, setTrace] = useState(() => (params.traceSpeed > 1.2 ? 8 : 4));
  const [alertLevel, setAlertLevel] = useState<IceAlertLevel>(0);
  const [countermeasure, setCountermeasure] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [paused, setPaused] = useState(false);
  const bustedRef = useRef(false);
  const pausedRef = useRef(false);

  const failOnce = useCallback(() => {
    if (bustedRef.current) return;
    bustedRef.current = true;
    setAlertLevel(3);
    setCountermeasure('ICE LOCKDOWN · NETRUNNER BUSTED');
    setFlash(true);
    window.setTimeout(onFail, 520);
  }, [onFail]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const iv = window.setInterval(() => {
      if (pausedRef.current) return;
      setTrace((t) => {
        // Soft ramp: pressure rises late so early mistakes are recoverable.
        const ramp = t >= 80 ? 1.25 : t >= 55 ? 1.08 : 0.78;
        const next = Math.min(100, t + params.traceSpeed * ramp * 0.32);
        if (next >= 100) failOnce();
        return next;
      });
    }, 280);
    return () => window.clearInterval(iv);
  }, [params.traceSpeed, failOnce]);

  useEffect(() => {
    const lvl: IceAlertLevel =
      trace >= 88 ? 3 : trace >= 68 ? 2 : trace >= 42 ? 1 : 0;
    setAlertLevel(lvl);
  }, [trace]);

  const spikeTrace = useCallback(
    (amount: number, msg?: string) => {
      setFlash(true);
      window.setTimeout(() => setFlash(false), 380);
      setCountermeasure(msg ?? COUNTERMEASURES[Math.floor(Math.random() * COUNTERMEASURES.length)]);
      setTrace((t) => {
        const next = Math.min(100, t + amount);
        if (next >= 100) failOnce();
        return next;
      });
    },
    [failOnce]
  );

  const recordMistake = useCallback(
    (msg?: string) => {
      setMistakes((m) => {
        const next = m + 1;
        if (params.maxMistakes > 0 && next > params.maxMistakes) {
          failOnce();
        }
        return next;
      });
      // Hard stil hurts, but 2–3 mistakes are recoverable before TRACE lock.
      const base = params.traceSpeed > 1.3 ? 14 : params.traceSpeed < 0.85 ? 7 : 10;
      const surge = trace >= 60 ? base * 1.15 : base;
      spikeTrace(Math.round(surge), msg);
    },
    [spikeTrace, params.traceSpeed, params.maxMistakes, trace, failOnce]
  );

  const rewardTrace = useCallback((amount: number) => {
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
    setPaused,
    recordMistake,
    rewardTrace,
    spikeTrace,
  };
}
