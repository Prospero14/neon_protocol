import React from 'react';
import { computeSkylineBlocks } from '../logic/nriCityMapVisual';
import type { NeonCityDistrictType } from '../logic/nriNeonCityMap';

type Props = {
  zoneKey: string;
  zoneType: NeonCityDistrictType;
  x: number;
  y: number;
  w: number;
  h: number;
};

export const NriCityMapSkyline: React.FC<Props> = ({ zoneKey, zoneType, x, y, w, h }) => {
  const blocks = computeSkylineBlocks(zoneKey, zoneType, x, y, w, h);
  if (!blocks.length) return null;
  return (
    <g className="nri-city-map__skyline" aria-hidden>
      {blocks.map((b, i) => (
        <g key={`${zoneKey}-b${i}`}>
          <rect
            x={b.x}
            y={b.y}
            width={b.w}
            height={b.h}
            className={`nri-city-map__skyline-block nri-city-map__skyline-block--${zoneType} nri-city-map__skyline-block--t${b.tier}`}
            rx={0.15}
          />
          {b.tier >= 1 && b.h > 1.2 && (
            <rect
              x={b.x + b.w * 0.22}
              y={b.y + b.h * 0.18}
              width={Math.max(0.15, b.w * 0.18)}
              height={Math.max(0.12, b.h * 0.12)}
              className={`nri-city-map__skyline-window nri-city-map__skyline-window--${zoneType}`}
              rx={0.05}
            />
          )}
          {b.tier >= 2 && b.h > 2 && (
            <rect
              x={b.x + b.w * 0.58}
              y={b.y + b.h * 0.35}
              width={Math.max(0.12, b.w * 0.14)}
              height={Math.max(0.1, b.h * 0.1)}
              className={`nri-city-map__skyline-window nri-city-map__skyline-window--bright nri-city-map__skyline-window--${zoneType}`}
              rx={0.04}
            />
          )}
        </g>
      ))}
    </g>
  );
};
