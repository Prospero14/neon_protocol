import React from 'react';
import type { MegaCluster } from '../logic/nriNeonCityMap';

type Props = {
  megaClusters?: MegaCluster[];
};

/** SVG defs для карты Neon City — паттерны, градиенты, фильтры. */
export const NriCityMapDefs: React.FC<Props> = ({ megaClusters }) => (
  <defs>
    <pattern id="nc-grid" width="10" height="10" patternUnits="userSpaceOnUse">
      <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(0,255,255,0.06)" strokeWidth="0.15" />
    </pattern>
    <pattern id="nc-grid-fine" width="5" height="5" patternUnits="userSpaceOnUse">
      <path d="M 5 0 L 0 0 0 5" fill="none" stroke="rgba(0,255,255,0.035)" strokeWidth="0.08" />
    </pattern>
    <pattern id="nc-scan" width="4" height="4" patternUnits="userSpaceOnUse">
      <line x1="0" y1="3.5" x2="4" y2="3.5" stroke="rgba(0,255,255,0.04)" strokeWidth="0.5" />
    </pattern>

    <pattern id="nc-tex-highway" width="6" height="6" patternUnits="userSpaceOnUse">
      <rect width="6" height="1.2" y="2.4" fill="rgba(255,210,80,0.12)" />
      <line x1="0" y1="0" x2="6" y2="6" stroke="rgba(255,180,40,0.06)" strokeWidth="0.3" />
    </pattern>
    <pattern id="nc-tex-overpass" width="4" height="4" patternUnits="userSpaceOnUse">
      <path d="M0 4 L4 0 M-1 1 L1 -1 M3 5 L5 3" stroke="rgba(180,180,210,0.14)" strokeWidth="0.35" />
    </pattern>
    <pattern id="nc-tex-industrial" width="5" height="5" patternUnits="userSpaceOnUse">
      <path d="M0 5 L5 0" stroke="rgba(200,150,60,0.16)" strokeWidth="0.4" />
      <circle cx="2.5" cy="2.5" r="0.35" fill="rgba(255,200,100,0.08)" />
    </pattern>
    <pattern id="nc-tex-slum" width="3" height="3" patternUnits="userSpaceOnUse">
      <circle cx="0.8" cy="1.2" r="0.45" fill="rgba(255,80,100,0.1)" />
      <circle cx="2.2" cy="2.1" r="0.35" fill="rgba(180,40,60,0.08)" />
    </pattern>
    <pattern id="nc-tex-mid" width="4" height="4" patternUnits="userSpaceOnUse">
      <rect width="1.2" height="1.2" x="1.4" y="1.4" fill="rgba(100,160,220,0.1)" />
    </pattern>
    <pattern id="nc-tex-park" width="5" height="5" patternUnits="userSpaceOnUse">
      <circle cx="1.2" cy="2.8" r="0.7" fill="rgba(80,220,120,0.09)" />
      <circle cx="3.8" cy="1.5" r="0.55" fill="rgba(60,180,100,0.07)" />
    </pattern>
    <pattern id="nc-tex-corp" width="3" height="8" patternUnits="userSpaceOnUse">
      <rect width="0.6" height="8" x="1.2" fill="rgba(200,100,255,0.14)" />
      <rect width="0.3" height="8" x="0.3" fill="rgba(160,60,220,0.08)" />
    </pattern>

    <linearGradient id="nc-bg-radial" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="rgba(20,12,40,0.95)" />
      <stop offset="45%" stopColor="rgba(8,6,18,1)" />
      <stop offset="100%" stopColor="rgba(4,2,10,1)" />
    </linearGradient>
    <linearGradient id="nc-asphalt" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="rgba(14,12,18,0.92)" />
      <stop offset="100%" stopColor="rgba(6,5,10,0.98)" />
    </linearGradient>
    <radialGradient id="nc-vignette" cx="50%" cy="48%" r="68%">
      <stop offset="55%" stopColor="rgba(0,0,0,0)" />
      <stop offset="100%" stopColor="rgba(0,0,0,0.55)" />
    </radialGradient>
    <linearGradient id="nc-zone-shine" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="rgba(255,255,255,0.14)" />
      <stop offset="35%" stopColor="rgba(255,255,255,0.03)" />
      <stop offset="100%" stopColor="rgba(255,255,255,0)" />
    </linearGradient>

    <filter id="nc-glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="0.8" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="nc-soft-glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="1.2" result="blur" />
      <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.45 0" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    {megaClusters?.map((c) => (
      <clipPath key={c.clusterKey} id={`mega-clip-${c.clusterKey}`}>
        <rect x={c.x} y={c.y} width={c.w} height={c.h} />
      </clipPath>
    ))}
  </defs>
);
