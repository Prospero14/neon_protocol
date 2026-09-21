/** Original cyberpunk-style corp marks (not trademark clones). Semi-transparent overlay. */

import React from 'react';

type Span = { x: number; y: number; w: number; h: number };

type MarkProps = { span: Span; opacity?: number };

function frame(span: Span, opacity: number) {
  const pad = Math.min(span.w, span.h) * 0.08;
  return {
    ix: span.x + pad,
    iy: span.y + pad,
    iw: span.w - pad * 2,
    ih: span.h - pad * 2,
    opacity,
  };
}

/** Crimson ascending chevrons — zaibatsu energy, original geometry. */
function MarkCrimsonTower({ span, opacity = 0.42 }: MarkProps) {
  const { ix, iy, iw, ih, opacity: o } = frame(span, opacity);
  return (
    <g opacity={o} className="nri-corp-logo-mark nri-corp-logo-mark--crimson">
      <rect x={ix} y={iy} width={iw} height={ih} fill="rgba(12,4,8,0.25)" rx={0.2} />
      <polygon
        points={`${ix + iw * 0.5},${iy + ih * 0.12} ${ix + iw * 0.78},${iy + ih * 0.88} ${ix + iw * 0.22},${iy + ih * 0.88}`}
        fill="none"
        stroke="#ff3a5a"
        strokeWidth={0.22}
      />
      <polyline
        points={`${ix + iw * 0.32},${iy + ih * 0.62} ${ix + iw * 0.5},${iy + ih * 0.38} ${ix + iw * 0.68},${iy + ih * 0.62}`}
        fill="none"
        stroke="#c41e3a"
        strokeWidth={0.18}
      />
      <rect x={ix + iw * 0.44} y={iy + ih * 0.7} width={iw * 0.12} height={ih * 0.14} fill="#ff3a5a" opacity={0.7} />
    </g>
  );
}

/** Green dual-chevron plate — mil-spec, original. */
function MarkGreenArsenal({ span, opacity = 0.42 }: MarkProps) {
  const { ix, iy, iw, ih, opacity: o } = frame(span, opacity);
  return (
    <g opacity={o} className="nri-corp-logo-mark nri-corp-logo-mark--arsenal">
      <rect x={ix} y={iy} width={iw} height={ih} fill="rgba(4,12,8,0.25)" rx={0.2} />
      <rect
        x={ix + iw * 0.2}
        y={iy + ih * 0.22}
        width={iw * 0.6}
        height={ih * 0.56}
        fill="none"
        stroke="#4dff8a"
        strokeWidth={0.2}
      />
      <polyline
        points={`${ix + iw * 0.28},${iy + ih * 0.55} ${ix + iw * 0.5},${iy + ih * 0.32} ${ix + iw * 0.72},${iy + ih * 0.55}`}
        fill="none"
        stroke="#2a7a4a"
        strokeWidth={0.2}
      />
      <polyline
        points={`${ix + iw * 0.34},${iy + ih * 0.68} ${ix + iw * 0.5},${iy + ih * 0.48} ${ix + iw * 0.66},${iy + ih * 0.68}`}
        fill="none"
        stroke="#4dff8a"
        strokeWidth={0.16}
      />
    </g>
  );
}

/** Golden hex seed — east-industrial, original. */
function MarkGoldHex({ span, opacity = 0.42 }: MarkProps) {
  const { ix, iy, iw, ih, opacity: o } = frame(span, opacity);
  const cx = ix + iw / 2;
  const cy = iy + ih / 2;
  const r = Math.min(iw, ih) * 0.32;
  const hex = [0, 1, 2, 3, 4, 5]
    .map((i) => {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
    })
    .join(' ');
  return (
    <g opacity={o} className="nri-corp-logo-mark nri-corp-logo-mark--hex">
      <rect x={ix} y={iy} width={iw} height={ih} fill="rgba(12,8,4,0.22)" rx={0.2} />
      <polygon points={hex} fill="none" stroke="#ffe066" strokeWidth={0.2} />
      <circle cx={cx} cy={cy} r={r * 0.28} fill="#c9a227" opacity={0.75} />
    </g>
  );
}

/** Bio spiral leaf — agri/pharma vibe, original. */
function MarkBioSpiral({ span, opacity = 0.42 }: MarkProps) {
  const { ix, iy, iw, ih, opacity: o } = frame(span, opacity);
  const cx = ix + iw / 2;
  const cy = iy + ih / 2;
  return (
    <g opacity={o} className="nri-corp-logo-mark nri-corp-logo-mark--bio">
      <rect x={ix} y={iy} width={iw} height={ih} fill="rgba(4,12,8,0.22)" rx={0.2} />
      <ellipse cx={cx} cy={cy} rx={iw * 0.28} ry={ih * 0.36} fill="none" stroke="#5cffb0" strokeWidth={0.18} />
      <path
        d={`M ${cx} ${iy + ih * 0.78} Q ${cx + iw * 0.22} ${cy} ${cx} ${iy + ih * 0.22} Q ${cx - iw * 0.22} ${cy} ${cx} ${iy + ih * 0.78}`}
        fill="none"
        stroke="#2a9a6a"
        strokeWidth={0.16}
      />
      <circle cx={cx} cy={cy} r={Math.min(iw, ih) * 0.06} fill="#5cffb0" />
    </g>
  );
}

