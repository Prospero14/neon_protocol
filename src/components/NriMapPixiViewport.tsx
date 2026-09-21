import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type CSSProperties,
} from 'react';
import {
  Application,
  Assets,
  Container,
  Graphics,
  Rectangle,
  Sprite,
  Text,
  Texture,
} from 'pixi.js';
import type { FederatedPointerEvent } from 'pixi.js';
import { resolveCityZoneArt } from '../../shared/nri-domain/cityZoneArtGallery';
import { districtTileSprite } from '../../shared/nri-domain/districtTileSprites';
import { isPlaceType, type PlaceType } from '../../shared/nri-domain/districtGrid';

export type NriMapPixiLayer = 'city' | 'underhive' | 'district';

export type NriMapPixiZone = {
  zoneKey: string;
  name: string;
  zoneType: string;
  x: number;
  y: number;
  w: number;
  h: number;
  parentZoneKey?: string | null;
  placeType?: string | null;
  artId?: string | null;
  color?: string | null;
  rotation?: number;
  corpName?: string | null;
};

export type NriMapPixiViewportHandle = {
  resetCamera: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
};

export type NriMapPixiMarker = {
  id: string;
  label: string;
  x: number;
  y: number;
  kind?: string;
};

export type NriMapPixiPlayerPin = {
  userId: string;
  displayName?: string | null;
  x: number;
  y: number;
  isSelf?: boolean;
};

export type NriMapPixiViewportProps = {
  layer: NriMapPixiLayer;
  zones: NriMapPixiZone[];
  worldW?: number;
  worldH?: number;
  selectedZoneKey?: string | null;
  hoverZoneKey?: string | null;
  editMode?: boolean;
  placeMode?: boolean;
  dragFromKey?: string | null;
  dragOverKey?: string | null;
  markers?: NriMapPixiMarker[];
  playerPins?: NriMapPixiPlayerPin[];
  onZonePointerDown?: (zoneKey: string, e: FederatedPointerEvent) => void;
  onZonePointerUp?: (zoneKey: string, e: FederatedPointerEvent) => void;
  onZoneClick?: (zoneKey: string, e: FederatedPointerEvent) => void;
  onBackgroundClick?: (worldX: number, worldY: number) => void;
  onHoverZone?: (zoneKey: string | null) => void;
  className?: string;
  style?: CSSProperties;
};

const DEFAULT_WORLD_W = 240;
const DEFAULT_WORLD_H = 165;
const FIT_PAD = 0.06;
const ZOOM_STEP = 1.18;
const MIN_ZOOM_MUL = 0.35;
const MAX_ZOOM_MUL = 8;
const FALLBACK_FILL = '#2a4060';
const STROKE_SELECTED = 0x4de8ff;
const STROKE_HOVER = 0xa0c4e8;
const STROKE_DRAG_FROM = 0xff2bd6;
const STROKE_DRAG_OVER = 0xffc857;
const STROKE_IDLE = 0x1a2838;

type LayerBundle = {
  bg: Container;
  city: Container;
  underhive: Container;
  district: Container;
  overlays: Container;
};

