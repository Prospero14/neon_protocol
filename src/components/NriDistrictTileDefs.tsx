import React from 'react';
import { DISTRICT_STYLES, PLACE_TYPES } from '../../shared/nri-domain/districtGrid';

const TEXTURED = new Set(['road', 'bridge', 'crossing', 'alley', 'park', 'plaza', 'parking']);

const BUILDING_GRADIENTS: { id: string; top: string; bottom: string }[] = [
  { id: 'ndi-bld-house', top: '#1a3058', bottom: '#0c1628' },
  { id: 'ndi-bld-restaurant', top: '#5a1838', bottom: '#2a0c1c' },
  { id: 'ndi-bld-shop', top: '#123c5c', bottom: '#081c30' },
  { id: 'ndi-bld-secondhand', top: '#3a2850', bottom: '#1a1028' },
  { id: 'ndi-bld-metro', top: '#0c2848', bottom: '#061428' },
  { id: 'ndi-bld-generic', top: '#243040', bottom: '#121820' },
];

function patternBody(placeType: string, style: string): React.ReactNode {
  switch (placeType) {
    case 'road':
      return (
        <>
          <rect width="6" height="6" fill="rgba(18,22,30,0.5)" />
          <rect width="0.5" height="6" x="2.75" fill="rgba(220,190,70,0.22)" />
        </>
      );
    case 'crossing':
      return (
        <>
          <rect width="6" height="6" fill="rgba(28,32,42,0.4)" />
          <rect width="2" height="0.6" x="0" y="1" fill="rgba(240,240,200,0.2)" />
          <rect width="2" height="0.6" x="4" y="3.4" fill="rgba(240,240,200,0.2)" />
        </>
      );
    case 'bridge':
      return (
        <path
          d="M0 6 L6 0 M-1 1 L1 -1 M5 7 L7 5"
          stroke="rgba(140,190,240,0.25)"
          strokeWidth="0.35"
          fill="none"
        />
      );
    case 'alley':
      return (
        <>
          <rect width="6" height="6" fill="rgba(6,8,14,0.35)" />
          <rect width="0.8" height="6" x="0.2" fill="rgba(40,40,55,0.35)" />
          <rect width="0.8" height="6" x="5" fill="rgba(40,40,55,0.35)" />
        </>
      );
    case 'park':
      return (
        <>
          <circle cx="1.5" cy="2" r="0.9" fill="rgba(60,180,100,0.18)" />
          <circle cx="4.2" cy="4" r="0.7" fill="rgba(50,150,90,0.14)" />
        </>
      );
    case 'plaza':
      return <rect width="1.2" height="1.2" x="2.4" y="2.4" fill="rgba(200,210,230,0.12)" />;
    case 'parking':
      return (
        <>
          <rect width="5" height="0.4" x="0.5" y="2.8" fill="rgba(180,190,210,0.15)" />
          <rect width="0.4" height="5" x="2.8" y="0.5" fill="rgba(180,190,210,0.12)" />
        </>
      );
    case 'metro':
      return (
        <>
          <rect width="6" height="1" y="4.5" fill="rgba(0,255,200,0.12)" />
          <circle cx="3" cy="3" r="0.6" fill="rgba(0,200,255,0.1)" />
        </>
      );
    case 'generic':
    default:
      if (style === 'slum') {
        return (
          <>
            <circle cx="1" cy="2" r="0.5" fill="rgba(200,80,60,0.12)" />
            <circle cx="4.5" cy="4" r="0.4" fill="rgba(160,50,40,0.1)" />
          </>
        );
      }
      if (style === 'chinatown') {
        return <rect width="0.5" height="4" x="2.75" y="1" fill="rgba(255,90,60,0.18)" />;
      }
      if (style === 'industrial') {
        return <path d="M0 6 L6 0" stroke="rgba(200,140,50,0.16)" strokeWidth="0.35" />;
      }
      return <rect width="1" height="1" x="2.5" y="2.5" fill="rgba(100,130,180,0.1)" />;
  }
}

/** SVG-паттерны клеток квартала: один defs на (placeType, districtStyle), не на клетку. */
export const NriDistrictTileDefs: React.FC = () => (
  <defs>
    {BUILDING_GRADIENTS.map((g) => (
      <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={g.top} />
        <stop offset="100%" stopColor={g.bottom} />
      </linearGradient>
    ))}
    {PLACE_TYPES.filter((pt) => TEXTURED.has(pt)).flatMap((placeType) =>
      DISTRICT_STYLES.map((style) => (
        <pattern
          key={`${placeType}-${style}`}
          id={`ndi-${placeType}-${style}`}
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
        >
          {patternBody(placeType, style)}
        </pattern>
      ))
    )}
  </defs>
);
