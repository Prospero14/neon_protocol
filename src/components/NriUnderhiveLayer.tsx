import React from 'react';
import type { NriMapLamp, NriMetroEdgeDto, NriMetroLineDto, NriMetroStationDto, NriUnderhivePayload } from '../logic/nriApi/map';
import { parseMetroStationId } from '../../shared/nri-domain/metroGraph';

type Props = {
  data: NriUnderhivePayload | null;
  lamps: NriMapLamp[];
  isHost: boolean;
  selectedStationId: string | null;
  selectedLampId?: string | null;
  myZoneKey: string | null;
  onSelectStation: (id: string) => void;
  onLampClick?: (lamp: NriMapLamp) => void;
};

function pctToView(x: number, y: number): { vx: number; vy: number } {
  return { vx: (x / 100) * 240, vy: (y / 100) * 165 };
}

/** Подулей: силуэты районов + корп-подземелья + метро + фонари. */
export const NriUnderhiveLayer: React.FC<Props> = ({
  data,
  lamps,
  isHost,
  selectedStationId,
  selectedLampId,
  myZoneKey,
  onSelectStation,
  onLampClick,
}) => {
  const frames = data?.districtFrames ?? [];
  const corps = data?.corpUndergrounds ?? [];
  const lines = data?.metro.lines ?? [];
  const stations = data?.metro.stations ?? [];
  const edges = data?.metro.edges ?? [];
  const lineById = new Map(lines.map((l) => [l.id, l]));
  const stationById = new Map(stations.map((s) => [s.id, s]));
  const myStationId = parseMetroStationId(myZoneKey);

  return (
    <g className="nri-city-map__underhive-world">
      <rect x={0} y={0} width={240} height={165} fill="rgba(6, 8, 14, 0.95)" />
      {lamps.map((lamp) => {
        const { vx, vy } = pctToView(lamp.x, lamp.y);
        const r = (lamp.radius / 100) * 40;
        const selected = lamp.id === selectedLampId;
        return (
          <g
            key={lamp.id}
            className="nri-map-lamp"
            onClick={(e) => {
              e.stopPropagation();
              onLampClick?.(lamp);
            }}
            style={{ cursor: isHost ? 'pointer' : 'default' }}
          >
            {lamp.on && (
              <circle cx={vx} cy={vy} r={r} fill={lamp.color} opacity={0.28} pointerEvents="none" />
            )}
            <circle cx={vx} cy={vy} r={4} fill="transparent" />
            <circle
              cx={vx}
              cy={vy}
              r={selected ? 1.6 : 1.1}
              fill={lamp.on ? lamp.color : 'rgba(120,130,150,0.7)'}
              stroke={selected ? '#fff' : 'rgba(0,0,0,0.5)'}
              strokeWidth={selected ? 0.35 : 0.2}
            />
          </g>
        );
      })}

      {frames.map((f) => (
        <g key={`uh-f-${f.zoneKey}`}>
          <rect
            x={f.x}
            y={f.y}
            width={f.w}
            height={f.h}
            rx={0.5}
            fill="rgba(18, 28, 42, 0.55)"
            stroke="rgba(90, 140, 180, 0.45)"
            strokeWidth={0.35}
          />
          <text
            x={f.x + f.w / 2}
            y={f.y + Math.min(4, f.h * 0.2)}
            textAnchor="middle"
            dominantBaseline="hanging"
            className="nri-city-overview-zone__label-text"
            fontSize={Math.max(1.6, Math.min(2.8, f.w * 0.08))}
            pointerEvents="none"
          >
            {f.name}
          </text>
        </g>
      ))}

      {corps.map((c) => (
        <g key={`uh-c-${c.sourceZoneKey}`}>
          <rect
            x={c.x}
            y={c.y}
            width={c.w}
            height={c.h}
            rx={0.25}
            fill={c.theme.primary}
            fillOpacity={0.85}
            stroke={c.theme.accent}
            strokeWidth={0.4}
          />
          <rect
            x={c.x + c.w * 0.08}
            y={c.y + c.h * 0.55}
            width={c.w * 0.84}
            height={c.h * 0.28}
            fill={c.theme.accent}
            opacity={0.35}
            pointerEvents="none"
          />
          <text
            x={c.x + c.w / 2}
            y={c.y + 1.2}
            textAnchor="middle"
            dominantBaseline="hanging"
            fill={c.theme.glow}
            fontSize={Math.max(1.4, Math.min(2.6, c.w * 0.2))}
            fontFamily="var(--font-mono, monospace)"
            fontWeight={700}
            pointerEvents="none"
          >
            {c.theme.abbrev}
          </text>
          <title>{c.name}</title>
        </g>
      ))}

      {edges.map((e) => {
        const a = stationById.get(e.fromStationId);
        const b = stationById.get(e.toStationId);
        const line = lineById.get(e.lineId);
        if (!a || !b) return null;
        return (
          <line
            key={e.id}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke={line?.color ?? '#4de8ff'}
            strokeWidth={1.2}
            strokeOpacity={0.85}
            strokeLinecap="round"
            pointerEvents="none"
          />
        );
      })}

      {stations.map((s) => {
        const line = lineById.get(s.lineId);
        const selected = s.id === selectedStationId;
        const here = s.id === myStationId;
        return (
          <g
            key={s.id}
            className="nri-metro-station"
            onClick={(e) => {
              e.stopPropagation();
              onSelectStation(s.id);
            }}
            style={{ cursor: 'pointer' }}
          >
            <circle
              cx={s.x}
              cy={s.y}
              r={selected || here ? 2.4 : 1.8}
              fill={here ? '#fff' : line?.color ?? '#4de8ff'}
              stroke={selected ? '#fff' : 'rgba(0,0,0,0.6)'}
              strokeWidth={0.35}
            />
            <text
              x={s.x}
              y={s.y - 2.8}
              textAnchor="middle"
              fill="rgba(220,240,255,0.95)"
              fontSize={2}
              fontFamily="var(--font-mono, monospace)"
              pointerEvents="none"
            >
              {s.name}
            </text>
          </g>
        );
      })}

      <text
        x={120}
        y={8}
        textAnchor="middle"
        fill="rgba(160, 200, 255, 0.55)"
        fontSize={3.5}
        fontFamily="var(--font-mono, monospace)"
        letterSpacing="0.2em"
        pointerEvents="none"
      >
        UNDERHIVE
      </text>
    </g>
  );
};

export type { NriMetroLineDto, NriMetroStationDto, NriMetroEdgeDto };