/** Medical shield cross — original rounded shield. */
function MarkTraumaShield({ span, opacity = 0.42 }: MarkProps) {
  const { ix, iy, iw, ih, opacity: o } = frame(span, opacity);
  return (
    <g opacity={o} className="nri-corp-logo-mark nri-corp-logo-mark--trauma">
      <rect x={ix} y={iy} width={iw} height={ih} fill="rgba(12,4,4,0.22)" rx={0.2} />
      <path
        d={`M ${ix + iw * 0.5} ${iy + ih * 0.16}
            L ${ix + iw * 0.78} ${iy + ih * 0.28}
            L ${ix + iw * 0.78} ${iy + ih * 0.55}
            Q ${ix + iw * 0.5} ${iy + ih * 0.88} ${ix + iw * 0.22} ${iy + ih * 0.55}
            L ${ix + iw * 0.22} ${iy + ih * 0.28} Z`}
        fill="none"
        stroke="#ff6666"
        strokeWidth={0.2}
      />
      <rect x={ix + iw * 0.44} y={iy + ih * 0.34} width={iw * 0.12} height={ih * 0.32} fill="#e02020" opacity={0.85} />
      <rect x={ix + iw * 0.34} y={iy + ih * 0.44} width={iw * 0.32} height={ih * 0.12} fill="#e02020" opacity={0.85} />
    </g>
  );
}

/** Radar eye — surveillance net, original. */
function MarkNetRadar({ span, opacity = 0.42 }: MarkProps) {
  const { ix, iy, iw, ih, opacity: o } = frame(span, opacity);
  const cx = ix + iw / 2;
  const cy = iy + ih / 2;
  const r = Math.min(iw, ih);
  return (
    <g opacity={o} className="nri-corp-logo-mark nri-corp-logo-mark--radar">
      <rect x={ix} y={iy} width={iw} height={ih} fill="rgba(4,8,14,0.25)" rx={0.2} />
      <circle cx={cx} cy={cy} r={r * 0.32} fill="none" stroke="#4dc8ff" strokeWidth={0.16} />
      <circle cx={cx} cy={cy} r={r * 0.2} fill="none" stroke="#2a6aaa" strokeWidth={0.14} />
      <circle cx={cx} cy={cy} r={r * 0.07} fill="#4dc8ff" />
      <line x1={cx} y1={cy} x2={cx + r * 0.3} y2={cy - r * 0.18} stroke="#4dc8ff" strokeWidth={0.14} />
    </g>
  );
}

/** Circuit diamond — chrome chip house, original. */
function MarkZetaChip({ span, opacity = 0.42 }: MarkProps) {
  const { ix, iy, iw, ih, opacity: o } = frame(span, opacity);
  const cx = ix + iw / 2;
  const cy = iy + ih / 2;
  return (
    <g opacity={o} className="nri-corp-logo-mark nri-corp-logo-mark--zeta">
      <rect x={ix} y={iy} width={iw} height={ih} fill="rgba(8,6,14,0.25)" rx={0.2} />
      <polygon
        points={`${cx},${iy + ih * 0.18} ${ix + iw * 0.78},${cy} ${cx},${iy + ih * 0.82} ${ix + iw * 0.22},${cy}`}
        fill="none"
        stroke="#b48cff"
        strokeWidth={0.2}
      />
      <rect x={cx - iw * 0.08} y={cy - ih * 0.08} width={iw * 0.16} height={ih * 0.16} fill="#6a4aaa" opacity={0.8} />
      <line x1={ix + iw * 0.22} y1={cy} x2={ix + iw * 0.12} y2={cy} stroke="#b48cff" strokeWidth={0.12} />
      <line x1={ix + iw * 0.78} y1={cy} x2={ix + iw * 0.88} y2={cy} stroke="#b48cff" strokeWidth={0.12} />
    </g>
  );
}

