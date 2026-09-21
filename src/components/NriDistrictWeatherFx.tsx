/** Слой погоды поверх квартала: облака + дождь. Включается мастером. */

import type { ReactNode } from 'react';

type Props = {
  x: number;
  y: number;
  w: number;
  h: number;
};

function unit(i: number, salt: number): number {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function NriDistrictWeatherFx({ x, y, w, h }: Props) {
  const clouds: ReactNode[] = [];
  for (let i = 0; i < 5; i++) {
    const cx = x + w * (0.08 + unit(i, 1) * 0.84);
    const cy = y + h * (0.06 + unit(i, 2) * 0.28);
    const rw = w * (0.14 + unit(i, 3) * 0.18);
    const rh = h * (0.045 + unit(i, 4) * 0.05);
    const dur = 18 + unit(i, 5) * 22;
    const delay = -unit(i, 6) * dur;
    clouds.push(
      <g
        key={`cloud-${i}`}
        className="nri-district-weather__cloud"
        style={{ animationDuration: `${dur.toFixed(1)}s`, animationDelay: `${delay.toFixed(1)}s` }}
      >
        <ellipse cx={cx} cy={cy} rx={rw} ry={rh} fill="rgba(90, 110, 140, 0.22)" />
        <ellipse cx={cx - rw * 0.35} cy={cy + rh * 0.15} rx={rw * 0.55} ry={rh * 0.75} fill="rgba(70, 90, 120, 0.18)" />
        <ellipse cx={cx + rw * 0.4} cy={cy + rh * 0.1} rx={rw * 0.5} ry={rh * 0.7} fill="rgba(100, 120, 150, 0.16)" />
      </g>
    );
  }

  const drops: ReactNode[] = [];
  const rainCount = 36;
  for (let i = 0; i < rainCount; i++) {
    const rx = x + w * unit(i, 10);
    const ry = y + h * unit(i, 11) * 0.85;
    const len = Math.min(w, h) * (0.045 + unit(i, 12) * 0.07);
    const dur = 0.55 + unit(i, 13) * 0.9;
    const delay = -unit(i, 14) * dur;
    drops.push(
      <line
        key={`rain-${i}`}
        x1={rx}
        y1={ry}
        x2={rx + len * 0.18}
        y2={ry + len}
        className="nri-district-weather__rain"
        style={{ animationDuration: `${dur.toFixed(2)}s`, animationDelay: `${delay.toFixed(2)}s` }}
      />
    );
  }

  return (
    <g className="nri-district-weather" pointerEvents="none" aria-hidden>
      <rect x={x} y={y} width={w} height={h} className="nri-district-weather__veil" />
      {clouds}
      {drops}
    </g>
  );
}
