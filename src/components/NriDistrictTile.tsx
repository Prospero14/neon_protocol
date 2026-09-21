import React, { useMemo } from 'react';
import type { NriMapZone } from '../logic/nriApi';
import {
  neighborsForTile,
  normalizeDistrictStyle,
  normalizePlaceType,
  type PlaceType,
} from '../../shared/nri-domain/districtGrid';
import {
  buildingBodyRect,
  applyAlleyInsets,
  isPackedBuildingBlock,
  resolveTileVisual,
  roadCornerFromLinks,
  type EdgeFlags,
} from '../../shared/nri-domain/districtTileVisual';
import { districtTileSprite } from '../../shared/nri-domain/districtTileSprites';
import type { BlockMegaInfo } from '../../shared/nri-domain/plazaMega';
import type { CorpLogoInfo } from '../../shared/nri-domain/corpLogoOverlay';
import { PlazaCellArt, CorpAnnexArt, PlazaMegaArt, ShackMegaArt, CorpHqMegaArt, CorpOfficeMegaArt, MergeMegaArt } from './NriMegaBlockArt';
import { CorpLogoOverlayArt } from './NriCorpLogoMarks';
import { NriDistrictNightFx, blinkStyle, hashSeed } from './NriDistrictNightFx';

type Props = {
  raw: NriMapZone;
  z: NriMapZone;
  districtStyle: string;
  gridRows: number;
  gridCols: number;
  neighborTypes: Map<string, PlaceType>;
  blockMega?: BlockMegaInfo | null;
  corpLogo?: CorpLogoInfo | null;
  corpName?: string | null;
  isFocused: boolean;
  isHovered: boolean;
  dragFrom?: boolean;
  dragOver?: boolean;
  animationSlot: number | null;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
};

