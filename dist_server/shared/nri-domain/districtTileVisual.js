import { tileCenterDecay, tileDecayAmount, tileDecorSeed } from './districtGrid';
const BUILDING_TYPES = new Set([
    'house',
    'shack',
    'restaurant',
    'shop',
    'secondhand',
    'nightclub',
    'hospital',
    'police',
    'electronics',
    'metro',
    'hotel',
    'service',
    'shop_asian',
    'market',
    'gunshop',
    'corp_annex',
    'corp_hq',
    'corp_office',
    'plaza',
]);
const GUTTER_OPEN = new Set([
    'road',
    'crossing',
    'bridge',
    'parking',
    'exit',
    'park',
    'pond',
    'plaza',
    'dump',
    'corp_hq',
    'corp_office',
]);
/** Куда идут пешеходы — зебра только у таких соседей. */
const PEDESTRIAN_DEST = new Set([
    'house',
    'shack',
    'shop',
    'restaurant',
    'secondhand',
    'nightclub',
    'hospital',
    'police',
    'electronics',
    'park',
    'pond',
    'plaza',
    'metro',
    'generic',
    'hotel',
    'service',
    'shop_asian',
    'market',
    'gunshop',
    'corp_annex',
    'corp_hq',
    'corp_office',
]);
export function isRoadLike(t) {
    if (!t)
        return false;
    return t === 'road' || t === 'crossing' || t === 'bridge' || t === 'exit';
}
export function isRoadSurface(placeType) {
    return placeType === 'road' || placeType === 'crossing' || placeType === 'bridge' || placeType === 'parking';
}
export function isBuildingPlace(placeType) {
    return BUILDING_TYPES.has(placeType);
}
function touchesStreet(side) {
    return side === 'road' || side === 'crossing' || side === 'bridge' || side === 'exit' || side === 'parking';
}
/** У каких сторон здания проходит улица (узкая полоса, не вся клетка). */
export function streetFrontFor(neighbors) {
    return {
        n: touchesStreet(neighbors.n),
        s: touchesStreet(neighbors.s),
        e: touchesStreet(neighbors.e),
        w: touchesStreet(neighbors.w),
    };
}
/**
 * Проезд вокруг здания только к «открытому» соседу (дорога/парк/свалка…).
 * Между двумя домами/бараками — без дороги (сплошной блок гетто).
 */
export function buildingGutterFor(placeType, neighbors) {
    if (!BUILDING_TYPES.has(placeType) && placeType !== 'generic') {
        return { n: false, s: false, e: false, w: false };
    }
    const side = (t) => !t || GUTTER_OPEN.has(t);
    return {
        n: side(neighbors.n),
        s: side(neighbors.s),
        e: side(neighbors.e),
        w: side(neighbors.w),
    };
}
/** Тротуар у дороги рядом со зданием (не у переулка — иначе ложные «зебры»). */
export function roadCurbFor(placeType, neighbors) {
    if (!isRoadSurface(placeType))
        return { n: false, s: false, e: false, w: false };
    const building = (t) => !!t && (BUILDING_TYPES.has(t) || t === 'generic');
    return {
        n: building(neighbors.n),
        s: building(neighbors.s),
        e: building(neighbors.e),
        w: building(neighbors.w),
    };
}
/**
 * ~1 зебра на 4 дорожных тайла, только если рядом жилой/магазин/парк/корп и т.п.
 * Не ставим просто потому что сосед — перекрёсток.
 */
