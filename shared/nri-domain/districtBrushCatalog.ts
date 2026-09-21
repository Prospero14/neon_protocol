/** Каталог кистей квартала: тип × форма + визуальные лого-лейауты. */

import { PLACE_TYPE_LABELS, PLACE_TYPES, type PlaceType } from './districtGrid.js';
import {
  isMegaMergeType,
  MEGA_MERGE_TYPES,
  shapeCellOffsets,
  type MegaShape,
} from './districtMegaMerge.js';
import {
  CORP_LOGO_SHAPES,
  CORP_LOGO_THEME_OPTIONS,
  corpLogoCellOffsets,
  type CorpLogoShape,
} from './corpLogoOverlay.js';

export type DistrictBrushShape = '1x1' | MegaShape;

export type DistrictBrush = {
  id: string;
  kind: 'tile' | 'logo' | 'select';
  placeType: PlaceType;
  shape: DistrictBrushShape;
  label: string;
  sectionId: string;
  /** logo brushes only */
  logoThemeId?: string;
};

export type DistrictBrushSection = {
  id: string;
  label: string;
  shapes: DistrictBrushShape[];
  mode: 'tile' | 'logo' | 'tool';
};

export const SELECT_BRUSH_ID = 'tool:select';

export const SELECT_BRUSH: DistrictBrush = {
  id: SELECT_BRUSH_ID,
  kind: 'select',
  placeType: 'generic',
  shape: '1x1',
  label: 'Выделение',
  sectionId: 'tools',
};

export function isSelectBrush(b: DistrictBrush | null | undefined): boolean {
  return !!b && (b.kind === 'select' || b.id === SELECT_BRUSH_ID);
}

export const DISTRICT_BRUSH_SECTIONS: DistrictBrushSection[] = [
  { id: 'tools', label: 'Инструменты', shapes: ['1x1'], mode: 'tool' },
  { id: '1x1', label: '1×1', shapes: ['1x1'], mode: 'tile' },
  { id: '2x1', label: '2×1 / 1×2', shapes: ['2x1', '1x2'], mode: 'tile' },
  { id: '2x2', label: '2×2', shapes: ['2x2'], mode: 'tile' },
  { id: '3x3', label: '3×3', shapes: ['3x3'], mode: 'tile' },
  { id: '4x4', label: '4×4', shapes: ['4x4'], mode: 'tile' },
  { id: '6x6', label: '6×6', shapes: ['6x6'], mode: 'tile' },
  {
    id: 'corners',
    label: 'Уголки',
    shapes: ['corner_se', 'corner_sw', 'corner_ne', 'corner_nw'],
    mode: 'tile',
  },
  { id: 'cross', label: 'Крест', shapes: ['cross'], mode: 'tile' },
  { id: 'logo-1x1', label: 'Лого 1×1', shapes: ['1x1'], mode: 'logo' },
  { id: 'logo-2x1', label: 'Лого 2×1/1×2', shapes: ['2x1', '1x2'], mode: 'logo' },
  { id: 'logo-2x2', label: 'Лого 2×2', shapes: ['2x2'], mode: 'logo' },
  { id: 'logo-3x3', label: 'Лого 3×3', shapes: ['3x3'], mode: 'logo' },
  { id: 'logo-6x6', label: 'Лого 6×6', shapes: ['6x6'], mode: 'logo' },
];

export function logoSectionIdForShape(shape: DistrictBrushShape): string {
  if (shape === '1x1') return 'logo-1x1';
  if (shape === '2x1' || shape === '1x2') return 'logo-2x1';
  if (shape === '2x2') return 'logo-2x2';
  if (shape === '3x3') return 'logo-3x3';
  if (shape === '6x6') return 'logo-6x6';
  return 'logo-1x1';
}

export const BRUSH_SHAPE_LABELS: Record<string, string> = {
  '1x1': '1×1',
  '2x1': '2×1',
  '1x2': '1×2',
  '2x2': '2×2',
  '3x3': '3×3',
  '4x4': '4×4',
  '6x6': '6×6',
  corner_se: 'Угол ⌞',
  corner_sw: 'Угол ⌝',
  corner_ne: 'Угол ⌟',
  corner_nw: 'Угол ⌜',
  cross: 'Крест +',
};

const SINGLE_TYPES: PlaceType[] = PLACE_TYPES.filter((t) => t !== 'exit');

function tileBrushId(placeType: string, shape: DistrictBrushShape): string {
  return `tile:${placeType}:${shape}`;
}

function logoBrushId(themeId: string, shape: CorpLogoShape): string {
  return `logo:${themeId}:${shape}`;
}