type CameraApi = {
  fit: () => void;
  reset: () => void;
  zoomAt: (factor: number, screenX: number, screenY: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  setWorldSize: (w: number, h: number) => void;
};

function truncateLabel(name: string, maxChars: number): string {
  const t = name.trim();
  if (t.length <= maxChars) return t;
  if (maxChars <= 1) return '…';
  return `${t.slice(0, maxChars - 1)}…`;
}

function strokeForZone(
  zoneKey: string,
  selectedZoneKey: string | null | undefined,
  hoverZoneKey: string | null | undefined,
  dragFromKey: string | null | undefined,
  dragOverKey: string | null | undefined
): { color: number; width: number } {
  if (dragFromKey === zoneKey) return { color: STROKE_DRAG_FROM, width: 1.4 };
  if (dragOverKey === zoneKey) return { color: STROKE_DRAG_OVER, width: 1.4 };
  if (selectedZoneKey === zoneKey) return { color: STROKE_SELECTED, width: 1.2 };
  if (hoverZoneKey === zoneKey) return { color: STROKE_HOVER, width: 1 };
  return { color: STROKE_IDLE, width: 0.5 };
}

function drawAsphaltBg(g: Graphics, worldW: number, worldH: number): void {
  g.clear();
  g.rect(0, 0, worldW, worldH);
  g.fill(0x0a0c12);
  g.rect(0, 0, worldW, worldH);
  g.fill({ color: 0x12161e, alpha: 0.92 });

  const step = 10;
  g.setStrokeStyle({ width: 0.35, color: 0x1c2430, alpha: 0.55 });
  for (let x = 0; x <= worldW; x += step) {
    g.moveTo(x, 0);
    g.lineTo(x, worldH);
  }
  for (let y = 0; y <= worldH; y += step) {
    g.moveTo(0, y);
    g.lineTo(worldW, y);
  }
  g.stroke();

  g.setStrokeStyle({ width: 0.55, color: 0x243040, alpha: 0.4 });
  for (let x = 0; x <= worldW; x += step * 4) {
    g.moveTo(x, 0);
    g.lineTo(x, worldH);
  }
  for (let y = 0; y <= worldH; y += step * 4) {
    g.moveTo(0, y);
    g.lineTo(worldW, y);
  }
  g.stroke();
}

async function textureFor(href: string, cache: Map<string, Texture>): Promise<Texture | null> {
  const hit = cache.get(href);
  if (hit) return hit;
  try {
    const tex = (await Assets.load(href)) as Texture;
    cache.set(href, tex);
    return tex;
  } catch {
    return null;
  }
}

export const NriMapPixiViewport = forwardRef<NriMapPixiViewportHandle, NriMapPixiViewportProps>(
  function NriMapPixiViewport(props, ref) {
    const {
      layer,
      zones,
      worldW = DEFAULT_WORLD_W,
      worldH = DEFAULT_WORLD_H,
      selectedZoneKey = null,
      hoverZoneKey = null,
      editMode = false,
      placeMode = false,
      dragFromKey = null,
      dragOverKey = null,
      markers = [],
      playerPins = [],
      className,
      style,
    } = props;

    const hostRef = useRef<HTMLDivElement>(null);
    const appRef = useRef<Application | null>(null);
    const worldRef = useRef<Container | null>(null);
    const layersRef = useRef<LayerBundle | null>(null);
    const cameraRef = useRef<CameraApi | null>(null);
    const fitScaleRef = useRef(1);
    const worldSizeRef = useRef({ w: worldW, h: worldH });
    const texCacheRef = useRef(new Map<string, Texture>());
    const propsRef = useRef(props);
    propsRef.current = props;

    const panRef = useRef<{
      active: boolean;
      pointerId: number | null;
      lastX: number;
      lastY: number;
      moved: boolean;
    }>({ active: false, pointerId: null, lastX: 0, lastY: 0, moved: false });

    useImperativeHandle(
      ref,
      () => ({
        resetCamera: () => cameraRef.current?.reset(),
        zoomIn: () => cameraRef.current?.zoomIn(),
        zoomOut: () => cameraRef.current?.zoomOut(),
      }),
      []
    );

    useEffect(() => {
      const host = hostRef.current;
      if (!host) return;

      let cancelled = false;
      let ro: ResizeObserver | null = null;
      const app = new Application();
      appRef.current = app;

      const setup = async () => {
        const w = Math.max(1, host.clientWidth || 640);
        const h = Math.max(1, host.clientHeight || 420);
        await app.init({
          width: w,
          height: h,
          background: 0x0a0c12,
          antialias: true,
          resolution: Math.min(window.devicePixelRatio || 1, 2),
          autoDensity: true,
          preference: 'webgl',
        });
        if (cancelled) {
          app.destroy(true);
          return;
        }

        host.appendChild(app.canvas);
        app.canvas.style.display = 'block';
        app.canvas.style.width = '100%';
        app.canvas.style.height = '100%';

        const world = new Container();
        world.label = 'world';
        app.stage.addChild(world);
        worldRef.current = world;

        const layers: LayerBundle = {
          bg: new Container(),
          city: new Container(),
          underhive: new Container(),
          district: new Container(),
          overlays: new Container(),
        };
        layers.bg.label = 'bg';
        layers.city.label = 'city';
        layers.underhive.label = 'underhive';
        layers.district.label = 'district';
        layers.overlays.label = 'overlays';
        world.addChild(layers.bg, layers.city, layers.underhive, layers.district, layers.overlays);
        layersRef.current = layers;

        const bgHit = new Graphics();
        bgHit.eventMode = 'static';
        bgHit.cursor = 'grab';
        layers.bg.addChild(bgHit);

        const asphalt = new Graphics();
        layers.bg.addChild(asphalt);

        const camera: CameraApi = {
          setWorldSize(nw, nh) {
            worldSizeRef.current = { w: nw, h: nh };
          },
          fit() {
            const { w: ww, h: wh } = worldSizeRef.current;
            const sw = app.screen.width;
            const sh = app.screen.height;
            if (sw <= 0 || sh <= 0 || ww <= 0 || wh <= 0) return;
            const scale = Math.min(sw / ww, sh / wh) * (1 - FIT_PAD);
            fitScaleRef.current = scale;
            world.scale.set(scale);
            world.x = (sw - ww * scale) / 2;
            world.y = (sh - wh * scale) / 2;
          },
          reset() {
            camera.fit();
          },
          zoomAt(factor, screenX, screenY) {
            const prev = world.scale.x;
            const min = fitScaleRef.current * MIN_ZOOM_MUL;
            const max = fitScaleRef.current * MAX_ZOOM_MUL;
            const next = Math.min(max, Math.max(min, prev * factor));
            if (next === prev) return;
            const ox = (screenX - world.x) / prev;
            const oy = (screenY - world.y) / prev;
            world.scale.set(next);
            world.x = screenX - ox * next;
            world.y = screenY - oy * next;
          },
          zoomIn() {
            camera.zoomAt(ZOOM_STEP, app.screen.width / 2, app.screen.height / 2);
          },
          zoomOut() {
            camera.zoomAt(1 / ZOOM_STEP, app.screen.width / 2, app.screen.height / 2);
          },
        };
        cameraRef.current = camera;
        camera.setWorldSize(worldSizeRef.current.w, worldSizeRef.current.h);

        const redrawBg = () => {
          const { w: ww, h: wh } = worldSizeRef.current;
          drawAsphaltBg(asphalt, ww, wh);
          bgHit.clear();
          bgHit.rect(0, 0, ww, wh);
          bgHit.fill({ color: 0x000000, alpha: 0.001 });
          bgHit.hitArea = new Rectangle(0, 0, ww, wh);
        };
        redrawBg();
        camera.fit();

        bgHit.on('pointerdown', (e: FederatedPointerEvent) => {
          if (e.button !== 0) return;
          panRef.current = {
            active: true,
            pointerId: e.pointerId,
            lastX: e.global.x,
            lastY: e.global.y,
            moved: false,
          };
          bgHit.cursor = 'grabbing';
          e.stopPropagation();
        });

        const onStageMove = (e: FederatedPointerEvent) => {
          const pan = panRef.current;
          if (!pan.active || pan.pointerId !== e.pointerId) return;
          const dx = e.global.x - pan.lastX;
          const dy = e.global.y - pan.lastY;
          if (dx !== 0 || dy !== 0) pan.moved = true;
          world.x += dx;
          world.y += dy;
          pan.lastX = e.global.x;
          pan.lastY = e.global.y;
        };

        const endPan = (e: FederatedPointerEvent) => {
          const pan = panRef.current;
          if (!pan.active || pan.pointerId !== e.pointerId) return;
          const wasMoved = pan.moved;
          pan.active = false;
          pan.pointerId = null;
          bgHit.cursor = propsRef.current.placeMode ? 'crosshair' : 'grab';
          if (!wasMoved) {
            const local = world.toLocal(e.global);
            propsRef.current.onBackgroundClick?.(local.x, local.y);
          }
        };

        app.stage.eventMode = 'static';
        app.stage.hitArea = app.screen;
        app.stage.on('pointermove', onStageMove);
        app.stage.on('pointerup', endPan);
        app.stage.on('pointerupoutside', endPan);

        const onWheel = (ev: WheelEvent) => {
          ev.preventDefault();
          const rect = app.canvas.getBoundingClientRect();
          const sx = ev.clientX - rect.left;
          const sy = ev.clientY - rect.top;
          const factor = ev.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
          camera.zoomAt(factor, sx, sy);
        };
        app.canvas.addEventListener('wheel', onWheel, { passive: false });

        const resize = () => {
          if (!host.isConnected) return;
          const nw = Math.max(1, host.clientWidth);
          const nh = Math.max(1, host.clientHeight);
          app.renderer.resolution = Math.min(window.devicePixelRatio || 1, 2);
          app.renderer.resize(nw, nh);
          app.stage.hitArea = app.screen;
          camera.fit();
        };
        ro = new ResizeObserver(() => resize());
        ro.observe(host);

        (app as Application & { __nriCleanup?: () => void }).__nriCleanup = () => {
          app.canvas.removeEventListener('wheel', onWheel);
          app.stage.off('pointermove', onStageMove);
          app.stage.off('pointerup', endPan);
          app.stage.off('pointerupoutside', endPan);
        };
        (app as Application & { __nriRedrawBg?: () => void }).__nriRedrawBg = redrawBg;
      };

      void setup();

      return () => {
        cancelled = true;
        ro?.disconnect();
        const a = appRef.current;
        if (a) {
          const extra = a as Application & { __nriCleanup?: () => void };
          extra.__nriCleanup?.();
          if (a.renderer) {
            a.destroy(true, { children: true });
          } else {
            try {
              a.destroy(true);
            } catch {
              /* init aborted */
            }
          }
        }
        appRef.current = null;
        worldRef.current = null;
        layersRef.current = null;
        cameraRef.current = null;
        if (host.contains(app.canvas)) {
          host.removeChild(app.canvas);
        }
      };
    }, []);

    useEffect(() => {
      worldSizeRef.current = { w: worldW, h: worldH };
      cameraRef.current?.setWorldSize(worldW, worldH);
      const app = appRef.current as (Application & { __nriRedrawBg?: () => void }) | null;
      app?.__nriRedrawBg?.();
      cameraRef.current?.fit();
    }, [worldW, worldH]);

    useEffect(() => {
      const layers = layersRef.current;
      const app = appRef.current;
      if (!layers || !app?.renderer) return;

      let cancelled = false;

      const clearContainer = (c: Container) => {
        while (c.children.length > 0) {
          const child = c.children[0]!;
          c.removeChild(child);
          child.destroy({ children: true });
        }
      };

      const wireZoneEvents = (target: Container, zoneKey: string) => {
        target.eventMode = 'static';
        target.cursor = 'pointer';
        target.on('pointerdown', (e: FederatedPointerEvent) => {
          e.stopPropagation();
          propsRef.current.onZonePointerDown?.(zoneKey, e);
        });
        target.on('pointerup', (e: FederatedPointerEvent) => {
          e.stopPropagation();
          propsRef.current.onZonePointerUp?.(zoneKey, e);
        });
        target.on('pointertap', (e: FederatedPointerEvent) => {
          e.stopPropagation();
          propsRef.current.onZoneClick?.(zoneKey, e);
        });
        target.on('pointerover', () => {
          propsRef.current.onHoverZone?.(zoneKey);
        });
        target.on('pointerout', () => {
          const cur = propsRef.current.hoverZoneKey;
          if (cur === zoneKey) propsRef.current.onHoverZone?.(null);
        });
      };

      const build = async () => {
        clearContainer(layers.city);
        clearContainer(layers.underhive);
        clearContainer(layers.district);
        clearContainer(layers.overlays);

        layers.city.visible = layer === 'city';
        layers.underhive.visible = layer === 'underhive';
        layers.district.visible = layer === 'district';

        if (layer === 'underhive') {
          const g = new Graphics();
          g.rect(0, 0, worldW, worldH);
          g.fill(0x070605);
          layers.underhive.addChild(g);
          const title = new Text({
            text: 'Подулей / Underhive',
            style: {
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
              fontSize: 14,
              fill: 0xc4a574,
              align: 'center',
            },
          });
          title.anchor.set(0.5);
          title.x = worldW / 2;
          title.y = worldH / 2 - 4;
          layers.underhive.addChild(title);
          const sub = new Text({
            text: 'Пустой слой · зоны появятся позже',
            style: {
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
              fontSize: 6,
              fill: 0x8a7a62,
              align: 'center',
            },
          });
          sub.anchor.set(0.5);
          sub.x = worldW / 2;
          sub.y = worldH / 2 + 12;
          layers.underhive.addChild(sub);
          return;
        }

        if (layer === 'city') {
          const tops = zones.filter((z) => !z.parentZoneKey);
          for (const z of tops) {
            const art = resolveCityZoneArt(z.artId, z.zoneType);
            const fill = art?.fill || z.color || FALLBACK_FILL;
            const stroke = strokeForZone(z.zoneKey, selectedZoneKey, hoverZoneKey, dragFromKey, dragOverKey);

            const node = new Container();
            node.x = z.x;
            node.y = z.y;
            node.hitArea = new Rectangle(0, 0, z.w, z.h);

            const g = new Graphics();
            g.rect(0, 0, z.w, z.h);
            g.fill(fill);
            g.stroke({ width: stroke.width, color: stroke.color, alignment: 0 });
            node.addChild(g);

            const maxChars = Math.max(4, Math.floor(z.w / 2.2));
            const label = new Text({
              text: truncateLabel(z.name, maxChars),
              style: {
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                fontSize: Math.min(5.5, Math.max(3.2, Math.min(z.w, z.h) * 0.22)),
                fill: 0xd8e6f5,
                align: 'center',
              },
            });
            label.anchor.set(0.5);
            label.x = z.w / 2;
            label.y = z.h / 2;
            label.eventMode = 'none';
            node.addChild(label);

            wireZoneEvents(node, z.zoneKey);
            layers.city.addChild(node);
          }
        } else {
        // district
        for (const z of zones) {
          if (cancelled) return;
          const node = new Container();
          const cx = z.x + z.w / 2;
          const cy = z.y + z.h / 2;
          node.x = cx;
          node.y = cy;
          const rotDeg = typeof z.rotation === 'number' ? z.rotation : 0;
          node.rotation = (rotDeg * Math.PI) / 180;
          node.hitArea = new Rectangle(-z.w / 2, -z.h / 2, z.w, z.h);

          const stroke = strokeForZone(z.zoneKey, selectedZoneKey, hoverZoneKey, dragFromKey, dragOverKey);
          const place: PlaceType | null =
            z.placeType && isPlaceType(z.placeType) ? z.placeType : null;
          const href = place ? districtTileSprite(place, z.zoneKey, z.artId) : null;
          let drewSprite = false;

          if (href) {
            const tex = await textureFor(href, texCacheRef.current);
            if (cancelled) return;
            if (tex) {
              const spr = new Sprite(tex);
              spr.anchor.set(0.5);
              spr.width = z.w;
              spr.height = z.h;
              node.addChild(spr);
              drewSprite = true;
            }
          }

          if (!drewSprite) {
            const g = new Graphics();
            g.rect(-z.w / 2, -z.h / 2, z.w, z.h);
            g.fill(z.color || FALLBACK_FILL);
            node.addChild(g);
          }

          const border = new Graphics();
          border.rect(-z.w / 2, -z.h / 2, z.w, z.h);
          border.stroke({ width: stroke.width, color: stroke.color, alignment: 0 });
          border.eventMode = 'none';
          node.addChild(border);

          wireZoneEvents(node, z.zoneKey);
          layers.district.addChild(node);
        }
        }

        const markers = propsRef.current.markers ?? [];
        for (const m of markers) {
          const g = new Graphics();
          g.circle(0, 0, 1.6);
          g.fill(m.kind === 'host' ? 0xffc857 : 0x4de8ff);
          g.stroke({ width: 0.35, color: 0x0a0c12 });
          g.x = m.x;
          g.y = m.y;
          g.eventMode = 'none';
          layers.overlays.addChild(g);
          if (m.label) {
            const t = new Text({
              text: truncateLabel(m.label, 14),
              style: {
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                fontSize: 4,
                fill: 0xe8f0ff,
              },
            });
            t.x = m.x + 2;
            t.y = m.y - 2;
            t.eventMode = 'none';
            layers.overlays.addChild(t);
          }
        }

        const pins = propsRef.current.playerPins ?? [];
        for (const p of pins) {
          const g = new Graphics();
          g.circle(0, 0, 2);
          g.fill(p.isSelf ? 0x7dffb3 : 0xc4a574);
          g.stroke({ width: 0.4, color: 0xffffff });
          g.x = p.x;
          g.y = p.y;
          g.eventMode = 'none';
          layers.overlays.addChild(g);
        }
      };

      void build();
      return () => {
        cancelled = true;
      };
    }, [
      layer,
      zones,
      worldW,
      worldH,
      selectedZoneKey,
      hoverZoneKey,
      dragFromKey,
      dragOverKey,
      markers,
      playerPins,
    ]);

    useEffect(() => {
      const layers = layersRef.current;
      if (!layers) return;
      const bgHit = layers.bg.children[0];
      if (bgHit && 'cursor' in bgHit) {
        (bgHit as Graphics).cursor = placeMode ? 'crosshair' : 'grab';
      }
    }, [placeMode, editMode]);

    const cls = ['nri-map-pixi', className].filter(Boolean).join(' ');
    return <div ref={hostRef} className={cls} style={style} />;
  }
);
