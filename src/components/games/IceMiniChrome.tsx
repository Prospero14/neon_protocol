import React from 'react';

type ShellProps = {
  children: React.ReactNode;
  /** Модификатор визуальной темы: scan | tap | mesh | log | dodge … */
  variant?: string;
  className?: string;
};

/** CRT-оболочка мини-игры: сетка, scanlines, угловые скобки. */
export const IceMiniShell: React.FC<ShellProps> = ({ children, variant, className = '' }) => (
  <div className={`ice-mini ${variant ? `ice-mini--${variant}` : ''} ${className}`.trim()}>
    <div className="ice-mini__crt" aria-hidden>
      <div className="ice-mini__scanlines" />
      <div className="ice-mini__hexgrid" />
      <span className="ice-mini__corner ice-mini__corner--tl" />
      <span className="ice-mini__corner ice-mini__corner--tr" />
      <span className="ice-mini__corner ice-mini__corner--bl" />
      <span className="ice-mini__corner ice-mini__corner--br" />
    </div>
    <div className="ice-mini__content">{children}</div>
  </div>
);

type HintProps = { children: React.ReactNode; pulse?: boolean };

/** Подсказка в стиле dev-console prompt. */
export const IceMiniHint: React.FC<HintProps> = ({ children, pulse }) => (
  <p className={`mono-text ice-mini__hint ${pulse ? 'ice-mini__hint--pulse' : ''}`}>
    <span className="ice-mini__prompt">&gt;_</span>
    {children}
  </p>
);

type MeterProps = {
  label: string;
  value: number;
  max?: number;
  variant?: 'trace' | 'exfil' | 'neutral';
  showPct?: boolean;
};

/** Анимированный системный meter (TRACE / EXFIL). */
export const IceMiniMeter: React.FC<MeterProps> = ({
  label,
  value,
  max = 100,
  variant = 'neutral',
  showPct = true,
}) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const danger = variant === 'trace' && pct >= 70;
  return (
    <div className={`ice-mini__meter ice-mini__meter--${variant} ${danger ? 'ice-mini__meter--danger' : ''}`}>
      <div className="ice-mini__meter-head">
        <span className="ice-mini__meter-label">{label}</span>
        {showPct && <span className="ice-mini__meter-pct mono-text">{Math.round(pct)}%</span>}
      </div>
      <div className="ice-mini__meter-track">
        <div className="ice-mini__meter-fill" style={{ width: `${pct}%` }} />
        <div className="ice-mini__meter-segments" aria-hidden />
        <div className="ice-mini__meter-glow" style={{ width: `${pct}%` }} aria-hidden />
      </div>
    </div>
  );
};

type FooterProps = { children: React.ReactNode };

export const IceMiniFooter: React.FC<FooterProps> = ({ children }) => (
  <p className="mono-text ice-mini__footer">{children}</p>
);

type TagProps = { children: React.ReactNode; tone?: 'ok' | 'warn' | 'err' | 'ice' };

/** Системный badge (OPEN / CVE / SCAN …). */
export const IceMiniTag: React.FC<TagProps> = ({ children, tone = 'ice' }) => (
  <span className={`ice-mini__tag ice-mini__tag--${tone}`}>{children}</span>
);

type FlashProps = { children: React.ReactNode; active?: boolean };

/** Центральный дисплей для flash-фаз (порты, узлы). */
export const IceMiniFlashDisplay: React.FC<FlashProps> = ({ children, active }) => (
  <div className={`ice-mini__flash ${active ? 'ice-mini__flash--active' : ''}`}>
    <span className="ice-mini__flash-ring" aria-hidden />
    {children}
  </div>
);
