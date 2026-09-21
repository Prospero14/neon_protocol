/** Inline SVG для площадей и 2×2-панелей — без внешнего <image> (в nested SVG он даёт «битую картинку»). */

import { corpTileTheme } from '../../shared/nri-domain/corpTileThemes';

type Span = { x: number; y: number; w: number; h: number };

/** 1×1 площадь внутри клетки. */
export function PlazaCellArt({ z }: { z: Span }) {
  const pad = Math.min(z.w, z.h) * 0.08;
  const ix = z.x + pad;
  const iy = z.y + pad;
  const iw = z.w - pad * 2;
  const ih = z.h - pad * 2;
  const m = Math.min(iw, ih);
  return (
    <g className="nri-district-plaza-cell" pointerEvents="none" aria-hidden>
      <rect x={ix} y={iy} width={iw} height={ih} rx={0.2} fill="#0c141c" stroke="#2a4058" strokeWidth={0.12} />
      <rect
        x={ix + iw * 0.18}
        y={iy + ih * 0.18}
        width={iw * 0.64}
        height={ih * 0.64}
        rx={0.12}
        fill="#121c28"
        stroke="#3a6080"
        strokeWidth={0.08}
      />
      <circle cx={ix + iw * 0.5} cy={iy + ih * 0.5} r={m * 0.12} fill="#1a3040" stroke="#4de8ff" strokeWidth={0.08} />
      <circle cx={ix + iw * 0.5} cy={iy + ih * 0.5} r={m * 0.05} fill="#7ad8ff" opacity={0.55} />
      <rect x={ix + iw * 0.12} y={iy + ih * 0.1} width={iw * 0.2} height={ih * 0.04} rx={0.03} fill="#00e5ff" opacity={0.55} />
      <rect x={ix + iw * 0.68} y={iy + ih * 0.1} width={iw * 0.18} height={ih * 0.04} rx={0.03} fill="#ff2bd6" opacity={0.5} />
    </g>
  );
}

