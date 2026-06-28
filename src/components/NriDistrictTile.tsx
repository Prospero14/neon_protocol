import React, { useMemo } from 'react';
import type { NriMapZone } from '../logic/nriApi';
import {
  neighborsForTile,
  normalizeDistrictStyle,
  normalizePlaceType,
  PLACE_TYPE_LABELS,
  type PlaceType,
} from '../../shared/nri-domain/districtGrid';
import {
  buildingBodyRect,
  resolveTileVisual,
  type EdgeFlags,
} from '../../shared/nri-domain/districtTileVisual';
import { districtTileSprite } from '../../shared/nri-domain/districtTileSprites';

type Props = {
  raw: NriMapZone;
  z: NriMapZone;
  districtStyle: string;
  gridRows: number;
  gridCols: number;
  neighborTypes: Map<string, PlaceType>;
  isFocused: boolean;
  isHovered: boolean;
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

const StreetEdge: React.FC<{ edge: 'n' | 's' | 'e' | 'w'; z: NriMapZone }> = ({ edge, z }) => {
  const road = 0.1;
  const walk = 0.04;
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
    </>
  );
};

function streetEdges(front: EdgeFlags): Array<'n' | 's' | 'e' | 'w'> {
  const out: Array<'n' | 's' | 'e' | 'w'> = [];
  if (front.n) out.push('n');
  if (front.s) out.push('s');
  if (front.e) out.push('e');
  if (front.w) out.push('w');
  return out;
}