export function parseDistrictBrushId(id: string): DistrictBrush | null {
  if (id === SELECT_BRUSH_ID || id === 'select') return SELECT_BRUSH;
  if (id.startsWith('logo:')) {
    const parts = id.split(':');
    if (parts.length !== 3) return null;
    const themeId = parts[1]!;
    const shape = parts[2]!;
    if (!(CORP_LOGO_SHAPES as readonly string[]).includes(shape)) return null;
    const theme = CORP_LOGO_THEME_OPTIONS.find((t) => t.id === themeId);
    const shapeLabel = BRUSH_SHAPE_LABELS[shape] ?? shape;
    const shapeTyped = shape as DistrictBrushShape;
    return {
      id,
      kind: 'logo',
      placeType: 'generic',
      shape: shapeTyped,
      logoThemeId: themeId,
      label: `${theme?.label ?? themeId} · ${shapeLabel}`,
      sectionId: logoSectionIdForShape(shapeTyped),
    };
  }
  // legacy id `placeType:shape` or `tile:placeType:shape`
  let placeType: string;
  let shape: string;
  if (id.startsWith('tile:')) {
    const parts = id.split(':');
    if (parts.length !== 3) return null;
    placeType = parts[1]!;
    shape = parts[2]!;
  } else {
    const i = id.lastIndexOf(':');
    if (i <= 0) return null;
    placeType = id.slice(0, i);
    shape = id.slice(i + 1);
  }
  if (!(PLACE_TYPES as readonly string[]).includes(placeType)) return null;
  if (!(shape in BRUSH_SHAPE_LABELS)) return null;
  if (shape !== '1x1' && !isMegaMergeType(placeType)) return null;
  const section = DISTRICT_BRUSH_SECTIONS.find((s) => s.mode === 'tile' && s.shapes.includes(shape as DistrictBrushShape));
  return {
    id: tileBrushId(placeType, shape as DistrictBrushShape),
    kind: 'tile',
    placeType: placeType as PlaceType,
    shape: shape as DistrictBrushShape,
    label: `${PLACE_TYPE_LABELS[placeType as PlaceType]} · ${BRUSH_SHAPE_LABELS[shape]}`,
    sectionId: section?.id ?? '1x1',
  };
}

export function buildDistrictBrushCatalog(): DistrictBrush[] {
  const out: DistrictBrush[] = [];
  for (const section of DISTRICT_BRUSH_SECTIONS) {
    if (section.mode === 'tool') {
      out.push(SELECT_BRUSH);
      continue;
    }
    if (section.mode === 'logo') {
      for (const shape of section.shapes) {
        if (!(CORP_LOGO_SHAPES as readonly string[]).includes(shape)) continue;
        for (const theme of CORP_LOGO_THEME_OPTIONS) {
          out.push({
            id: logoBrushId(theme.id, shape as CorpLogoShape),
            kind: 'logo',
            placeType: 'generic',
            shape,
            logoThemeId: theme.id,
            label: `${theme.label} · ${BRUSH_SHAPE_LABELS[shape]}`,
            sectionId: section.id,
          });
        }
      }
      continue;
    }
    for (const shape of section.shapes) {
      const types: PlaceType[] =
        shape === '1x1' ? SINGLE_TYPES : ([...MEGA_MERGE_TYPES] as PlaceType[]);
      for (const placeType of types) {
        if (shape !== '1x1' && !isMegaMergeType(placeType)) continue;
        out.push({
          id: tileBrushId(placeType, shape),
          kind: 'tile',
          placeType,
          shape,
          label: `${PLACE_TYPE_LABELS[placeType]} · ${BRUSH_SHAPE_LABELS[shape]}`,
          sectionId: section.id,
        });
      }
    }
  }
  return out;
}

export function brushesForSection(sectionId: string, query = ''): DistrictBrush[] {
  const q = query.trim().toLowerCase();
  return buildDistrictBrushCatalog().filter((b) => {
    if (b.sectionId !== sectionId) return false;
    if (!q) return true;
    return (
      b.label.toLowerCase().includes(q) ||
      b.placeType.toLowerCase().includes(q) ||
      (b.logoThemeId?.toLowerCase().includes(q) ?? false)
    );
  });
}

export function brushCellOffsets(
  shape: DistrictBrushShape
): ReadonlyArray<readonly [number, number]> {
  if (shape === '1x1') return [[0, 0]];
  if ((CORP_LOGO_SHAPES as readonly string[]).includes(shape)) {
    return corpLogoCellOffsets(shape as CorpLogoShape);
  }
  return shapeCellOffsets(shape);
}

const CORNER_CYCLE: DistrictBrushShape[] = [
  'corner_se',
  'corner_ne',
  'corner_nw',
  'corner_sw',
];

/** Поворот формы кисти на 90° (2×1↔1×2, уголки по кругу). Квадраты без изменений. */
export function rotateDistrictBrushShape(
  shape: DistrictBrushShape,
  dir: 1 | -1
): DistrictBrushShape {
  if (shape === '2x1') return '1x2';
  if (shape === '1x2') return '2x1';
  const ci = CORNER_CYCLE.indexOf(shape);
  if (ci >= 0) {
    const next = (ci + dir + CORNER_CYCLE.length) % CORNER_CYCLE.length;
    return CORNER_CYCLE[next]!;
  }
  return shape;
}

export function withRotatedDistrictBrush(
  brush: DistrictBrush,
  dir: 1 | -1
): DistrictBrush {
  const nextShape = rotateDistrictBrushShape(brush.shape, dir);
  if (nextShape === brush.shape) return brush;
  if (brush.kind === 'logo') {
    return (
      parseDistrictBrushId(`logo:${brush.logoThemeId ?? 'default'}:${nextShape}`) ?? brush
    );
  }
  return parseDistrictBrushId(`tile:${brush.placeType}:${nextShape}`) ?? brush;
}

export function districtBrushRotatesShape(shape: DistrictBrushShape): boolean {
  return shape === '2x1' || shape === '1x2' || CORNER_CYCLE.includes(shape);
}

/** @deprecated use districtBrushRotatesShape — колесо крутит любую кисть */
export function districtBrushCanRotate(shape: DistrictBrushShape): boolean {
  return districtBrushRotatesShape(shape);
}

export function nextBrushOrientation(cur: number, dir: 1 | -1): number {
  return (((Math.round(cur / 90) * 90 + dir * 90) % 360) + 360) % 360;
}