/** 2×2 панель площади — только solid shapes (без defs/url/#pattern). */
export function PlazaMegaArt({ span }: { span: Span; seed?: string }) {
  const { x, y, w, h } = span;
  const pad = Math.min(w, h) * 0.03;
  const ix = x + pad;
  const iy = y + pad;
  const iw = w - pad * 2;
  const ih = h - pad * 2;
  const m = Math.min(iw, ih);
  return (
    <g className="nri-district-plaza-mega" pointerEvents="none" aria-hidden>
      <rect x={ix} y={iy} width={iw} height={ih} rx={0.3} fill="#0a121c" stroke="#2a4058" strokeWidth={0.16} />
      <rect x={ix + iw * 0.06} y={iy + ih * 0.06} width={iw * 0.88} height={ih * 0.88} rx={0.22} fill="#101820" stroke="#3a5570" strokeWidth={0.1} />
      {/* плитка */}
      <line x1={ix + iw * 0.5} y1={iy + ih * 0.08} x2={ix + iw * 0.5} y2={iy + ih * 0.92} stroke="#1a2838" strokeWidth={0.08} opacity={0.8} />
      <line x1={ix + iw * 0.08} y1={iy + ih * 0.5} x2={ix + iw * 0.92} y2={iy + ih * 0.5} stroke="#1a2838" strokeWidth={0.08} opacity={0.8} />
      {/* центральная площадь */}
      <rect
        x={ix + iw * 0.22}
        y={iy + ih * 0.22}
        width={iw * 0.56}
        height={ih * 0.56}
        rx={0.2}
        fill="#121c28"
        stroke="#3a7088"
        strokeWidth={0.14}
      />
      <rect
        x={ix + iw * 0.32}
        y={iy + ih * 0.32}
        width={iw * 0.36}
        height={ih * 0.36}
        rx={0.15}
        fill="#0c141c"
        stroke="#4de8ff"
        strokeWidth={0.1}
        opacity={0.95}
      />
      {/* фонтан */}
      <circle cx={ix + iw * 0.5} cy={iy + ih * 0.5} r={m * 0.08} fill="#143040" stroke="#4de8ff" strokeWidth={0.12} />
      <circle cx={ix + iw * 0.5} cy={iy + ih * 0.5} r={m * 0.04} fill="#7ad8ff" opacity={0.5} />
      {/* скамейки */}
      <rect x={ix + iw * 0.26} y={iy + ih * 0.14} width={iw * 0.18} height={ih * 0.035} rx={0.04} fill="#243040" />
      <rect x={ix + iw * 0.56} y={iy + ih * 0.14} width={iw * 0.18} height={ih * 0.035} rx={0.04} fill="#243040" />
      <rect x={ix + iw * 0.26} y={iy + ih * 0.82} width={iw * 0.18} height={ih * 0.035} rx={0.04} fill="#243040" />
      <rect x={ix + iw * 0.56} y={iy + ih * 0.82} width={iw * 0.18} height={ih * 0.035} rx={0.04} fill="#243040" />
      <rect x={ix + iw * 0.1} y={iy + ih * 0.06} width={iw * 0.16} height={ih * 0.025} rx={0.02} fill="#ff2bd6" opacity={0.4} />
      <rect x={ix + iw * 0.72} y={iy + ih * 0.06} width={iw * 0.14} height={ih * 0.025} rx={0.02} fill="#00e5ff" opacity={0.4} />
      <rect x={ix + iw * 0.1} y={iy + ih * 0.1} width={iw * 0.14} height={ih * 0.03} rx={0.04} fill="#00e5ff" opacity={0.35} />
      <rect x={ix + iw * 0.76} y={iy + ih * 0.1} width={iw * 0.14} height={ih * 0.03} rx={0.04} fill="#ff2bd6" opacity={0.35} />
      <rect x={ix + iw * 0.1} y={iy + ih * 0.87} width={iw * 0.14} height={ih * 0.03} rx={0.04} fill="#b8ff3c" opacity={0.3} />
      <rect x={ix + iw * 0.76} y={iy + ih * 0.87} width={iw * 0.14} height={ih * 0.03} rx={0.04} fill="#00e5ff" opacity={0.3} />
      {/* деревья */}
      <circle cx={ix + iw * 0.16} cy={iy + ih * 0.36} r={m * 0.045} fill="#2a5840" stroke="#4a8860" strokeWidth={0.06} />
      <circle cx={ix + iw * 0.84} cy={iy + ih * 0.36} r={m * 0.045} fill="#2a5840" stroke="#4a8860" strokeWidth={0.06} />
      <circle cx={ix + iw * 0.16} cy={iy + ih * 0.64} r={m * 0.045} fill="#2a5840" stroke="#4a8860" strokeWidth={0.06} />
      <circle cx={ix + iw * 0.84} cy={iy + ih * 0.64} r={m * 0.045} fill="#2a5840" stroke="#4a8860" strokeWidth={0.06} />
    </g>
  );
}

