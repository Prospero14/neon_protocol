import React from 'react';
import {
  computeDistrictPeaks,
  districtNeonStroke,
  districtPlateFill,
  overviewLabelLines,
} from '../../shared/nri-domain/cityMapOverview';
import type { NeonCityDistrictType } from '../logic/nriNeonCityMap';

type Props = {
  zoneKey: string;
  zoneType: NeonCityDistrictType;
  name: string;
  corpName?: string | null;
  x: number;
  y: number;
  w: number;
  h: number;
  isFocused: boolean;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: (e: React.MouseEvent) => void;
};

/** Обзорный блок района на карте города — «плита + силуэт + имя». */
export const NriCityOverviewZone: React.FC<Props> = ({
  zoneKey,
  zoneType,
  name,
  corpName,
  x,
  y,
  w,
  h,
  isFocused,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  onClick,
}) => {
  const isRoad = zoneType === 'highway' || zoneType === 'overpass';
  const peaks = computeDistrictPeaks(zoneKey, zoneType, x, y, w, h);
  const stroke = districtNeonStroke(zoneType);
  const active = isFocused || isHovered;
  const labelLines = overviewLabelLines(name, zoneType, corpName);
  const isTile = zoneType === 'corp' || w <= 17 || h <= 17;
  const fontSize = Math.max(1.35, Math.min(2.55, w * 0.19, h * 0.17));
  const lineStep = fontSize * 1.12;
  const labelPadTop = isTile ? 1.2 : Math.max(2.4, h * 0.14);
  const labelY = y + labelPadTop;

  return (
    <g
      data-zone-key={zoneKey}
      className={`nri-city-overview-zone${active ? ' nri-city-overview-zone--active' : ''}${isFocused ? ' nri-city-overview-zone--focused' : ''}${isTile ? ' nri-city-overview-zone--tile' : ''}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={isRoad ? 0.25 : isTile ? 0.15 : 0.55}
        className={`nri-city-overview-zone__plate nri-city-overview-zone__plate--${zoneType}`}
        fill={districtPlateFill(zoneType)}
        stroke={stroke}
        strokeWidth={active ? 0.28 : isTile ? 0.06 : 0.16}
        filter={active ? 'url(#nc-glow)' : undefined}
      />
      {isRoad && (
        <line
          x1={x + w * 0.06}
          y1={y + h / 2}
          x2={x + w * 0.94}
          y2={y + h / 2}
          className="nri-city-map__hw-center"
          pointerEvents="none"
        />
      )}
      {!isRoad &&
        peaks.map((p, i) => (
          <rect
            key={`${zoneKey}-p${i}`}
            x={p.x}
            y={p.y}
            width={p.w}
            height={p.h}
            className={`nri-city-overview-zone__peak nri-city-overview-zone__peak--${zoneType}`}
            rx={0.12}
            pointerEvents="none"
          />
        ))}
      {!isRoad && w >= 4 && h >= 3 && (
        <text
          x={x + w / 2}
          y={labelY}
          textAnchor="middle"
          dominantBaseline="hanging"
          className={`nri-city-overview-zone__label-text nri-city-overview-zone__label-text--${zoneType}`}
          fontSize={fontSize}
          pointerEvents="none"
        >
          {labelLines.map((line, i) => (
            <tspan key={`${line}-${i}`} x={x + w / 2} dy={i === 0 ? 0 : lineStep}>
              {line}
            </tspan>
          ))}
        </text>
      )}
    </g>
  );
};
