import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, MapPin, Minus, Plus, RotateCcw, Trash2 } from 'lucide-react';
import {
  nriCreateMapMarker,
  nriCreateMapSubZone,
  nriDeleteMapMarker,
  nriDeleteMapSubZone,
  nriFetchMapMarkers,
  nriFetchMapPositions,
  nriFetchMapZones,
  nriFallbackCityZones,
  applyCanonCityGeometry,
  nriFallbackDistrictTiles,
  nriFetchVehicles,
  nriMoveToZone,
  nriPatchMapZone,
  type NriMapMarker,
  type NriMapZone,
  type NriMapView,
  type NriPlayerPosition,
  type NriTableVehicle,
} from '../logic/nriApi';
import {
  DISTRICT_TYPE_LABELS,
  getMegaClusters,
  megaFromZoneKey,
  megaKeyFromZoneKey,
  ZONE_TYPE_DEFAULT_COLORS,
  zoneDisplayColor,
  zoneRectPaint,
  type NeonCityDistrictType,
} from '../logic/nriNeonCityMap';
import { resolveZoneIconHref } from '../../shared/nri-domain/zoneIcons';
import { NriCityMapDefs } from './NriCityMapDefs';
import { megaWatermarkFontSize, zoneTexturePatternId, zoneTypeUsesTexture } from '../logic/nriCityMapVisual';
import { NriCityOverviewZone } from './NriCityOverviewZone';
import { NriCityDistrictCard } from './NriCityDistrictCard';
import { NriCityMapSkyline } from './NriCityMapSkyline';
import { NriCityMapZoneDecor } from './NriCityMapZoneDecor';
import { getVehicleDef } from '../logic/nriVehicles';
import { readNeonAuthToken } from '../logic/authTokenStorage';
import { useAuth } from '../logic/AuthContext';
import { canDrillIntoDistrict, isSubMapZoneKey } from '../../shared/nri-domain/mapZones';
import {
  DISTRICT_STYLE_LABELS,
  DISTRICT_STYLES,
  defaultDistrictStyle,
  normalizeDistrictStyle,
  normalizePlaceType,
  parseSubTileGrid,
  PLACE_TYPE_LABELS,
  PLACE_TYPES,
  type DistrictStyle,
  type PlaceType,
} from '../../shared/nri-domain/districtGrid';
import { resolveCityScale } from '../../shared/nri-domain/cityScale';
import { NriCityDistrictDossier } from './NriCityDistrictDossier';
import { zoneOverviewRect } from '../logic/nriCityMapVisual';
import { DISTRICT_DRILL_CANVAS, relayoutDistrictGridTiles } from '../logic/nriNeonCitySubzonesGen';
import { NriDistrictTile } from './NriDistrictTile';
import { NriDistrictTileDefs } from './NriDistrictTileDefs';
import { resolveTileVisual, tileAnimationCost } from '../../shared/nri-domain/districtTileVisual';
import { neighborsForTile } from '../../shared/nri-domain/districtGrid';

type Props = {
  inviteCode: string;
  isHost: boolean;
  currentUserId: string;
  onNewAchievements?: (unlocks: import('../logic/nriApi').NriAchievementUnlock[]) => void;
};

type ViewBox = { x: number; y: number; w: number; h: number };

const LAYER_ORDER: Record<string, number> = {
  highway: 0,
  overpass: 1,
  industrial: 2,
  slum: 3,
  mid: 4,
  park: 5,
  corp: 6,
  tunnel: 7,
};

const DEFAULT_VIEW: NriMapView = { w: 240, h: 165 };
const MIN_ZOOM_W = 56;
/** Порог (px): меньше — tap/выбор района, больше — pan. */
const PAN_DRAG_THRESHOLD = 10;
/** Стартовый зум — карта крупнее, меньше «деревенский» масштаб. */
const FOCUS_VIEW_PAD = { x: 6, y: 4, w: 228, h: 157 };
/** Подпись мегаполиса на обзорной карте (лор, не симуляция). */
const NEON_CITY_POP_LABEL = '~6.8M';

function sortedZones(zones: NriMapZone[]): NriMapZone[] {
  return [...zones].sort((a, b) => {
    const la = LAYER_ORDER[a.zoneType] ?? 3;
    const lb = LAYER_ORDER[b.zoneType] ?? 3;
    return la - lb || a.sortOrder - b.sortOrder;
  });
}

function defaultFocusView(mapView: NriMapView): ViewBox {
  const sx = mapView.w / DEFAULT_VIEW.w;
  const sy = mapView.h / DEFAULT_VIEW.h;
  return clampViewBox(
    {
      x: FOCUS_VIEW_PAD.x * sx,
      y: FOCUS_VIEW_PAD.y * sy,
      w: FOCUS_VIEW_PAD.w * sx,
      h: FOCUS_VIEW_PAD.h * sy,
    },
    mapView
  );
}

function clampViewBox(vb: ViewBox, mapView: NriMapView): ViewBox {
  const w = Math.min(mapView.w, Math.max(MIN_ZOOM_W, vb.w));
  const h = (w / mapView.w) * mapView.h;
  return {
    w,
    h,
    x: Math.max(0, Math.min(mapView.w - w, vb.x)),
    y: Math.max(0, Math.min(mapView.h - h, vb.y)),
  };
}

function zoneLabelLines(z: NriMapZone): string[] {
  if (z.zoneType === 'corp') {
    const label = z.corpName || z.name;
    const parts = label.split(' ');
    return parts.length > 1 ? [parts[0], parts.slice(1).join(' ')] : [label];
  }
  if (['park', 'mid', 'slum', 'industrial'].includes(z.zoneType)) {
    const words = z.name.split(' ');
    if (words.length <= 2) return [z.name];
    const mid = Math.ceil(words.length / 2);
    return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
  }
  return [];
}

function zoneMega(z: NriMapZone): string | null {
  return z.megaDistrict ?? megaFromZoneKey(z.zoneKey);
}

function defaultDistrictStyleFromZone(z: NriMapZone): DistrictStyle {
  return normalizeDistrictStyle(z.districtStyle ?? '') ?? defaultDistrictStyle(z.zoneType);
}