export function ShackMegaArt({ span }: { span: Span; seed?: string }) {
  const { x, y, w, h } = span;
  const pad = Math.min(w, h) * 0.03;
  const ix = x + pad;
  const iy = y + pad;
  const iw = w - pad * 2;
  const ih = h - pad * 2;
  const roofs: Array<{ rx: number; ry: number; rw: number; rh: number; fill: string }> = [
    { rx: 0.04, ry: 0.06, rw: 0.28, rh: 0.22, fill: '#3a4858' },
    { rx: 0.34, ry: 0.04, rw: 0.3, rh: 0.26, fill: '#445060' },
    { rx: 0.66, ry: 0.08, rw: 0.3, rh: 0.2, fill: '#384858' },
    { rx: 0.06, ry: 0.32, rw: 0.26, rh: 0.28, fill: '#405060' },
    { rx: 0.36, ry: 0.34, rw: 0.32, rh: 0.24, fill: '#364858' },
    { rx: 0.7, ry: 0.3, rw: 0.26, rh: 0.3, fill: '#425468' },
    { rx: 0.04, ry: 0.64, rw: 0.3, rh: 0.3, fill: '#3a5060' },
    { rx: 0.38, ry: 0.62, rw: 0.28, rh: 0.32, fill: '#485868' },
    { rx: 0.68, ry: 0.66, rw: 0.28, rh: 0.28, fill: '#3c4c5c' },
  ];
  return (
    <g className="nri-district-shack-mega" pointerEvents="none" aria-hidden>
      <rect x={ix} y={iy} width={iw} height={ih} rx={0.2} fill="#121820" stroke="#2a3848" strokeWidth={0.12} />
      <rect x={ix + iw * 0.46} y={iy + ih * 0.04} width={iw * 0.08} height={ih * 0.92} fill="#0e141c" opacity={0.85} />
      <rect x={ix + iw * 0.04} y={iy + ih * 0.46} width={iw * 0.92} height={ih * 0.08} fill="#0e141c" opacity={0.75} />
      {roofs.map((r, i) => (
        <rect
          key={i}
          x={ix + iw * r.rx}
          y={iy + ih * r.ry}
          width={iw * r.rw}
          height={ih * r.rh}
          rx={0.06}
          fill={r.fill}
          stroke="#5a7088"
          strokeWidth={0.05}
          opacity={0.95}
        />
      ))}
      <rect x={ix + iw * 0.1} y={iy + ih * 0.12} width={iw * 0.1} height={ih * 0.025} rx={0.03} fill="#00e5ff" opacity={0.4} />
      <rect x={ix + iw * 0.72} y={iy + ih * 0.18} width={iw * 0.12} height={ih * 0.022} rx={0.03} fill="#ff2bd6" opacity={0.35} />
      <rect x={ix + iw * 0.42} y={iy + ih * 0.72} width={iw * 0.14} height={ih * 0.022} rx={0.03} fill="#b8ff3c" opacity={0.3} />
      <rect x={ix + iw * 0.14} y={iy + ih * 0.78} width={iw * 0.08} height={ih * 0.02} rx={0.03} fill="#ffcc33" opacity={0.3} />
    </g>
  );
}

export function CorpHqMegaArt({ span, corpName }: { span: Span; corpName?: string | null }) {
  const theme = corpTileTheme(corpName);
  const { x, y, w, h } = span;
  const pad = Math.min(w, h) * 0.02;
  const ix = x + pad;
  const iy = y + pad;
  const iw = w - pad * 2;
  const ih = h - pad * 2;
  return (
    <g className="nri-district-corp-hq" pointerEvents="none" aria-hidden>
      <rect x={ix} y={iy} width={iw} height={ih} rx={0.25} fill={theme.primary} stroke={theme.accent} strokeWidth={0.18} />
      <rect x={ix + iw * 0.06} y={iy + ih * 0.08} width={iw * 0.88} height={ih * 0.84} rx={0.15} fill={theme.secondary} stroke={theme.glow} strokeWidth={0.1} opacity={0.95} />
      {/* башни */}
      <rect x={ix + iw * 0.12} y={iy + ih * 0.18} width={iw * 0.22} height={ih * 0.62} fill={theme.primary} stroke={theme.accent} strokeWidth={0.08} />
      <rect x={ix + iw * 0.4} y={iy + ih * 0.12} width={iw * 0.2} height={ih * 0.68} fill={theme.primary} stroke={theme.glow} strokeWidth={0.1} />
      <rect x={ix + iw * 0.66} y={iy + ih * 0.22} width={iw * 0.2} height={ih * 0.58} fill={theme.primary} stroke={theme.accent} strokeWidth={0.08} />
      {/* окна */}
      {[0.22, 0.32, 0.42, 0.52, 0.62].map((py, i) => (
        <g key={i}>
          <rect x={ix + iw * 0.15} y={iy + ih * py} width={iw * 0.06} height={ih * 0.04} fill={theme.glow} opacity={0.55} />
          <rect x={ix + iw * 0.44} y={iy + ih * py} width={iw * 0.12} height={ih * 0.035} fill={theme.glow} opacity={0.65} />
          <rect x={ix + iw * 0.7} y={iy + ih * py} width={iw * 0.06} height={ih * 0.04} fill={theme.glow} opacity={0.5} />
        </g>
      ))}
      <rect x={ix + iw * 0.28} y={iy + ih * 0.08} width={iw * 0.44} height={ih * 0.05} rx={0.04} fill={theme.accent} opacity={0.7} />
    </g>
  );
}

