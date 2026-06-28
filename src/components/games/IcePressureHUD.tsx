import React from 'react';
import { IceMiniMeter } from './IceMiniChrome';
import type { IceAlertLevel } from './useIcePressure';

type Props = {
  trace: number;
  alertLevel: IceAlertLevel;
  countermeasure: string | null;
  flash: boolean;
  mistakes?: number;
  maxMistakes?: number;
};

const ALERT_LABELS: Record<IceAlertLevel, string | null> = {
  0: null,
  1: 'ICE PROXIMITY · повышенный мониторинг',
  2: 'COUNTERMEASURE · система адаптируется',
  3: 'BLACK ICE · локализация netrunner',
};

export const IcePressureHUD: React.FC<Props> = ({
  trace,
  alertLevel,
  countermeasure,
  flash,
  mistakes,
  maxMistakes,
}) => (
  <div className={`ice-pressure ${flash ? 'ice-pressure--flash' : ''} ice-pressure--lvl-${alertLevel}`}>
    {alertLevel > 0 && (
      <div className="ice-pressure__alert mono-text" role="status" aria-live="polite">
        <span className="ice-pressure__alert-pulse" aria-hidden />
        {ALERT_LABELS[alertLevel]}
      </div>
    )}
    {countermeasure && (
      <p className="ice-pressure__cm mono-text">{countermeasure}</p>
    )}
    <IceMiniMeter label="ICE TRACE" value={trace} variant="trace" />
    {maxMistakes != null && mistakes != null && (
      <p className="mono-text ice-pressure__mistakes">
        Аномалий {mistakes}/{maxMistakes} · провал при TRACE 100%
      </p>
    )}
  </div>
);