export function crosswalkEdgesFor(placeType, neighbors, zoneKey = '') {
    const none = { n: false, s: false, e: false, w: false };
    if (placeType !== 'road')
        return none;
    // Подход к перекрёстку — всегда зебра на стороне к crossing.
    const towardCrossing = {
        n: neighbors.n === 'crossing',
        s: neighbors.s === 'crossing',
        e: neighbors.e === 'crossing',
        w: neighbors.w === 'crossing',
    };
    if (towardCrossing.n || towardCrossing.s || towardCrossing.e || towardCrossing.w) {
        return towardCrossing;
    }
    const destEdges = [];
    if (neighbors.n && PEDESTRIAN_DEST.has(neighbors.n))
        destEdges.push('n');
    if (neighbors.s && PEDESTRIAN_DEST.has(neighbors.s))
        destEdges.push('s');
    if (neighbors.e && PEDESTRIAN_DEST.has(neighbors.e))
        destEdges.push('e');
    if (neighbors.w && PEDESTRIAN_DEST.has(neighbors.w))
        destEdges.push('w');
    if (destEdges.length === 0)
        return none;
    // плотность ≈ 1/4
    const seed = zoneKey ? tileDecorSeed(zoneKey) : 0;
    if (seed % 4 !== 0)
        return none;
    // один край — к пешеходному назначению (предпочтение стороне с crossing рядом по оси)
    const scored = destEdges.map((edge) => {
        let score = 1;
        if (edge === 'n' || edge === 's') {
            if (neighbors.e === 'crossing' || neighbors.w === 'crossing')
                score += 2;
        }
        else {
            if (neighbors.n === 'crossing' || neighbors.s === 'crossing')
                score += 2;
        }
        return { edge, score };
    });
    scored.sort((a, b) => b.score - a.score || a.edge.localeCompare(b.edge));
    const pick = scored[(seed >> 2) % scored.length].edge;
    return {
        n: pick === 'n',
        s: pick === 's',
        e: pick === 'e',
        w: pick === 'w',
    };
}
export function roadLinksFor(placeType, neighbors) {
    if (!isRoadSurface(placeType)) {
        return { n: false, s: false, e: false, w: false };
    }
    const links = (side) => {
        if (!side)
            return false;
        if (isRoadLike(side))
            return true;
        if (side === 'parking')
            return true;
        if (placeType === 'bridge' && (side === 'road' || side === 'crossing'))
            return true;
        return false;
    };
    return {
        n: links(neighbors.n),
        s: links(neighbors.s),
        e: links(neighbors.e),
        w: links(neighbors.w),
    };
}
export function resolveRoadCore(placeType, links) {
    if (placeType === 'crossing' || placeType === 'bridge')
        return 'both';
    if (!isRoadSurface(placeType))
        return 'none';
    const h = links.e || links.w;
    const v = links.n || links.s;
    if (h && v)
        return 'both';
    if (v)
        return 'v';
    if (h)
        return 'h';
    return 'both';
}
export function roadCornerFromLinks(links) {
    const n = links.n ? 1 : 0;
    const s = links.s ? 1 : 0;
    const e = links.e ? 1 : 0;
    const w = links.w ? 1 : 0;
    if (n + s + e + w !== 2)
        return null;
    if (links.e && links.s)
        return 'se';
    if (links.w && links.s)
        return 'sw';
    if (links.e && links.n)
        return 'ne';
    if (links.w && links.n)
        return 'nw';
    return null;
}
export function exitGapDirection(row, col, rows, _cols) {
    const onN = row === 0;
    const onS = row >= rows - 1;
    const onW = col === 0;
    if (onN)
        return 'n';
    if (onS)
        return 's';
    if (onW)
        return 'w';
    return 'e';
}
export function districtFillPatternId(placeType, districtStyle) {
    // Дороги без текстуры — иначе «шум» поверх разметки.
    if (placeType !== 'park' &&
        placeType !== 'pond' &&
        placeType !== 'plaza' &&
        placeType !== 'dump' &&
        placeType !== 'parking') {
        return null;
    }
    return `ndi-${placeType}-${districtStyle}`;
}
function facadeDirection(neighbors) {
    if (touchesStreet(neighbors.s))
        return 's';
    if (touchesStreet(neighbors.n))
        return 'n';
    if (touchesStreet(neighbors.w))
        return 'w';
    if (touchesStreet(neighbors.e))
        return 'e';
    return null;
}
export function resolveTileVisual(input) {
    const { placeType, districtStyle, zoneKey, gridRow, gridCol, gridRows, gridCols, neighbors } = input;
    const decay = tileCenterDecay(gridRow, gridCol, gridRows, gridCols);
    const dirt = tileDecayAmount(decay, districtStyle, placeType);
    const seed = tileDecorSeed(zoneKey);
    const decor = [];
    const animate = [];
    const styleAccents = [];
    const streetFront = streetFrontFor(neighbors);
    const buildingGutter = buildingGutterFor(placeType, neighbors);
    const roadCurb = roadCurbFor(placeType, neighbors);
    const crosswalkEdges = crosswalkEdgesFor(placeType, neighbors, zoneKey);
    const innerAlleyEdges = innerAlleyEdgesFor(placeType, neighbors, zoneKey, gridRow, gridCol, districtStyle);
    const patternClass = `nri-district-tile--${placeType} nri-district-tile--style-${districtStyle}`;
    const roadLinks = roadLinksFor(placeType, neighbors);
    const roadCore = resolveRoadCore(placeType, roadLinks);
    const showBuilding = (BUILDING_TYPES.has(placeType) &&
        placeType !== 'shack' &&
        placeType !== 'plaza' &&
        placeType !== 'corp_hq' &&
        placeType !== 'corp_office' &&
        placeType !== 'market') ||
        (placeType === 'generic' && seed % 3 !== 0);
    if (placeType === 'road' || placeType === 'parking') {
        if (seed % 2 === 0)
            animate.push('headlights');
    }
    if (placeType === 'house' || (placeType === 'generic' && showBuilding)) {
        animate.push('windows');
    }
    if (placeType === 'house' ||
        placeType === 'shack' ||
        placeType === 'restaurant' ||
        placeType === 'shop' ||
        placeType === 'secondhand' ||
        placeType === 'nightclub' ||
        placeType === 'electronics' ||
        placeType === 'metro' ||
        placeType === 'hospital' ||
        placeType === 'police' ||
        (placeType === 'generic' && showBuilding)) {
        animate.push('neon');
    }
    if (placeType === 'park') {
        decor.push('tree');
        if (seed % 2 === 0)
            animate.push('tree_sway');
    }
    if (placeType === 'dump') {
        if (seed % 2 === 0)
            decor.push('trash');
        if (seed % 3 === 0)
            decor.push('cyber_junk');
    }
    // shack: open sprite с плотной крышей — без neon-пульса
    if ((placeType === 'generic' || placeType === 'shack') && districtStyle !== 'corp_clean') {
        if (dirt > 0.55 && seed % 4 === 0)
            decor.push('trash');
        if (dirt > 0.7 && seed % 7 === 0)
            decor.push('homeless');
        if (dirt > 0.75 && seed % 9 === 0)
            decor.push('drunk');
        if (dirt > 0.5 && districtStyle === 'slum' && seed % 5 === 0)
            decor.push('cyber_junk');
    }
    if (districtStyle === 'chinatown' && ['restaurant', 'shop', 'nightclub'].includes(placeType)) {
        styleAccents.push('chinatown_lantern');
    }
    if (districtStyle === 'industrial' && ['generic', 'house'].includes(placeType) && seed % 2 === 0) {
        styleAccents.push('industrial_pipe');
    }
    if (districtStyle === 'corp_clean' && ['house', 'shop', 'restaurant', 'hospital'].includes(placeType)) {
        styleAccents.push('corp_trim');
    }
    const showFacade = (BUILDING_TYPES.has(placeType) &&
        placeType !== 'shack' &&
        placeType !== 'plaza' &&
        placeType !== 'corp_hq' &&
        placeType !== 'corp_office' &&
        placeType !== 'market') ||
        (placeType === 'generic' && showBuilding);
    const facadeDir = showFacade ? facadeDirection(neighbors) : null;
    const exitGap = placeType === 'exit' ? exitGapDirection(gridRow, gridCol, gridRows, gridCols) : null;
    return {
        patternClass,
        fillPatternId: districtFillPatternId(placeType, districtStyle),
        roadLinks,
        roadCore,
        streetFront,
        buildingGutter,
        roadCurb,
        crosswalkEdges,
        innerAlleyEdges,
        showBuilding,
        showFacade,
        facadeDir,
        softBlend: placeType === 'park' ||
            placeType === 'plaza' ||
            placeType === 'dump' ||
            placeType === 'pond' ||
            placeType === 'market' ||
            placeType === 'corp_hq' ||
            placeType === 'corp_office',
        exitGap,
        styleAccents,
        decor,
        animate,
        neonVariant: districtStyle === 'chinatown' ? 'chinatown' : 'default',
        edgeFade: placeType === 'exit',
    };
}
export function tileAnimationCost(visual) {
    return visual.animate.length > 0 ? 1 : 0;
}
/**
 * Внутренние улочки на стыке двух зданий (не дорога): обе клетки
 * детерминированно соглашаются по каноническому ребру → полосы складываются.
 */
