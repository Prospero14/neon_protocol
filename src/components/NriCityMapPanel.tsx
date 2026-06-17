import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, MapPin, Minus, Plus, RotateCcw, Trash2 } from 'lucide-react';
import {
  nriCreateMapMarker,
  nriDeleteMapMarker,
  nriFetchMapMarkers,
  nriFetchMapPositions,
  nriFetchMapZones,
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
  getMegaWatermarks,
  megaFromZoneKey,
  megaKeyFromZoneKey,
  ZONE_TYPE_DEFAULT_COLORS,
  zoneDisplayColor,
  zoneRectPaint,
  type NightCityDistrictType,
} from '../logic/nriNightCityMap';
import { resolveZoneIconHref } from '../../shared/nri-domain/zoneIcons';
import { getVehicleDef } from '../logic/nriVehicles';
import { readNeonAuthToken } from '../logic/authTokenStorage';
import { useAuth } from '../logic/AuthContext';

type Props = {
  inviteCode: string;
  isHost: boolean;
  currentUserId: string;
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

function sortedZones(zones: NriMapZone[]): NriMapZone[] {
  return [...zones].sort((a, b) => {
    const la = LAYER_ORDER[a.zoneType] ?? 3;
    const lb = LAYER_ORDER[b.zoneType] ?? 3;
    return la - lb || a.sortOrder - b.sortOrder;
  });
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

export const NriCityMapPanel: React.FC<Props> = ({ inviteCode, isHost, currentUserId }) => {
  const { token } = useAuth();
  const authToken = readNeonAuthToken() ?? token;
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panRef = useRef({
    active: false,
    moved: false,
    sx: 0,
    sy: 0,
    vbx: 0,
    vby: 0,
  });

  const [mapView, setMapView] = useState<NriMapView>(DEFAULT_VIEW);
  const [zones, setZones] = useState<NriMapZone[]>([]);
  const [markers, setMarkers] = useState<NriMapMarker[]>([]);
  const [placeMode, setPlaceMode] = useState(false);
  const [selected, setSelected] = useState<NriMapMarker | null>(null);
  const [draft, setDraft] = useState<{ x: number; y: number; label: string; blurb: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [hoverZone, setHoverZone] = useState<NriMapZone | null>(null);
  const [selectedZoneKey, setSelectedZoneKey] = useState<string | null>(null);
  const [viewBox, setViewBox] = useState<ViewBox>({ x: 0, y: 0, w: DEFAULT_VIEW.w, h: DEFAULT_VIEW.h });
  const [editName, setEditName] = useState('');
  const [editMega, setEditMega] = useState('');
  const [editCorp, setEditCorp] = useState('');
  const [editPois, setEditPois] = useState('');
  const [editColor, setEditColor] = useState('#5a9ee6');
  const [colorUseDefault, setColorUseDefault] = useState(true);
  const [positions, setPositions] = useState<NriPlayerPosition[]>([]);
  const [vehicles, setVehicles] = useState<NriTableVehicle[]>([]);
  const [moveVehicleId, setMoveVehicleId] = useState<string>('');
  const [moveOverload, setMoveOverload] = useState(false);
  const [moveMsg, setMoveMsg] = useState<string | null>(null);
  const focusZone = useMemo(
    () => (selectedZoneKey ? zones.find((z) => z.zoneKey === selectedZoneKey) ?? null : null),
    [zones, selectedZoneKey]
  );
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

  const refreshZones = useCallback(async () => {
    if (!authToken) return;
    const data = await nriFetchMapZones(authToken, inviteCode);
    if (!data) {
      setErr('Не удалось загрузить районы карты. Обновите страницу после деплоя или перезапустите сервер.');
      return;
    }
    if (data.zones.length === 0) {
      setErr('Карта пуста — на сервере не засеяны районы Night City.');
    } else {
      setErr(null);
    }
    setZones(data.zones);
    setMapView(data.view);
    setViewBox({ x: 0, y: 0, w: data.view.w, h: data.view.h });
    setSelectedZoneKey((prev) => (prev && data.zones.some((z) => z.zoneKey === prev) ? prev : null));
  }, [authToken, inviteCode]);

  useEffect(() => {
    refreshZones();
    refreshMarkers();
    refreshPositions();
    const t = setInterval(() => {
      refreshMarkers();
      refreshPositions();
    }, 5000);
    return () => clearInterval(t);
  }, [refreshZones, refreshMarkers, refreshPositions]);

  useEffect(() => {
    if (!focusZone) {
      setEditName('');
      setEditMega('');
      setEditCorp('');
      setEditPois('');
      setEditColor('#5a9ee6');
      setColorUseDefault(true);
      return;
    }
    setEditName(focusZone.name);
    setEditMega(zoneMega(focusZone) ?? '');
    setEditCorp(focusZone.corpName ?? '');
    setEditPois(focusZone.pois?.join(', ') ?? '');
    setColorUseDefault(!focusZone.color);
    setEditColor(zoneDisplayColor(focusZone));
  }, [focusZone?.zoneKey, focusZone?.name, focusZone?.corpName, focusZone?.pois, focusZone?.megaDistrict, focusZone?.color, focusZone?.zoneType]);

  const isZoomedIn = viewBox.w < mapView.w - 1 || viewBox.x > 0.5 || viewBox.y > 0.5;

  const clickToPercent = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const local = pt.matrixTransform(ctm.inverse());
    return {
      x: (local.x / mapView.w) * 100,
      y: (local.y / mapView.h) * 100,
    };
  };

  const onSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (panRef.current.moved) return;
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
      const nw = Math.min(mapView.w, Math.max(MIN_ZOOM_W, vb.w * factor));
      const nh = (nw / mapView.w) * mapView.h;
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
        mapView
      );
    });
  };

  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    zoomAt(e.deltaY > 0 ? 1.1 : 0.9, e.clientX, e.clientY);
  };

  const resetView = () => {
    clearZoneSelection();
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
    setViewBox({ x: 0, y: 0, w: mapView.w, h: mapView.h });
  };

  const onZoneClick = (z: NriMapZone, e: React.MouseEvent) => {
    e.stopPropagation();
    if (placeMode) return;
    if (z.zoneType === 'tunnel') return;
    if (selectedZoneKey === z.zoneKey) {
      clearZoneSelection();
      return;
    }
    zoomToZone(z);
    setHoverZone(null);
  };

  const onZonePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    panRef.current.moved = false;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (placeMode || e.button !== 0) return;
    panRef.current = {
      active: true,
      moved: false,
      sx: e.clientX,
      sy: e.clientY,
      vbx: viewBox.x,
      vby: viewBox.y,
    };
    setPanning(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!panRef.current.active || !svgRef.current) return;
    const dx = e.clientX - panRef.current.sx;
    const dy = e.clientY - panRef.current.sy;
    if (Math.abs(dx) + Math.abs(dy) > 3) panRef.current.moved = true;
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
        mapView
      )
    );
  };

  const endPan = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!panRef.current.active) return;
    panRef.current.active = false;
    setPanning(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    window.setTimeout(() => {
      panRef.current.moved = false;
    }, 0);
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

  const saveZoneEdits = async () => {
    if (!authToken || !focusZone) return;
    const payload: {
      name?: string;
      corpName?: string | null;
      megaDistrict?: string;
      pois?: string[];
      color?: string | null;
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

    if (Object.keys(payload).length === 0) return;

    setBusy(true);
    setErr(null);
    const res = await nriPatchMapZone(authToken, inviteCode, focusZone.zoneKey, payload);
    setBusy(false);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    if (payload.megaDistrict) {
      const data = await nriFetchMapZones(authToken, inviteCode);
      if (data) {
        setZones(data.zones);
        const hit = data.zones.find((z) => z.zoneKey === focusZone.zoneKey) ?? res.zone;
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
      (colorUseDefault ? null : editColor.trim().toLowerCase()) !== (focusZone.color ?? null));

  const districtList = sortedZones(zones);
  const megaMarks = useMemo(() => {
    const defaults = getMegaWatermarks();
    const byKey = new Map<string, string>();
    for (const z of zones) {
      const mk = megaKeyFromZoneKey(z.zoneKey);
      const label = z.megaDistrict ?? megaFromZoneKey(z.zoneKey);
      if (mk && label) byKey.set(mk, label);
    }
    return defaults.map((m) => ({ ...m, megaLabel: byKey.get(m.megaKey) ?? m.megaLabel }));
  }, [zones]);
  const panelZone = focusZone ?? hoverZone;
  const typeLabel = panelZone
    ? DISTRICT_TYPE_LABELS[panelZone.zoneType as NightCityDistrictType] ?? panelZone.zoneType
    : '';

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

  const moveToZone = async () => {
    if (!authToken || !focusZone) return;
    if (myPosition?.zoneKey === focusZone.zoneKey) {
      setMoveMsg('Вы уже в этом районе.');
      return;
    }
    setBusy(true);
    setErr(null);
    setMoveMsg(null);
    const res = await nriMoveToZone(authToken, inviteCode, {
      zoneKey: focusZone.zoneKey,
      vehicleId: moveVehicleId || null,
      overload: moveOverload,
    });
    setBusy(false);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    setMoveMsg(res.message);
    await refreshPositions();
  };

  const positionDot = (p: NriPlayerPosition) => {
    const z = p.zoneKey ? zones.find((z) => z.zoneKey === p.zoneKey) : null;
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
          <h2 className="nri-city-map__title">Найт-Сити · Carbon 2185</h2>
          <p className="mono-text opacity-70">
            Клик по району — выбрать и приблизить · повторный клик — снять выделение.
            Колёсико — зум · ЛКМ — сдвиг.
            {isHost ? ' Редактирование доступно только для выбранного района.' : ''}
          </p>
        </div>
        <div className="nri-city-map__toolbar">
          {isZoomedIn && (
            <button type="button" className="nri-modal__submit" onClick={resetView}>
              <ArrowLeft size={14} /> Общая карта
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
        {panelZone ? (
          <>
            <p className={`mono-text nri-city-map__hover${focusZone ? ' nri-city-map__hover--selected' : ''}`}>
              {focusZone && <span className="nri-city-map__selected-tag">выбран</span>}
              {zoneMega(panelZone) && <span className="nri-city-map__mega-tag">{zoneMega(panelZone)}</span>}
              <strong>{panelZone.name}</strong> · {typeLabel}
              {panelZone.locked && ' · доступ только корпам'}
              {panelZone.corpName && ` · ${panelZone.corpName}`}
              {panelZone.pois?.length ? ` · ${panelZone.pois.join(', ')}` : ''}
            </p>
            {isHost && focusZone && (
              <div className="nri-city-map__zone-edit">
                <label className="nri-city-map__zone-field mono-text">
                  <span>Название</span>
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} />
                </label>
                {megaKeyFromZoneKey(focusZone.zoneKey) && (
                  <label className="nri-city-map__zone-field mono-text">
                    <span>Мегарайон</span>
                    <input
                      value={editMega}
                      onChange={(e) => setEditMega(e.target.value)}
                      title="Меняет подпись для всего мегарайона"
                    />
                  </label>
                )}
                {focusZone.zoneType === 'corp' && (
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
                          setEditColor(zoneDisplayColor(focusZone));
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
                        setEditColor(ZONE_TYPE_DEFAULT_COLORS[focusZone.zoneType] ?? '#5a9ee6');
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
                  onClick={saveZoneEdits}
                >
                  Сохранить
                </button>
              </div>
            )}
            {isHost && !focusZone && (
              <p className="mono-text nri-city-map__hover-hint">Кликните район на карте, чтобы выбрать его для переименования</p>
            )}
            {!isHost && focusZone && (
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
                    <button type="button" className="nri-modal__submit" disabled={busy} onClick={moveToZone}>
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
            Наведите на квартал или кликните, чтобы выбрать
          </p>
        )}
      </div>

      <div className="nri-city-map__chassis">
        <span className="nri-city-map__corner nri-city-map__corner--tl" />
        <span className="nri-city-map__corner nri-city-map__corner--tr" />
        <span className="nri-city-map__corner nri-city-map__corner--bl" />
        <span className="nri-city-map__corner nri-city-map__corner--br" />
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
            className="nri-city-map__svg"
            viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
            onClick={onSvgClick}
          >
            <defs>
              <pattern id="nc-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(0,255,255,0.06)" strokeWidth="0.15" />
              </pattern>
              <filter id="nc-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="0.8" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <rect className="nri-city-map__bg" x={0} y={0} width={mapView.w} height={mapView.h} />
            <rect className="nri-city-map__grid" x={0} y={0} width={mapView.w} height={mapView.h} fill="url(#nc-grid)" />
            {megaMarks.map((m) => (
              <text
                key={m.megaKey}
                x={m.x}
                y={m.y}
                className="nri-city-map__mega-watermark"
                textAnchor="middle"
              >
                {m.megaLabel}
              </text>
            ))}
            {districtList.map((z) => {
              const lines = zoneLabelLines(z);
              const showFo =
                lines.length > 0 &&
                ['park', 'corp', 'mid', 'slum', 'industrial'].includes(z.zoneType) &&
                z.w > 8 &&
                z.h > 5;
              const isFocused = selectedZoneKey === z.zoneKey;
              const isHovered = hoverZone?.zoneKey === z.zoneKey;
              const rectPaint =
                isFocused && !colorUseDefault
                  ? zoneRectPaint(editColor, z.zoneType)
                  : zoneRectPaint(z.color ?? null, z.zoneType);
              const iconHref = resolveZoneIconHref(z.iconId, z.zoneType, z.zoneKey);
              return (
                <g
                  key={z.zoneKey}
                  className={`nri-city-map__zone-g ${isFocused ? 'focused' : ''}`}
                  onPointerDown={onZonePointerDown}
                  onMouseEnter={() => setHoverZone(z)}
                  onMouseLeave={() => setHoverZone((prev) => (prev?.zoneKey === z.zoneKey ? null : prev))}
                  onClick={(e) => onZoneClick(z, e)}
                >
                  <rect
                    x={z.x}
                    y={z.y}
                    width={z.w}
                    height={z.h}
                    className={`nri-city-map__zone nri-city-map__zone--${z.zoneType}${z.locked ? ' locked' : ''}`}
                    rx={z.zoneType === 'corp' ? 1.2 : z.zoneType === 'park' ? 1 : 0.4}
                    style={rectPaint}
                    filter={isFocused || isHovered ? 'url(#nc-glow)' : undefined}
                  />
                  {iconHref && (
                    <image
                      href={iconHref}
                      x={z.x}
                      y={z.y}
                      width={z.w}
                      height={z.h}
                      preserveAspectRatio="xMidYMid meet"
                      className="nri-city-map__zone-icon"
                    />
                  )}
                  {showFo && (
                    <foreignObject
                      x={z.x + 0.3}
                      y={z.y + 0.3}
                      width={Math.max(0, z.w - 0.6)}
                      height={Math.max(0, z.h - 0.6)}
                      className="nri-city-map__fo"
                    >
                      <div className={`nri-city-map__fo-label nri-city-map__fo-label--${z.zoneType}`}>
                        {lines.map((line) => (
                          <span key={line}>{line}</span>
                        ))}
                      </div>
                    </foreignObject>
                  )}
                  {z.zoneType === 'corp' && z.h > 6 && (
                    <line
                      x1={z.x + z.w * 0.05}
                      y1={z.y + z.h * 0.52}
                      x2={z.x + z.w * 0.95}
                      y2={z.y + z.h * 0.52}
                      className="nri-city-map__tunnel-line"
                    />
                  )}
                  {z.zoneType === 'slum' && z.pois?.length && z.h > 7 && (
                    <text x={z.x + z.w / 2} y={z.y + z.h - 1} className="nri-city-map__poi">
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
              const px = (m.x / 100) * mapView.w;
              const py = (m.y / 100) * mapView.h;
              const isHostMarker = m.kind === 'host';
              return (
                <g
                  key={m.id}
                  className={`nri-city-map__marker nri-city-map__marker--${isHostMarker ? 'host' : 'player'} ${selected?.id === m.id ? 'selected' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
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