function clipId(zoneKey: string): string {
  return `tile-clip-${zoneKey.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
}

function animOn(slot: number | null, base: string): string {
  if (slot == null) return base;
  return base
    .split(/\s+/)
    .map((c) => `${c} ${c}--anim`)
    .join(' ');
}

type Edge = 'n' | 's' | 'e' | 'w';

function edgesFrom(flags: EdgeFlags): Edge[] {
  const out: Edge[] = [];
  if (flags.n) out.push('n');
  if (flags.s) out.push('s');
  if (flags.e) out.push('e');
  if (flags.w) out.push('w');
  return out;
}

/** Полоса асфальта + тротуар у края клетки (здания / стык дом↔дом). */
const StreetEdge: React.FC<{ edge: Edge; z: NriMapZone; wide?: boolean; markLane?: boolean }> = ({
  edge,
  z,
  wide,
  markLane = true,
}) => {
  const road = wide ? 0.2 : 0.15;
  const walk = wide ? 0.055 : 0.045;
  const lane =
    markLane ? (
      edge === 'n' || edge === 's' ? (
        <line
          x1={z.x + z.w * 0.15}
          y1={edge === 'n' ? z.y + z.h * (road * 0.55) : z.y + z.h * (1 - road * 0.55)}
          x2={z.x + z.w * 0.85}
          y2={edge === 'n' ? z.y + z.h * (road * 0.55) : z.y + z.h * (1 - road * 0.55)}
          className="nri-district-tile__lane-yellow"
        />
      ) : (
        <line
          x1={edge === 'w' ? z.x + z.w * (road * 0.55) : z.x + z.w * (1 - road * 0.55)}
          y1={z.y + z.h * 0.15}
          x2={edge === 'w' ? z.x + z.w * (road * 0.55) : z.x + z.w * (1 - road * 0.55)}
          y2={z.y + z.h * 0.85}
          className="nri-district-tile__lane-yellow"
        />
      )
    ) : null;
  if (edge === 'n') {
    return (
      <>
        <rect x={z.x} y={z.y} width={z.w} height={z.h * road} className="nri-district-tile__street-road" />
        <rect
          x={z.x}
          y={z.y + z.h * road}
          width={z.w}
          height={z.h * walk}
          className="nri-district-tile__street-sidewalk"
        />
        {lane}
      </>
    );
  }
  if (edge === 's') {
    return (
      <>
        <rect
          x={z.x}
          y={z.y + z.h * (1 - road)}
          width={z.w}
          height={z.h * road}
          className="nri-district-tile__street-road"
        />
        <rect
          x={z.x}
          y={z.y + z.h * (1 - road - walk)}
          width={z.w}
          height={z.h * walk}
          className="nri-district-tile__street-sidewalk"
        />
        {lane}
      </>
    );
  }
  if (edge === 'w') {
    return (
      <>
        <rect x={z.x} y={z.y} width={z.w * road} height={z.h} className="nri-district-tile__street-road" />
        <rect
          x={z.x + z.w * road}
          y={z.y}
          width={z.w * walk}
          height={z.h}
          className="nri-district-tile__street-sidewalk"
        />
        {lane}
      </>
    );
  }
  return (
    <>
      <rect
        x={z.x + z.w * (1 - road)}
        y={z.y}
        width={z.w * road}
        height={z.h}
        className="nri-district-tile__street-road"
      />
      <rect
        x={z.x + z.w * (1 - road - walk)}
        y={z.y}
        width={z.w * walk}
        height={z.h}
        className="nri-district-tile__street-sidewalk"
      />
      {lane}
    </>
  );
};

/**
 * Зебра у края клетки: бело-жёлтые полосы (как на реальном перекрёстке) + светофор.
 */
const CrosswalkAtEdge: React.FC<{ edge: Edge; z: NriMapZone; compact?: boolean }> = ({
  edge,
  z,
  compact,
}) => {
  const stripeCount = 7;
  const stripeFrac = 1 / (stripeCount + 2);
  const pad = compact ? 0.12 : 0.14;
  const depth = compact ? 0.16 : 0.18;
  const light =
    edge === 'n' ? (
      <g className="nri-district-tile__traffic-light">
        <rect x={z.x + z.w * 0.78} y={z.y + z.h * 0.02} width={z.w * 0.08} height={z.h * 0.2} rx={0.04} />
        <circle cx={z.x + z.w * 0.82} cy={z.y + z.h * 0.06} r={Math.min(z.w, z.h) * 0.025} className="nri-district-tile__tl-red" />
        <circle cx={z.x + z.w * 0.82} cy={z.y + z.h * 0.115} r={Math.min(z.w, z.h) * 0.025} className="nri-district-tile__tl-amber" />
        <circle cx={z.x + z.w * 0.82} cy={z.y + z.h * 0.17} r={Math.min(z.w, z.h) * 0.025} className="nri-district-tile__tl-green" />
      </g>
    ) : edge === 's' ? (
      <g className="nri-district-tile__traffic-light">
        <rect x={z.x + z.w * 0.14} y={z.y + z.h * 0.78} width={z.w * 0.08} height={z.h * 0.2} rx={0.04} />
        <circle cx={z.x + z.w * 0.18} cy={z.y + z.h * 0.82} r={Math.min(z.w, z.h) * 0.025} className="nri-district-tile__tl-red" />
        <circle cx={z.x + z.w * 0.18} cy={z.y + z.h * 0.875} r={Math.min(z.w, z.h) * 0.025} className="nri-district-tile__tl-amber" />
        <circle cx={z.x + z.w * 0.18} cy={z.y + z.h * 0.93} r={Math.min(z.w, z.h) * 0.025} className="nri-district-tile__tl-green" />
      </g>
    ) : edge === 'w' ? (
      <g className="nri-district-tile__traffic-light">
        <rect x={z.x + z.w * 0.02} y={z.y + z.h * 0.14} width={z.w * 0.2} height={z.h * 0.08} rx={0.04} />
        <circle cx={z.x + z.w * 0.06} cy={z.y + z.h * 0.18} r={Math.min(z.w, z.h) * 0.025} className="nri-district-tile__tl-red" />
        <circle cx={z.x + z.w * 0.115} cy={z.y + z.h * 0.18} r={Math.min(z.w, z.h) * 0.025} className="nri-district-tile__tl-amber" />
        <circle cx={z.x + z.w * 0.17} cy={z.y + z.h * 0.18} r={Math.min(z.w, z.h) * 0.025} className="nri-district-tile__tl-green" />
      </g>
    ) : (
      <g className="nri-district-tile__traffic-light">
        <rect x={z.x + z.w * 0.78} y={z.y + z.h * 0.78} width={z.w * 0.2} height={z.h * 0.08} rx={0.04} />
        <circle cx={z.x + z.w * 0.82} cy={z.y + z.h * 0.82} r={Math.min(z.w, z.h) * 0.025} className="nri-district-tile__tl-red" />
        <circle cx={z.x + z.w * 0.875} cy={z.y + z.h * 0.82} r={Math.min(z.w, z.h) * 0.025} className="nri-district-tile__tl-amber" />
        <circle cx={z.x + z.w * 0.93} cy={z.y + z.h * 0.82} r={Math.min(z.w, z.h) * 0.025} className="nri-district-tile__tl-green" />
      </g>
    );

  const stripes = Array.from({ length: stripeCount }, (_, i) => {
    const t = pad + (i + 0.5) * ((1 - pad * 2) / stripeCount);
    const yellow = i % 2 === 0;
    const cls = yellow ? 'nri-district-tile__crosswalk nri-district-tile__crosswalk--yellow' : 'nri-district-tile__crosswalk';
    if (edge === 'n') {
      return (
        <rect
          key={i}
          x={z.x + z.w * (t - stripeFrac * 0.35)}
          y={z.y + z.h * 0.06}
          width={z.w * stripeFrac * 0.7}
          height={z.h * depth}
          className={cls}
          rx={0.02}
        />
      );
    }
    if (edge === 's') {
      return (
        <rect
          key={i}
          x={z.x + z.w * (t - stripeFrac * 0.35)}
          y={z.y + z.h * (1 - 0.06 - depth)}
          width={z.w * stripeFrac * 0.7}
          height={z.h * depth}
          className={cls}
          rx={0.02}
        />
      );
    }
    if (edge === 'w') {
      return (
        <rect
          key={i}
          x={z.x + z.w * 0.06}
          y={z.y + z.h * (t - stripeFrac * 0.35)}
          width={z.w * depth}
          height={z.h * stripeFrac * 0.7}
          className={cls}
          rx={0.02}
        />
      );
    }
    return (
      <rect
        key={i}
        x={z.x + z.w * (1 - 0.06 - depth)}
        y={z.y + z.h * (t - stripeFrac * 0.35)}
        width={z.w * depth}
        height={z.h * stripeFrac * 0.7}
        className={cls}
        rx={0.02}
      />
    );
  });

  return (
    <>
      {stripes}
      {light}
    </>
  );
};

/** Вафельная разметка box-junction в центре клетки. */
const WaffleJunctionArt: React.FC<{ z: NriMapZone; clipId: string }> = ({ z, clipId }) => {
  const inset = 0.2;
  const ix = z.x + z.w * inset;
  const iy = z.y + z.h * inset;
  const iw = z.w * (1 - inset * 2);
  const ih = z.h * (1 - inset * 2);
  const step = Math.min(iw, ih) / 4.5;
  return (
    <g className="nri-district-tile__waffle" pointerEvents="none" aria-hidden>
      <defs>
        <clipPath id={clipId}>
          <rect x={ix} y={iy} width={iw} height={ih} rx={0.04} />
        </clipPath>
      </defs>
      <rect x={ix} y={iy} width={iw} height={ih} className="nri-district-tile__waffle-box" rx={0.04} />
      <g clipPath={`url(#${clipId})`}>
        {Array.from({ length: 11 }, (_, i) => {
          const o = (i - 5) * step;
          return (
            <React.Fragment key={i}>
              <line
                x1={ix + o}
                y1={iy}
                x2={ix + o + ih}
                y2={iy + ih}
                className="nri-district-tile__waffle-line"
              />
              <line
                x1={ix + o}
                y1={iy + ih}
                x2={ix + o + ih}
                y2={iy}
                className="nri-district-tile__waffle-line"
              />
            </React.Fragment>
          );
        })}
      </g>
    </g>
  );
};