/** Orbital arc — flight path crescent, original. */
function MarkOrbitalArc({ span, opacity = 0.42 }: MarkProps) {
  const { ix, iy, iw, ih, opacity: o } = frame(span, opacity);
  const cx = ix + iw / 2;
  const cy = iy + ih / 2;
  const r = Math.min(iw, ih) * 0.34;
  return (
    <g opacity={o} className="nri-corp-logo-mark nri-corp-logo-mark--orbital">
      <rect x={ix} y={iy} width={iw} height={ih} fill="rgba(4,8,14,0.22)" rx={0.2} />
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r * 0.55} 0 0 1 ${cx + r} ${cy}`}
        fill="none"
        stroke="#7ae0ff"
        strokeWidth={0.22}
      />
      <circle cx={cx + r * 0.55} cy={cy - r * 0.15} r={r * 0.12} fill="#3a8aaa" />
      <circle cx={cx} cy={cy + r * 0.05} r={r * 0.08} fill="#7ae0ff" opacity={0.8} />
    </g>
  );
}

/** Amber droplet + ring — resource corp, original. */
function MarkAmberResource({ span, opacity = 0.42 }: MarkProps) {
  const { ix, iy, iw, ih, opacity: o } = frame(span, opacity);
  const cx = ix + iw / 2;
  return (
    <g opacity={o} className="nri-corp-logo-mark nri-corp-logo-mark--amber">
      <rect x={ix} y={iy} width={iw} height={ih} fill="rgba(12,8,4,0.22)" rx={0.2} />
      <ellipse cx={cx} cy={iy + ih * 0.42} rx={iw * 0.18} ry={ih * 0.22} fill="#ffb040" opacity={0.55} />
      <path
        d={`M ${cx} ${iy + ih * 0.22} Q ${cx + iw * 0.2} ${iy + ih * 0.45} ${cx} ${iy + ih * 0.72} Q ${cx - iw * 0.2} ${iy + ih * 0.45} ${cx} ${iy + ih * 0.22}`}
        fill="none"
        stroke="#c87820"
        strokeWidth={0.18}
      />
      <circle cx={cx} cy={iy + ih * 0.78} r={Math.min(iw, ih) * 0.08} fill="none" stroke="#ffb040" strokeWidth={0.14} />
    </g>
  );
}

/** Wave bars — broadcast band, original. */
function MarkWaveBand({ span, opacity = 0.42 }: MarkProps) {
  const { ix, iy, iw, ih, opacity: o } = frame(span, opacity);
  return (
    <g opacity={o} className="nri-corp-logo-mark nri-corp-logo-mark--wave">
      <rect x={ix} y={iy} width={iw} height={ih} fill="rgba(4,8,12,0.22)" rx={0.2} />
      {[0.28, 0.42, 0.56, 0.7].map((py, i) => (
        <rect
          key={i}
          x={ix + iw * 0.2}
          y={iy + ih * py}
          width={iw * (0.35 + i * 0.08)}
          height={ih * 0.06}
          fill="#80d0f0"
          opacity={0.35 + i * 0.12}
        />
      ))}
      <circle cx={ix + iw * 0.78} cy={iy + ih * 0.35} r={Math.min(iw, ih) * 0.08} fill="#4a90b0" />
    </g>
  );
}

/** Neutral seal. */
function MarkNeutralSeal({ span, opacity = 0.4 }: MarkProps) {
  const { ix, iy, iw, ih, opacity: o } = frame(span, opacity);
  const cx = ix + iw / 2;
  const cy = iy + ih / 2;
  return (
    <g opacity={o} className="nri-corp-logo-mark nri-corp-logo-mark--seal">
      <rect x={ix} y={iy} width={iw} height={ih} fill="rgba(6,10,14,0.28)" rx={0.2} />
      <circle cx={cx} cy={cy} r={Math.min(iw, ih) * 0.3} fill="none" stroke="#7ec8e8" strokeWidth={0.18} />
      <rect x={cx - iw * 0.1} y={cy - ih * 0.1} width={iw * 0.2} height={ih * 0.2} fill="#5a8aaa" opacity={0.7} />
    </g>
  );
}

const MARK_BY_THEME: Record<string, React.FC<MarkProps>> = {
  arasaka: MarkCrimsonTower,
  militech: MarkGreenArsenal,
  kang_tao: MarkGoldHex,
  'kang tao': MarkGoldHex,
  biotechnica: MarkBioSpiral,
  trauma_team: MarkTraumaShield,
  'trauma team': MarkTraumaShield,
  netwatch: MarkNetRadar,
  zetatech: MarkZetaChip,
  orbital_air: MarkOrbitalArc,
  'orbital air': MarkOrbitalArc,
  sovoil: MarkAmberResource,
  ebm: MarkWaveBand,
  default: MarkNeutralSeal,
};

export function CorpLogoOverlayArt({
  span,
  themeId,
  opacity = 0.48,
}: {
  span: Span;
  themeId: string;
  opacity?: number;
}) {
  const key = themeId.trim().toLowerCase();
  const Mark = MARK_BY_THEME[key] ?? MarkNeutralSeal;
  return <Mark span={span} opacity={opacity} />;
}
