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

export function useIcePressure(params: IceGameParams, onFail: () => void) {
  const [trace, setTrace] = useState(() => (params.traceSpeed > 1.4 ? 12 : 6));
  const [alertLevel, setAlertLevel] = useState<IceAlertLevel>(0);
  const [countermeasure, setCountermeasure] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const bustedRef = useRef(false);

  const failOnce = useCallback(() => {
    if (bustedRef.current) return;
    bustedRef.current = true;
    setAlertLevel(3);
    setCountermeasure('ICE LOCKDOWN · NETRUNNER BUSTED');
    setFlash(true);
    window.setTimeout(onFail, 520);
  }, [onFail]);

  useEffect(() => {
    const iv = window.setInterval(() => {
      setTrace((t) => {
        const drain = params.traceSpeed * (t >= 70 ? 1.35 : t >= 45 ? 1.1 : 0.85);
        const next = Math.min(100, t + drain * 0.55);
        if (next >= 100) failOnce();
        return next;
      });
    }, 260);
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
      setMistakes((m) => m + 1);
      const base = params.traceSpeed > 1.5 ? 22 : params.traceSpeed < 0.9 ? 9 : 14;
      const surge = trace >= 55 ? base * 1.25 : base;
      spikeTrace(Math.round(surge), msg);
    },
    [spikeTrace, params.traceSpeed, trace]
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
    recordMistake,
    rewardTrace,
    spikeTrace,
  };
}