function NriDistrictTileInner({
  raw,
  z,
  districtStyle,
  gridRows,
  gridCols,
  neighborTypes,
  isFocused,
  isHovered,
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
        neighbors: neighborsForTile(row, col, neighborTypes),
      }),
    [placeType, style, raw.zoneKey, row, col, gridRows, gridCols, neighborTypes]
  );

  const body = visual.showBuilding ? buildingBodyRect(visual.facadeDir, placeType) : null;
  const spriteHref = visual.showBuilding ? districtTileSprite(placeType) : null;

  const isDefaultName = /^Клетка \d+\.\d+$/.test(raw.name);
  const labelText = !isDefaultName
    ? raw.name
    : placeType !== 'generic'
      ? PLACE_TYPE_LABELS[placeType]
      : '';
  const showLabel = z.w > 3.5 && z.h > 2.8 && labelText.length > 0;

  return (
    <g
      data-zone-key={raw.zoneKey}
      className={`nri-city-map__zone-g nri-city-map__zone-g--tile${visual.softBlend ? ' nri-city-map__zone-g--soft' : ''}`}
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
        className={`nri-district-tile ${visual.patternClass}${visual.edgeFade ? ' nri-district-tile--exit' : ''}`}
        rx={visual.softBlend ? 0.35 : 0.15}
        filter={isFocused || isHovered ? 'url(#nc-glow)' : undefined}
      />

      <g clipPath={`url(#${cid})`} pointerEvents="none">
        {visual.fillPatternId && (
          <rect
            x={z.x}
            y={z.y}
            width={z.w}
            height={z.h}
            className="nri-district-tile__tex"
            fill={`url(#${visual.fillPatternId})`}
          />
        )}

        {spriteHref && (
          <image
            href={spriteHref}
            x={z.x}
            y={z.y}
            width={z.w}
            height={z.h}
            preserveAspectRatio="xMidYMid slice"
            className="nri-district-tile__sprite"
          />
        )}

        {visual.showBuilding &&
          streetEdges(visual.streetFront).map((edge) => (
            <StreetEdge key={edge} edge={edge} z={z} />
          ))}

        {visual.roadCore !== 'none' && (
          <>
            {(visual.roadCore === 'h' || visual.roadCore === 'both') && (
              <rect
                x={z.x + z.w * 0.1}
                y={z.y + z.h * 0.42}
                width={z.w * 0.8}
                height={z.h * 0.16}
                className="nri-district-tile__road-core"
                rx={0.05}
              />
            )}
            {(visual.roadCore === 'v' || visual.roadCore === 'both') && (
              <rect
                x={z.x + z.w * 0.42}
                y={z.y + z.h * 0.1}
                width={z.w * 0.16}
                height={z.h * 0.8}
                className="nri-district-tile__road-core"
                rx={0.05}
              />
            )}
          </>
        )}

        {body && !spriteHref && (
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

        {visual.styleAccents.includes('chinatown_lantern') && (
          <>
            <circle
              cx={z.x + z.w * 0.2}
              cy={z.y + z.h * 0.16}
              r={Math.min(z.w, z.h) * 0.07}
              className={animOn(animationSlot, 'nri-district-tile__lantern')}
            />
            <circle
              cx={z.x + z.w * 0.8}
              cy={z.y + z.h * 0.16}
              r={Math.min(z.w, z.h) * 0.07}
              className={animOn(animationSlot, 'nri-district-tile__lantern')}
            />
          </>
        )}

        {visual.decor.includes('car') && (
          <rect
            x={z.x + z.w * 0.28}
            y={z.y + z.h * 0.54}
            width={z.w * 0.3}
            height={z.h * 0.12}
            className={animOn(animationSlot, 'nri-district-tile__car')}
            rx={0.06}
          />
        )}
        {visual.decor.includes('tree') && (
          <circle
            cx={z.x + z.w * 0.5}
            cy={z.y + z.h * 0.45}
            r={Math.min(z.w, z.h) * 0.16}
            className={animOn(animationSlot, 'nri-district-tile__tree')}
          />
        )}
        {visual.decor.includes('trash') && (
          <rect
            x={z.x + z.w * 0.12}
            y={z.y + z.h * 0.78}
            width={z.w * 0.08}
            height={z.h * 0.1}
            className="nri-district-tile__trash"
          />
        )}
        {visual.decor.includes('homeless') && (
          <ellipse
            cx={z.x + z.w * 0.75}
            cy={z.y + z.h * 0.82}
            rx={z.w * 0.1}
            ry={z.h * 0.06}
            className="nri-district-tile__homeless"
          />
        )}
        {visual.decor.includes('drunk') && (
          <ellipse
            cx={z.x + z.w * 0.22}
            cy={z.y + z.h * 0.72}
            rx={z.w * 0.08}
            ry={z.h * 0.05}
            className="nri-district-tile__drunk"
          />
        )}
        {visual.decor.includes('cyber_junk') && (
          <rect
            x={z.x + z.w * 0.65}
            y={z.y + z.h * 0.72}
            width={z.w * 0.1}
            height={z.h * 0.08}
            className="nri-district-tile__cyber-junk"
            rx={0.03}
          />
        )}
        {visual.animate.includes('neon') && body && !spriteHref && (
          <rect
            x={z.x + z.w * (body.x + body.w * 0.08)}
            y={z.y + z.h * (visual.facadeDir === 'n' ? body.y + 0.02 : body.y + body.h * 0.1)}
            width={z.w * body.w * 0.84}
            height={Math.max(0.22, z.h * 0.05)}
            className={
              visual.neonVariant === 'chinatown'
                ? animOn(animationSlot, 'nri-district-tile__neon nri-district-tile__neon--chinatown')
                : animOn(animationSlot, 'nri-district-tile__neon')
            }
            rx={0.03}
          />
        )}
        {visual.animate.includes('windows') && body && !spriteHref && (
          <>
            <rect
              x={z.x + z.w * (body.x + body.w * 0.2)}
              y={z.y + z.h * (body.y + body.h * 0.25)}
              width={z.w * body.w * 0.12}
              height={z.h * body.h * 0.1}
              className={animOn(animationSlot, 'nri-district-tile__window')}
            />
            <rect
              x={z.x + z.w * (body.x + body.w * 0.58)}
              y={z.y + z.h * (body.y + body.h * 0.25)}
              width={z.w * body.w * 0.12}
              height={z.h * body.h * 0.1}
              className={animOn(animationSlot, 'nri-district-tile__window nri-district-tile__window--violet')}
            />
          </>
        )}
      </g>

      {showLabel && (
        <text
          x={z.x + z.w / 2}
          y={z.y + z.h - 0.35}
          textAnchor="middle"
          className="nri-district-tile__label"
        >
          {labelText.length > 16 ? `${labelText.slice(0, 14)}…` : labelText}
        </text>
      )}
    </g>
  );
}

export const NriDistrictTile = React.memo(NriDistrictTileInner);