/** Тайл дороги: клетка = проезжая часть, простая читаемая разметка. */
const RoadTileArt: React.FC<{
  z: NriMapZone;
  links: EdgeFlags;
  core: 'h' | 'v' | 'both' | 'none';
  curb: EdgeFlags;
  crosswalkEdges: EdgeFlags;
  isCrossing?: boolean;
  isBridge?: boolean;
}> = ({ z, links, core, curb, crosswalkEdges, isCrossing, isBridge }) => {
  // Почти на всю клетку — без «пустых полей» по бокам.
  const band = isCrossing ? 0.78 : 0.72;
  const mid = (1 - band) / 2;
  const sidewalk = 0.07;
  const corner = !isCrossing ? roadCornerFromLinks(links) : null;
  const cx = z.x + z.w * 0.5;
  const cy = z.y + z.h * 0.5;
  const x0 = z.x;
  const y0 = z.y;
  const x1 = z.x + z.w;
  const y1 = z.y + z.h;
  const rx = z.w * 0.5;
  const ry = z.h * 0.5;
  /** Четверть-окружность по центру клетки (как оранжевая схема). */
  const cornerLaneD =
    corner === 'se'
      ? `M ${cx} ${y1} A ${rx} ${ry} 0 0 0 ${x1} ${cy}`
      : corner === 'sw'
        ? `M ${cx} ${y1} A ${rx} ${ry} 0 0 1 ${x0} ${cy}`
        : corner === 'ne'
          ? `M ${cx} ${y0} A ${rx} ${ry} 0 0 1 ${x1} ${cy}`
          : corner === 'nw'
            ? `M ${cx} ${y0} A ${rx} ${ry} 0 0 0 ${x0} ${cy}`
            : null;
  return (
    <>
      <rect x={z.x} y={z.y} width={z.w} height={z.h} className="nri-district-tile__asphalt" rx={0.06} />

      {/* Тонкий тротуар только у зданий — без жёлтой «разметки» */}
      {curb.n && (
        <rect
          x={z.x}
          y={z.y}
          width={z.w}
          height={z.h * sidewalk}
          className="nri-district-tile__street-sidewalk"
        />
      )}
      {curb.s && (
        <rect
          x={z.x}
          y={z.y + z.h * (1 - sidewalk)}
          width={z.w}
          height={z.h * sidewalk}
          className="nri-district-tile__street-sidewalk"
        />
      )}
      {curb.w && (
        <rect
          x={z.x}
          y={z.y}
          width={z.w * sidewalk}
          height={z.h}
          className="nri-district-tile__street-sidewalk"
        />
      )}
      {curb.e && (
        <rect
          x={z.x + z.w * (1 - sidewalk)}
          y={z.y}
          width={z.w * sidewalk}
          height={z.h}
          className="nri-district-tile__street-sidewalk"
        />
      )}

      {corner && cornerLaneD ? (
        <>
          {(corner === 'se' || corner === 'ne') && (
            <rect
              x={cx - z.w * 0.02}
              y={z.y + z.h * mid}
              width={z.w * (0.5 - mid + 0.02)}
              height={z.h * band}
              className="nri-district-tile__road-band"
              rx={0.03}
            />
          )}
          {(corner === 'sw' || corner === 'nw') && (
            <rect
              x={z.x + z.w * mid}
              y={z.y + z.h * mid}
              width={z.w * (0.5 - mid + 0.02)}
              height={z.h * band}
              className="nri-district-tile__road-band"
              rx={0.03}
            />
          )}
          {(corner === 'se' || corner === 'sw') && (
            <rect
              x={z.x + z.w * mid}
              y={cy - z.h * 0.02}
              width={z.w * band}
              height={z.h * (0.5 - mid + 0.02)}
              className="nri-district-tile__road-band"
              rx={0.03}
            />
          )}
          {(corner === 'ne' || corner === 'nw') && (
            <rect
              x={z.x + z.w * mid}
              y={z.y + z.h * mid}
              width={z.w * band}
              height={z.h * (0.5 - mid + 0.02)}
              className="nri-district-tile__road-band"
              rx={0.03}
            />
          )}
          <path d={cornerLaneD} fill="none" className="nri-district-tile__lane-yellow" />
        </>
      ) : !isCrossing ? (
        <>
          {(core === 'h' || core === 'both') && (
            <>
              <rect
                x={links.w ? z.x : z.x + z.w * 0.04}
                y={z.y + z.h * mid}
                width={links.w && links.e ? z.w : links.w || links.e ? z.w * 0.96 : z.w * 0.92}
                height={z.h * band}
                className="nri-district-tile__road-band"
                rx={0.03}
              />
              <>
                  <line
                    x1={z.x + z.w * 0.08}
                    y1={z.y + z.h * (mid + 0.03)}
                    x2={z.x + z.w * 0.92}
                    y2={z.y + z.h * (mid + 0.03)}
                    className="nri-district-tile__lane-white"
                  />
                  <line
                    x1={z.x + z.w * 0.08}
                    y1={z.y + z.h * (mid + band - 0.03)}
                    x2={z.x + z.w * 0.92}
                    y2={z.y + z.h * (mid + band - 0.03)}
                    className="nri-district-tile__lane-white"
                  />
                  <line
                    x1={links.w ? x0 : z.x + z.w * 0.08}
                    y1={cy}
                    x2={links.e ? x1 : z.x + z.w * 0.92}
                    y2={cy}
                    className="nri-district-tile__lane-yellow"
                  />
                </>
            </>
          )}
          {(core === 'v' || core === 'both') && (
            <>
              <rect
                x={z.x + z.w * mid}
                y={links.n ? z.y : z.y + z.h * 0.04}
                width={z.w * band}
                height={links.n && links.s ? z.h : links.n || links.s ? z.h * 0.96 : z.h * 0.92}
                className="nri-district-tile__road-band"
                rx={0.03}
              />
              <>
                  <line
                    x1={z.x + z.w * (mid + 0.03)}
                    y1={z.y + z.h * 0.08}
                    x2={z.x + z.w * (mid + 0.03)}
                    y2={z.y + z.h * 0.92}
                    className="nri-district-tile__lane-white"
                  />
                  <line
                    x1={z.x + z.w * (mid + band - 0.03)}
                    y1={z.y + z.h * 0.08}
                    x2={z.x + z.w * (mid + band - 0.03)}
                    y2={z.y + z.h * 0.92}
                    className="nri-district-tile__lane-white"
                  />
                  <line
                    x1={cx}
                    y1={links.n ? y0 : z.y + z.h * 0.08}
                    x2={cx}
                    y2={links.s ? y1 : z.y + z.h * 0.92}
                    className="nri-district-tile__lane-yellow"
                  />
                </>
            </>
          )}
        </>
      ) : null}
      {isCrossing && (
        <>
          <WaffleJunctionArt
            z={z}
            clipId={`waffle-${String(z.x).replace(/[^0-9a-z-]/gi, 'x')}-${String(z.y).replace(/[^0-9a-z-]/gi, 'x')}`}
          />
          {edgesFrom(links).map((edge) => (
            <CrosswalkAtEdge key={`xing-${edge}`} edge={edge} z={z} compact />
          ))}
        </>
      )}
      {isBridge && (
        <>
          <rect
            x={z.x + z.w * 0.1}
            y={z.y + z.h * 0.14}
            width={z.w * 0.8}
            height={z.h * 0.72}
            className="nri-district-tile__bridge-deck"
            rx={0.08}
          />
          <line
            x1={z.x + z.w * 0.12}
            y1={z.y + z.h * 0.18}
            x2={z.x + z.w * 0.88}
            y2={z.y + z.h * 0.18}
            className="nri-district-tile__bridge-rail"
          />
          <line
            x1={z.x + z.w * 0.12}
            y1={z.y + z.h * 0.82}
            x2={z.x + z.w * 0.88}
            y2={z.y + z.h * 0.82}
            className="nri-district-tile__bridge-rail"
          />
        </>
      )}
      {!isCrossing &&
        edgesFrom(crosswalkEdges).map((edge) => (
          <CrosswalkAtEdge key={`cw-${edge}`} edge={edge} z={z} />
        ))}
    </>
  );
};

