import React from 'react';
import { DISTRICT_STYLES, PLACE_TYPES } from '../../shared/nri-domain/districtGrid';

const TEXTURED = new Set(['road', 'bridge', 'crossing', 'park', 'pond', 'plaza', 'parking', 'dump']);

const BUILDING_GRADIENTS: { id: string; top: string; bottom: string }[] = [
  { id: 'ndi-bld-house', top: '#0e1828', bottom: '#060a12' },
  { id: 'ndi-bld-shack', top: '#141c28', bottom: '#080c14' },
  { id: 'ndi-bld-restaurant', top: '#2a0c1c', bottom: '#10060e' },
  { id: 'ndi-bld-shop', top: '#0a2030', bottom: '#040e18' },
  { id: 'ndi-bld-secondhand', top: '#1c1428', bottom: '#0a0814' },
  { id: 'ndi-bld-nightclub', top: '#280818', bottom: '#0c0410' },
  { id: 'ndi-bld-hospital', top: '#3a4a58', bottom: '#182028' },
  { id: 'ndi-bld-police', top: '#0e1a30', bottom: '#060c18' },
  { id: 'ndi-bld-electronics', top: '#0c241c', bottom: '#061410' },
  { id: 'ndi-bld-metro', top: '#061828', bottom: '#030c16' },
  { id: 'ndi-bld-hotel', top: '#101c2c', bottom: '#060a14' },
  { id: 'ndi-bld-service', top: '#121820', bottom: '#080a10' },
  { id: 'ndi-bld-shop_asian', top: '#1a1020', bottom: '#0a0610' },
  { id: 'ndi-bld-market', top: '#181410', bottom: '#0a0806' },
  { id: 'ndi-bld-gunshop', top: '#141818', bottom: '#080a0c' },
  { id: 'ndi-bld-corp_annex', top: '#141018', bottom: '#08060c' },
  { id: 'ndi-bld-generic', top: '#121820', bottom: '#080a10' },
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
    case 'park':
      return (
        <>
          <circle cx="1.5" cy="2" r="0.9" fill="rgba(60,180,100,0.18)" />
          <circle cx="4.2" cy="4" r="0.7" fill="rgba(50,150,90,0.14)" />
        </>
      );
    case 'dump':
      return (
        <>
          <ellipse cx="2" cy="3.2" rx="1.4" ry="0.9" fill="rgba(120,100,60,0.22)" />
          <ellipse cx="4.2" cy="2.5" rx="1.1" ry="0.8" fill="rgba(90,80,50,0.18)" />
          <rect width="1.2" height="0.7" x="2.5" y="1.5" fill="rgba(80,100,120,0.15)" />
        </>
      );
    case 'pond':
      return (
        <>
          <ellipse cx="3" cy="3" rx="2.2" ry="1.6" fill="rgba(40,140,180,0.22)" />
          <ellipse cx="2.4" cy="2.6" rx="0.9" ry="0.4" fill="rgba(120,200,230,0.18)" />
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