export function CorpOfficeMegaArt({ span, corpName }: { span: Span; corpName?: string | null }) {
  const theme = corpTileTheme(corpName);
  const { x, y, w, h } = span;
  const pad = Math.min(w, h) * 0.04;
  const ix = x + pad;
  const iy = y + pad;
  const iw = w - pad * 2;
  const ih = h - pad * 2;
  return (
    <g className="nri-district-corp-office" pointerEvents="none" aria-hidden>
      <rect x={ix} y={iy} width={iw} height={ih} rx={0.2} fill={theme.primary} stroke={theme.accent} strokeWidth={0.14} />
      <rect x={ix + iw * 0.12} y={iy + ih * 0.14} width={iw * 0.76} height={ih * 0.72} fill={theme.secondary} stroke={theme.glow} strokeWidth={0.08} />
      {[0.25, 0.4, 0.55, 0.7].map((py, i) => (
        <rect key={i} x={ix + iw * 0.2} y={iy + ih * py} width={iw * 0.6} height={ih * 0.06} fill={theme.glow} opacity={0.35} />
      ))}
      <rect x={ix + iw * 0.35} y={iy + ih * 0.78} width={iw * 0.3} height={ih * 0.1} fill={theme.primary} />
    </g>
  );
}

export function CorpAnnexArt({ z, corpName }: { z: Span; corpName?: string | null }) {
  const theme = corpTileTheme(corpName);
  const pad = Math.min(z.w, z.h) * 0.1;
  const ix = z.x + pad;
  const iy = z.y + pad;
  const iw = z.w - pad * 2;
  const ih = z.h - pad * 2;
  return (
    <g className="nri-district-corp-annex" pointerEvents="none" aria-hidden>
      <rect x={ix} y={iy} width={iw} height={ih} rx={0.12} fill={theme.secondary} stroke={theme.accent} strokeWidth={0.1} />
      <rect x={ix + iw * 0.15} y={iy + ih * 0.2} width={iw * 0.7} height={ih * 0.55} fill={theme.primary} />
      <rect x={ix + iw * 0.2} y={iy + ih * 0.12} width={iw * 0.45} height={ih * 0.08} rx={0.03} fill={theme.glow} opacity={0.55} />
      <rect x={ix + iw * 0.35} y={iy + ih * 0.7} width={iw * 0.3} height={ih * 0.15} fill={theme.primary} stroke={theme.accent} strokeWidth={0.05} />
    </g>
  );
}