/** Короткие неоновые вывески вместо одной красной полосы на всю ширину. */
const NeonSignStrip: React.FC<{
  z: NriMapZone;
  body: { x: number; y: number; w: number; h: number };
  zoneKey: string;
  chinatown: boolean;
  animationSlot: number | null;
}> = ({ z, body, zoneKey, chinatown, animationSlot }) => {
  let h = 0;
  for (let i = 0; i < zoneKey.length; i++) h = (h * 31 + zoneKey.charCodeAt(i)) | 0;
  const seed = Math.abs(h);
  const bx = z.x + z.w * body.x;
  const by = z.y + z.h * body.y;
  const bw = z.w * body.w;
  const bh = z.h * body.h;
  const y = by + bh * 0.08;
  const hBar = Math.max(0.14, z.h * 0.035);
  const palette = chinatown
    ? (['nri-district-tile__neon--amber', 'nri-district-tile__neon--magenta', 'nri-district-tile__neon--cyan'] as const)
    : (['nri-district-tile__neon--cyan', 'nri-district-tile__neon--magenta', 'nri-district-tile__neon--lime'] as const);
  const segs = [
    { x: 0.08 + (seed % 5) * 0.02, w: 0.22 + (seed % 3) * 0.04, c: palette[0]! },
    { x: 0.38 + ((seed >> 3) % 4) * 0.02, w: 0.16 + ((seed >> 2) % 3) * 0.03, c: palette[1]! },
    { x: 0.62 + ((seed >> 5) % 3) * 0.02, w: 0.2 + ((seed >> 4) % 2) * 0.04, c: palette[2]! },
  ];
  return (
    <g className="nri-district-tile__neon-group" pointerEvents="none">
      {segs.map((s, i) => (
        <rect
          key={i}
          x={bx + bw * s.x}
          y={y + (i === 1 ? hBar * 0.4 : 0)}
          width={bw * s.w}
          height={hBar}
          rx={0.04}
          className={animOn(animationSlot, `nri-district-tile__neon ${s.c}`)}
          style={animationSlot != null ? blinkStyle(seed, 30 + i * 7, 1.2, 2.4) : undefined}
        />
      ))}
    </g>
  );
};

