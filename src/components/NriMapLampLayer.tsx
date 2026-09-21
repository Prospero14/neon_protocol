import React from 'react';
import type { NriMapLamp } from '../logic/nriApi/map';

type Props = {
  lamps: NriMapLamp[];
  isHost: boolean;
  viewW: number;
  viewH: number;
  mode?: 'glow' | 'markers';
  selectedLampId?: string | null;
  onLampClick?: (lamp: NriMapLamp) => void;
};

/** Soft glows under plates + clickable markers above. */
export const NriMapLampLayer: React.FC<Props> = ({
  lamps,
  isHost,
  viewW,
  viewH,
  mode = 'glow',
  selectedLampId,
  onLampClick,
}) => {
  return (
    <g
      className={`nri-map-lamp-layer nri-map-lamp-layer--${mode}`}
      pointerEvents={mode === 'markers' && isHost ? 'auto' : 'none'}
    >
      {lamps.map((lamp) => {
        const vx = (lamp.x / 100) * viewW;
        const vy = (lamp.y / 100) * viewH;
        const r = (lamp.radius / 100) * Math.min(viewW, viewH) * 0.55;
        if (mode === 'glow') {
          if (!lamp.on) return null;
          return (
            <g key={`glow-${lamp.id}`}>
              <circle cx={vx} cy={vy} r={r} fill={lamp.color} opacity={0.45} />
              <circle cx={vx} cy={vy} r={r * 0.45} fill={lamp.color} opacity={0.35} />
            </g>
          );
        }
        const selected = lamp.id === selectedLampId;
        return (
          <g
            key={`mk-${lamp.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onLampClick?.(lamp);
            }}
            style={{ cursor: isHost ? 'pointer' : 'default' }}
          >
            <circle cx={vx} cy={vy} r={7} fill="transparent" />
            <circle
              cx={vx}
              cy={vy}
              r={selected ? 2.4 : 1.7}
              fill={lamp.on ? lamp.color : 'rgba(100,110,130,0.85)'}
              stroke={selected ? '#fff' : lamp.on ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)'}
              strokeWidth={selected ? 0.5 : 0.25}
            />
          </g>
        );
      })}
    </g>
  );
};
