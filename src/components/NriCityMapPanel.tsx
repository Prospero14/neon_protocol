import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowLeftRight,
  CloudRain,
  Lightbulb,
  MapPin,
  Minus,
  Plus,
  RotateCcw,
  RotateCw,
  Shapes,
  Trash2,
  Wand2,
} from 'lucide-react';
import {
  nriCreateMapMarker,
  nriCreateMapSubZone,
  nriCreateMapTopZone,
  nriDeleteMapMarker,
  nriDeleteMapSubZone,
  nriFetchMapMarkers,
  nriFetchMapPositions,
  nriFetchMapZones,
  nriFallbackCityZones,
  nriFallbackDistrictTiles,
  nriFetchVehicles,
  nriMoveToZone,
  nriPatchMapZone,
  nriRegenDistrictTiles,
  nriClearDistrictTiles,
  nriFetchUnderhive,
  nriFetchMapLamps,
  nriCreateMapLamp,
  nriPatchMapLamp,
  nriDeleteMapLamp,
  nriCreateMetroLine,
  nriCreateMetroStation,
  nriDeleteMetroStation,
  nriMetroEnter,
  nriMetroRide,
  nriMetroRideComplete,
  nriMetroRideActive,
  nriCreateMetroShop,
  nriMetroShopBuy,
  type NriMapMarker,
  type NriMapZone,
  type NriMapView,
  type NriPlayerPosition,
  type NriTableVehicle,
  type NriMapLamp,
  type NriUnderhivePayload,
  type NriMetroStationDto,
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
import { NriDistrictWeatherFx } from './NriDistrictWeatherFx';
import { resolveTileVisual, tileAnimationCost } from '../../shared/nri-domain/districtTileVisual';
import { neighborsForTile } from '../../shared/nri-domain/districtGrid';
import type { CityZoneShapePreset } from '../../shared/nri-domain/cityZoneShapePresets';
import { UNDERHIVE_PASSPORT_ID } from '../logic/nriItemCatalog';
import {
  NriMapObjectPicker,
  type MapPickerSelection,
} from './NriMapObjectPicker';
import { NriDistrictBrushPicker } from './NriDistrictBrushPicker';
import { NriUnderhiveLayer } from './NriUnderhiveLayer';
import { NriMapLampLayer } from './NriMapLampLayer';
import {
  brushCellOffsets,
  districtBrushRotatesShape,
  isSelectBrush,
  nextBrushOrientation,
  SELECT_BRUSH,
  withRotatedDistrictBrush,
  type DistrictBrush,
} from '../../shared/nri-domain/districtBrushCatalog';
import {
  DEFAULT_METRO_SHOP_CATALOG,
  LAMP_COLOR_PRESETS,
  neighborStationIds,
} from '../../shared/nri-domain/metroGraph';
import {
  buildBlockMegaInfoMultiSize,
  buildPlazaMegaInfo,
  CORP_HQ_SIZE,
  CORP_OFFICE_SIZE,
  type BlockMegaInfo,
} from '../../shared/nri-domain/plazaMega';
import {
  buildExplicitMegaInfo,
  encodeMegaArtId,
  encodeMegaCoverArtId,
  isMegaMergeType,
  parseMegaArtId,
  shapeDims,
} from '../../shared/nri-domain/districtMegaMerge';
import {
  buildCorpLogoInfo,
  encodeCorpLogoArtId,
  encodeCorpLogoCoverArtId,
  parseCorpLogoArtId,
  type CorpLogoInfo,
  type CorpLogoShape,
} from '../../shared/nri-domain/corpLogoOverlay';

type Props = {
  inviteCode: string;
  isHost: boolean;
  /** Мастер / админ стола — рубильник погоды */
  canToggleWeather?: boolean;
  currentUserId: string;
  /** Инвентарь текущего игрока — для доступа в Подулей */
  inventoryItemIds?: string[];
  onNewAchievements?: (unlocks: import('../logic/nriApi').NriAchievementUnlock[]) => void;
};

type MapLayer = 'city' | 'underhive';
type EditTool = 'select' | 'paint' | 'swap';

/** Blurb-prefix: district-local marker (0–100 of drill canvas). Hidden on city overview. */
const DISTRICT_MARKER_PREFIX = '\u200B@d:';

function encodeDistrictMarkerBlurb(parentKey: string, userBlurb: string): string {
  const note = userBlurb.trim();
  return `${DISTRICT_MARKER_PREFIX}${parentKey}${note ? `\n${note}` : ''}`;
}

function displayMarkerBlurb(blurb: string | null): string {
  if (!blurb) return '';
  if (!blurb.startsWith(DISTRICT_MARKER_PREFIX)) return blurb;
  const nl = blurb.indexOf('\n');
  return nl >= 0 ? blurb.slice(nl + 1) : '';
}

function isDistrictLocalMarker(m: Pick<NriMapMarker, 'blurb'>): boolean {
  return !!m.blurb?.startsWith(DISTRICT_MARKER_PREFIX);
}

function clampNum(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

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

export const NriCityMapPanel: React.FC<Props> = ({
  inviteCode,
  isHost,
  canToggleWeather,
  currentUserId,
  inventoryItemIds,
  onNewAchievements,
}) => {
  const weatherMaster = canToggleWeather ?? isHost;
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
  const [editMode, setEditMode] = useState(false);
  const [editTool, setEditTool] = useState<EditTool>('select');
  const [paintPlaceType, setPaintPlaceType] = useState<PlaceType>('shop');
  const [swapFromKey, setSwapFromKey] = useState<string | null>(null);
  const [mapLayer, setMapLayer] = useState<MapLayer>('city');
  const [tileDragFrom, setTileDragFrom] = useState<string | null>(null);
  const [, setTileDragOver] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeShapeId, setActiveShapeId] = useState<string | null>(null);
  const [pendingPlaceShape, setPendingPlaceShape] = useState<CityZoneShapePreset | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [underhiveData, setUnderhiveData] = useState<NriUnderhivePayload | null>(null);
  const [cityLamps, setCityLamps] = useState<NriMapLamp[]>([]);
  const [lampTool, setLampTool] = useState<'off' | 'place' | 'erase'>('off');
  const lampPlaceMode = lampTool === 'place';
  const lampEraseMode = lampTool === 'erase';
  const [lampColor, setLampColor] = useState('#ffb040');
  const [selectedLampId, setSelectedLampId] = useState<string | null>(null);
  const [selectedMetroStationId, setSelectedMetroStationId] = useState<string | null>(null);
  const [metroConnectFromId, setMetroConnectFromId] = useState<string | null>(null);
  const [activeMetroLineId, setActiveMetroLineId] = useState<string | null>(null);
  const [metroPlaceMode, setMetroPlaceMode] = useState(false);
  const [metroRide, setMetroRide] = useState<{
    id: string;
    arriveAt: number;
    toStationId: string;
    totalSeconds: number;
  } | null>(null);
  const [rideRemainingSec, setRideRemainingSec] = useState(0);
  const [megaSelectMode, setMegaSelectMode] = useState(false);
  const [megaSelection, setMegaSelection] = useState<string[]>([]);
  const [brushPickerOpen, setBrushPickerOpen] = useState(false);
  const [activeBrush, setActiveBrush] = useState<DistrictBrush | null>(() => SELECT_BRUSH);
  const [brushOrientation, setBrushOrientation] = useState(0);
  const [brushPreviewKeys, setBrushPreviewKeys] = useState<string[]>([]);
  const [districtUndo, setDistrictUndo] = useState<
    Array<{ zoneKey: string; placeType: string | null; artId: string | null }> | null
  >(null);
  const tileDragRef = useRef<{
    fromKey: string | null;
    active: boolean;
    moved: boolean;
    pointerId: number | null;
    sx: number;
    sy: number;
  }>({ fromKey: null, active: false, moved: false, pointerId: null, sx: 0, sy: 0 });
  const weatherStorageKey = `nri-map-weather:${inviteCode}`;
  const [weatherOn, setWeatherOn] = useState(() => {
    try {
      return localStorage.getItem(`nri-map-weather:${inviteCode}`) === '1';
    } catch {
      return false;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(weatherStorageKey, weatherOn ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [weatherOn, weatherStorageKey]);
  const canAccessUnderhive =
    isHost || (inventoryItemIds ?? []).includes(UNDERHIVE_PASSPORT_ID);

  useEffect(() => {
    if (districtParentKey && editMode) {
      setEditTool((t) => (t === 'swap' ? t : 'paint'));
    }
  }, [districtParentKey, editMode]);

  useEffect(() => {
    if (editMode && districtParentKey) {
      setPaintPlaceType(editPlaceType);
    }
  }, [editPlaceType, editMode, districtParentKey]);

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
    () => sortedZones(zones.filter((z) => !z.parentZoneKey)),
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
    refreshMarkers();
    refreshPositions();
    const pollMs = districtParentKey ? 20_000 : 12_000;
    const t = setInterval(() => {
      if (mapRefreshPausedRef.current) return;
      refreshMarkers();
      refreshPositions();
    }, pollMs);
    return () => clearInterval(t);
  }, [refreshZones, refreshMarkers, refreshPositions, districtParentKey]);

  useEffect(() => {
    if (mapLayer !== 'city' || !authToken) return;
    let cancelled = false;
    void (async () => {
      const lamps = await nriFetchMapLamps(authToken, inviteCode, 'city');
      if (!cancelled) setCityLamps(lamps);
    })();
    return () => {
      cancelled = true;
    };
  }, [mapLayer, authToken, inviteCode, districtParentKey]);

  useEffect(() => {
    if (mapLayer !== 'underhive' || !authToken) return;
    let cancelled = false;
    const tick = async () => {
      const { ride } = await nriMetroRideActive(authToken, inviteCode);
      if (cancelled) return;
      if (!ride) {
        setMetroRide(null);
        setRideRemainingSec(0);
        return;
      }
      setMetroRide({
        id: ride.id,
        arriveAt: ride.arriveAt,
        toStationId: ride.toStationId,
        totalSeconds: ride.totalSeconds,
      });
      const rem = Math.max(0, Math.ceil(ride.remainingMs / 1000));
      setRideRemainingSec(rem);
      if (rem <= 0) {
        const done = await nriMetroRideComplete(authToken, inviteCode, ride.id);
        if (cancelled) return;
        if (done.ok) {
          setMetroRide(null);
          setRideRemainingSec(0);
          if (done.station) setSelectedMetroStationId(done.station.id);
          setSaveMsg('Поездка завершена');
          void refreshPositions();
        }
      }
    };
    void tick();
    const id = setInterval(() => void tick(), 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [mapLayer, authToken, inviteCode, refreshPositions]);

  const refreshUnderhive = useCallback(async () => {
    if (!authToken) return false;
    const res = await nriFetchUnderhive(authToken, inviteCode);
    if (res.ok) {
      setUnderhiveData(res.data);
      setActiveMetroLineId((prev) => prev ?? res.data.metro.lines[0]?.id ?? null);
      setCityLamps((prev) => {
        const others = prev.filter((l) => l.layer !== 'underhive');
        return [...others, ...res.data.lamps];
      });
      return true;
    }
    return false;
  }, [authToken, inviteCode]);

  const onLampClick = useCallback(
    (lamp: NriMapLamp) => {
      if (!isHost) return;
      if (lampEraseMode) {
        void (async () => {
          if (!authToken) return;
          setBusy(true);
          setErr(null);
          const ok = await nriDeleteMapLamp(authToken, inviteCode, lamp.id);
          setBusy(false);
          if (!ok) {
            setErr('Не удалось удалить фонарь');
            return;
          }
          setCityLamps((prev) => prev.filter((l) => l.id !== lamp.id));
          setUnderhiveData((prev) =>
            prev ? { ...prev, lamps: prev.lamps.filter((l) => l.id !== lamp.id) } : prev
          );
          setSelectedLampId((id) => (id === lamp.id ? null : id));
          setSaveMsg('Фонарь удалён');
        })();
        return;
      }
      setSelectedLampId(lamp.id);
      setLampColor(lamp.color);
      setLampTool('off');
      setSaveMsg(`Фонарь выбран · Del или «Удалить»`);
    },
    [isHost, lampEraseMode, authToken, inviteCode]
  );

  const toggleSelectedLamp = useCallback(async () => {
    if (!isHost || !authToken || !selectedLampId) return;
    const lamp = cityLamps.find((l) => l.id === selectedLampId);
    if (!lamp) return;
    const res = await nriPatchMapLamp(authToken, inviteCode, lamp.id, { on: !lamp.on });
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    setCityLamps((prev) => prev.map((l) => (l.id === res.lamp.id ? res.lamp : l)));
    if (lamp.layer === 'underhive') {
      setUnderhiveData((prev) =>
        prev
          ? { ...prev, lamps: prev.lamps.map((l) => (l.id === res.lamp.id ? res.lamp : l)) }
          : prev
      );
    }
    setSaveMsg(res.lamp.on ? 'Фонарь включён' : 'Фонарь выключен');
  }, [isHost, authToken, inviteCode, selectedLampId, cityLamps]);

  const recolorSelectedLamp = useCallback(
    async (color: string) => {
      setLampColor(color);
      if (!isHost || !authToken || !selectedLampId) return;
      const res = await nriPatchMapLamp(authToken, inviteCode, selectedLampId, { color });
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      setCityLamps((prev) => prev.map((l) => (l.id === res.lamp.id ? res.lamp : l)));
      setUnderhiveData((prev) =>
        prev
          ? { ...prev, lamps: prev.lamps.map((l) => (l.id === res.lamp.id ? res.lamp : l)) }
          : prev
      );
      setSaveMsg('Цвет фонаря обновлён');
    },
    [isHost, authToken, inviteCode, selectedLampId]
  );

  const deleteSelectedLamp = useCallback(async () => {
    if (!isHost || !authToken || !selectedLampId) return;
    setBusy(true);
    setErr(null);
    const id = selectedLampId;
    const ok = await nriDeleteMapLamp(authToken, inviteCode, id);
    setBusy(false);
    if (!ok) {
      setErr('Не удалось удалить фонарь');
      return;
    }
    setCityLamps((prev) => prev.filter((l) => l.id !== id));
    setUnderhiveData((prev) =>
      prev ? { ...prev, lamps: prev.lamps.filter((l) => l.id !== id) } : prev
    );
    setSelectedLampId(null);
    setSaveMsg('Фонарь удалён');
  }, [isHost, authToken, inviteCode, selectedLampId]);

  useEffect(() => {
    if (!isHost || !selectedLampId) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        void deleteSelectedLamp();
      }
      if (e.key === 'Escape') {
        setSelectedLampId(null);
        setLampTool('off');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isHost, selectedLampId, deleteSelectedLamp]);

  const findNearLamp = useCallback(
    (xPct: number, yPct: number): NriMapLamp | null => {
      const layer = mapLayer === 'underhive' ? 'underhive' : 'city';
      const list = cityLamps.filter((l) => {
        if (l.layer !== layer) return false;
        if (layer === 'city' && districtParentKey) return l.parentZoneKey === districtParentKey;
        if (layer === 'city') return !l.parentZoneKey;
        return true;
      });
      let best: NriMapLamp | null = null;
      let bestD = 3.5; // % of map
      for (const l of list) {
        const d = Math.hypot(l.x - xPct, l.y - yPct);
        if (d < bestD) {
          bestD = d;
          best = l;
        }
      }
      return best;
    },
    [cityLamps, mapLayer, districtParentKey]
  );

  const visibleCityLamps = useMemo(() => {
    return cityLamps.filter((l) => {
      if (l.layer !== 'city') return false;
      if (districtParentKey) return l.parentZoneKey === districtParentKey;
      return !l.parentZoneKey;
    });
  }, [cityLamps, districtParentKey]);

  const districtBlockMega = useMemo(() => {
    const out = new Map<string, BlockMegaInfo>();
    if (!districtParentKey || districtTilesLayout.length === 0) return out;
    const tiles = districtTilesLayout.map((z) => ({
      zoneKey: z.zoneKey,
      gridRow: z.gridRow ?? 0,
      gridCol: z.gridCol ?? 0,
      x: z.x,
      y: z.y,
      w: z.w,
      h: z.h,
      placeType: normalizePlaceType(z.placeType ?? 'generic'),
      artId: z.artId ?? null,
    }));
    const explicit = buildExplicitMegaInfo(tiles);
    for (const [k, info] of explicit) {
      const { rows, cols } = shapeDims(info.shape);
      out.set(k, {
        role: info.role,
        span: info.span,
        kind: info.placeType,
        size: Math.max(rows, cols),
      });
    }
    const plaza = buildPlazaMegaInfo(tiles);
    for (const [k, v] of plaza) {
      if (!out.has(k)) out.set(k, { ...v, kind: 'plaza', size: 2 });
    }
    const autoBlocks: Array<{
      placeType: PlaceType;
      kind: BlockMegaInfo['kind'];
      sizes: number[];
    }> = [
      { placeType: 'shack', kind: 'shack', sizes: [2] },
      { placeType: 'corp_office', kind: 'corp_office', sizes: [CORP_OFFICE_SIZE, 2] },
      { placeType: 'corp_hq', kind: 'corp_hq', sizes: [CORP_HQ_SIZE, 4, 3, 2] },
      { placeType: 'house', kind: 'house', sizes: [2] },
    ];
    for (const spec of autoBlocks) {
      const m = buildBlockMegaInfoMultiSize(tiles, spec.placeType, spec.kind, spec.sizes);
      for (const [k, v] of m) {
        if (!out.has(k)) out.set(k, v);
      }
    }
    return out;
  }, [districtParentKey, districtTilesLayout]);

  const districtCorpLogos = useMemo(() => {
    const out = new Map<string, CorpLogoInfo>();
    if (!districtParentKey || districtTilesLayout.length === 0) return out;
    const tiles = districtTilesLayout.map((z) => ({
      zoneKey: z.zoneKey,
      gridRow: z.gridRow ?? 0,
      gridCol: z.gridCol ?? 0,
      x: z.x,
      y: z.y,
      w: z.w,
      h: z.h,
      artId: z.artId ?? null,
    }));
    return buildCorpLogoInfo(tiles);
  }, [districtParentKey, districtTilesLayout]);

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
      setDeleteConfirmName('');
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
    setDeleteConfirmName('');
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
    setSwapFromKey(null);
    setEditTool('select');
    setPendingPlaceShape(null);
    setActiveShapeId(null);
    setViewBox(defaultFocusView(mapView));
  };

  const regenDistrict = async () => {
    if (!authToken || !districtParentKey || !isHost || !editMode || mapFromFallback) return;
    if (
      !window.confirm(
        'Перегенерировать квартал? Клетки и их имена сбросятся. Игроки с клеток переедут в район.'
      )
    ) {
      return;
    }
    setBusy(true);
    setErr(null);
    setSaveMsg(null);
    const res = await nriRegenDistrictTiles(authToken, inviteCode, districtParentKey);
    setBusy(false);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    setZones((prev) => {
      const tops = prev.filter((z) => z.parentZoneKey !== districtParentKey);
      const parent = tops.find((z) => z.zoneKey === districtParentKey);
      const merged = [...tops.filter((z) => z.zoneKey !== districtParentKey), ...(parent ? [parent] : []), ...res.zones];
      return merged;
    });
    setSelectedZoneKey(null);
    setSaveMsg(`Квартал пересобран · ${res.count} клеток`);
  };

  const clearDistrict = async () => {
    if (!authToken || !districtParentKey || !isHost || !editMode || mapFromFallback) return;
    if (
      !window.confirm(
        'Очистить квартал? Дома/магазины станут пустыми клетками; дороги и выходы сохранятся.'
      )
    ) {
      return;
    }
    setBusy(true);
    setErr(null);
    setSaveMsg(null);
    const res = await nriClearDistrictTiles(authToken, inviteCode, districtParentKey);
    setBusy(false);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    setZones((prev) => {
      const tops = prev.filter((z) => z.parentZoneKey !== districtParentKey);
      const parent = tops.find((z) => z.zoneKey === districtParentKey);
      const merged = [
        ...tops.filter((z) => z.zoneKey !== districtParentKey),
        ...(parent ? [parent] : []),
        ...res.zones,
      ];
      return merged;
    });
    setSelectedZoneKey(null);
    setSaveMsg(`Квартал очищен · ${res.count} клеток`);
  };

  const rotateFocusTile = async (delta: number) => {
    if (!authToken || !focusZone || !isHost || !editMode || mapFromFallback) return;
    if (!isSubMapZoneKey(focusZone.zoneKey) || !parseSubTileGrid(focusZone.zoneKey)) return;
    const cur = typeof focusZone.rotation === 'number' ? focusZone.rotation : 0;
    const next = ((Math.round((cur + delta) / 90) * 90) % 360 + 360) % 360;
    setBusy(true);
    setErr(null);
    const res = await nriPatchMapZone(authToken, inviteCode, focusZone.zoneKey, { rotation: next });
    setBusy(false);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    setZones((prev) => prev.map((z) => (z.zoneKey === res.zone.zoneKey ? res.zone : z)));
    setSaveMsg(`Поворот ${next}°`);
  };

  const paintTile = async (zoneKey: string, placeType: PlaceType) => {
    if (!authToken || mapFromFallback) return;
    setBusy(true);
    setErr(null);
    const z = zones.find((x) => x.zoneKey === zoneKey);
    const parsed = parseMegaArtId(z?.artId);
    const clearKeys = new Set<string>([zoneKey]);
    if (parsed?.kind === 'cover') clearKeys.add(parsed.anchorKey);
    if (parsed?.kind === 'anchor') {
      for (const t of zones) {
        const p = parseMegaArtId(t.artId);
        if (p?.kind === 'cover' && p.anchorKey === zoneKey) clearKeys.add(t.zoneKey);
      }
    }
    for (const key of clearKeys) {
      if (key === zoneKey) continue;
      await nriPatchMapZone(authToken, inviteCode, key, { artId: null });
    }
    const res = await nriPatchMapZone(authToken, inviteCode, zoneKey, {
      placeType,
      artId: null,
    });
    setBusy(false);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    await refreshZones({ silent: true });
  };


  const snapshotZoneCells = (keys: Iterable<string>) => {
    const out: Array<{ zoneKey: string; placeType: string | null; artId: string | null }> = [];
    for (const zoneKey of keys) {
      const z = zones.find((x) => x.zoneKey === zoneKey);
      if (!z) continue;
      out.push({
        zoneKey,
        placeType: z.placeType ?? null,
        artId: z.artId ?? null,
      });
    }
    return out;
  };

  const placeDistrictBrush = async (origin: NriMapZone) => {
    if (!authToken || !districtParentKey || !activeBrush || mapFromFallback) return;
    if (isSelectBrush(activeBrush)) return;
    if (origin.gridRow == null || origin.gridCol == null) return;
    const offsets = brushCellOffsets(activeBrush.shape);
    const byPos = new Map(
      districtTilesLayout
        .filter((t) => t.gridRow != null && t.gridCol != null)
        .map((t) => [`${t.gridRow},${t.gridCol}`, t] as const)
    );
    const footprint = offsets.map(([dr, dc]) =>
      byPos.get(`${origin.gridRow! + dr},${origin.gridCol! + dc}`)
    );
    if (footprint.some((c) => !c)) {
      setErr(`Кисти «${activeBrush.label}» не хватает клеток отсюда (нужен свободный контур).`);
      return;
    }
    const cells = footprint as typeof districtTilesLayout;
    const rewrite = new Set(cells.map((c) => c.zoneKey));
    const clearKeys = new Set<string>();
    for (const z of districtSubZones) {
      const p = parseMegaArtId(z.artId) ?? parseCorpLogoArtId(z.artId);
      if (!p) continue;
      if (p.kind === 'cover' && rewrite.has(p.anchorKey)) clearKeys.add(z.zoneKey);
      if (p.kind === 'anchor' && rewrite.has(z.zoneKey)) {
        clearKeys.add(z.zoneKey);
        for (const t of districtSubZones) {
          const cp = parseMegaArtId(t.artId) ?? parseCorpLogoArtId(t.artId);
          if (cp?.kind === 'cover' && cp.anchorKey === z.zoneKey) clearKeys.add(t.zoneKey);
        }
      }
      if (rewrite.has(z.zoneKey)) clearKeys.add(z.zoneKey);
    }
    const touchKeys = new Set([...rewrite, ...clearKeys]);
    const undo = snapshotZoneCells(touchKeys);
    setBusy(true);
    setErr(null);
    for (const key of clearKeys) {
      if (rewrite.has(key)) continue;
      const res = await nriPatchMapZone(authToken, inviteCode, key, { artId: null });
      if (res.ok) setZones((prev) => prev.map((z) => (z.zoneKey === res.zone.zoneKey ? res.zone : z)));
    }
    const anchor = cells[0]!;
    const isLogo = activeBrush.kind === 'logo';
    const artAnchor = isLogo
      ? encodeCorpLogoArtId(activeBrush.logoThemeId ?? 'default', activeBrush.shape as CorpLogoShape)
      : activeBrush.shape === '1x1' || !isMegaMergeType(activeBrush.placeType)
        ? null
        : encodeMegaArtId(activeBrush.placeType, activeBrush.shape);
    const coverArt = artAnchor
      ? isLogo
        ? encodeCorpLogoCoverArtId(anchor.zoneKey)
        : encodeMegaCoverArtId(anchor.zoneKey)
      : null;
    for (const c of cells) {
      const artId =
        !artAnchor
          ? null
          : c.zoneKey === anchor.zoneKey
            ? artAnchor
            : coverArt;
      const payload: { placeType?: PlaceType; artId: string | null; rotation?: number } = {
        artId,
        rotation: brushOrientation,
      };
      if (!isLogo) payload.placeType = activeBrush.placeType;
      const res = await nriPatchMapZone(authToken, inviteCode, c.zoneKey, payload);
      if (!res.ok) {
        setBusy(false);
        setErr(res.error);
        return;
      }
      setZones((prev) => prev.map((z) => (z.zoneKey === res.zone.zoneKey ? res.zone : z)));
    }
    setDistrictUndo(undo);
    setBusy(false);
    setMegaSelectMode(false);
    setMegaSelection([]);
    setSaveMsg(isLogo ? `Лого: ${activeBrush.label}` : `Поставлено: ${activeBrush.label}`);
    await refreshZones({ silent: true });
  };

  const undoDistrictEdit = async () => {
    if (!authToken || !districtUndo || districtUndo.length === 0 || mapFromFallback) return;
    setBusy(true);
    setErr(null);
    const snap = districtUndo;
    setDistrictUndo(null);
    for (const cell of snap) {
      const res = await nriPatchMapZone(authToken, inviteCode, cell.zoneKey, {
        placeType: normalizePlaceType(cell.placeType ?? 'generic'),
        artId: cell.artId,
      });
      if (!res.ok) {
        setBusy(false);
        setErr(res.error);
        return;
      }
      setZones((prev) => prev.map((z) => (z.zoneKey === res.zone.zoneKey ? res.zone : z)));
    }
    setBusy(false);
    setSaveMsg('Откат: 1 действие');
    await refreshZones({ silent: true });
  };

  const brushPreviewForZone = (raw: NriMapZone, brush: DistrictBrush | null = activeBrush): string[] => {
    if (!brush || isSelectBrush(brush) || raw.gridRow == null || raw.gridCol == null) return [];
    const offsets = brushCellOffsets(brush.shape);
    const byPos = new Map(
      districtTilesLayout
        .filter((t) => t.gridRow != null && t.gridCol != null)
        .map((t) => [`${t.gridRow},${t.gridCol}`, t.zoneKey] as const)
    );
    const keys: string[] = [];
    for (const [dr, dc] of offsets) {
      const k = byPos.get(`${raw.gridRow + dr},${raw.gridCol + dc}`);
      if (!k) return [];
      keys.push(k);
    }
    return keys;
  };


  const swapTiles = async (fromKey: string, toKey: string) => {
    if (!authToken || mapFromFallback || fromKey === toKey) return;
    setBusy(true);
    setErr(null);
    const res = await nriPatchMapZone(authToken, inviteCode, fromKey, { swapWithZoneKey: toKey });
    setBusy(false);
    setSwapFromKey(null);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    await refreshZones({ silent: true });
    setSelectedZoneKey(toKey);
    setSaveMsg(districtParentKey ? 'Клетки обменены' : 'Геометрия районов обменена');
  };

  const enterDistrict = useCallback(
    async (z: NriMapZone) => {
      if (!authToken || !canDrillIntoDistrict(z)) return;
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
    [authToken, loadDistrictTiles]
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
  };

  const clearTileDrag = () => {
    tileDragRef.current = { fromKey: null, active: false, moved: false, pointerId: null, sx: 0, sy: 0 };
    setTileDragFrom(null);
    setTileDragOver(null);
  };

  const placeLampAtEvent = (e: React.MouseEvent) => {
    if (!isHost || !authToken) return;
    const svg = svgRef.current;
    if (!svg) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const local = pt.matrixTransform(ctm.inverse());
    const vw = districtParent ? DISTRICT_DRILL_CANVAS.w : mapView.w;
    const vh = districtParent ? DISTRICT_DRILL_CANVAS.h : mapView.h;
    const x = Math.max(0, Math.min(100, (local.x / vw) * 100));
    const y = Math.max(0, Math.min(100, (local.y / vh) * 100));
    const near = findNearLamp(x, y);
    if (near) {
      onLampClick(near);
      return;
    }
    if (lampEraseMode) {
      setSaveMsg('Кликните по маркеру фонаря, чтобы снять');
      return;
    }
    if (!lampPlaceMode) return;
    void (async () => {
      setBusy(true);
      setErr(null);
      const res = await nriCreateMapLamp(authToken, inviteCode, {
        x,
        y,
        color: lampColor,
        on: true,
        layer: mapLayer === 'underhive' ? 'underhive' : 'city',
        parentZoneKey: mapLayer === 'underhive' ? null : districtParentKey,
      });
      setBusy(false);
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      if (mapLayer === 'underhive') {
        setUnderhiveData((prev) =>
          prev ? { ...prev, lamps: [...prev.lamps, res.lamp] } : prev
        );
      }
      setCityLamps((prev) => [...prev.filter((l) => l.id !== res.lamp.id), res.lamp]);
      setSelectedLampId(res.lamp.id);
      setSaveMsg('Фонарь поставлен · выберите цвет / Del — удалить');
    })();
  };

  const handleZoneClick = (raw: NriMapZone, e?: React.MouseEvent) => {
    if ((lampPlaceMode || lampEraseMode) && isHost && e) {
      placeLampAtEvent(e);
      return;
    }
    if (
      editMode &&
      isHost &&
      !mapFromFallback &&
      mapLayer === 'city' &&
      megaSelectMode &&
      districtParentKey &&
      isSubMapZoneKey(raw.zoneKey)
    ) {
      // Toggle off if already selected; otherwise grow a solid rectangle
      // from previous selection + this cell (two corners → full 3×3).
      setMegaSelection((prev) => {
        if (prev.includes(raw.zoneKey)) {
          return prev.filter((k) => k !== raw.zoneKey);
        }
        const pool = districtTilesLayout.filter((t) => t.gridRow != null && t.gridCol != null);
        const byKey = new Map(pool.map((t) => [t.zoneKey, t]));
        const seed = [...prev.map((k) => byKey.get(k)).filter(Boolean), byKey.get(raw.zoneKey)].filter(
          (t): t is (typeof pool)[number] => !!t
        );
        if (seed.length === 0) return [raw.zoneKey];
        const minR = Math.min(...seed.map((t) => t.gridRow!));
        const maxR = Math.max(...seed.map((t) => t.gridRow!));
        const minC = Math.min(...seed.map((t) => t.gridCol!));
        const maxC = Math.max(...seed.map((t) => t.gridCol!));
        const filled = pool
          .filter(
            (t) =>
              t.gridRow! >= minR &&
              t.gridRow! <= maxR &&
              t.gridCol! >= minC &&
              t.gridCol! <= maxC
          )
          .map((t) => t.zoneKey);
        return filled.length >= 2 ? filled : [...prev, raw.zoneKey];
      });
      applyZoneSelection(raw);
      return;
    }
    if (
      editMode &&
      isHost &&
      !mapFromFallback &&
      mapLayer === 'city'
    ) {
      if (districtParentKey && isSubMapZoneKey(raw.zoneKey) && parseSubTileGrid(raw.zoneKey)) {
        if (editTool === 'swap') {
          if (!swapFromKey) {
            setSwapFromKey(raw.zoneKey);
            applyZoneSelection(raw);
            setSaveMsg('Выберите вторую клетку для обмена');
            return;
          }
          void swapTiles(swapFromKey, raw.zoneKey);
          return;
        }
        if (
          activeBrush &&
          !isSelectBrush(activeBrush) &&
          (editTool === 'paint' || editTool === 'select') &&
          !megaSelectMode
        ) {
          void placeDistrictBrush(raw);
          applyZoneSelection(raw);
          return;
        }
        // Выделение / без кисти постановки — только выбрать клетку
        if (isSelectBrush(activeBrush) || editTool === 'select') {
          applyZoneSelection(raw);
          setSaveMsg('Клетка выбрана · колесо или «Поворот» — крутить');
          return;
        }
        // Fallback 1×1 paint
        if (editTool === 'paint') {
          void paintTile(raw.zoneKey, paintPlaceType);
          applyZoneSelection(raw);
          return;
        }
      }
      if (!districtParentKey && !raw.parentZoneKey && editTool === 'swap') {
        if (!swapFromKey) {
          setSwapFromKey(raw.zoneKey);
          applyZoneSelection(raw);
          setSaveMsg('Выберите второй район для обмена геометрией');
          return;
        }
        void swapTiles(swapFromKey, raw.zoneKey);
        return;
      }
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
    setViewBox(
      districtParentKey
        ? { x: 0, y: 0, w: DISTRICT_DRILL_CANVAS.w, h: DISTRICT_DRILL_CANVAS.h }
        : defaultFocusView(mapView)
    );
  };

  const createTopZoneAt = async (preset: CityZoneShapePreset, worldX: number, worldY: number) => {
    if (!authToken || !isHost || mapFromFallback) return;
    const name = window.prompt('Название района / зоны (обязательно)');
    if (!name?.trim()) return;
    const x = Math.max(0, worldX - preset.w / 2);
    const y = Math.max(0, worldY - preset.h / 2);
    setBusy(true);
    setErr(null);
    const res = await nriCreateMapTopZone(authToken, inviteCode, {
      name: name.trim(),
      zoneType: preset.defaultZoneType,
      x,
      y,
      w: preset.w,
      h: preset.h,
      artId: preset.defaultArtId ?? null,
    });
    setBusy(false);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    setZones((prev) => [...prev.filter((z) => z.zoneKey !== res.zone.zoneKey), res.zone]);
    setSelectedZoneKey(res.zone.zoneKey);
    setPendingPlaceShape(null);
    setActiveShapeId(null);
    setSaveMsg(`Создан район «${res.zone.name}»`);
    void refreshZones({ silent: true });
  };

  const deleteTopZoneTyped = async () => {
    if (!authToken || !focusZone || focusZone.parentZoneKey || !editMode || mapFromFallback) return;
    const confirmName = deleteConfirmName.trim();
    if (!confirmName) {
      setErr('Введите точное название района для удаления');
      return;
    }
    if (!window.confirm(`Удалить район «${focusZone.name}»?`)) return;
    setBusy(true);
    setErr(null);
    const res = await nriDeleteMapSubZone(authToken, inviteCode, focusZone.zoneKey, { confirmName });
    setBusy(false);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    setSelectedZoneKey(null);
    setDeleteConfirmName('');
    setSaveMsg('Район удалён');
    await refreshZones();
  };

  const clickToWorld = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const local = pt.matrixTransform(ctm.inverse());
    return { x: local.x, y: local.y };
  };

  const clickToPercent = (e: React.MouseEvent<SVGSVGElement>) => {
    const world = clickToWorld(e);
    if (!world) return null;
    if (districtParent) {
      return {
        x: (world.x / DISTRICT_DRILL_CANVAS.w) * 100,
        y: (world.y / DISTRICT_DRILL_CANVAS.h) * 100,
      };
    }
    return {
      x: (world.x / mapView.w) * 100,
      y: (world.y / mapView.h) * 100,
    };
  };

  const onSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (panRef.current.didDrag) {
      panRef.current.didDrag = false;
      return;
    }
    if ((lampPlaceMode || lampEraseMode) && isHost && authToken) {
      placeLampAtEvent(e);
      return;
    }
    if (mapLayer === 'underhive' && metroPlaceMode && isHost && authToken && activeMetroLineId) {
      const world = clickToWorld(e);
      if (!world) return;
      void (async () => {
        setBusy(true);
        setErr(null);
        const res = await nriCreateMetroStation(authToken, inviteCode, {
          lineId: activeMetroLineId,
          x: world.x,
          y: world.y,
          connectFromStationId: metroConnectFromId,
        });
        setBusy(false);
        if (!res.ok) {
          setErr(res.error);
          return;
        }
        setSelectedMetroStationId(res.station.id);
        setMetroConnectFromId(null);
        setMetroPlaceMode(false);
        await refreshUnderhive();
        setSaveMsg(`Станция «${res.station.name}»`);
      })();
      return;
    }
    if (placeMode) {
      const pos = clickToPercent(e);
      if (!pos) return;
      setDraft({ x: pos.x, y: pos.y, label: '', blurb: '' });
      setSelected(null);
      return;
    }
    if (
      pendingPlaceShape &&
      isHost &&
      editMode &&
      !districtParentKey &&
      mapLayer === 'city' &&
      !mapFromFallback
    ) {
      const world = clickToWorld(e);
      if (!world) return;
      void createTopZoneAt(pendingPlaceShape, world.x, world.y);
      return;
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
    // Выделение: колесо крутит выбранную клетку (не зум).
    if (
      mapLayer === 'city' &&
      districtParentKey &&
      editMode &&
      isSelectBrush(activeBrush) &&
      editTool !== 'swap' &&
      !megaSelectMode &&
      focusZone &&
      isSubMapZoneKey(focusZone.zoneKey)
    ) {
      const dir: 1 | -1 = e.deltaY > 0 ? 1 : -1;
      void rotateFocusTile(dir * 90);
      return;
    }
    // Кисть постановки: колесо поворачивает форму / orientation.
    if (
      mapLayer === 'city' &&
      districtParentKey &&
      editMode &&
      activeBrush &&
      !isSelectBrush(activeBrush) &&
      editTool !== 'swap' &&
      !megaSelectMode
    ) {
      const dir: 1 | -1 = e.deltaY > 0 ? 1 : -1;
      if (districtBrushRotatesShape(activeBrush.shape)) {
        const next = withRotatedDistrictBrush(activeBrush, dir);
        if (next.id !== activeBrush.id) {
          setActiveBrush(next);
          setPaintPlaceType(next.placeType);
          if (hoverZone?.parentZoneKey === districtParentKey) {
            setBrushPreviewKeys(brushPreviewForZone(hoverZone, next));
          }
          setSaveMsg(`Кисть «${next.label}» · колесо = поворот`);
        }
      } else {
        const nextOri = nextBrushOrientation(brushOrientation, dir);
        setBrushOrientation(nextOri);
        setSaveMsg(`Кисть «${activeBrush.label}» · поворот ${nextOri}°`);
      }
      return;
    }
    if (mapLayer !== 'city' && mapLayer !== 'underhive') return;
    zoomAt(e.deltaY > 0 ? 1.1 : 0.9, e.clientX, e.clientY);
  };

  const resolveTapZoneKey = (target: EventTarget | null): string | null => {
    if (!(target instanceof Element)) return null;
    return target.closest('[data-zone-key]')?.getAttribute('data-zone-key') ?? null;
  };

  const armPan = (e: React.PointerEvent, tapZoneKey: string | null = null) => {
    if (e.button !== 0) return;
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
    handleZoneClick(raw, e);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    if (mapLayer !== 'city' && mapLayer !== 'underhive') return;
    if ((e.target as Element).closest('.nri-city-map__marker')) return;
    armPan(e, resolveTapZoneKey(e.target));
    // Сразу берём capture — иначе pan ломается на SVG/зоне
    try {
      wrapRef.current?.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
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
    }
    const rect = svgRef.current.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
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
        handleZoneClick(raw, e as unknown as React.MouseEvent);
      }
    }
  };

  const onPickerSelect = (sel: MapPickerSelection) => {
    if (sel.kind === 'place') {
      setPaintPlaceType(sel.placeType);
      setEditTool('paint');
      setPendingPlaceShape(null);
      setActiveShapeId(null);
      setSwapFromKey(null);
      setSaveMsg(`Кисть «${PLACE_TYPE_LABELS[sel.placeType]}»`);
      return;
    }
    setPendingPlaceShape(sel.preset);
    setActiveShapeId(sel.preset.id);
    setEditTool('select');
    setSwapFromKey(null);
    setSaveMsg(`Форма «${sel.preset.label}»: клик по фону карты для размещения`);
  };

  const saveMarker = async () => {
    if (!authToken || !draft?.label.trim() || mapFromFallback) return;
    setBusy(true);
    setErr(null);
    const userBlurb = draft.blurb.trim();
    const res = await nriCreateMapMarker(authToken, inviteCode, {
      label: draft.label.trim(),
      blurb: districtParentKey
        ? encodeDistrictMarkerBlurb(districtParentKey, userBlurb)
        : userBlurb || undefined,
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
    if (!authToken || !parentKey || !newSubName.trim() || mapFromFallback) return;
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
    setZones((prev) => {
      const kept = prev.filter((z) => z.parentZoneKey !== parentKey && z.zoneKey !== createdKey);
      const siblings = prev.filter((z) => z.parentZoneKey === parentKey && z.zoneKey !== createdKey);
      return [...kept, ...siblings, res.zone];
    });
    setDistrictParentKey(parentKey);
    setViewBox({ x: 0, y: 0, w: DISTRICT_DRILL_CANVAS.w, h: DISTRICT_DRILL_CANVAS.h });
    setSelectedZoneKey(createdKey);
    void refreshZones({ silent: true });
  };

  const deleteSubZone = async () => {
    if (!authToken || !focusZone || !isSubMapZoneKey(focusZone.zoneKey) || !editMode) return;
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
    if (!authToken || !focusZone || mapFromFallback) return;
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
    if (editMode && isSubMapZoneKey(focusZone.zoneKey) && editPlaceType !== curPlace) {
      payload.placeType = editPlaceType;
    }
    const curStyle = normalizeDistrictStyle(focusZone.districtStyle ?? '') ?? null;
    const nextStyle = editDistrictStyle;
    if (!isSubMapZoneKey(focusZone.zoneKey) && canDrillIntoDistrict(focusZone)) {
      const base = curStyle ?? defaultDistrictStyleFromZone(focusZone);
      if (nextStyle !== base) payload.districtStyle = nextStyle;
    } else if (editMode && isSubMapZoneKey(focusZone.zoneKey) && curStyle !== nextStyle) {
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

  const districtList = renderZones;
  const megaClusters = useMemo(
    () => (districtParent || cityZones.length === 0 || mapLayer !== 'city' ? [] : getMegaClusters()),
    [districtParent, cityZones.length, mapLayer]
  );
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
      (editMode &&
        isSubMapZoneKey(focusZone.zoneKey) &&
        editPlaceType !== normalizePlaceType(focusZone.placeType ?? 'generic')) ||
      (editMode &&
        editDistrictStyle !==
          (isSubMapZoneKey(focusZone.zoneKey)
            ? normalizeDistrictStyle(focusZone.districtStyle ?? districtVisualStyle) ?? 'residential'
            : defaultDistrictStyleFromZone(focusZone))) ||
      (!editMode &&
        !isSubMapZoneKey(focusZone.zoneKey) &&
        editDistrictStyle !== defaultDistrictStyleFromZone(focusZone)));

  const panelZone = focusZone ?? hoverZone;
  const cityOverviewFocus =
    !!focusZone && !districtParentKey && !isSubMapZoneKey(focusZone.zoneKey);
  const cityOverviewHoverOnly =
    !districtParentKey && !!hoverZone && !focusZone && !isSubMapZoneKey(hoverZone.zoneKey);
  const subCountForFocus =
    focusZone && canDrillIntoDistrict(focusZone)
      ? focusZone.subTileCount ?? zones.filter((z) => z.parentZoneKey === focusZone.zoneKey).length
      : 0;
  const canEnterFocus = !!(focusZone && canDrillIntoDistrict(focusZone));
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
  const selectedMetroStation = useMemo((): NriMetroStationDto | null => {
    if (!selectedMetroStationId || !underhiveData) return null;
    return underhiveData.metro.stations.find((s) => s.id === selectedMetroStationId) ?? null;
  }, [selectedMetroStationId, underhiveData]);
  const selectedMetroNeighbors = useMemo(() => {
    if (!selectedMetroStation || !underhiveData) return [];
    const ids = neighborStationIds(selectedMetroStation.id, underhiveData.metro.edges);
    return underhiveData.metro.stations.filter((s) => ids.includes(s.id));
  }, [selectedMetroStation, underhiveData]);
  const selectedMetroShops = useMemo(() => {
    if (!selectedMetroStation || !underhiveData) return [];
    return underhiveData.metro.shops.filter((s) => s.stationId === selectedMetroStation.id);
  }, [selectedMetroStation, underhiveData]);
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
      if (laid) {
        return {
          px: laid.x + laid.w / 2,
          py: laid.y + laid.h / 2,
          label: p.displayName ?? p.userId.slice(0, 6),
        };
      }
      if (p.x != null && p.y != null) {
        return {
          px: clampNum(p.x - districtParent.x, 0, DISTRICT_DRILL_CANVAS.w),
          py: clampNum(p.y - districtParent.y, 0, DISTRICT_DRILL_CANVAS.h),
          label: p.displayName ?? p.userId.slice(0, 6),
        };
      }
      return null;
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
            {mapLayer === 'underhive'
              ? underhiveData
                ? 'Подулей / Underhive — метро, фонари, корп-подземелья.'
                : 'Подулей / Underhive — загрузка слоя…'
              : districtParent
                ? editMode
                  ? 'Редактор: объект / обмен / поворот / очистка.'
                  : 'Клик по клетке — выбрать · имя и привязки без редактора.'
                : `Neon City · ${NEON_CITY_POP_LABEL} жителей · клик — район · карточка — войти.`}
            {mapLayer === 'city' || mapLayer === 'underhive' ? ' Колёсико — зум · ЛКМ — сдвиг.' : ''}
          </p>
        </div>
        <div className="nri-city-map__toolbar">
          <span className="nri-city-map__tb-group" role="group" aria-label="Слой">
            <button
              type="button"
              className={`nri-lobby__close ${mapLayer === 'city' ? 'active' : ''}`}
              onClick={() => {
                setMapLayer('city');
                setLampTool('off');
                setMetroPlaceMode(false);
                setErr(null);
              }}
            >
              Город
            </button>
            <button
              type="button"
              className={`nri-lobby__close ${mapLayer === 'underhive' ? 'active' : ''}`}
              disabled={!canAccessUnderhive}
              title={
                canAccessUnderhive
                  ? 'Подулей / Underhive'
                  : 'Нужна Метка поручителя из Подулья'
              }
              onClick={() => {
                if (!canAccessUnderhive) return;
                void (async () => {
                  if (authToken) {
                    const res = await nriFetchUnderhive(authToken, inviteCode);
                    if (res.ok) {
                      setUnderhiveData(res.data);
                      setActiveMetroLineId((prev) => prev ?? res.data.metro.lines[0]?.id ?? null);
                      setCityLamps((prev) => {
                        const others = prev.filter((l) => l.layer !== 'underhive');
                        return [...others, ...res.data.lamps];
                      });
                      setErr(null);
                    } else if (!isHost) {
                      const softFail =
                        /404|не найден|unavailable|сеть|network|timeout|таймаут/i.test(res.error) ||
                        res.error.includes('Подулей недоступен');
                      if (!softFail) {
                        setErr(res.error);
                        return;
                      }
                      setErr(null);
                    } else {
                      setErr(res.error);
                    }
                  }
                  setMapLayer('underhive');
                  setDistrictParentKey(null);
                  setSelectedZoneKey(null);
                  setEditMode(false);
                  setEditTool('select');
                  setSwapFromKey(null);
                  setPendingPlaceShape(null);
                  setActiveShapeId(null);
                  setLampTool('off');
                  setMetroPlaceMode(false);
                  setMegaSelectMode(false);
                  setViewBox(defaultFocusView(mapView));
                })();
              }}
            >
              Подулей
            </button>
          </span>

          {(mapLayer === 'city' || mapLayer === 'underhive') && (
            <span className="nri-city-map__tb-group" role="group" aria-label="Вид">
              {mapLayer === 'city' && districtParentKey && (
                <button type="button" className="nri-modal__submit" onClick={resetView}>
                  <ArrowLeft size={14} /> Neon City
                </button>
              )}
              <button
                type="button"
                className="nri-lobby__close"
                title="Приблизить"
                onClick={() => zoomAt(0.82)}
              >
                <Plus size={14} />
              </button>
              <button
                type="button"
                className="nri-lobby__close"
                title="Отдалить"
                onClick={() => zoomAt(1.12)}
              >
                <Minus size={14} />
              </button>
              <button
                type="button"
                className="nri-lobby__close"
                title="Сбросить камеру"
                onClick={resetView}
              >
                <RotateCcw size={14} />
              </button>
            </span>
          )}

          {weatherMaster && (
            <span className="nri-city-map__tb-group" role="group" aria-label="Атмосфера">
              <button
                type="button"
                className={`nri-city-map__weather-toggle ${weatherOn ? 'active' : ''}`}
                onClick={() => setWeatherOn((v) => !v)}
              >
                <CloudRain size={15} /> {weatherOn ? 'Дождь: ВКЛ' : 'Дождь'}
              </button>
            </span>
          )}

          {mapLayer === 'city' && (
            <span className="nri-city-map__tb-group" role="group" aria-label="Метки">
              <button
                type="button"
                className={`nri-modal__submit ${placeMode ? 'active' : ''} ${!isHost ? 'nri-city-map__place-player' : ''}`}
                disabled={mapFromFallback}
                title={mapFromFallback ? 'Локальная схема — метки не сохраняются' : undefined}
                onClick={() => {
                  setPlaceMode((v) => !v);
                  setDraft(null);
                  setPendingPlaceShape(null);
                }}
              >
                <Plus size={14} /> {placeMode ? 'Метки: ВКЛ' : 'Ставить метку'}
              </button>
            </span>
          )}

          {isHost && mapLayer === 'city' && (
            <span className="nri-city-map__tb-group" role="group" aria-label="Редактор">
              <button
                type="button"
                className={`nri-modal__submit ${editMode ? 'active' : ''}`}
                disabled={mapFromFallback}
                title="Режим редактирования карты"
                onClick={() => {
                  setEditMode((v) => {
                    if (v) {
                      setEditTool('select');
                      setSwapFromKey(null);
                      setPendingPlaceShape(null);
                      setActiveShapeId(null);
                      setBrushPickerOpen(false);
                      setBrushPreviewKeys([]);
                      clearTileDrag();
                      return false;
                    }
                    setEditTool('select');
                    setSwapFromKey(null);
                    setMegaSelectMode(false);
                    setMegaSelection([]);
                    if (districtParentKey) {
                      setActiveBrush(SELECT_BRUSH);
                      setSaveMsg('Выделение: клик = выбрать клетку · колесо = поворот');
                    } else {
                      setSaveMsg('Выберите форму в пикере · клик по фону — новый район');
                    }
                    return true;
                  });
                }}
              >
                {editMode ? 'Редактор: ВКЛ' : 'Редактор'}
              </button>
              {editMode && (
                <>
                  {districtParentKey ? (
                    <>
                      <button
                        type="button"
                        className={`nri-modal__submit ${brushPickerOpen ? 'active' : ''}`}
                        title="Каталог кистей по размерам"
                        onClick={() => setBrushPickerOpen(true)}
                      >
                        <Shapes size={14} /> {activeBrush ? activeBrush.label : 'Кисти'}
                      </button>
                      <button
                        type="button"
                        className="nri-lobby__close"
                        disabled={busy || !districtUndo || mapFromFallback}
                        title="Откатить последнее размещение"
                        onClick={() => void undoDistrictEdit()}
                      >
                        <RotateCcw size={14} /> Откатить
                      </button>
                      <button
                        type="button"
                        className={`nri-lobby__close ${editTool === 'swap' ? 'active' : ''}`}
                        title="Два клика или drag-and-drop для обмена"
                        onClick={() => {
                          setEditTool((t) =>
                            t === 'swap' ? (isSelectBrush(activeBrush) ? 'select' : 'paint') : 'swap'
                          );
                          setSwapFromKey(null);
                        }}
                      >
                        <ArrowLeftRight size={14} /> Обмен
                      </button>
                      <button
                        type="button"
                        className="nri-lobby__close"
                        disabled={busy || mapFromFallback}
                        title="Очистить здания квартала"
                        onClick={() => void clearDistrict()}
                      >
                        <Trash2 size={14} /> Очистить
                      </button>
                      <button
                        type="button"
                        className="nri-lobby__close"
                        disabled={busy || mapFromFallback}
                        title="Сбросить клетки и собрать квартал заново"
                        onClick={() => void regenDistrict()}
                      >
                        <Wand2 size={14} /> Переген
                      </button>
                    </>
                  ) : (
                    <>
                  <button
                    type="button"
                    className={`nri-lobby__close ${pickerOpen ? 'active' : ''}`}
                    title="Выбор объекта / формы"
                    onClick={() => setPickerOpen(true)}
                  >
                    <Shapes size={14} />{' '}
                    {pendingPlaceShape ? pendingPlaceShape.label : 'Объект'}
                  </button>
                  <button
                    type="button"
                    className={`nri-lobby__close ${editTool === 'swap' ? 'active' : ''}`}
                    title="Два клика или drag-and-drop для обмена"
                    onClick={() => {
                      setEditTool((t) => (t === 'swap' ? 'select' : 'swap'));
                      setSwapFromKey(null);
                      setPendingPlaceShape(null);
                    }}
                  >
                    <ArrowLeftRight size={14} /> Обмен
                  </button>
                    </>
                  )}
                </>
              )}
            </span>
          )}

          {isHost && ((editMode && mapLayer === 'city') || mapLayer === 'underhive') && (
            <span className="nri-city-map__tb-group" role="group" aria-label="Фонари">
              <button
                type="button"
                className={`nri-modal__submit ${lampTool === 'place' ? 'active' : ''}`}
                title="Клик по карте — поставить фонарь. Клик по маркеру — выбрать."
                onClick={() => {
                  setLampTool((t) => (t === 'place' ? 'off' : 'place'));
                  setMetroPlaceMode(false);
                  setPlaceMode(false);
                }}
              >
                <Lightbulb size={14} /> {lampTool === 'place' ? 'Ставить' : 'Фонарь'}
              </button>
              <button
                type="button"
                className={`nri-lobby__close ${lampTool === 'erase' ? 'active' : ''}`}
                title="Режим снятия: клик по фонарю удаляет его сразу"
                onClick={() => {
                  setLampTool((t) => (t === 'erase' ? 'off' : 'erase'));
                  setMetroPlaceMode(false);
                  setPlaceMode(false);
                  setSaveMsg(lampTool === 'erase' ? null : 'Снять фонарь: клик по маркеру');
                }}
              >
                <Trash2 size={14} /> Снять
              </button>
              <span className="nri-city-map__lamp-swatches" role="group" aria-label="Цвета фонарей">
                {LAMP_COLOR_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`nri-city-map__lamp-swatch${lampColor === p.color ? ' active' : ''}`}
                    title={selectedLampId ? `Перекрасить · ${p.label}` : `Кисть · ${p.label}`}
                    style={{ background: p.color }}
                    onClick={() => void recolorSelectedLamp(p.color)}
                  />
                ))}
              </span>
              {selectedLampId && (
                <>
                  <button
                    type="button"
                    className="nri-lobby__close"
                    disabled={busy}
                    title="Вкл / выкл"
                    onClick={() => void toggleSelectedLamp()}
                  >
                    {cityLamps.find((l) => l.id === selectedLampId)?.on ? 'Выкл' : 'Вкл'}
                  </button>
                  <button
                    type="button"
                    className="nri-modal__submit nri-city-map__lamp-delete"
                    disabled={busy}
                    title="Удалить выбранный фонарь (Delete)"
                    onClick={() => void deleteSelectedLamp()}
                  >
                    <Trash2 size={14} /> Удалить
                  </button>
                </>
              )}
            </span>
          )}

          {isHost && mapLayer === 'underhive' && (
            <span className="nri-city-map__tb-group" role="group" aria-label="Метро">
              <button
                type="button"
                className="nri-lobby__close"
                disabled={busy || !authToken}
                onClick={() => {
                  void (async () => {
                    if (!authToken) return;
                    setBusy(true);
                    const res = await nriCreateMetroLine(authToken, inviteCode);
                    setBusy(false);
                    if (!res.ok) {
                      setErr(res.error);
                      return;
                    }
                    setActiveMetroLineId(res.line.id);
                    await refreshUnderhive();
                    setSaveMsg(`Ветка «${res.line.name}»`);
                  })();
                }}
              >
                Новая ветка
              </button>
              <button
                type="button"
                className={`nri-lobby__close ${metroPlaceMode ? 'active' : ''}`}
                disabled={!activeMetroLineId}
                title={activeMetroLineId ? 'Клик по карте — станция' : 'Сначала создайте ветку'}
                onClick={() => {
                  setMetroPlaceMode((v) => !v);
                  setLampTool('off');
                }}
              >
                Станция
              </button>
              <button
                type="button"
                className={`nri-lobby__close ${metroConnectFromId ? 'active' : ''}`}
                disabled={!selectedMetroStationId}
                title="Следующая станция соединится с выбранной"
                onClick={() => {
                  if (!selectedMetroStationId) return;
                  setMetroConnectFromId(selectedMetroStationId);
                  setMetroPlaceMode(true);
                  setLampTool('off');
                  setSaveMsg('Кликните место новой станции для связи');
                }}
              >
                Связать
              </button>
              <button
                type="button"
                className="nri-lobby__close"
                disabled={!selectedMetroStationId || busy || !authToken}
                onClick={() => {
                  void (async () => {
                    if (!authToken || !selectedMetroStationId) return;
                    setBusy(true);
                    const res = await nriCreateMetroShop(authToken, inviteCode, {
                      stationId: selectedMetroStationId,
                      catalogIds: [...DEFAULT_METRO_SHOP_CATALOG],
                    });
                    setBusy(false);
                    if (!res.ok) {
                      setErr(res.error);
                      return;
                    }
                    await refreshUnderhive();
                    setSaveMsg(`Лавка «${res.shop.label}»`);
                  })();
                }}
              >
                Лавка
              </button>
            </span>
          )}
        </div>
      </header>

      {isHost && editMode && mapLayer === 'city' && (
        <p className="mono-text nri-city-map__edit-dock-hint">
          {districtParentKey
            ? editTool === 'swap'
              ? swapFromKey
                ? 'Обмен: кликните вторую клетку (или перетащите).'
                : 'Обмен: кликните первую клетку или перетащите клетку на другую.'
              : activeBrush && !isSelectBrush(activeBrush)
                ? `Кисть «${activeBrush.label}»${brushOrientation ? ` · ${brushOrientation}°` : ''}: клик = поставить · колесо = поворот кисти`
                : 'Выделение: клик = выбрать · колесо = поворот клетки · «Кисти» — поставить объект'
            : editTool === 'swap'
              ? swapFromKey
                ? 'Обмен геометрией: кликните второй район.'
                : 'Обмен геометрией: кликните первый район или перетащите.'
              : pendingPlaceShape
                ? `Форма «${pendingPlaceShape.label}»: клик по фону карты — создать район.`
                : 'Откройте «Объект» — выберите форму, затем клик по фону.'}
        </p>
      )}

      <NriMapObjectPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={onPickerSelect}
        mode={districtParentKey ? 'buildings' : 'all'}
        activePlaceType={paintPlaceType}
        activeShapeId={activeShapeId}
      />
      <NriDistrictBrushPicker
        open={brushPickerOpen}
        onClose={() => setBrushPickerOpen(false)}
        activeBrushId={activeBrush?.id ?? null}
        onSelect={(brush) => {
          setActiveBrush(brush);
          setBrushOrientation(0);
          setMegaSelectMode(false);
          setMegaSelection([]);
          if (isSelectBrush(brush)) {
            setEditTool('select');
            setSaveMsg('Выделение: клик = выбрать · колесо = поворот клетки');
          } else {
            setPaintPlaceType(brush.placeType);
            setEditTool('paint');
            setSaveMsg(`Кисть «${brush.label}»: клик = угол · колесо = поворот`);
          }
        }}
      />

      {mapFromFallback && (
        <p className="nri-lobby__err mono-text">
          Локальная схема города (read-only): правки зон, сабзоны и метки отключены, пока API карты недоступен.
        </p>
      )}
      {err && <p className="nri-lobby__err mono-text">{err}</p>}

      <div className="nri-city-map__hover-slot" aria-live="polite">
        {mapLayer === 'underhive' ? (
          <p className="mono-text nri-city-map__hover">
            {metroRide
              ? `Поездка… ${rideRemainingSec}с`
              : canAccessUnderhive
                ? underhiveData?.label ?? 'Подулей открыт.'
                : 'Нужна «Метка поручителя из Подулья» — выдаёт мастер.'}
          </p>
        ) : districtParent && districtScale ? (
          <>
            <NriCityDistrictDossier
              zoneType={districtParent.zoneType}
              scale={districtParent}
              megaLabel={districtParent.megaDistrict ?? megaFromZoneKey(districtParent.zoneKey)}
              compact
            />
          </>
        ) : null}
        {mapLayer === 'city' && cityOverviewFocus ? (
          <NriCityDistrictCard
            zone={focusZone!}
            megaLabel={zoneMega(focusZone!)}
            selected
            drillLabel={
              canEnterFocus
                ? subCountForFocus > 0
                  ? `Войти в район (${subCountForFocus} клеток)`
                  : 'Войти в район'
                : null
            }
            onDrill={canEnterFocus ? () => void enterDistrict(focusZone!) : undefined}
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
                  disabled={busy || !zoneEditsDirty || !editName.trim() || mapFromFallback}
                  onClick={() => void saveZoneEdits()}
                >
                  {busy ? 'Сохранение…' : 'Сохранить'}
                </button>
                {editMode && (
                  <div className="nri-city-map__zone-field mono-text nri-city-map__zone-field--wide">
                    <span>Удалить район (введите точное имя)</span>
                    <input
                      value={deleteConfirmName}
                      onChange={(e) => setDeleteConfirmName(e.target.value)}
                      placeholder={focusZone!.name}
                    />
                    <button
                      type="button"
                      className="nri-lobby__close"
                      disabled={busy || mapFromFallback || !deleteConfirmName.trim()}
                      onClick={() => void deleteTopZoneTyped()}
                    >
                      <Trash2 size={14} /> Удалить район
                    </button>
                  </div>
                )}
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
        ) : mapLayer === 'city' && cityOverviewHoverOnly ? (
          <p className="mono-text nri-city-map__hover-hint">
            <strong>{hoverZone!.name}</strong> · {DISTRICT_TYPE_LABELS[hoverZone!.zoneType as NeonCityDistrictType] ?? hoverZone!.zoneType}
            {' '}— клик для карточки района
          </p>
        ) : mapLayer === 'city' && panelZone ? (
          <>
            {!districtParentKey && (
              <p className={`mono-text nri-city-map__hover${focusZone ? ' nri-city-map__hover--selected' : ''}`}>
                {focusZone && <span className="nri-city-map__selected-tag">выбран</span>}
                <strong>{panelZone.name}</strong> · {typeLabel}
                {panelZone.locked && ' · доступ только корпам'}
                {panelZone.corpName && ` · ${panelZone.corpName}`}
                {panelZone.pois?.length ? ` · ${panelZone.pois.join(', ')}` : ''}
              </p>
            )}
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
                {editMode && isSubMapZoneKey(focusZone.zoneKey) && (
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
                    {parseSubTileGrid(focusZone.zoneKey) && (
                      <div className="nri-city-map__zone-field mono-text">
                        <span>Поворот {typeof focusZone.rotation === 'number' ? focusZone.rotation : 0}°</span>
                        <button
                          type="button"
                          className="nri-lobby__close"
                          disabled={busy}
                          onClick={() => void rotateFocusTile(90)}
                        >
                          <RotateCw size={14} /> +90°
                        </button>
                      </div>
                    )}
                  </>
                )}
                {editMode && editTool === 'paint' && (
                  <p className="mono-text opacity-70">
                    Кисть: выберите тип в «Объект» и кликните клетку. Перетаскивание = обмен.
                  </p>
                )}
                {editMode && editTool === 'swap' && (
                  <p className="mono-text opacity-70">
                    {swapFromKey
                      ? `Обмен: ${swapFromKey} → кликните вторую клетку или перетащите`
                      : 'Кликните первую клетку или перетащите клетку на другую'}
                  </p>
                )}
                <button
                  type="button"
                  className="nri-modal__submit"
                  disabled={busy || !zoneEditsDirty || !editName.trim() || mapFromFallback}
                  onClick={() => void saveZoneEdits()}
                >
                  {busy ? 'Сохранение…' : 'Сохранить'}
                </button>
                {saveMsg && <p className="mono-text nri-scenario__checkpoint-ok">{saveMsg}</p>}
                {editMode && isSubMapZoneKey(focusZone.zoneKey) && (
                  <button type="button" className="nri-lobby__close" disabled={busy} onClick={deleteSubZone}>
                    <Trash2 size={14} />{' '}
                    {parseSubTileGrid(focusZone.zoneKey) ? 'Сбросить клетку' : 'Удалить сабзону'}
                  </button>
                )}
                {editMode && !districtUsesGrid && (
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
                      disabled={busy || !newSubName.trim() || mapFromFallback}
                      onClick={createSubZone}
                    >
                      Добавить сабзону
                    </button>
                  </div>
                )}
              </div>
            )}
            {isHost && editMode && districtParentKey && !focusZone && !districtUsesGrid && (
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
                  disabled={busy || !newSubName.trim() || mapFromFallback}
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
        ) : mapLayer === 'city' ? (
          <p className="mono-text nri-city-map__hover nri-city-map__hover--empty">
            {districtParent ? 'Наведите на клетку или кликните, чтобы выбрать' : 'Наведите на район или кликните для карточки'}
          </p>
        ) : null}
      </div>

      <div className="nri-city-map__chassis">
        <span className="nri-city-map__corner nri-city-map__corner--tl" />
        <span className="nri-city-map__corner nri-city-map__corner--tr" />
        <span className="nri-city-map__corner nri-city-map__corner--bl" />
        <span className="nri-city-map__corner nri-city-map__corner--br" />
        {zonesLoading && mapLayer === 'city' && (
          <div className="nri-city-map__empty nri-city-map__loading">
            <p className="mono-text">Загрузка карты…</p>
          </div>
        )}
        {!zonesLoading && mapLayer === 'city' && cityZones.length === 0 && !districtParent && (
          <div className="nri-city-map__empty">
            <p className="mono-text">{err ?? 'Районы не загрузились с сервера.'}</p>
            <button type="button" className="nri-lobby__copy" onClick={() => void refreshZones()}>
              Обновить карту
            </button>
          </div>
        )}
        {!zonesLoading && mapLayer === 'city' && districtParent && districtSubZones.length === 0 && (
          <div className="nri-city-map__empty">
            <p className="mono-text">{err ?? 'Клетки района не загрузились.'}</p>
            <button type="button" className="nri-lobby__copy" onClick={() => void exitDistrict()}>
              Назад к городу
            </button>
          </div>
        )}
        {mapLayer === 'underhive' ? (
          <div
            className={`nri-city-map__wrap ${panning ? 'nri-city-map__wrap--panning' : ''} ${lampPlaceMode || lampEraseMode || metroPlaceMode ? 'nri-city-map__wrap--place' : ''} ${editMode ? 'nri-city-map__wrap--edit' : ''}`}
            ref={wrapRef}
            onWheel={onWheel}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endPan}
            onPointerCancel={endPan}
          >
            <svg
              ref={svgRef}
              className="nri-city-map__svg nri-city-map__svg--underhive"
              viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
              onClick={onSvgClick}
              aria-label="Подулей"
            >
              <NriUnderhiveLayer
                data={underhiveData}
                lamps={underhiveData?.lamps ?? []}
                isHost={isHost}
                selectedStationId={selectedMetroStationId}
                selectedLampId={selectedLampId}
                myZoneKey={positions.find((p) => p.userId === currentUserId)?.zoneKey ?? null}
                onSelectStation={setSelectedMetroStationId}
                onLampClick={(lamp) => onLampClick(lamp)}
              />
            </svg>
          </div>
        ) : (
        <div
          className={`nri-city-map__wrap ${panning ? 'nri-city-map__wrap--panning' : ''} ${placeMode || pendingPlaceShape || lampPlaceMode || lampEraseMode ? 'nri-city-map__wrap--place' : ''} ${tileDragFrom ? 'nri-city-map__wrap--tile-drag' : ''} ${editMode ? 'nri-city-map__wrap--edit' : ''} ${weatherOn ? 'nri-city-map__wrap--weather' : ''}`}
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
            <NriMapLampLayer
              lamps={visibleCityLamps}
              isHost={isHost}
              viewW={canvasView.w}
              viewH={canvasView.h}
              mode="glow"
            />
            {districtList.map(({ raw, z }) => {
              if (districtParent && raw.gridRow != null) {
                const isFocused = selectedZoneKey === raw.zoneKey;
                const isHovered = hoverZone?.zoneKey === raw.zoneKey;
                const megaKey = `${raw.gridRow},${raw.gridCol}`;
                return (
                  <NriDistrictTile
                    key={raw.zoneKey}
                    raw={raw}
                    z={z}
                    districtStyle={districtVisualStyle}
                    gridRows={districtGridDims.rows}
                    gridCols={districtGridDims.cols}
                    neighborTypes={districtNeighborTypes}
                    blockMega={districtBlockMega.get(megaKey) ?? null}
                    corpLogo={districtCorpLogos.get(megaKey) ?? null}
                    corpName={districtParent.corpName}
                    animationSlot={districtTileAnimSlots.get(raw.zoneKey) ?? null}
                    isFocused={isFocused}
                    isHovered={isHovered}
                    onMouseEnter={() => {
                      setHoverZone(raw);
                      if (
                        editMode &&
                        activeBrush &&
                        !isSelectBrush(activeBrush) &&
                        !megaSelectMode &&
                        editTool !== 'swap'
                      ) {
                        setBrushPreviewKeys(brushPreviewForZone(raw));
                      } else {
                        setBrushPreviewKeys([]);
                      }
                    }}
                    onMouseLeave={() => {
                      setHoverZone((prev) => (prev?.zoneKey === raw.zoneKey ? null : prev));
                      setBrushPreviewKeys([]);
                    }}
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
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      if (canDrillIntoDistrict(raw)) void enterDistrict(raw);
                    }}
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
            <NriMapLampLayer
              lamps={visibleCityLamps}
              isHost={isHost}
              viewW={canvasView.w}
              viewH={canvasView.h}
              mode="markers"
              selectedLampId={selectedLampId}
              onLampClick={(lamp) => onLampClick(lamp)}
            />
            {megaSelectMode &&
              megaSelection.map((key) => {
                const tile = districtTilesLayout.find((t) => t.zoneKey === key);
                if (!tile) return null;
                return (
                  <rect
                    key={`mega-sel-${key}`}
                    x={tile.x}
                    y={tile.y}
                    width={tile.w}
                    height={tile.h}
                    className="nri-city-map__mega-select"
                    fill="rgba(77, 232, 255, 0.22)"
                    stroke="rgba(77, 232, 255, 0.9)"
                    strokeWidth={0.35}
                    pointerEvents="none"
                  />
                );
              })}
            {editMode &&
              !megaSelectMode &&
              brushPreviewKeys.map((key) => {
                const tile = districtTilesLayout.find((t) => t.zoneKey === key);
                if (!tile) return null;
                return (
                  <rect
                    key={`brush-prev-${key}`}
                    x={tile.x}
                    y={tile.y}
                    width={tile.w}
                    height={tile.h}
                    className="nri-city-map__brush-preview"
                    fill="rgba(255, 180, 60, 0.2)"
                    stroke="rgba(255, 200, 80, 0.85)"
                    strokeWidth={0.35}
                  />
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
              const districtLocal = isDistrictLocalMarker(m);
              if (districtParent) {
                if (!districtLocal) return null;
                const px = (m.x / 100) * DISTRICT_DRILL_CANVAS.w;
                const py = (m.y / 100) * DISTRICT_DRILL_CANVAS.h;
                if (px < 0 || py < 0 || px > DISTRICT_DRILL_CANVAS.w || py > DISTRICT_DRILL_CANVAS.h) return null;
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
              }
              if (districtLocal) return null;
              const px = (m.x / 100) * mapView.w;
              const py = (m.y / 100) * mapView.h;
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
            {weatherOn && mapLayer === 'city' ? (
              <NriDistrictWeatherFx x={0} y={0} w={canvasView.w} h={canvasView.h} />
            ) : null}
          </svg>
        </div>
        )}
      </div>

      {draft && mapLayer === 'city' && (
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
            <button type="button" className="nri-modal__submit" disabled={busy || !draft.label.trim() || mapFromFallback} onClick={saveMarker}>
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
          {selected.blurb && displayMarkerBlurb(selected.blurb) ? (
            <p className="opacity-70">{displayMarkerBlurb(selected.blurb)}</p>
          ) : null}
          {(isHost || (selected.ownerUserId != null && selected.ownerUserId === currentUserId)) && (
            <button type="button" className="nri-lobby__close" disabled={busy} onClick={() => removeMarker(selected.id)}>
              <Trash2 size={14} /> Удалить метку
            </button>
          )}
        </div>
      )}

      {mapLayer === 'underhive' && selectedMetroStation && (
          <div className="nri-city-map__selected mono-text">
            <strong>{selectedMetroStation.name}</strong>
            <p className="opacity-70">Станция метро</p>
            {metroRide && (
              <p className="opacity-70">
                В пути… {rideRemainingSec}с
              </p>
            )}
            <div className="nri-presets__actions">
              <button
                type="button"
                className="nri-modal__submit"
                disabled={busy || !authToken || !!metroRide}
                onClick={() => {
                  void (async () => {
                    if (!authToken) return;
                    setBusy(true);
                    const res = await nriMetroEnter(authToken, inviteCode, selectedMetroStation.id);
                    setBusy(false);
                    if (!res.ok) {
                      setErr(res.error);
                      return;
                    }
                    setSaveMsg(`Вы на станции «${res.station.name}»`);
                    await refreshPositions();
                  })();
                }}
              >
                Войти
              </button>
              {isHost && (
                <button
                  type="button"
                  className="nri-lobby__close"
                  disabled={busy || !authToken}
                  onClick={() => {
                    void (async () => {
                      if (!authToken) return;
                      if (!window.confirm(`Удалить станцию «${selectedMetroStation.name}»?`)) return;
                      setBusy(true);
                      const ok = await nriDeleteMetroStation(
                        authToken,
                        inviteCode,
                        selectedMetroStation.id
                      );
                      setBusy(false);
                      if (!ok) {
                        setErr('Не удалось удалить станцию');
                        return;
                      }
                      setSelectedMetroStationId(null);
                      await refreshUnderhive();
                    })();
                  }}
                >
                  <Trash2 size={14} /> Станция
                </button>
              )}
            </div>
            {selectedMetroNeighbors.length > 0 && (
              <div className="nri-city-map__metro-rides">
                <p className="opacity-70">Поездки:</p>
                {selectedMetroNeighbors.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    className="nri-lobby__close"
                    disabled={busy || !authToken || !!metroRide}
                    onClick={() => {
                      void (async () => {
                        if (!authToken) return;
                        setBusy(true);
                        const res = await nriMetroRide(authToken, inviteCode, n.id);
                        setBusy(false);
                        if (!res.ok) {
                          setErr(res.error);
                          return;
                        }
                        setMetroRide({
                          id: res.ride.id,
                          arriveAt: res.ride.arriveAt,
                          toStationId: res.ride.toStationId,
                          totalSeconds: res.ride.totalSeconds,
                        });
                        setRideRemainingSec(res.ride.totalSeconds);
                        setSaveMsg(`Поездка → ${n.name}`);
                      })();
                    }}
                  >
                    → {n.name}
                  </button>
                ))}
              </div>
            )}
            {selectedMetroShops.map((shop) => (
              <div key={shop.id} className="nri-city-map__metro-shop">
                <p>
                  <strong>{shop.label}</strong>
                </p>
                {(shop.catalogIds.length ? shop.catalogIds : [...DEFAULT_METRO_SHOP_CATALOG]).map((cid) => (
                  <button
                    key={`${shop.id}-${cid}`}
                    type="button"
                    className="nri-lobby__close"
                    disabled={busy || !authToken}
                    onClick={() => {
                      void (async () => {
                        if (!authToken) return;
                        setBusy(true);
                        const res = await nriMetroShopBuy(authToken, inviteCode, shop.id, cid);
                        setBusy(false);
                        if (!res.ok) {
                          setErr(res.error);
                          return;
                        }
                        setSaveMsg(`Куплено · ${res.price}₩ · остаток ${res.wonlongs}`);
                      })();
                    }}
                  >
                    Купить {cid}
                  </button>
                ))}
              </div>
            ))}
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