/** Половина внутренней улочки + ларьки; с соседним тайлом складывается в проход. */
const InnerAlleyEdge: React.FC<{
  edge: Edge;
  z: NriMapZone;
  zoneKey: string;
}> = ({ edge, z, zoneKey }) => {
  let h = 0;
  for (let i = 0; i < zoneKey.length; i++) h = (h * 31 + zoneKey.charCodeAt(i)) | 0;
  const seed = Math.abs(h);
  const strip = 0.15;
  const stallW = edge === 'e' || edge === 'w' ? strip * 0.72 : 0.22;
  const stallH = edge === 'e' || edge === 'w' ? 0.18 : strip * 0.72;
  const neon = seed % 2 === 0 ? 'nri-district-tile__stall-neon--cyan' : 'nri-district-tile__stall-neon--magenta';
  const neon2 = seed % 3 === 0 ? 'nri-district-tile__stall-neon--lime' : 'nri-district-tile__stall-neon--amber';

  const path =
    edge === 'e' ? (
      <rect
        x={z.x + z.w * (1 - strip)}
        y={z.y}
        width={z.w * strip}
        height={z.h}
        className="nri-district-tile__alley"
      />
    ) : edge === 'w' ? (
      <rect x={z.x} y={z.y} width={z.w * strip} height={z.h} className="nri-district-tile__alley" />
    ) : edge === 'n' ? (
      <rect x={z.x} y={z.y} width={z.w} height={z.h * strip} className="nri-district-tile__alley" />
    ) : (
      <rect
        x={z.x}
        y={z.y + z.h * (1 - strip)}
        width={z.w}
        height={z.h * strip}
        className="nri-district-tile__alley"
      />
    );

  const stalls =
    edge === 'e' || edge === 'w'
      ? [
          { t: 0.18 + (seed % 5) * 0.04 },
          { t: 0.55 + ((seed >> 2) % 4) * 0.05 },
        ]
      : [
          { t: 0.2 + (seed % 4) * 0.05 },
          { t: 0.58 + ((seed >> 3) % 3) * 0.06 },
        ];

  return (
    <g className="nri-district-tile__alley-g" pointerEvents="none">
      {path}
      {stalls.map((s, i) => {
        const sx =
          edge === 'e'
            ? z.x + z.w * (1 - strip + 0.02)
            : edge === 'w'
              ? z.x + z.w * 0.02
              : z.x + z.w * s.t;
        const sy =
          edge === 'e' || edge === 'w'
            ? z.y + z.h * s.t
            : edge === 'n'
              ? z.y + z.h * 0.02
              : z.y + z.h * (1 - strip + 0.02);
        const sw = edge === 'e' || edge === 'w' ? z.w * stallW : z.w * stallW;
        const sh = edge === 'e' || edge === 'w' ? z.h * stallH : z.h * stallH;
        return (
          <g key={i}>
            <rect x={sx} y={sy} width={sw} height={sh} className="nri-district-tile__stall" rx={0.04} />
            <rect
              x={sx}
              y={sy}
              width={sw}
              height={Math.max(0.08, sh * 0.22)}
              className={`nri-district-tile__stall-neon ${i === 0 ? neon : neon2}`}
              rx={0.03}
            />
          </g>
        );
      })}
    </g>
  );
};

/** Асфальт вокруг корпуса здания (вырезаем body). */
const BuildingPad: React.FC<{
  z: NriMapZone;
  body: { x: number; y: number; w: number; h: number };
}> = ({ z, body }) => {
  const bx = z.x + z.w * body.x;
  const by = z.y + z.h * body.y;
  const bw = z.w * body.w;
  const bh = z.h * body.h;
  const d = [
    `M ${z.x} ${z.y} h ${z.w} v ${z.h} h ${-z.w} Z`,
    `M ${bx} ${by} h ${bw} v ${bh} h ${-bw} Z`,
  ].join(' ');
  return (
    <>
      <path d={d} fillRule="evenodd" className="nri-district-tile__street-fill" />
      <rect
        x={bx - z.w * 0.02}
        y={by - z.h * 0.02}
        width={bw + z.w * 0.04}
        height={bh + z.h * 0.04}
        className="nri-district-tile__building-pad"
        rx={0.12}
      />
    </>
  );
};

