import { tileDecorSeed } from './districtGrid';
function path(points) {
    if (points.length === 0)
        return '';
    return `${points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(3)},${p[1].toFixed(3)}`).join(' ')} Z`;
}
function neonAccent(placeType, style, seed) {
    if (style === 'chinatown')
        return seed % 2 === 0 ? 'amber' : 'magenta';
    if (placeType === 'restaurant')
        return 'magenta';
    if (placeType === 'shop')
        return 'cyan';
    if (placeType === 'secondhand')
        return 'violet';
    if (placeType === 'metro')
        return 'lime';
    if (style === 'slum')
        return 'amber';
    return seed % 3 === 0 ? 'cyan' : seed % 3 === 1 ? 'lime' : 'magenta';
}
function neonLabelFor(placeType, seed) {
    const labels = {
        restaurant: ['NOODLE', 'RAMEN', 'BAR', 'FOOD'],
        shop: ['TECH', 'GEAR', 'MART', 'MOD'],
        secondhand: ['JUNK', 'USED', 'SCRAP'],
        house: ['HOME', 'FLAT', 'UNIT'],
        metro: ['METRO', 'SUB', 'LINE'],
        generic: ['RENT', 'BLOCK', 'UNIT'],
    };
    const pool = labels[placeType] ?? ['NEON'];
    return pool[seed % pool.length] ?? 'NEON';
}
/** Смещение центра здания от улицы. */
function anchor(x, y, w, h, facadeDir) {
    const cx = x + w * 0.5;
    const baseY = y + h * 0.66;
    if (facadeDir === 's')
        return { cx, baseY: y + h * 0.58, streetEdge: 's' };
    if (facadeDir === 'n')
        return { cx, baseY: y + h * 0.72, streetEdge: 'n' };
    if (facadeDir === 'w')
        return { cx: x + w * 0.58, baseY, streetEdge: 'w' };
    if (facadeDir === 'e')
        return { cx: x + w * 0.42, baseY, streetEdge: 'e' };
    return { cx, baseY, streetEdge: null };
}
function streetBand(x, y, w, h, edge) {
    const t = Math.min(w, h) * 0.14;
    if (edge === 's') {
        const sy = y + h - t;
        return {
            street: path([
                [x, sy],
                [x + w, sy],
                [x + w, y + h],
                [x, y + h],
            ]),
            wet: path([
                [x + w * 0.08, sy + t * 0.15],
                [x + w * 0.92, sy + t * 0.15],
                [x + w * 0.85, y + h - t * 0.1],
                [x + w * 0.15, y + h - t * 0.1],
            ]),
        };
    }
    if (edge === 'n') {
        const sy = y + t;
        return {
            street: path([
                [x, y],
                [x + w, y],
                [x + w, sy],
                [x, sy],
            ]),
            wet: path([
                [x + w * 0.1, y + t * 0.55],
                [x + w * 0.9, y + t * 0.55],
                [x + w * 0.82, y + t * 0.85],
                [x + w * 0.18, y + t * 0.85],
            ]),
        };
    }
    if (edge === 'w') {
        const sx = x + t;
        return {
            street: path([
                [x, y],
                [sx, y],
                [sx, y + h],
                [x, y + h],
            ]),
            wet: path([
                [x + t * 0.55, y + h * 0.12],
                [x + t * 0.85, y + h * 0.12],
                [x + t * 0.78, y + h * 0.88],
                [x + t * 0.48, y + h * 0.88],
            ]),
        };
    }
    const sx = x + w - t;
    return {
        street: path([
            [sx, y],
            [x + w, y],
            [x + w, y + h],
            [sx, y + h],
        ]),
        wet: path([
            [x + w - t * 0.85, y + h * 0.1],
            [x + w - t * 0.52, y + h * 0.1],
            [x + w - t * 0.45, y + h * 0.9],
            [x + w - t * 0.78, y + h * 0.9],
        ]),
    };
}
function isoBuilding(cx, baseY, w, h, scale) {
    const bw = w * 0.34 * scale;
    const depth = w * 0.22 * scale;
    const wallH = h * 0.36 * scale;
    const left = [
        [cx - bw, baseY],
        [cx, baseY + depth],
        [cx, baseY + depth - wallH],
        [cx - bw, baseY - wallH],
    ];
    const right = [
        [cx, baseY + depth],
        [cx + bw, baseY],
        [cx + bw, baseY - wallH],
        [cx, baseY + depth - wallH],
    ];
    const roof = [
        [cx, baseY + depth - wallH],
        [cx + bw, baseY - wallH],
        [cx, baseY - depth - wallH],
        [cx - bw, baseY - wallH],
    ];
    const neonPath = path([
        [cx + bw * 0.08, baseY - wallH * 0.55],
        [cx + bw * 0.92, baseY - wallH * 0.55],
        [cx + bw * 0.88, baseY - wallH * 0.48],
        [cx + bw * 0.12, baseY - wallH * 0.48],
    ]);
    const wx = cx + bw * 0.55;
    const wy = baseY - wallH * 0.72;
    const ww = bw * 0.22;
    const wh = wallH * 0.14;
    const windows = [
        path([
            [wx, wy],
            [wx + ww, wy],
            [wx + ww, wy + wh],
            [wx, wy + wh],
        ]),
        path([
            [wx, wy + wh * 1.35],
            [wx + ww, wy + wh * 1.35],
            [wx + ww, wy + wh * 2.35],
            [wx, wy + wh * 2.35],
        ]),
    ];
    return { left: path(left), right: path(right), roof: path(roof), neonPath, windows };
}
function isoGround(x, y, w, h) {
    const cx = x + w * 0.5;
    const cy = y + h * 0.74;
    const hw = w * 0.46;
    const hh = h * 0.2;
    return path([
        [cx, cy - hh],
        [cx + hw, cy],
        [cx, cy + hh],
        [cx - hw, cy],
    ]);
}
function isoRoadPad(x, y, w, h) {
    const cx = x + w * 0.5;
    const cy = y + h * 0.68;
    const hw = w * 0.44;
    const hh = h * 0.22;
    const ground = path([
        [cx, cy - hh],
        [cx + hw, cy],
        [cx, cy + hh],
        [cx - hw, cy],
    ]);
    const lane = path([
        [cx - hw * 0.55, cy - hh * 0.15],
        [cx + hw * 0.55, cy - hh * 0.15],
        [cx + hw * 0.45, cy + hh * 0.15],
        [cx - hw * 0.45, cy + hh * 0.15],
    ]);
    return {
        ground,
        street: lane,
        wetSheen: path([
            [cx - hw * 0.35, cy + hh * 0.05],
            [cx + hw * 0.35, cy + hh * 0.05],
            [cx + hw * 0.25, cy + hh * 0.35],
            [cx - hw * 0.25, cy + hh * 0.35],
        ]),
        leftWall: '',
        rightWall: '',
        roof: '',
        neonLabel: '',
        neonVertical: false,
        windows: [],
        props: [],
        accent: 'cyan',
    };
}
export function buildIsoDiorama(x, y, w, h, placeType, districtStyle, facadeDir, streetFront, zoneKey) {
    if (w < 2.4 || h < 2)
        return null;
    const seed = tileDecorSeed(zoneKey);
    const accent = neonAccent(placeType, districtStyle, seed);
    if (placeType === 'road' || placeType === 'crossing' || placeType === 'parking' || placeType === 'bridge') {
        const road = isoRoadPad(x, y, w, h);
        if (seed % 3 !== 0) {
            const cx = x + w * 0.52;
            const cy = y + h * 0.62;
            road.props.push({
                kind: 'car',
                d: path([
                    [cx - w * 0.14, cy],
                    [cx + w * 0.14, cy],
                    [cx + w * 0.1, cy + h * 0.08],
                    [cx - w * 0.1, cy + h * 0.08],
                ]),
            });
        }
        return road;
    }
    if (placeType === 'park' || placeType === 'plaza') {
        return {
            ground: isoGround(x, y, w, h),
            leftWall: '',
            rightWall: '',
            roof: '',
            neonLabel: '',
            neonVertical: false,
            windows: [],
            props: [
                {
                    kind: 'tree',
                    d: `M ${x + w * 0.5} ${y + h * 0.42} m 0 ${h * 0.08} a ${w * 0.12} ${h * 0.12} 0 1 0 0.01 0`,
                },
            ],
            accent: 'lime',
        };
    }
    if (placeType === 'alley') {
        return {
            ground: path([
                [x + w * 0.2, y + h * 0.82],
                [x + w * 0.8, y + h * 0.82],
                [x + w * 0.72, y + h * 0.95],
                [x + w * 0.28, y + h * 0.95],
            ]),
            leftWall: path([
                [x + w * 0.18, y + h * 0.25],
                [x + w * 0.28, y + h * 0.82],
                [x + w * 0.28, y + h * 0.95],
                [x + w * 0.18, y + h * 0.38],
            ]),
            rightWall: path([
                [x + w * 0.82, y + h * 0.25],
                [x + w * 0.72, y + h * 0.82],
                [x + w * 0.72, y + h * 0.95],
                [x + w * 0.82, y + h * 0.38],
            ]),
            roof: '',
            neonLabel: seed % 2 === 0 ? 'BAR' : '',
            neonVertical: true,
            windows: [],
            props: [],
            accent: 'magenta',
        };
    }
    const { cx, baseY, streetEdge } = anchor(x, y, w, h, facadeDir);
    const scale = placeType === 'metro' ? 1.15 : placeType === 'generic' ? 0.85 : 1;
    const b = isoBuilding(cx, baseY, w, h, scale);
    let street;
    let wetSheen;
    const edge = streetEdge ??
        (streetFront.s ? 's' : streetFront.n ? 'n' : streetFront.e ? 'e' : streetFront.w ? 'w' : 's');
    if (streetFront.n || streetFront.s || streetFront.e || streetFront.w) {
        const band = streetBand(x, y, w, h, edge);
        street = band.street;
        wetSheen = band.wet;
    }
    const props = [];
    if (placeType === 'shop' && seed % 2 === 0) {
        props.push({
            kind: 'vending',
            d: path([
                [x + w * 0.12, y + h * 0.48],
                [x + w * 0.22, y + h * 0.48],
                [x + w * 0.22, y + h * 0.68],
                [x + w * 0.12, y + h * 0.68],
            ]),
        });
    }
    if (seed % 5 === 0) {
        props.push({
            kind: 'pole',
            d: `M ${x + w * 0.78} ${y + h * 0.35} L ${x + w * 0.78} ${y + h * 0.72}`,
        });
    }
    return {
        ground: isoGround(x, y, w, h),
        street,
        wetSheen,
        leftWall: b.left,
        rightWall: b.right,
        roof: b.roof,
        neonPath: b.neonPath,
        neonLabel: neonLabelFor(placeType, seed),
        neonVertical: placeType === 'secondhand' || (districtStyle === 'chinatown' && seed % 2 === 1),
        windows: b.windows,
        props,
        accent,
    };
}
//# sourceMappingURL=districtTileIso.js.map