const MERGE_PALETTE: Record<string, { fill: string; stroke: string; accent: string }> = {
  road: { fill: '#1a1e24', stroke: '#6a7888', accent: '#ffc857' },
  crossing: { fill: '#1a1e24', stroke: '#8a98a8', accent: '#ffe080' },
  dump: { fill: '#1c1810', stroke: '#8a7040', accent: '#c89840' },
  shack: { fill: '#181210', stroke: '#a06040', accent: '#ff8060' },
  park: { fill: '#0c1a12', stroke: '#3a9060', accent: '#60e090' },
  pond: { fill: '#0a1420', stroke: '#3a70a0', accent: '#60c0ff' },
  market: { fill: '#1a1018', stroke: '#a05080', accent: '#ff80c0' },
  house: { fill: '#101820', stroke: '#5a8ac0', accent: '#80c0ff' },
  restaurant: { fill: '#1a1014', stroke: '#c05070', accent: '#ff80a0' },
  shop: { fill: '#101820', stroke: '#40a0c0', accent: '#60e0ff' },
  parking: { fill: '#14161c', stroke: '#707888', accent: '#a0a8b8' },
  hotel: { fill: '#12101c', stroke: '#8a70c0', accent: '#c0a0ff' },
  nightclub: { fill: '#140818', stroke: '#c040a0', accent: '#ff60d0' },
  hospital: { fill: '#101820', stroke: '#60a0c0', accent: '#a0e0ff' },
  police: { fill: '#0e1420', stroke: '#4060a0', accent: '#7090ff' },
  electronics: { fill: '#0c1820', stroke: '#40c0c0', accent: '#60ffe0' },
  service: { fill: '#141610', stroke: '#90a040', accent: '#d0e060' },
  shop_asian: { fill: '#1a1010', stroke: '#c04040', accent: '#ff8060' },
  secondhand: { fill: '#181410', stroke: '#a08050', accent: '#e0c080' },
  gunshop: { fill: '#141018', stroke: '#a05060', accent: '#ff7080' },
  metro: { fill: '#0c141c', stroke: '#50a0c0', accent: '#80e0ff' },
};