export function innerAlleyEdgesFor(placeType, neighbors, zoneKey, row, col, districtStyle) {
    const none = { n: false, s: false, e: false, w: false };
    if (!BUILDING_TYPES.has(placeType) && placeType !== 'generic')
        return none;
    // барак — свой спрайт на всю клетку; улочки только у «обычных» корпусов
    if (placeType === 'shack')
        return none;
    const density = districtStyle === 'slum' || districtStyle === 'chinatown'
        ? 42
        : districtStyle === 'corp_clean'
            ? 14
            : districtStyle === 'industrial'
                ? 22
                : 32;
    const building = (t) => !!t && BUILDING_TYPES.has(t) && t !== 'shack';
    const agreed = (edge) => {
        let or = row;
        let oc = col;
        let oe = edge;
        // канон: владелец ребра — клетка с меньшим индексом (север/запад)
        if (edge === 'w') {
            oc = col - 1;
            oe = 'e';
        }
        else if (edge === 'n') {
            or = row - 1;
            oe = 's';
        }
        const id = `${or}:${oc}:${oe}:${zoneKey.split('__')[0] ?? ''}`;
        let h = 0;
        for (let i = 0; i < id.length; i++)
            h = (h * 33 + id.charCodeAt(i)) | 0;
        return Math.abs(h) % 100 < density;
    };
    return {
        n: building(neighbors.n) && agreed('n'),
        s: building(neighbors.s) && agreed('s'),
        e: building(neighbors.e) && agreed('e'),
        w: building(neighbors.w) && agreed('w'),
    };
}
/** Сдвинуть корпус, чтобы освободить полосу под улочку. */
export function applyAlleyInsets(body, alley) {
    const a = 0.15;
    let { x, y, w, h } = body;
    if (alley.w) {
        x += a;
        w -= a;
    }
    if (alley.e)
        w -= a;
    if (alley.n) {
        y += a;
        h -= a;
    }
    if (alley.s)
        h -= a;
    if (w < 0.35) {
        x = body.x;
        w = body.w;
    }
    if (h < 0.35) {
        y = body.y;
        h = body.h;
    }
    return { x, y, w, h };
}
/** Доля клетки под корпус здания (остальное — двор/тротуар/улица). */
export function buildingBodyRect(facadeDir, placeType, packed = false) {
    // В гетто-блоке (соседи-дома) корпус крупнее; с улицы — запас под gutter.
    const gutter = packed
        ? 0.05
        : placeType === 'metro'
            ? 0.14
            : placeType === 'shack'
                ? 0.12
                : placeType === 'house'
                    ? 0.18
                    : 0.16;
    const inner = 1 - gutter * 2;
    const shift = packed ? 0 : 0.05;
    if (facadeDir === 'n')
        return { x: gutter, y: gutter + shift, w: inner, h: inner - shift };
    if (facadeDir === 's')
        return { x: gutter, y: gutter, w: inner, h: inner - shift };
    if (facadeDir === 'w')
        return { x: gutter + shift, y: gutter, w: inner - shift, h: inner };
    if (facadeDir === 'e')
        return { x: gutter, y: gutter, w: inner - shift, h: inner };
    return { x: gutter, y: gutter, w: inner, h: inner };
}
/** Дом внутри блока (соседи-здания) — без «дороги» между клетками. */
export function isPackedBuildingBlock(neighbors) {
    const sides = [neighbors.n, neighbors.s, neighbors.e, neighbors.w];
    return sides.filter((t) => t && BUILDING_TYPES.has(t)).length >= 2;
}
//# sourceMappingURL=districtTileVisual.js.map