export const NriCityMapPanel: React.FC<Props> = ({ inviteCode, isHost, currentUserId, onNewAchievements }) => {
  const { token } = useAuth();
  const authToken = readNeonAuthToken() ?? token;
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const districtParentKeyRef = useRef<string | null>(null);
  const mapRefreshPausedRef = useRef(false);
  const panRef = useRef({
    active: false,
    moved: false,
    didDrag: false,
    suppressClick: false,
    sx: 0,
    sy: 0,
    vbx: 0,
    vby: 0,
    tapZoneKey: null as string | null,
  });

  const [mapView, setMapView] = useState<NriMapView>(DEFAULT_VIEW);
  const [zones, setZones] = useState<NriMapZone[]>([]);
  const [markers, setMarkers] = useState<NriMapMarker[]>([]);
  const [placeMode, setPlaceMode] = useState(false);
  const [selected, setSelected] = useState<NriMapMarker | null>(null);
  const [draft, setDraft] = useState<{ x: number; y: number; label: string; blurb: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [zonesLoading, setZonesLoading] = useState(true);
  const [mapFromFallback, setMapFromFallback] = useState(false);
  const [hoverZone, setHoverZone] = useState<NriMapZone | null>(null);
  const [selectedZoneKey, setSelectedZoneKey] = useState<string | null>(null);
  const [districtParentKey, setDistrictParentKey] = useState<string | null>(null);
  districtParentKeyRef.current = districtParentKey;
  const [newSubName, setNewSubName] = useState('');
  const [viewBox, setViewBox] = useState<ViewBox>(() => defaultFocusView(DEFAULT_VIEW));
  const [editName, setEditName] = useState('');
  const [editMega, setEditMega] = useState('');
  const [editCorp, setEditCorp] = useState('');
  const [editPois, setEditPois] = useState('');
  const [editColor, setEditColor] = useState('#5a9ee6');
  const [editPlaceType, setEditPlaceType] = useState<PlaceType>('generic');
  const [editDistrictStyle, setEditDistrictStyle] = useState<DistrictStyle>('residential');
  const [colorUseDefault, setColorUseDefault] = useState(true);
  const [positions, setPositions] = useState<NriPlayerPosition[]>([]);
  const [vehicles, setVehicles] = useState<NriTableVehicle[]>([]);
  const [moveVehicleId, setMoveVehicleId] = useState<string>('');
  const [moveOverload, setMoveOverload] = useState(false);
  const [moveMsg, setMoveMsg] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const focusZone = useMemo(
    () => (selectedZoneKey ? zones.find((z) => z.zoneKey === selectedZoneKey) ?? null : null),
    [zones, selectedZoneKey]
  );
  const districtParent = useMemo(
    () => (districtParentKey ? zones.find((z) => z.zoneKey === districtParentKey) ?? null : null),
    [districtParentKey, zones]
  );
  const canvasView = useMemo(
    (): NriMapView => (districtParent ? DISTRICT_DRILL_CANVAS : mapView),
    [districtParent, mapView]
  );
  const cityZones = useMemo(
    () => sortedZones(applyCanonCityGeometry(zones.filter((z) => !z.parentZoneKey))),
    [zones]
  );
  const districtSubZones = useMemo(() => {
    if (!districtParentKey) return [];
    return sortedZones(zones.filter((z) => z.parentZoneKey === districtParentKey));
  }, [districtParentKey, zones]);
  const districtTilesLayout = useMemo(() => {
    if (!districtParentKey || districtSubZones.length === 0) return [];
    return relayoutDistrictGridTiles(districtSubZones);
  }, [districtParentKey, districtSubZones]);
  const districtGridDims = useMemo(() => {
    let rows = 0;
    let cols = 0;
    for (const z of districtSubZones) {
      if (z.gridRow != null) rows = Math.max(rows, z.gridRow + 1);
      if (z.gridCol != null) cols = Math.max(cols, z.gridCol + 1);
    }
    return { rows: rows || 1, cols: cols || 1 };
  }, [districtSubZones]);
  const districtNeighborTypes = useMemo(() => {
    const m = new Map<string, PlaceType>();
    for (const z of districtSubZones) {
      if (z.gridRow == null || z.gridCol == null) continue;
      m.set(`${z.gridRow},${z.gridCol}`, normalizePlaceType(z.placeType ?? 'generic'));
    }
    return m;
  }, [districtSubZones]);
  const districtVisualStyle = useMemo(() => {
    const fromTile = districtSubZones.find((z) => z.districtStyle)?.districtStyle;
    const fromParent = districtParent?.districtStyle;
    return normalizeDistrictStyle(fromTile ?? fromParent ?? 'residential') ?? 'residential';
  }, [districtSubZones, districtParent?.districtStyle]);
  const districtTileAnimSlots = useMemo(() => {
    const slots = new Map<string, number | null>();
    if (!districtParentKey) return slots;
    let used = 0;
    const MAX_ANIM = 12;
    for (const raw of districtSubZones) {
      if (raw.gridRow == null || raw.gridCol == null) continue;
      const visual = resolveTileVisual({
        placeType: normalizePlaceType(raw.placeType ?? 'generic'),
        districtStyle:
          normalizeDistrictStyle(raw.districtStyle ?? districtVisualStyle) ?? 'residential',
        zoneKey: raw.zoneKey,
        gridRow: raw.gridRow,
        gridCol: raw.gridCol,
        gridRows: districtGridDims.rows,
        gridCols: districtGridDims.cols,
        neighbors: neighborsForTile(raw.gridRow, raw.gridCol, districtNeighborTypes),
      });
      if (tileAnimationCost(visual) > 0 && used < MAX_ANIM) {
        slots.set(raw.zoneKey, used);
        used += 1;
      } else {
        slots.set(raw.zoneKey, null);
      }
    }
    return slots;
  }, [districtParentKey, districtSubZones, districtGridDims, districtNeighborTypes, districtVisualStyle]);
  const renderZones = useMemo(() => {
    if (districtParent) {
      return districtTilesLayout.map((raw) => ({ raw, z: raw }));
    }
    return cityZones.map((raw) => ({ raw, z: raw }));
  }, [districtParent, districtTilesLayout, cityZones]);
  const [panning, setPanning] = useState(false);

  const refreshMarkers = useCallback(async () => {
    if (!authToken) return;
    const list = await nriFetchMapMarkers(authToken, inviteCode);
    if (list) setMarkers(list);
  }, [authToken, inviteCode]);

  const refreshPositions = useCallback(async () => {
    if (!authToken) return;
    const [pos, veh] = await Promise.all([
      nriFetchMapPositions(authToken, inviteCode),
      nriFetchVehicles(authToken, inviteCode),
    ]);
    setPositions(pos);
    setVehicles(veh);
  }, [authToken, inviteCode]);

  const mergeTopAndDistrictTiles = useCallback(
    (top: NriMapZone[], parentKey: string | null, tiles: NriMapZone[]) => {
      if (!parentKey) return top;
      const withoutOld = top.filter((z) => z.parentZoneKey !== parentKey);
      return [...withoutOld, ...tiles];
    },
    []
  );

  const loadDistrictTiles = useCallback(
    async (parentKey: string, parentZone?: NriMapZone | null): Promise<NriMapZone[]> => {
      if (!authToken) return [];
      const cached = zones.filter((z) => z.parentZoneKey === parentKey);
      if (cached.length > 0) return cached;
      const data = await nriFetchMapZones(authToken, inviteCode, { parentZoneKey: parentKey });
      if (!data.ok) {
        const parent =
          parentZone ?? zones.find((z) => z.zoneKey === parentKey) ?? null;
        if (parent) {
          const fallback = nriFallbackDistrictTiles(parent);
          if (fallback.length > 0) {
            setZones((prev) => mergeTopAndDistrictTiles(prev.filter((z) => !z.parentZoneKey), parentKey, fallback));
            setErr(`${data.error} Показана локальная сетка (сохранение может не работать).`);
            return fallback;
          }
        }
        setErr(data.error);
        return [];
      }
      setZones((prev) => mergeTopAndDistrictTiles(prev.filter((z) => !z.parentZoneKey), parentKey, data.zones));
      return data.zones;
    },
    [authToken, inviteCode, mergeTopAndDistrictTiles, zones]
  );

  const prefetchDistrictTiles = useCallback(
    (parent: NriMapZone) => {
      if (!authToken || !canDrillIntoDistrict(parent)) return;
      const count = parent.subTileCount ?? zones.filter((z) => z.parentZoneKey === parent.zoneKey).length;
      if (count === 0) return;
      if (zones.some((z) => z.parentZoneKey === parent.zoneKey)) return;
      void loadDistrictTiles(parent.zoneKey, parent);
    },
    [authToken, loadDistrictTiles, zones]
  );

  const refreshZones = useCallback(async (opts?: { silent?: boolean }) => {
    if (mapRefreshPausedRef.current) return;
    const useFallback = (message: string) => {
      if (districtParentKeyRef.current) {
        setErr(message);
        return false;
      }
      const fallback = nriFallbackCityZones();
      if (fallback.length === 0) {
        setErr(message);
        return false;
      }
      setZones(fallback);
      setMapView({ w: 240, h: 165 });
      setDistrictParentKey(null);
      setViewBox(defaultFocusView({ w: 240, h: 165 }));
      setSelectedZoneKey(null);
      setMapFromFallback(true);
      setErr(`${message} Показана локальная схема города.`);
      return true;
    };

    if (!authToken) {
      setZonesLoading(false);
      useFallback('Нет авторизации для карты.');
      return;
    }
    if (!opts?.silent) setZonesLoading(true);
    try {
      const dk = districtParentKeyRef.current;
      if (dk) {
        const tiles = await nriFetchMapZones(authToken, inviteCode, { parentZoneKey: dk });
        if (!tiles.ok) {
          if (!opts?.silent) setErr(tiles.error);
          return;
        }
        setMapFromFallback(false);
        if (!opts?.silent) setErr(null);
        setZones((prev) => mergeTopAndDistrictTiles(prev.filter((z) => !z.parentZoneKey), dk, tiles.zones));
        return;
      }
      const data = await nriFetchMapZones(authToken, inviteCode);
      if (!data.ok) {
        if (!useFallback(data.error)) return;
        return;
      }
      let merged = data.zones;
      const dkAfter = districtParentKeyRef.current;
      if (dkAfter && data.zones.some((z) => z.zoneKey === dkAfter)) {
        const tiles = await nriFetchMapZones(authToken, inviteCode, { parentZoneKey: dkAfter });
        if (tiles.ok) merged = mergeTopAndDistrictTiles(data.zones, dkAfter, tiles.zones);
        else if (tiles.error && !opts?.silent) setErr(tiles.error);
      }
      const topCount = merged.filter((z) => !z.parentZoneKey).length;
      if (topCount === 0 && !dkAfter) {
        if (!useFallback('Карта пуста — на сервере не засеяны районы.')) return;
        return;
      }
      setMapFromFallback(false);
      setErr(null);
      setZones(merged);
      setMapView(data.view);
      setDistrictParentKey((prev) => (prev && merged.some((z) => z.zoneKey === prev) ? prev : null));
      const parentStill = dkAfter ? merged.find((z) => z.zoneKey === dkAfter) : null;
      if (parentStill) {
        setViewBox({ x: 0, y: 0, w: DISTRICT_DRILL_CANVAS.w, h: DISTRICT_DRILL_CANVAS.h });
      } else {
        setViewBox(defaultFocusView(data.view));
      }
      setSelectedZoneKey((prev) => (prev && merged.some((z) => z.zoneKey === prev) ? prev : null));
    } finally {
      if (!opts?.silent) setZonesLoading(false);
    }
  }, [authToken, inviteCode, mergeTopAndDistrictTiles]);

  useEffect(() => {
    if (!mapFromFallback || zonesLoading || districtParentKey) return;
    const t = setInterval(() => {
      void refreshZones({ silent: true });
    }, 30000);
    return () => clearInterval(t);
  }, [mapFromFallback, zonesLoading, districtParentKey, refreshZones]);

  useEffect(() => {
    void refreshZones();
    if (!districtParentKey) {
      refreshMarkers();
      refreshPositions();
    }
    const pollMs = districtParentKey ? 0 : 12000;
    if (pollMs <= 0) return;
    const t = setInterval(() => {
      if (mapRefreshPausedRef.current) return;
      refreshMarkers();
      refreshPositions();
    }, pollMs);
    return () => clearInterval(t);
  }, [refreshZones, refreshMarkers, refreshPositions, districtParentKey]);

  useEffect(() => {
    if (!focusZone) {
      setEditName('');
      setEditMega('');
      setEditCorp('');
      setEditPois('');
      setEditColor('#5a9ee6');
      setColorUseDefault(true);
      setEditPlaceType('generic');
      setEditDistrictStyle('residential');
      return;
    }
    setEditName(focusZone.name);
    setEditMega(zoneMega(focusZone) ?? '');
    setEditCorp(focusZone.corpName ?? '');
    setEditPois(focusZone.pois?.join(', ') ?? '');
    setColorUseDefault(!focusZone.color);
    setEditColor(zoneDisplayColor(focusZone));
    setEditPlaceType(normalizePlaceType(focusZone.placeType ?? 'generic'));
    setEditDistrictStyle(
      normalizeDistrictStyle(focusZone.districtStyle ?? districtVisualStyle) ?? 'residential'
    );
  }, [
    focusZone?.zoneKey,
    focusZone?.name,
    focusZone?.corpName,
    focusZone?.pois,
    focusZone?.megaDistrict,
    focusZone?.color,
    focusZone?.zoneType,
    focusZone?.placeType,
    focusZone?.districtStyle,
    districtVisualStyle,
  ]);

  const isZoomedIn =
    !!districtParentKey || viewBox.w < canvasView.w - 1 || viewBox.x > 0.5 || viewBox.y > 0.5;

  const clickToPercent = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const local = pt.matrixTransform(ctm.inverse());
    const gx = districtParent ? local.x + districtParent.x : local.x;
    const gy = districtParent ? local.y + districtParent.y : local.y;
    return {
      x: (gx / mapView.w) * 100,
      y: (gy / mapView.h) * 100,
    };
  };

  const onSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (panRef.current.didDrag) {
      panRef.current.didDrag = false;
      return;
    }
    if (placeMode) {
      const pos = clickToPercent(e);
      if (!pos) return;
      setDraft({ x: pos.x, y: pos.y, label: '', blurb: '' });
      setSelected(null);
    }
  };

  const zoomAt = (factor: number, clientX?: number, clientY?: number) => {
    const svg = svgRef.current;
    if (!svg) return;
    setViewBox((vb) => {
      const nw = Math.min(canvasView.w, Math.max(MIN_ZOOM_W, vb.w * factor));
      const nh = (nw / canvasView.w) * canvasView.h;
      let anchorX = vb.x + vb.w / 2;
      let anchorY = vb.y + vb.h / 2;
      if (clientX != null && clientY != null) {
        const pt = svg.createSVGPoint();
        pt.x = clientX;
        pt.y = clientY;
        const ctm = svg.getScreenCTM();
        if (ctm) {
          const local = pt.matrixTransform(ctm.inverse());
          anchorX = local.x;
          anchorY = local.y;
        }
      }
      const ratioX = (anchorX - vb.x) / vb.w;
      const ratioY = (anchorY - vb.y) / vb.h;
      return clampViewBox(
        {
          w: nw,
          h: nh,
          x: anchorX - nw * ratioX,
          y: anchorY - nh * ratioY,
        },
        canvasView
      );
    });
  };

  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    zoomAt(e.deltaY > 0 ? 1.1 : 0.9, e.clientX, e.clientY);
  };

  const resetView = () => {
    if (districtParentKey) {
      exitDistrict();
      return;
    }
    clearZoneSelection();
  };

  const exitDistrict = () => {
    setDistrictParentKey(null);
    setSelectedZoneKey(null);
    setHoverZone(null);
    setViewBox(defaultFocusView(mapView));
  };

  const enterDistrict = useCallback(
    async (z: NriMapZone) => {
      if (!authToken || !canDrillIntoDistrict(z)) return;
      const count = z.subTileCount ?? zones.filter((s) => s.parentZoneKey === z.zoneKey).length;
      if (count === 0) {
        setErr('У этого района нет сетки клеток.');
        return;
      }
      setBusy(true);
      setErr(null);
      try {
        const tiles = await loadDistrictTiles(z.zoneKey, z);
        if (tiles.length === 0) {
          setErr('Клетки района не найдены. Перезапустите сервер: npm run build && npm start.');
          return;
        }
        setDistrictParentKey(z.zoneKey);
        setSelectedZoneKey(null);
        setHoverZone(null);
        setViewBox({ x: 0, y: 0, w: DISTRICT_DRILL_CANVAS.w, h: DISTRICT_DRILL_CANVAS.h });
      } finally {
        setBusy(false);
      }
    },
    [authToken, loadDistrictTiles, zones]
  );

  const applyZoneSelection = (raw: NriMapZone) => {
    if (placeMode) return;
    if (raw.zoneType === 'tunnel') return;

    if (districtParentKey) {
      if (selectedZoneKey === raw.zoneKey) {
        setSelectedZoneKey(null);
        return;
      }
      setSelectedZoneKey(raw.zoneKey);
      setHoverZone(raw);
      return;
    }

    if (selectedZoneKey === raw.zoneKey) {
      clearZoneSelection();
      return;
    }
    zoomToZone(raw);
    setHoverZone(raw);
    if (!districtParentKey && canDrillIntoDistrict(raw)) {
      prefetchDistrictTiles(raw);
    }
  };

  const resolveTapZoneKey = (target: EventTarget | null): string | null => {
    if (!(target instanceof Element)) return null;
    return target.closest('[data-zone-key]')?.getAttribute('data-zone-key') ?? null;
  };

  const armPan = (e: React.PointerEvent, tapZoneKey: string | null = null) => {
    if (placeMode || e.button !== 0) return;
    panRef.current = {
      active: true,
      moved: false,
      didDrag: false,
      suppressClick: false,
      sx: e.clientX,
      sy: e.clientY,
      vbx: viewBox.x,
      vby: viewBox.y,
      tapZoneKey,
    };
  };

  const onZoneClick = (raw: NriMapZone, e: React.MouseEvent) => {
    e.stopPropagation();
    if (panRef.current.suppressClick) {
      panRef.current.suppressClick = false;
      return;
    }
    if (panRef.current.didDrag) {
      panRef.current.didDrag = false;
      return;
    }
    applyZoneSelection(raw);
  };

  const zoomToZone = (z: NriMapZone) => {
    const pad = Math.max(4, Math.min(z.w, z.h) * 0.2);
    setViewBox(
      clampViewBox(
        {
          x: z.x - pad,
          y: z.y - pad,
          w: z.w + pad * 2,
          h: z.h + pad * 2,
        },
        mapView
      )
    );
    setSelectedZoneKey(z.zoneKey);
  };

  const clearZoneSelection = () => {
    setSelectedZoneKey(null);
    setViewBox(districtParentKey ? { x: 0, y: 0, w: DISTRICT_DRILL_CANVAS.w, h: DISTRICT_DRILL_CANVAS.h } : defaultFocusView(mapView));
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (placeMode || e.button !== 0) return;
    if ((e.target as Element).closest('.nri-city-map__marker')) return;
    armPan(e, resolveTapZoneKey(e.target));
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!panRef.current.active || !svgRef.current) return;
    const dx = e.clientX - panRef.current.sx;
    const dy = e.clientY - panRef.current.sy;
    if (!panRef.current.moved) {
      if (Math.hypot(dx, dy) <= PAN_DRAG_THRESHOLD) return;
      panRef.current.moved = true;
      panRef.current.tapZoneKey = null;
      setPanning(true);
      wrapRef.current?.setPointerCapture(e.pointerId);
    }
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = viewBox.w / rect.width;
    const scaleY = viewBox.h / rect.height;
    setViewBox((vb) =>
      clampViewBox(
        {
          ...vb,
          x: panRef.current.vbx - dx * scaleX,
          y: panRef.current.vby - dy * scaleY,
        },
        canvasView
      )
    );
  };

  const endPan = (e: React.PointerEvent) => {
    if (!panRef.current.active) return;
    const dx = e.clientX - panRef.current.sx;
    const dy = e.clientY - panRef.current.sy;
    const dragged = Math.hypot(dx, dy) > PAN_DRAG_THRESHOLD;
    const tapKey = !dragged ? panRef.current.tapZoneKey : null;
    panRef.current.active = false;
    panRef.current.tapZoneKey = null;
    panRef.current.moved = false;
    panRef.current.didDrag = dragged;
    setPanning(false);
    const cap = wrapRef.current ?? (e.currentTarget as HTMLElement);
    if (cap.hasPointerCapture(e.pointerId)) {
      cap.releasePointerCapture(e.pointerId);
    }
    if (tapKey) {
      const raw = zones.find((z) => z.zoneKey === tapKey);
      if (raw) {
        panRef.current.suppressClick = true;
        applyZoneSelection(raw);
      }
    }
  };

  const saveMarker = async () => {
    if (!authToken || !draft?.label.trim()) return;
    setBusy(true);
    setErr(null);
    const res = await nriCreateMapMarker(authToken, inviteCode, {
      label: draft.label.trim(),
      blurb: draft.blurb.trim() || undefined,
      x: draft.x,
      y: draft.y,
    });
    setBusy(false);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    setDraft(null);
    setPlaceMode(false);
    await refreshMarkers();
  };

  const removeMarker = async (id: string) => {
    if (!authToken || !window.confirm('Удалить метку?')) return;
    setBusy(true);
    await nriDeleteMapMarker(authToken, inviteCode, id);
    setBusy(false);
    setSelected(null);
    await refreshMarkers();
  };

  const createSubZone = async () => {
    const parentKey =
      districtParentKey ?? (focusZone && canDrillIntoDistrict(focusZone) ? focusZone.zoneKey : null);
    if (!authToken || !parentKey || !newSubName.trim()) return;
    setBusy(true);
    setErr(null);
    const res = await nriCreateMapSubZone(authToken, inviteCode, {
      parentZoneKey: parentKey,
      name: newSubName.trim(),
    });
    setBusy(false);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    const createdKey = res.zone.zoneKey;
    setNewSubName('');
    const data = await nriFetchMapZones(authToken, inviteCode);
    if (!data.ok) {
      setErr(data.error);
      return;
    }
    setZones(data.zones);
    setMapView(data.view);
    const parent = data.zones.find((z) => z.zoneKey === parentKey);
    if (parent) {
      setDistrictParentKey(parentKey);
      setViewBox({ x: 0, y: 0, w: DISTRICT_DRILL_CANVAS.w, h: DISTRICT_DRILL_CANVAS.h });
    }
    setSelectedZoneKey(createdKey);
  };

  const deleteSubZone = async () => {
    if (!authToken || !focusZone || !isSubMapZoneKey(focusZone.zoneKey)) return;
    const isGrid = !!parseSubTileGrid(focusZone.zoneKey);
    const msg = isGrid
      ? `Сбросить клетку «${focusZone.name}» (тип → пусто, игроки уйдут в родительский район)?`
      : `Удалить сабзону «${focusZone.name}»?`;
    if (!window.confirm(msg)) return;
    setBusy(true);
    setErr(null);
    const res = await nriDeleteMapSubZone(authToken, inviteCode, focusZone.zoneKey);
    setBusy(false);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    if (isGrid) {
      await refreshZones();
      return;
    }
    setSelectedZoneKey(null);
    await refreshZones();
  };

  const saveZoneEdits = async () => {
    if (!authToken || !focusZone) return;
    const payload: {
      name?: string;
      corpName?: string | null;
      megaDistrict?: string;
      pois?: string[];
      color?: string | null;
      placeType?: string;
      districtStyle?: string | null;
    } = {};
    const name = editName.trim();
    const mega = editMega.trim();
    const corp = editCorp.trim();
    const pois = editPois
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    const curMega = zoneMega(focusZone);

    if (name && name !== focusZone.name) payload.name = name;
    if (mega && mega !== curMega) payload.megaDistrict = mega;
    if (focusZone.zoneType === 'corp' && corp !== (focusZone.corpName ?? '')) {
      payload.corpName = corp || null;
    }
    const curPois = focusZone.pois ?? [];
    if (pois.join('\0') !== curPois.join('\0')) payload.pois = pois;
    const nextColor = colorUseDefault ? null : editColor.trim().toLowerCase();
    const curColor = focusZone.color ?? null;
    if (nextColor !== curColor) payload.color = nextColor;
    const curPlace = normalizePlaceType(focusZone.placeType ?? 'generic');
    if (isSubMapZoneKey(focusZone.zoneKey) && editPlaceType !== curPlace) {
      payload.placeType = editPlaceType;
    }
    const curStyle = normalizeDistrictStyle(focusZone.districtStyle ?? '') ?? null;
    const nextStyle = editDistrictStyle;
    if (!isSubMapZoneKey(focusZone.zoneKey) && canDrillIntoDistrict(focusZone)) {
      const base = curStyle ?? defaultDistrictStyleFromZone(focusZone);
      if (nextStyle !== base) payload.districtStyle = nextStyle;
    } else if (isSubMapZoneKey(focusZone.zoneKey) && curStyle !== nextStyle) {
      payload.districtStyle = nextStyle;
    }

    if (Object.keys(payload).length === 0) {
      setSaveMsg('Нет изменений для сохранения.');
      return;
    }

    setBusy(true);
    setErr(null);
    setSaveMsg(null);
    mapRefreshPausedRef.current = true;
    const optimistic = { ...focusZone };
    if (payload.name) optimistic.name = payload.name;
    if (payload.placeType) optimistic.placeType = payload.placeType;
    if (payload.districtStyle !== undefined) optimistic.districtStyle = payload.districtStyle;
    if (payload.color !== undefined) optimistic.color = payload.color;
    setZones((prev) => prev.map((z) => (z.zoneKey === optimistic.zoneKey ? optimistic : z)));
    const res = await nriPatchMapZone(authToken, inviteCode, focusZone.zoneKey, payload);
    mapRefreshPausedRef.current = false;
    setBusy(false);
    if (!res.ok) {
      setZones((prev) => prev.map((z) => (z.zoneKey === focusZone.zoneKey ? focusZone : z)));
      setErr(res.error);
      return;
    }
    setSaveMsg('Сохранено');
    if (payload.megaDistrict || payload.districtStyle) {
      const data = await nriFetchMapZones(authToken, inviteCode);
      if (data.ok) {
        const dk = districtParentKeyRef.current;
        let merged = data.zones;
        if (dk) {
          const tiles = await nriFetchMapZones(authToken, inviteCode, { parentZoneKey: dk });
          if (tiles.ok) merged = mergeTopAndDistrictTiles(data.zones, dk, tiles.zones);
        }
        setZones(merged);
        const hit = merged.find((z) => z.zoneKey === focusZone.zoneKey) ?? res.zone;
        setSelectedZoneKey(hit.zoneKey);
      }
    } else {
      setZones((prev) => prev.map((z) => (z.zoneKey === res.zone.zoneKey ? res.zone : z)));
      setSelectedZoneKey(res.zone.zoneKey);
      if (payload.color !== undefined) {
        setColorUseDefault(!res.zone.color);
        setEditColor(zoneDisplayColor(res.zone));
      }
    }
  };

  const zoneEditsDirty =
    !!focusZone &&
    (editName.trim() !== focusZone.name ||
      editMega.trim() !== (zoneMega(focusZone) ?? '') ||
      (focusZone.zoneType === 'corp' && editCorp.trim() !== (focusZone.corpName ?? '')) ||
      editPois
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean)
        .join('\0') !== (focusZone.pois ?? []).join('\0') ||
      (colorUseDefault ? null : editColor.trim().toLowerCase()) !== (focusZone.color ?? null) ||
      (isSubMapZoneKey(focusZone.zoneKey) &&
        editPlaceType !== normalizePlaceType(focusZone.placeType ?? 'generic')) ||
      editDistrictStyle !==
        (isSubMapZoneKey(focusZone.zoneKey)
          ? normalizeDistrictStyle(focusZone.districtStyle ?? districtVisualStyle) ?? 'residential'
          : defaultDistrictStyleFromZone(focusZone)));

  const districtList = renderZones;
  const megaClusters = useMemo(
    () => (districtParent || cityZones.length === 0 ? [] : getMegaClusters()),
    [districtParent, cityZones.length]
  );
  const panelZone = focusZone ?? hoverZone;
  const cityOverviewFocus =
    !!focusZone && !districtParentKey && !isSubMapZoneKey(focusZone.zoneKey);
  const cityOverviewHoverOnly =
    !districtParentKey && !!hoverZone && !focusZone && !isSubMapZoneKey(hoverZone.zoneKey);
  const subCountForFocus =
    focusZone && canDrillIntoDistrict(focusZone)
      ? focusZone.subTileCount ?? zones.filter((z) => z.parentZoneKey === focusZone.zoneKey).length
      : 0;
  const districtUsesGrid =
    districtSubZones.some((z) => z.gridRow != null) || (districtParent?.subTileCount ?? 0) > 0;
  const typeLabel = panelZone
    ? DISTRICT_TYPE_LABELS[panelZone.zoneType as NeonCityDistrictType] ?? panelZone.zoneType
    : '';
  const districtScale = useMemo(() => {
    if (!districtParent) return null;
    return resolveCityScale({
      zoneType: districtParent.zoneType,
      populationBand: districtParent.populationBand,
      densityLabel: districtParent.densityLabel,
      trafficLevel: districtParent.trafficLevel,
      nightlifeLevel: districtParent.nightlifeLevel,
    });
  }, [districtParent]);

  const myPosition = useMemo(
    () => positions.find((p) => p.userId === currentUserId) ?? null,
    [positions, currentUserId]
  );
  const myVehicles = useMemo(
    () => vehicles.filter((v) => v.assignedUserId === currentUserId),
    [vehicles, currentUserId]
  );
  const myZone = useMemo(
    () => (myPosition?.zoneKey ? zones.find((z) => z.zoneKey === myPosition.zoneKey) ?? null : null),
    [myPosition?.zoneKey, zones]
  );
  const selectedVehicle = moveVehicleId ? vehicles.find((v) => v.id === moveVehicleId) ?? null : null;
  const selectedVehicleDef = selectedVehicle ? getVehicleDef(selectedVehicle.catalogId) : null;

  const moveToZone = async (targetZoneKey?: string) => {
    const destKey = targetZoneKey ?? focusZone?.zoneKey;
    if (!authToken || !destKey) return;
    if (myPosition?.zoneKey === destKey) {
      setMoveMsg('Вы уже в этом районе.');
      return;
    }
    setBusy(true);
    setErr(null);
    setMoveMsg(null);
    const res = await nriMoveToZone(authToken, inviteCode, {
      zoneKey: destKey,
      vehicleId: moveVehicleId || null,
      overload: moveOverload,
    });
    setBusy(false);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    setMoveMsg(res.message);
    if (res.newAchievements?.length) onNewAchievements?.(res.newAchievements);
    await refreshPositions();
  };

  const positionDot = (p: NriPlayerPosition) => {
    const z = p.zoneKey ? zones.find((zz) => zz.zoneKey === p.zoneKey) : null;
    if (districtParent) {
      const inDistrict =
        z?.parentZoneKey === districtParent.zoneKey || z?.zoneKey === districtParent.zoneKey;
      if (!inDistrict) return null;
      const laid = z ? districtTilesLayout.find((t) => t.zoneKey === z.zoneKey) : null;
      const px = p.x ?? (laid ? laid.x + laid.w / 2 : z ? z.x - districtParent.x + z.w / 2 : null);
      const py = p.y ?? (laid ? laid.y + laid.h / 2 : z ? z.y - districtParent.y + z.h / 2 : null);
      if (px == null || py == null) return null;
      return { px, py, label: p.displayName ?? p.userId.slice(0, 6) };
    }
    const px = p.x ?? (z ? z.x + z.w / 2 : null);
    const py = p.y ?? (z ? z.y + z.h / 2 : null);
    if (px == null || py == null) return null;
    return { px, py, label: p.displayName ?? p.userId.slice(0, 6) };
  };

  return (
    <div className="nri-city-map">
      <header className="nri-city-map__head">
        <MapPin size={18} />
        <div>
          <h2 className="nri-city-map__title">Carbon 2185</h2>
          {districtParent ? (
            <nav className="nri-city-map__breadcrumb mono-text">
              <button type="button" className="nri-city-map__crumb" onClick={exitDistrict}>
                Neon City
              </button>
              <span className="nri-city-map__crumb-sep">/</span>
              <span>{districtParent.name}</span>
            </nav>
          ) : null}
          <p className="mono-text opacity-70">
            {districtParent
              ? 'Клик по клетке — выбрать · мастер задаёт тип и название.'
              : `Neon City · ${NEON_CITY_POP_LABEL} жителей · клик — район · двойной клик — сетка.`}
            {' '}Колёсико — зум · ЛКМ — сдвиг.
            {isHost ? ' Редактирование доступно для выбранной зоны.' : ''}
          </p>
        </div>
        <div className="nri-city-map__toolbar">
          {(isZoomedIn || districtParentKey) && (
            <button type="button" className="nri-modal__submit" onClick={resetView}>
              <ArrowLeft size={14} /> {districtParentKey ? 'Neon City' : 'Общая карта'}
            </button>
          )}
          <button type="button" className="nri-lobby__close" title="Приблизить" onClick={() => zoomAt(0.82)}>
            <Plus size={14} />
          </button>
          <button type="button" className="nri-lobby__close" title="Отдалить" onClick={() => zoomAt(1.12)}>
            <Minus size={14} />
          </button>
          <button type="button" className="nri-lobby__close" title="Сбросить" onClick={resetView}>
            <RotateCcw size={14} />
          </button>
          <button
            type="button"
            className={`nri-modal__submit ${placeMode ? 'active' : ''} ${!isHost ? 'nri-city-map__place-player' : ''}`}
            onClick={() => {
              setPlaceMode((v) => !v);
              setDraft(null);
            }}
          >
            <Plus size={14} /> {placeMode ? 'Метки: ВКЛ' : 'Ставить метку'}
          </button>
        </div>
      </header>

      {err && <p className="nri-lobby__err mono-text">{err}</p>}

      <div className="nri-city-map__hover-slot" aria-live="polite">
        {districtParent && districtScale ? (
          <NriCityDistrictDossier
            zoneType={districtParent.zoneType}
            scale={districtParent}
            megaLabel={districtParent.megaDistrict ?? megaFromZoneKey(districtParent.zoneKey)}
            compact
          />
        ) : null}
        {cityOverviewFocus ? (
          <NriCityDistrictCard
            zone={focusZone!}
            megaLabel={zoneMega(focusZone!)}
            selected
            drillLabel={
              canDrillIntoDistrict(focusZone!) && subCountForFocus > 0
                ? `Войти в район (${subCountForFocus} клеток)`
                : null
            }
            onDrill={
              canDrillIntoDistrict(focusZone!) && subCountForFocus > 0
                ? () => void enterDistrict(focusZone!)
                : undefined
            }
          >
            {isHost ? (
              <div className="nri-city-map__zone-edit">
                <label className="nri-city-map__zone-field mono-text">
                  <span>Название</span>
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} />
                </label>
                {megaKeyFromZoneKey(focusZone!.zoneKey) && (
                  <label className="nri-city-map__zone-field mono-text">
                    <span>Мегарайон</span>
                    <input
                      value={editMega}
                      onChange={(e) => setEditMega(e.target.value)}
                      title="Меняет подпись для всего мегарайона"
                    />
                  </label>
                )}
                {focusZone!.zoneType === 'corp' && (
                  <label className="nri-city-map__zone-field mono-text">
                    <span>Корпорация</span>
                    <input value={editCorp} onChange={(e) => setEditCorp(e.target.value)} />
                  </label>
                )}
                <label className="nri-city-map__zone-field mono-text nri-city-map__zone-field--wide">
                  <span>Места (через запятую)</span>
                  <input
                    value={editPois}
                    onChange={(e) => setEditPois(e.target.value)}
                    placeholder="бар, рынок, засада…"
                  />
                </label>
                {canDrillIntoDistrict(focusZone!) && (
                  <label className="nri-city-map__zone-field mono-text">
                    <span>Стиль квартала</span>
                    <select
                      value={editDistrictStyle}
                      onChange={(e) => setEditDistrictStyle(e.target.value as DistrictStyle)}
                    >
                      {DISTRICT_STYLES.map((st) => (
                        <option key={st} value={st}>
                          {DISTRICT_STYLE_LABELS[st]}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <label className="nri-city-map__zone-field mono-text nri-city-map__zone-field--color">
                  <span>Цвет района</span>
                  <label className="mono-text nri-city-map__color-toggle">
                    <input
                      type="checkbox"
                      checked={!colorUseDefault}
                      onChange={(e) => {
                        const custom = e.target.checked;
                        setColorUseDefault(!custom);
                        if (custom) {
                          setEditColor(zoneDisplayColor(focusZone!));
                        }
                      }}
                    />
                    Свой цвет
                  </label>
                  <div className="nri-city-map__color-row">
                    <input
                      type="color"
                      value={editColor}
                      disabled={colorUseDefault}
                      onClick={() => setColorUseDefault(false)}
                      onChange={(e) => {
                        setColorUseDefault(false);
                        setEditColor(e.target.value);
                      }}
                    />
                    <button
                      type="button"
                      className="nri-lobby__copy"
                      onClick={() => {
                        setColorUseDefault(true);
                        setEditColor(ZONE_TYPE_DEFAULT_COLORS[focusZone!.zoneType] ?? '#5a9ee6');
                      }}
                    >
                      Стандарт
                    </button>
                  </div>
                </label>
                <button
                  type="button"
                  className="nri-modal__submit"
                  disabled={busy || !zoneEditsDirty || !editName.trim()}
                  onClick={() => void saveZoneEdits()}
                >
                  {busy ? 'Сохранение…' : 'Сохранить'}
                </button>
                {saveMsg && <p className="mono-text nri-scenario__checkpoint-ok">{saveMsg}</p>}
              </div>
            ) : (
              <div className="nri-city-map__travel">
                <p className="mono-text">
                  {myZone ? (
                    <>
                      Сейчас: <strong>{myZone.name}</strong>
                    </>
                  ) : (
                    'Позиция не задана — выберите район назначения.'
                  )}
                </p>
                {myPosition?.zoneKey !== focusZone!.zoneKey && (
                  <>
                    {myVehicles.length > 0 && (
                      <label className="nri-modal__field">
                        <span>Транспорт</span>
                        <select
                          value={moveVehicleId}
                          onChange={(e) => {
                            setMoveVehicleId(e.target.value);
                            setMoveOverload(false);
                          }}
                        >
                          <option value="">Пешком (медленнее)</option>
                          {myVehicles.map((v) => {
                            const def = getVehicleDef(v.catalogId);
                            const label = v.label || def?.name || v.catalogId;
                            return (
                              <option key={v.id} value={v.id}>
                                {label} · {def?.speed ?? '?'} spd · {def?.seats ?? '?'} мест
                              </option>
                            );
                          })}
                        </select>
                      </label>
                    )}
                    {moveVehicleId && selectedVehicleDef && (
                      <label className="mono-text nri-scenario__check">
                        <input
                          type="checkbox"
                          checked={moveOverload}
                          onChange={(e) => setMoveOverload(e.target.checked)}
                        />
                        Перегруз мест (мастер получит уведомление — возможна полиция)
                      </label>
                    )}
                    <button type="button" className="nri-modal__submit" disabled={busy} onClick={() => void moveToZone()}>
                      Переместиться → {focusZone!.name}
                    </button>
                    <p className="mono-text opacity-60">
                      Время в пути фиксируется служебным сообщением мастеру в личке.
                    </p>
                  </>
                )}
                {myPosition?.zoneKey === focusZone!.zoneKey && (
                  <p className="mono-text nri-scenario__checkpoint-ok">Вы в этом районе.</p>
                )}
                {moveMsg && <p className="mono-text nri-city-map__travel-msg">{moveMsg}</p>}
              </div>
            )}
          </NriCityDistrictCard>
        ) : cityOverviewHoverOnly ? (
          <p className="mono-text nri-city-map__hover-hint">
            <strong>{hoverZone!.name}</strong> · {DISTRICT_TYPE_LABELS[hoverZone!.zoneType as NeonCityDistrictType] ?? hoverZone!.zoneType}
            {' '}— клик для карточки района
          </p>
        ) : panelZone ? (
          <>
            <p className={`mono-text nri-city-map__hover${focusZone ? ' nri-city-map__hover--selected' : ''}`}>
              {focusZone && <span className="nri-city-map__selected-tag">выбран</span>}
              <strong>{panelZone.name}</strong> · {typeLabel}
              {panelZone.locked && ' · доступ только корпам'}
              {panelZone.corpName && ` · ${panelZone.corpName}`}
              {panelZone.pois?.length ? ` · ${panelZone.pois.join(', ')}` : ''}
            </p>
            {focusZone?.placeType === 'exit' && focusZone.linksTo && focusZone.linksTo.length > 0 ? (
              <div className="nri-city-map__exit-links">
                {focusZone.linksTo.map((link) => (
                  <button
                    key={link.zoneKey}
                    type="button"
                    className="nri-modal__submit nri-city-map__exit-link-btn"
                    disabled={busy}
                    onClick={() => void moveToZone(link.zoneKey)}
                  >
                    Выход → {link.label ?? link.zoneKey}
                    {link.travelMinutes != null ? ` (~${link.travelMinutes} мин)` : ''}
                  </button>
                ))}
              </div>
            ) : null}
            {isHost && focusZone && districtParentKey && (
              <div className="nri-city-map__zone-edit">
                <label className="nri-city-map__zone-field mono-text">
                  <span>Название</span>
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} />
                </label>
                <label className="nri-city-map__zone-field mono-text nri-city-map__zone-field--wide">
                  <span>Места (через запятую)</span>
                  <input
                    value={editPois}
                    onChange={(e) => setEditPois(e.target.value)}
                    placeholder="бар, рынок, засада…"
                  />
                </label>
                {isSubMapZoneKey(focusZone.zoneKey) && (
                  <>
                    <label className="nri-city-map__zone-field mono-text">
                      <span>Тип клетки</span>
                      <select value={editPlaceType} onChange={(e) => setEditPlaceType(e.target.value as PlaceType)}>
                        {PLACE_TYPES.map((pt) => (
                          <option key={pt} value={pt}>
                            {PLACE_TYPE_LABELS[pt]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="nri-city-map__zone-field mono-text">
                      <span>Стиль клетки</span>
                      <select
                        value={editDistrictStyle}
                        onChange={(e) => setEditDistrictStyle(e.target.value as DistrictStyle)}
                      >
                        {DISTRICT_STYLES.map((st) => (
                          <option key={st} value={st}>
                            {DISTRICT_STYLE_LABELS[st]}
                          </option>
                        ))}
                      </select>
                    </label>
                  </>
                )}
                <button
                  type="button"
                  className="nri-modal__submit"
                  disabled={busy || !zoneEditsDirty || !editName.trim()}
                  onClick={() => void saveZoneEdits()}
                >
                  {busy ? 'Сохранение…' : 'Сохранить'}
                </button>
                {saveMsg && <p className="mono-text nri-scenario__checkpoint-ok">{saveMsg}</p>}
                {isSubMapZoneKey(focusZone.zoneKey) && (
                  <button type="button" className="nri-lobby__close" disabled={busy} onClick={deleteSubZone}>
                    <Trash2 size={14} />{' '}
                    {parseSubTileGrid(focusZone.zoneKey) ? 'Сбросить клетку' : 'Удалить сабзону'}
                  </button>
                )}
                {!districtUsesGrid && (
                  <div className="nri-city-map__sub-create">
                    <label className="nri-city-map__zone-field mono-text nri-city-map__zone-field--wide">
                      <span>Новая сабзона</span>
                      <input
                        value={newSubName}
                        onChange={(e) => setNewSubName(e.target.value)}
                        placeholder="бар, рынок, засада…"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') void createSubZone();
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      className="nri-modal__submit"
                      disabled={busy || !newSubName.trim()}
                      onClick={createSubZone}
                    >
                      Добавить сабзону
                    </button>
                  </div>
                )}
              </div>
            )}
            {isHost && districtParentKey && !focusZone && !districtUsesGrid && (
              <div className="nri-city-map__sub-create">
                <label className="nri-city-map__zone-field mono-text nri-city-map__zone-field--wide">
                  <span>Новая сабзона в «{districtParent?.name}»</span>
                  <input
                    value={newSubName}
                    onChange={(e) => setNewSubName(e.target.value)}
                    placeholder="бар, рынок, засада…"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void createSubZone();
                    }}
                  />
                </label>
                <button
                  type="button"
                  className="nri-modal__submit"
                  disabled={busy || !newSubName.trim()}
                  onClick={createSubZone}
                >
                  Добавить сабзону
                </button>
              </div>
            )}
            {isHost && !focusZone && !districtParentKey && (
              <p className="mono-text nri-city-map__hover-hint">
                Кликните район на карте — откроется карточка с данными и действиями.
              </p>
            )}
            {!isHost && focusZone && districtParentKey && (
              <div className="nri-city-map__travel">
                <p className="mono-text">
                  {myZone ? (
                    <>
                      Сейчас: <strong>{myZone.name}</strong>
                    </>
                  ) : (
                    'Позиция не задана — выберите район назначения.'
                  )}
                </p>
                {myPosition?.zoneKey !== focusZone.zoneKey && (
                  <>
                    {myVehicles.length > 0 && (
                      <label className="nri-modal__field">
                        <span>Транспорт</span>
                        <select
                          value={moveVehicleId}
                          onChange={(e) => {
                            setMoveVehicleId(e.target.value);
                            setMoveOverload(false);
                          }}
                        >
                          <option value="">Пешком (медленнее)</option>
                          {myVehicles.map((v) => {
                            const def = getVehicleDef(v.catalogId);
                            const label = v.label || def?.name || v.catalogId;
                            return (
                              <option key={v.id} value={v.id}>
                                {label} · {def?.speed ?? '?'} spd · {def?.seats ?? '?'} мест
                              </option>
                            );
                          })}
                        </select>
                      </label>
                    )}
                    {moveVehicleId && selectedVehicleDef && (
                      <label className="mono-text nri-scenario__check">
                        <input
                          type="checkbox"
                          checked={moveOverload}
                          onChange={(e) => setMoveOverload(e.target.checked)}
                        />
                        Перегруз мест (мастер получит уведомление — возможна полиция)
                      </label>
                    )}
                    <button type="button" className="nri-modal__submit" disabled={busy} onClick={() => void moveToZone()}>
                      Переместиться → {focusZone.name}
                    </button>
                    <p className="mono-text opacity-60">
                      Время в пути фиксируется служебным сообщением мастеру в личке.
                    </p>
                  </>
                )}
                {myPosition?.zoneKey === focusZone.zoneKey && (
                  <p className="mono-text nri-scenario__checkpoint-ok">Вы в этом районе.</p>
                )}
                {moveMsg && <p className="mono-text nri-city-map__travel-msg">{moveMsg}</p>}
              </div>
            )}
          </>
        ) : (
          <p className="mono-text nri-city-map__hover nri-city-map__hover--empty">
            {districtParent ? 'Наведите на клетку или кликните, чтобы выбрать' : 'Наведите на район или кликните для карточки'}
          </p>
        )}
      </div>

      <div className="nri-city-map__chassis">
        <span className="nri-city-map__corner nri-city-map__corner--tl" />
        <span className="nri-city-map__corner nri-city-map__corner--tr" />
        <span className="nri-city-map__corner nri-city-map__corner--bl" />
        <span className="nri-city-map__corner nri-city-map__corner--br" />
        {zonesLoading && (
          <div className="nri-city-map__empty nri-city-map__loading">
            <p className="mono-text">Загрузка карты…</p>
          </div>
        )}
        {!zonesLoading && cityZones.length === 0 && !districtParent && (
          <div className="nri-city-map__empty">
            <p className="mono-text">{err ?? 'Районы не загрузились с сервера.'}</p>
            <button type="button" className="nri-lobby__copy" onClick={() => void refreshZones()}>
              Обновить карту
            </button>
          </div>
        )}
        {!zonesLoading && districtParent && districtSubZones.length === 0 && (
          <div className="nri-city-map__empty">
            <p className="mono-text">{err ?? 'Клетки района не загрузились.'}</p>
            <button type="button" className="nri-lobby__copy" onClick={() => void exitDistrict()}>
              Назад к городу
            </button>
          </div>
        )}
        <div
          className={`nri-city-map__wrap ${panning ? 'nri-city-map__wrap--panning' : ''} ${placeMode ? 'nri-city-map__wrap--place' : ''}`}
          ref={wrapRef}
          onWheel={onWheel}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endPan}
            onPointerCancel={endPan}
          >
            <svg
              ref={svgRef}
              className={`nri-city-map__svg${districtParent ? ' nri-city-map__svg--district' : ' nri-city-map__svg--city'}`}
              viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
              onClick={onSvgClick}
            >
            <NriCityMapDefs megaClusters={megaClusters} />
            {districtParent && <NriDistrictTileDefs />}
            <rect className="nri-city-map__bg" x={0} y={0} width={canvasView.w} height={canvasView.h} fill="url(#nc-bg-radial)" />
            {!districtParent && (
              <rect
                className="nri-city-map__bg-asphalt"
                x={0}
                y={0}
                width={canvasView.w}
                height={canvasView.h}
                fill="url(#nc-asphalt)"
              />
            )}
            <rect
              className="nri-city-map__bg-fine"
              x={0}
              y={0}
              width={canvasView.w}
              height={canvasView.h}
              fill="url(#nc-grid-fine)"
            />
            <rect className="nri-city-map__grid" x={0} y={0} width={canvasView.w} height={canvasView.h} fill="url(#nc-grid)" />
            <rect
              className="nri-city-map__scan"
              x={0}
              y={0}
              width={canvasView.w}
              height={canvasView.h}
              fill="url(#nc-scan)"
            />
            <rect
              className="nri-city-map__vignette"
              x={0}
              y={0}
              width={canvasView.w}
              height={canvasView.h}
              fill="url(#nc-vignette)"
            />
            {districtParent && (
              <rect
                className="nri-city-map__district-frame"
                x={0.3}
                y={0.3}
                width={canvasView.w - 0.6}
                height={canvasView.h - 0.6}
                rx={1.2}
              />
            )}
            {!districtParent && (
              <g className="nri-city-map__ambient" aria-hidden>
                <path d="M 12 140 Q 80 120 140 145 T 228 138" className="nri-city-map__ambient-line" />
                <path d="M 8 88 Q 60 72 120 90 T 232 82" className="nri-city-map__ambient-line nri-city-map__ambient-line--dim" />
                <path d="M 20 42 Q 100 28 180 48" className="nri-city-map__ambient-line nri-city-map__ambient-line--magenta" />
              </g>
            )}
            {megaClusters.map((mc) => (
              <rect
                key={`mega-${mc.clusterKey}`}
                x={mc.x + 0.4}
                y={mc.y + 0.4}
                width={mc.w - 0.8}
                height={mc.h - 0.8}
                className="nri-city-map__mega-frame"
                rx={1.5}
              />
            ))}
            {megaClusters.map((mc) => (
              <g key={`wm-${mc.clusterKey}`} clipPath={`url(#mega-clip-${mc.clusterKey})`}>
                <text
                  x={mc.x + mc.w / 2}
                  y={mc.y + mc.h / 2}
                  className="nri-city-map__mega-watermark"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={megaWatermarkFontSize(mc.w, mc.h)}
                >
                  {mc.megaLabel}
                </text>
              </g>
            ))}
            {districtList.map(({ raw, z }) => {
              if (districtParent && raw.gridRow != null) {
                const isFocused = selectedZoneKey === raw.zoneKey;
                const isHovered = hoverZone?.zoneKey === raw.zoneKey;
                return (
                  <NriDistrictTile
                    key={raw.zoneKey}
                    raw={raw}
                    z={z}
                    districtStyle={districtVisualStyle}
                    gridRows={districtGridDims.rows}
                    gridCols={districtGridDims.cols}
                    neighborTypes={districtNeighborTypes}
                    animationSlot={districtTileAnimSlots.get(raw.zoneKey) ?? null}
                    isFocused={isFocused}
                    isHovered={isHovered}
                    onMouseEnter={() => setHoverZone(raw)}
                    onMouseLeave={() => setHoverZone((prev) => (prev?.zoneKey === raw.zoneKey ? null : prev))}
                    onClick={(e) => onZoneClick(raw, e)}
                  />
                );
              }
              const lines = zoneLabelLines(z);
              const showFo =
                lines.length > 0 &&
                ['park', 'corp', 'mid', 'slum', 'industrial'].includes(z.zoneType) &&
                z.w > 8 &&
                z.h > 5;
              const isFocused = selectedZoneKey === raw.zoneKey;
              const isHovered = hoverZone?.zoneKey === raw.zoneKey;
              const inner = districtParent
                ? { x: z.x, y: z.y, w: z.w, h: z.h }
                : zoneOverviewRect(z.x, z.y, z.w, z.h);
              const ix = inner.x;
              const iy = inner.y;
              const iw = inner.w;
              const ih = inner.h;
              const rectPaint =
                isFocused && !colorUseDefault
                  ? zoneRectPaint(editColor, z.zoneType)
                  : zoneRectPaint(z.color ?? null, z.zoneType);
              const iconHref = resolveZoneIconHref(z.iconId, z.zoneType, z.zoneKey);
              if (!districtParent) {
                return (
                  <NriCityOverviewZone
                    key={raw.zoneKey}
                    zoneKey={z.zoneKey}
                    zoneType={z.zoneType as NeonCityDistrictType}
                    name={z.name}
                    corpName={raw.corpName}
                    x={ix}
                    y={iy}
                    w={iw}
                    h={ih}
                    isFocused={isFocused}
                    isHovered={isHovered}
                    onMouseEnter={() => setHoverZone(raw)}
                    onMouseLeave={() => setHoverZone((prev) => (prev?.zoneKey === raw.zoneKey ? null : prev))}
                    onClick={(e) => onZoneClick(raw, e)}
                  />
                );
              }
              return (
                <g
                  key={raw.zoneKey}
                  data-zone-key={raw.zoneKey}
                  className={`nri-city-map__zone-g ${isFocused ? 'focused' : ''}${districtParent ? ' nri-city-map__zone-g--sub' : ''}`}
                  onMouseEnter={() => setHoverZone(raw)}
                  onMouseLeave={() => setHoverZone((prev) => (prev?.zoneKey === raw.zoneKey ? null : prev))}
                  onClick={(e) => onZoneClick(raw, e)}
                >
                  <rect
                    x={ix}
                    y={iy}
                    width={iw}
                    height={ih}
                    className={`nri-city-map__zone nri-city-map__zone--${z.zoneType}${z.locked ? ' locked' : ''}`}
                    rx={z.zoneType === 'corp' ? 1.2 : z.zoneType === 'park' ? 1 : 0.35}
                    style={rectPaint}
                    filter={isFocused || isHovered ? 'url(#nc-glow)' : undefined}
                  />
                  {zoneTypeUsesTexture(z.zoneType) && (
                    <rect
                      x={ix}
                      y={iy}
                      width={iw}
                      height={ih}
                      className={`nri-city-map__zone-tex nri-city-map__zone-tex--${z.zoneType}`}
                      fill={`url(#${zoneTexturePatternId(z.zoneType)})`}
                      rx={z.zoneType === 'corp' ? 1.2 : z.zoneType === 'park' ? 1 : 0.35}
                      pointerEvents="none"
                    />
                  )}
                  <NriCityMapSkyline
                    zoneKey={z.zoneKey}
                    zoneType={z.zoneType as NeonCityDistrictType}
                    x={ix}
                    y={iy}
                    w={iw}
                    h={ih}
                  />
                  <rect
                    x={ix}
                    y={iy}
                    width={iw}
                    height={Math.min(ih * 0.38, 6)}
                    className="nri-city-map__zone-shine"
                    fill="url(#nc-zone-shine)"
                    rx={z.zoneType === 'corp' ? 1.2 : z.zoneType === 'park' ? 1 : 0.35}
                    pointerEvents="none"
                  />
                  <NriCityMapZoneDecor
                    zoneKey={z.zoneKey}
                    zoneType={z.zoneType as NeonCityDistrictType}
                    x={ix}
                    y={iy}
                    w={iw}
                    h={ih}
                  />
                  {z.zoneType === 'highway' && iw > 4 && (
                    <line
                      x1={ix + iw * 0.08}
                      y1={iy + ih / 2}
                      x2={ix + iw * 0.92}
                      y2={iy + ih / 2}
                      className="nri-city-map__hw-center"
                      pointerEvents="none"
                    />
                  )}
                  {iconHref && (
                    <image
                      href={iconHref}
                      x={ix}
                      y={iy}
                      width={iw}
                      height={ih}
                      preserveAspectRatio="xMidYMid meet"
                      className="nri-city-map__zone-icon"
                    />
                  )}
                  {showFo && (
                    <foreignObject
                      x={ix + 0.3}
                      y={iy + 0.3}
                      width={Math.max(0, iw - 0.6)}
                      height={Math.max(0, ih - 0.6)}
                      className="nri-city-map__fo"
                    >
                      <div className={`nri-city-map__fo-label nri-city-map__fo-label--${z.zoneType}`}>
                        {lines.map((line) => (
                          <span key={line}>{line}</span>
                        ))}
                      </div>
                    </foreignObject>
                  )}
                  {z.zoneType === 'corp' && ih > 6 && (
                    <line
                      x1={ix + iw * 0.05}
                      y1={iy + ih * 0.52}
                      x2={ix + iw * 0.95}
                      y2={iy + ih * 0.52}
                      className="nri-city-map__tunnel-line"
                    />
                  )}
                  {z.zoneType === 'slum' && z.pois?.length && ih > 7 && (
                    <text x={ix + iw / 2} y={iy + ih - 1} className="nri-city-map__poi">
                      {z.pois.slice(0, 2).join(' · ')}
                    </text>
                  )}
                </g>
              );
            })}
            {positions.map((p) => {
              const dot = positionDot(p);
              if (!dot) return null;
              const isMe = p.userId === currentUserId;
              return (
                <g key={`pos-${p.userId}`} className={`nri-city-map__player-pos ${isMe ? 'nri-city-map__player-pos--me' : ''}`}>
                  <circle cx={dot.px} cy={dot.py} r={1.2} />
                  <text x={dot.px} y={dot.py - 1.8} textAnchor="middle" className="nri-city-map__player-pos-label">
                    {dot.label}
                  </text>
                </g>
              );
            })}
            {markers.map((m) => {
              let px = (m.x / 100) * mapView.w;
              let py = (m.y / 100) * mapView.h;
              if (districtParent) {
                px -= districtParent.x;
                py -= districtParent.y;
                if (px < 0 || py < 0 || px > DISTRICT_DRILL_CANVAS.w || py > DISTRICT_DRILL_CANVAS.h) return null;
              }
              const isHostMarker = m.kind === 'host';
              return (
                <g
                  key={m.id}
                  className={`nri-city-map__marker nri-city-map__marker--${isHostMarker ? 'host' : 'player'} ${selected?.id === m.id ? 'selected' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (panRef.current.didDrag) {
                      panRef.current.didDrag = false;
                      return;
                    }
                    setSelected(m);
                    setDraft(null);
                  }}
                >
                  {isHostMarker ? (
                    <circle cx={px} cy={py} r={2.2} />
                  ) : (
                    <polygon
                      points={`${px},${py - 2.6} ${px + 2.2},${py} ${px},${py + 2.6} ${px - 2.2},${py}`}
                    />
                  )}
                  <text x={px} y={py - 3.6} textAnchor="middle">
                    {m.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {draft && (
        <div className="nri-city-map__draft">
          <h4 className="mono-text">Новая метка</h4>
          <label className="nri-modal__field">
            <span>Подпись</span>
            <input
              value={draft.label}
              onChange={(e) => setDraft({ ...draft, label: e.target.value })}
              placeholder="Встреча, засада, NPC…"
              autoFocus
            />
          </label>
          <label className="nri-modal__field">
            <span>Заметка (опционально)</span>
            <textarea
              rows={2}
              value={draft.blurb}
              onChange={(e) => setDraft({ ...draft, blurb: e.target.value })}
            />
          </label>
          <div className="nri-presets__actions">
            <button type="button" className="nri-lobby__close" onClick={() => setDraft(null)}>
              Отмена
            </button>
            <button type="button" className="nri-modal__submit" disabled={busy || !draft.label.trim()} onClick={saveMarker}>
              Поставить
            </button>
          </div>
        </div>
      )}

      {selected && (
        <div className="nri-city-map__selected mono-text">
          <strong>{selected.label}</strong>
          <p className="opacity-70">
            {selected.kind === 'host' ? 'Метка мастера' : 'Метка игрока'}
            {selected.ownerName ? ` · ${selected.ownerName}` : ''}
          </p>
          {selected.blurb && <p className="opacity-70">{selected.blurb}</p>}
          {(isHost || (selected.ownerUserId != null && selected.ownerUserId === currentUserId)) && (
            <button type="button" className="nri-lobby__close" disabled={busy} onClick={() => removeMarker(selected.id)}>
              <Trash2 size={14} /> Удалить метку
            </button>
          )}
        </div>
      )}

      <ul className="nri-city-map__legend">
        <li><span className="swatch marker-host" /> Метка мастера</li>
        <li><span className="swatch marker-player" /> Метка игрока</li>
        <li><span className="swatch corp" /> Корп-квартал</li>
        <li><span className="swatch mid" /> Средний класс</li>
        <li><span className="swatch slum" /> Трущобы</li>
        <li><span className="swatch industrial" /> Промзоны</li>
        <li><span className="swatch park" /> Парки</li>
        <li><span className="swatch highway" /> Магистрали</li>
        <li><span className="swatch tunnel" /> Корп-тоннели</li>
      </ul>
    </div>
  );
};
