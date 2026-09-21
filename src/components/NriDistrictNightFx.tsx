/** Ночная атмосфера клетки — отключена (было слишком ярко). Хелперы оставлены для палитры/анимаций тайлов. */

import type { CSSProperties } from 'react';

type Span = { x: number; y: number; w: number; h: number };

export function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function unit(seed: number, salt: number): number {
  const x = Math.sin(seed * 0.001 + salt * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/** Разный период и фаза мигания — огни не синхронизируются. */
export function blinkStyle(
  seed: number,
  salt: number,
  baseSec: number,
  spreadSec: number
): CSSProperties {
  const dur = baseSec + unit(seed, salt) * spreadSec;
  const delay = unit(seed, salt + 19) * (baseSec + spreadSec);
  return {
    animationDuration: `${dur.toFixed(2)}s`,
    animationDelay: `${(-delay).toFixed(2)}s`,
  };
}

type Props = {
  z: Span;
  zoneKey: string;
  roadish?: boolean;
};

/** Overlay отключён — оставляем пустой слой, чтобы не ломать импорты. */
export function NriDistrictNightFx(_props: Props) {
  return null;
}
