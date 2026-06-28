import React from 'react';
import { zoneDecorVariant } from '../logic/nriCityMapVisual';
import type { NeonCityDistrictType } from '../logic/nriNeonCityMap';

type Props = {
  zoneKey: string;
  zoneType: NeonCityDistrictType;
  x: number;
  y: number;
  w: number;
  h: number;
};

export const NriCityMapZoneDecor: React.FC<Props> = ({ zoneKey, zoneType, x, y, w, h }) => {
  if (w < 4 || h < 3) return null;
  const v = zoneDecorVariant(zoneKey);

  if (zoneType === 'highway' && w >= h * 1.2) {
    return (
      <>
        <line
          x1={x + w * 0.08}
          y1={y + h / 2}
          x2={x + w * 0.92}
          y2={y + h / 2}
          className="nri-city-map__hw-lane"
        />
        {h > 2.5 && (
          <line
            x1={x + w * 0.08}
            y1={y + h * 0.32}
            x2={x + w * 0.92}
            y2={y + h * 0.32}
            className="nri-city-map__hw-lane nri-city-map__hw-lane--dim"
          />
        )}
      </>
    );
  }

  if (zoneType === 'corp' && h > 5) {
    const cols = [0.22, 0.5, 0.78].slice(0, v + 1);
    return (
      <>
        {cols.map((frac) => (
          <line
            key={frac}
            x1={x + w * frac}
            y1={y + h * 0.12}
            x2={x + w * frac}
            y2={y + h * 0.88}
            className="nri-city-map__corp-pillar"
          />
        ))}
      </>
    );
  }

  if (zoneType === 'industrial' && h > 4) {
    const slots = v + 1;
    return (
      <>
        {Array.from({ length: slots }, (_, i) => {
          const bw = Math.max(1.2, w * 0.14);
          const bh = h * (0.35 + (i % 2) * 0.12);
          const bx = x + w * (0.12 + i * (0.7 / Math.max(1, slots - 1)));
          return (
            <rect
              key={i}
              x={bx}
              y={y + h - bh - 0.4}
              width={bw}
              height={bh}
              className="nri-city-map__ind-silo"
              rx={0.2}
            />
          );
        })}
      </>
    );
  }

  if (zoneType === 'mid' && w > 6 && h > 5) {
    const rows = 2;
    const cols = 3;
    const cellW = (w * 0.7) / cols;
    const cellH = (h * 0.5) / rows;
    const windows: React.ReactNode[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if ((r + c + v) % 2 === 0) continue;
        windows.push(
          <rect
            key={`${r}-${c}`}
            x={x + w * 0.15 + c * cellW}
            y={y + h * 0.22 + r * cellH}
            width={cellW * 0.55}
            height={cellH * 0.45}
            className="nri-city-map__mid-window"
            rx={0.15}
          />
        );
      }
    }
    return <>{windows}</>;
  }

  if (zoneType === 'park' && w > 5 && h > 4) {
    const dots = [
      [0.25, 0.35],
      [0.55, 0.55],
      [0.75, 0.3],
    ].slice(0, v + 2);
    return (
      <>
        {dots.map(([fx, fy]) => (
          <circle
            key={`${fx}-${fy}`}
            cx={x + w * fx}
            cy={y + h * fy}
            r={Math.min(w, h) * 0.09}
            className="nri-city-map__park-tree"
          />
        ))}
      </>
    );
  }

  if (zoneType === 'slum' && w > 5 && h > 5) {
    return (
      <>
        <rect
          x={x + w * 0.1}
          y={y + h * 0.55}
          width={w * 0.35}
          height={h * 0.28}
          className="nri-city-map__slum-block"
          rx={0.2}
        />
        {v > 0 && (
          <rect
            x={x + w * 0.52}
            y={y + h * 0.48}
            width={w * 0.32}
            height={h * 0.32}
            className="nri-city-map__slum-block nri-city-map__slum-block--alt"
            rx={0.2}
          />
        )}
      </>
    );
  }

  if (zoneType === 'overpass' && w > 4 && h > 3) {
    return (
      <rect
        x={x + w * 0.05}
        y={y + h * 0.62}
        width={w * 0.9}
        height={h * 0.28}
        className="nri-city-map__overpass-shadow"
        rx={0.15}
      />
    );
  }

  return null;
};
