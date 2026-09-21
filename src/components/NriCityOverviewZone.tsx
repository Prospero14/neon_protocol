import React from 'react';
import {
  computeDistrictPeaks,
  districtNeonStroke,
  districtPlateFill,
  overviewLabelFontSize,
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
  onDoubleClick?: (e: React.MouseEvent) => void;
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
  onDoubleClick,
}) => {
  const isRoad = zoneType === 'highway' || zoneType === 'overpass';
  const peaks = computeDistrictPeaks(zoneKey, zoneType, x, y, w, h);
  const stroke = districtNeonStroke(zoneType);
  const active = isFocused || isHovered;
  const labelLines = overviewLabelLines(name, zoneType, corpName);
  const isTile = zoneType === 'corp' || w <= 17 || h <= 17;
  const fontSize = overviewLabelFontSize(w, h, labelLines, zoneType);
  const lineStep = fontSize * 1.14;
  const labelPadTop = isTile ? 1.1 : Math.max(2.2, h * 0.12);
  const labelY = y + labelPadTop;
  const strokeW = active ? (isFocused ? 0.55 : 0.42) : isTile ? 0.22 : 0.32;
  const clipId = `nc-clip-${zoneKey.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

  return (
    <g
      data-zone-key={zoneKey}
      className={`nri-city-overview-zone${active ? ' nri-city-overview-zone--active' : ''}${isFocused ? ' nri-city-overview-zone--focused' : ''}${isTile ? ' nri-city-overview-zone--tile' : ''}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      <defs>
        <clipPath id={clipId}>
          <rect x={x} y={y} width={w} height={h} rx={isRoad ? 0.25 : isTile ? 0.2 : 0.55} />
        </clipPath>
      </defs>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={isRoad ? 0.25 : isTile ? 0.2 : 0.55}
        className={`nri-city-overview-zone__plate nri-city-overview-zone__plate--${zoneType}`}
        fill={districtPlateFill(zoneType)}
        stroke={stroke}
        strokeWidth={strokeW}
        filter={active ? 'url(#nc-glow)' : undefined}
      />
      {/* Внутренний контур — читаемые границы */}
      {!isRoad && (
        <rect
          x={x + 0.35}
          y={y + 0.35}
          width={Math.max(0.5, w - 0.7)}
          height={Math.max(0.5, h - 0.7)}
          rx={isTile ? 0.12 : 0.4}
          fill="none"
          stroke="rgba(255,255,255,0.14)"
          strokeWidth={0.18}
          pointerEvents="none"
        />
      )}
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
      <g clipPath={`url(#${clipId})`} pointerEvents="none">
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
              stroke="rgba(0,0,0,0.35)"
              strokeWidth={0.08}
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
          >
            {labelLines.map((line, i) => (
              <tspan key={`${line}-${i}`} x={x + w / 2} dy={i === 0 ? 0 : lineStep}>
                {line}
              </tspan>
            ))}
          </text>
        )}
      </g>
    </g>
  );
};