/** Seamless mega block — continuous surface without internal seams. */
export function MergeMegaArt({
  span,
  placeType,
}: {
  span: Span;
  placeType: string;
}) {
  const pal = MERGE_PALETTE[placeType] ?? MERGE_PALETTE.park!;
  const { x, y, w, h } = span;
  const pad = Math.min(w, h) * 0.02;
  const ix = x + pad;
  const iy = y + pad;
  const iw = w - pad * 2;
  const ih = h - pad * 2;
  return (
    <g className={`nri-district-merge-mega nri-district-merge-mega--${placeType}`} pointerEvents="none" aria-hidden>
      <rect x={ix} y={iy} width={iw} height={ih} rx={0.15} fill={pal.fill} stroke={pal.stroke} strokeWidth={0.12} />
      {(placeType === 'road' || placeType === 'crossing') && (
        <>
          {/* Разметка дорог рисуется поклеточно в RoadTileArt — здесь только сплошной асфальт. */}
        </>
      )}
      {placeType === 'house' && (
        <>
          <rect x={ix + iw * 0.08} y={iy + ih * 0.2} width={iw * 0.84} height={ih * 0.62} fill={pal.stroke} opacity={0.35} />
          <rect x={ix + iw * 0.12} y={iy + ih * 0.12} width={iw * 0.76} height={ih * 0.1} fill={pal.accent} opacity={0.45} />
          {[0.25, 0.45, 0.65].map((px, i) => (
            <rect key={i} x={ix + iw * px} y={iy + ih * 0.35} width={iw * 0.12} height={ih * 0.2} fill={pal.accent} opacity={0.4} />
          ))}
        </>
      )}
      {placeType === 'park' && (
        <>
          <circle cx={ix + iw * 0.3} cy={iy + ih * 0.4} r={Math.min(iw, ih) * 0.18} fill={pal.accent} opacity={0.35} />
          <circle cx={ix + iw * 0.65} cy={iy + ih * 0.55} r={Math.min(iw, ih) * 0.22} fill={pal.accent} opacity={0.28} />
          <rect x={ix + iw * 0.1} y={iy + ih * 0.75} width={iw * 0.8} height={ih * 0.08} rx={0.05} fill={pal.stroke} opacity={0.4} />
        </>
      )}
      {placeType === 'pond' && (
        <ellipse cx={ix + iw * 0.5} cy={iy + ih * 0.5} rx={iw * 0.4} ry={ih * 0.34} fill={pal.accent} opacity={0.35} stroke={pal.stroke} strokeWidth={0.1} />
      )}
      {placeType === 'dump' && (
        <>
          <rect x={ix + iw * 0.12} y={iy + ih * 0.22} width={iw * 0.32} height={ih * 0.4} fill={pal.accent} opacity={0.3} />
          <rect x={ix + iw * 0.5} y={iy + ih * 0.32} width={iw * 0.38} height={ih * 0.42} fill={pal.stroke} opacity={0.4} />
        </>
      )}
      {placeType === 'shack' && (
        <>
          <rect x={ix + iw * 0.08} y={iy + ih * 0.32} width={iw * 0.26} height={ih * 0.48} fill={pal.stroke} />
          <rect x={ix + iw * 0.38} y={iy + ih * 0.28} width={iw * 0.24} height={ih * 0.52} fill={pal.accent} opacity={0.4} />
          <rect x={ix + iw * 0.66} y={iy + ih * 0.36} width={iw * 0.24} height={ih * 0.44} fill={pal.stroke} />
        </>
      )}
      {placeType === 'market' && (
        <>
          <rect x={ix + iw * 0.06} y={iy + ih * 0.18} width={iw * 0.88} height={ih * 0.58} fill={pal.stroke} opacity={0.35} />
          {[0.15, 0.35, 0.55, 0.72].map((px, i) => (
            <rect key={i} x={ix + iw * px} y={iy + ih * 0.26} width={iw * 0.14} height={ih * 0.38} fill={pal.accent} opacity={0.45} />
          ))}
        </>
      )}
      {(placeType === 'restaurant' || placeType === 'shop') && (
        <>
          <rect x={ix + iw * 0.1} y={iy + ih * 0.22} width={iw * 0.8} height={ih * 0.55} fill={pal.stroke} opacity={0.4} />
          <rect x={ix + iw * 0.15} y={iy + ih * 0.12} width={iw * 0.55} height={ih * 0.1} rx={0.04} fill={pal.accent} opacity={0.7} />
        </>
      )}
      {placeType === 'parking' && (
        <>
          {[0.2, 0.45, 0.7].map((px, i) => (
            <rect key={i} x={ix + iw * px} y={iy + ih * 0.2} width={iw * 0.18} height={ih * 0.6} fill={pal.stroke} opacity={0.35} stroke={pal.accent} strokeWidth={0.06} />
          ))}
        </>
      )}
      {(placeType === 'hotel' ||
        placeType === 'nightclub' ||
        placeType === 'hospital' ||
        placeType === 'police' ||
        placeType === 'electronics' ||
        placeType === 'service' ||
        placeType === 'shop_asian' ||
        placeType === 'secondhand' ||
        placeType === 'gunshop' ||
        placeType === 'metro') && (
        <>
          <rect x={ix + iw * 0.08} y={iy + ih * 0.18} width={iw * 0.84} height={ih * 0.64} fill={pal.stroke} opacity={0.32} />
          <rect x={ix + iw * 0.12} y={iy + ih * 0.1} width={iw * 0.5} height={ih * 0.1} rx={0.04} fill={pal.accent} opacity={0.7} />
          {[0.22, 0.4, 0.58].map((py, i) => (
            <rect key={i} x={ix + iw * 0.18} y={iy + ih * py} width={iw * 0.18} height={ih * 0.1} fill={pal.accent} opacity={0.35} />
          ))}
          {[0.22, 0.4, 0.58].map((py, i) => (
            <rect key={`r${i}`} x={ix + iw * 0.55} y={iy + ih * py} width={iw * 0.22} height={ih * 0.1} fill={pal.accent} opacity={0.28} />
          ))}
        </>
      )}
    </g>
  );
}