function NriDistrictTileInner({
  raw,
  z,
  districtStyle,
  gridRows,
  gridCols,
  neighborTypes,
  blockMega,
  corpLogo,
  corpName,
  isFocused,
  isHovered,
  dragFrom,
  dragOver,
  animationSlot,
  onMouseEnter,
  onMouseLeave,
  onClick,
  onDoubleClick,
}: Props) {
  const placeType = normalizePlaceType(raw.placeType ?? 'generic');
  const style = normalizeDistrictStyle(raw.districtStyle ?? districtStyle) ?? 'residential';
  const row = raw.gridRow ?? 0;
  const col = raw.gridCol ?? 0;
  const cid = clipId(raw.zoneKey);
  const isMegaCover = blockMega?.role === 'cover';
  const isMegaAnchor = blockMega?.role === 'anchor' && !!blockMega.span;
  const isMegaCell = isMegaCover || isMegaAnchor;
  const isLogoAnchor = corpLogo?.role === 'anchor' && !!corpLogo.span;
  /** Дороги в mega рисуем поклеточно — иначе разметка уезжает на стык bbox. */
  const isRoadSurfaceMega =
    isMegaCell &&
    (placeType === 'road' ||
      placeType === 'crossing' ||
      placeType === 'bridge' ||
      placeType === 'parking' ||
      blockMega?.kind === 'road' ||
      blockMega?.kind === 'crossing' ||
      blockMega?.kind === 'parking');
  const hideCellDecor = isMegaCell && !isRoadSurfaceMega;
  const rotDeg = typeof raw.rotation === 'number' ? raw.rotation : 0;
  const rotCx = z.x + z.w * 0.5;
  const rotCy = z.y + z.h * 0.5;
  const rotTransform = rotDeg ? `rotate(${rotDeg} ${rotCx} ${rotCy})` : undefined;

  const neighbors = useMemo(
    () => neighborsForTile(row, col, neighborTypes),
    [row, col, neighborTypes]
  );

  const visual = useMemo(
    () =>
      resolveTileVisual({
        placeType,
        districtStyle: style,
        zoneKey: raw.zoneKey,
        gridRow: row,
        gridCol: col,
        gridRows,
        gridCols,
        neighbors,
      }),
    [placeType, style, raw.zoneKey, row, col, gridRows, gridCols, neighbors]
  );

  const packed = visual.showBuilding && isPackedBuildingBlock(neighbors);
  const hasAlley =
    visual.innerAlleyEdges.n ||
    visual.innerAlleyEdges.s ||
    visual.innerAlleyEdges.e ||
    visual.innerAlleyEdges.w;
  const body = visual.showBuilding
    ? applyAlleyInsets(
        buildingBodyRect(visual.facadeDir, placeType, packed && !hasAlley),
        visual.innerAlleyEdges
      )
    : null;
  const spriteHref = districtTileSprite(placeType, raw.zoneKey, raw.artId);
  /** Полная клетка — иначе крошечный inset + неон = каша. */
  const openSprite = !!spriteHref && !hideCellDecor;
  const hasSprite = openSprite;
  /** Спрайт уже читается — микродекор только шумит на сетке. */
  const quietDecor = hasSprite;

  return (
    <g
      data-zone-key={raw.zoneKey}
      className={`nri-city-map__zone-g nri-city-map__zone-g--tile${visual.softBlend ? ' nri-city-map__zone-g--soft' : ''}${
        dragFrom ? ' nri-city-map__zone-g--drag-from' : ''
      }${dragOver ? ' nri-city-map__zone-g--drag-over' : ''}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      <clipPath id={cid}>
        <rect x={z.x + 0.04} y={z.y + 0.04} width={z.w - 0.08} height={z.h - 0.08} rx={0.15} />
      </clipPath>

      <rect
        x={z.x}
        y={z.y}
        width={z.w}
        height={z.h}
        className={`nri-district-tile ${visual.patternClass}${visual.edgeFade ? ' nri-district-tile--exit' : ''}${
          hideCellDecor ? ' nri-district-tile--plaza-mega-cell' : ''
        }`}
        rx={hideCellDecor ? 0 : visual.softBlend ? 0.35 : 0.15}
        stroke={hideCellDecor ? 'none' : undefined}
        strokeWidth={hideCellDecor ? 0 : undefined}
        fill={hideCellDecor ? 'transparent' : undefined}
        filter={
          hideCellDecor
            ? undefined
            : isFocused || isHovered
              ? 'url(#nc-glow)'
              : undefined
        }
      />

      <g
        clipPath={`url(#${cid})`}
        pointerEvents="none"
        transform={rotTransform}
      >
        {!hideCellDecor && visual.fillPatternId && (
          <rect
            x={z.x}
            y={z.y}
            width={z.w}
            height={z.h}
            className="nri-district-tile__tex"
            fill={`url(#${visual.fillPatternId})`}
          />
        )}

        {!hideCellDecor && visual.showBuilding && body && !hasSprite && (!packed || hasAlley) && (
          <BuildingPad z={z} body={body} />
        )}

        {!hideCellDecor &&
          !quietDecor &&
          edgesFrom(visual.innerAlleyEdges).map((edge) => (
            <InnerAlleyEdge key={`alley-${edge}`} edge={edge} z={z} zoneKey={raw.zoneKey} />
          ))}

        {!hideCellDecor && visual.roadCore !== 'none' && (
          <RoadTileArt
            z={z}
            links={visual.roadLinks}
            core={visual.roadCore}
            curb={visual.roadCurb}
            crosswalkEdges={visual.crosswalkEdges}
            isCrossing={placeType === 'crossing'}
            isBridge={placeType === 'bridge'}
          />
        )}

        {!hideCellDecor &&
          !quietDecor &&
          visual.showBuilding &&
          edgesFrom(visual.buildingGutter).map((edge) => (
            <StreetEdge
              key={`gutter-${edge}`}
              edge={edge}
              z={z}
              wide={
                (edge === 'n' && visual.streetFront.n) ||
                (edge === 's' && visual.streetFront.s) ||
                (edge === 'e' && visual.streetFront.e) ||
                (edge === 'w' && visual.streetFront.w)
              }
            />
          ))}

        {openSprite && (
          <image
            href={spriteHref!}
            x={z.x + z.w * 0.04}
            y={z.y + z.h * 0.04}
            width={z.w * 0.92}
            height={z.h * 0.92}
            preserveAspectRatio="xMidYMid meet"
            className="nri-district-tile__sprite nri-district-tile__sprite--open"
          />
        )}

        {placeType === 'plaza' && !hideCellDecor && !quietDecor && (
          <PlazaCellArt z={{ x: z.x, y: z.y, w: z.w, h: z.h }} />
        )}

        {placeType === 'corp_annex' && !hideCellDecor && (
          <CorpAnnexArt z={{ x: z.x, y: z.y, w: z.w, h: z.h }} corpName={corpName} />
        )}

        {!hideCellDecor && body && !spriteHref && (
          <>
            <rect
              x={z.x + z.w * body.x}
              y={z.y + z.h * body.y}
              width={z.w * body.w}
              height={z.h * body.h}
              className={`nri-district-tile__building nri-district-tile__building--${placeType}`}
              fill={`url(#ndi-bld-${placeType === 'generic' ? 'generic' : placeType})`}
              rx={0.12}
            />
            {visual.showFacade && visual.facadeDir && (
              <rect
                x={
                  visual.facadeDir === 'n' || visual.facadeDir === 's'
                    ? z.x + z.w * (body.x + body.w * 0.1)
                    : visual.facadeDir === 'w'
                      ? z.x + z.w * body.x
                      : z.x + z.w * (body.x + body.w * 0.78)
                }
                y={
                  visual.facadeDir === 'n'
                    ? z.y + z.h * body.y
                    : visual.facadeDir === 's'
                      ? z.y + z.h * (body.y + body.h * 0.78)
                      : z.y + z.h * (body.y + body.h * 0.12)
                }
                width={
                  visual.facadeDir === 'n' || visual.facadeDir === 's'
                    ? z.w * body.w * 0.8
                    : z.w * body.w * 0.2
                }
                height={
                  visual.facadeDir === 'e' || visual.facadeDir === 'w'
                    ? z.h * body.h * 0.76
                    : z.h * body.h * 0.2
                }
                className={`nri-district-tile__facade nri-district-tile__facade--${placeType}`}
                rx={0.06}
              />
            )}
          </>
        )}

        {visual.exitGap && (
          <>
            <rect x={z.x} y={z.y} width={z.w} height={z.h} className="nri-district-tile__exit-frame" />
            {visual.exitGap === 'n' && (
              <rect
                x={z.x + z.w * 0.34}
                y={z.y + z.h * 0.05}
                width={z.w * 0.32}
                height={z.h * 0.45}
                className="nri-district-tile__exit-gap"
              />
            )}
            {visual.exitGap === 's' && (
              <rect
                x={z.x + z.w * 0.34}
                y={z.y + z.h * 0.5}
                width={z.w * 0.32}
                height={z.h * 0.45}
                className="nri-district-tile__exit-gap"
              />
            )}
            {visual.exitGap === 'w' && (
              <rect
                x={z.x + z.w * 0.05}
                y={z.y + z.h * 0.34}
                width={z.w * 0.45}
                height={z.h * 0.32}
                className="nri-district-tile__exit-gap"
              />
            )}
            {visual.exitGap === 'e' && (
              <rect
                x={z.x + z.w * 0.5}
                y={z.y + z.h * 0.34}
                width={z.w * 0.45}
                height={z.h * 0.32}
                className="nri-district-tile__exit-gap"
              />
            )}
          </>
        )}

        {visual.styleAccents.includes('chinatown_lantern') && !quietDecor && (
          <>
            <circle
              cx={z.x + z.w * 0.2}
              cy={z.y + z.h * 0.16}
              r={Math.min(z.w, z.h) * 0.07}
              className={animOn(animationSlot, 'nri-district-tile__lantern')}
              style={
                animationSlot != null ? blinkStyle(hashSeed(raw.zoneKey), 51, 1.4, 2.2) : undefined
              }
            />
            <circle
              cx={z.x + z.w * 0.8}
              cy={z.y + z.h * 0.16}
              r={Math.min(z.w, z.h) * 0.07}
              className={animOn(animationSlot, 'nri-district-tile__lantern')}
              style={
                animationSlot != null ? blinkStyle(hashSeed(raw.zoneKey), 58, 1.6, 2.6) : undefined
              }
            />
          </>
        )}

        {!quietDecor && !hideCellDecor && visual.decor.includes('tree') && (
          <circle
            cx={z.x + z.w * 0.5}
            cy={z.y + z.h * 0.45}
            r={Math.min(z.w, z.h) * 0.16}
            className={animOn(animationSlot, 'nri-district-tile__tree')}
            style={
              animationSlot != null ? blinkStyle(hashSeed(raw.zoneKey), 71, 3.2, 3.5) : undefined
            }
          />
        )}
        {!quietDecor && !hideCellDecor && visual.decor.includes('trash') && (
          <rect
            x={z.x + z.w * 0.12}
            y={z.y + z.h * 0.78}
            width={z.w * 0.08}
            height={z.h * 0.1}
            className="nri-district-tile__trash"
          />
        )}
        {!quietDecor && !hideCellDecor && visual.decor.includes('homeless') && (
          <ellipse
            cx={z.x + z.w * 0.75}
            cy={z.y + z.h * 0.82}
            rx={z.w * 0.1}
            ry={z.h * 0.06}
            className="nri-district-tile__homeless"
          />
        )}
        {!quietDecor && !hideCellDecor && visual.decor.includes('drunk') && (
          <ellipse
            cx={z.x + z.w * 0.22}
            cy={z.y + z.h * 0.72}
            rx={z.w * 0.08}
            ry={z.h * 0.05}
            className="nri-district-tile__drunk"
          />
        )}
        {!quietDecor && !hideCellDecor && visual.decor.includes('cyber_junk') && (
          <rect
            x={z.x + z.w * 0.65}
            y={z.y + z.h * 0.72}
            width={z.w * 0.1}
            height={z.h * 0.08}
            className="nri-district-tile__cyber-junk"
            rx={0.03}
          />
        )}
        {!quietDecor && !hideCellDecor && visual.animate.includes('neon') && body && (
          <NeonSignStrip
            z={z}
            body={body}
            zoneKey={raw.zoneKey}
            chinatown={visual.neonVariant === 'chinatown'}
            animationSlot={animationSlot}
          />
        )}
        {!quietDecor && !hideCellDecor && visual.animate.includes('neon') && !body && openSprite && (
          <NeonSignStrip
            z={z}
            body={{ x: 0.06, y: 0.06, w: 0.88, h: 0.88 }}
            zoneKey={raw.zoneKey}
            chinatown={visual.neonVariant === 'chinatown'}
            animationSlot={animationSlot}
          />
        )}
        {!quietDecor && !hideCellDecor && visual.animate.includes('windows') && body && (
          <>
            <rect
              x={z.x + z.w * (body.x + body.w * 0.2)}
              y={z.y + z.h * (body.y + body.h * 0.25)}
              width={z.w * body.w * 0.12}
              height={z.h * body.h * 0.1}
              className={animOn(animationSlot, 'nri-district-tile__window')}
              style={
                animationSlot != null ? blinkStyle(hashSeed(raw.zoneKey), 81, 2.4, 3.2) : undefined
              }
            />
            <rect
              x={z.x + z.w * (body.x + body.w * 0.58)}
              y={z.y + z.h * (body.y + body.h * 0.25)}
              width={z.w * body.w * 0.12}
              height={z.h * body.h * 0.1}
              className={animOn(animationSlot, 'nri-district-tile__window nri-district-tile__window--violet')}
              style={
                animationSlot != null ? blinkStyle(hashSeed(raw.zoneKey), 89, 2.8, 3.6) : undefined
              }
            />
          </>
        )}

        {!hideCellDecor && (
          <NriDistrictNightFx
            z={{ x: z.x, y: z.y, w: z.w, h: z.h }}
            zoneKey={raw.zoneKey}
            roadish={
              placeType === 'road' ||
              placeType === 'crossing' ||
              placeType === 'bridge' ||
              placeType === 'parking'
            }
          />
        )}
      </g>

      {/* Mega art must NOT be clipPath'd to a single cell — span covers 2×2 / 3×3 / … */}
      {isMegaAnchor && blockMega?.span && !isRoadSurfaceMega && (
        <g
          className="nri-district-tile__mega-layer"
          pointerEvents="none"
          aria-hidden
          transform={
            rotDeg && blockMega.span
              ? `rotate(${rotDeg} ${blockMega.span.x + blockMega.span.w / 2} ${blockMega.span.y + blockMega.span.h / 2})`
              : undefined
          }
        >
          {blockMega.kind === 'plaza' && <PlazaMegaArt span={blockMega.span} />}
          {blockMega.kind === 'shack' && <ShackMegaArt span={blockMega.span} />}
          {blockMega.kind === 'corp_hq' && <CorpHqMegaArt span={blockMega.span} corpName={corpName} />}
          {blockMega.kind === 'corp_office' && (
            <CorpOfficeMegaArt span={blockMega.span} corpName={corpName} />
          )}
          {blockMega.kind !== 'plaza' &&
            blockMega.kind !== 'shack' &&
            blockMega.kind !== 'corp_hq' &&
            blockMega.kind !== 'corp_office' && (
              <MergeMegaArt span={blockMega.span} placeType={blockMega.kind} />
            )}
        </g>
      )}
      {isLogoAnchor && corpLogo?.span && (
        <g
          className="nri-district-tile__logo-layer"
          pointerEvents="none"
          aria-hidden
          transform={
            rotDeg && corpLogo.span
              ? `rotate(${rotDeg} ${corpLogo.span.x + corpLogo.span.w / 2} ${corpLogo.span.y + corpLogo.span.h / 2})`
              : undefined
          }
        >
          <CorpLogoOverlayArt span={corpLogo.span} themeId={corpLogo.themeId} opacity={0.5} />
        </g>
      )}
    </g>
  );
}

export const NriDistrictTile = React.memo(NriDistrictTileInner);
