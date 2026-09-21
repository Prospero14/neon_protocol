/** Explicit mega-merge for district tiles via artId markers. */
/** Types that can be merged into seamless mega blocks. */
export const MEGA_MERGE_TYPES = [
    'road',
    'crossing',
    'dump',
    'shack',
    'park',
    'pond',
    'market',
    'house',
    'corp_hq',
    'corp_office',
    'plaza',
    'restaurant',
    'shop',
    'parking',
    'hotel',
    'nightclub',
    'hospital',
    'police',
    'electronics',
    'service',
    'shop_asian',
    'secondhand',
    'gunshop',
    'metro',
];
/**
 * Rect: 2x1 (wide), 1x2 (tall), 2x2, 3x3, 4x4, 6x6
 * corner_*: L-shape 2×2 missing one corner (3 cells); suffix = missing corner
 * cross: plus — center + N/E/S/W (5 cells)
 */
export const MEGA_SHAPES = [
    '2x1',
    '1x2',
    '2x2',
    '3x3',
    '4x4',
    '6x6',
    'corner_ne',
    'corner_nw',
    'corner_se',
    'corner_sw',
    'cross',
];
export function isMegaMergeType(t) {
    return MEGA_MERGE_TYPES.includes(t);
}
export function parseMegaShape(s) {
    return MEGA_SHAPES.includes(s) ? s : null;
}
/** Bounding box and occupied offsets relative to min row/col. */
export function shapeCellOffsets(shape) {
    switch (shape) {
        case '2x1':
            return [
                [0, 0],
                [0, 1],
            ];
        case '1x2':
            return [
                [0, 0],
                [1, 0],
            ];
        case '2x2':
            return [
                [0, 0],
                [0, 1],
                [1, 0],
                [1, 1],
            ];
        case '3x3':
            return blockOffsets(3);
        case '4x4':
            return blockOffsets(4);
        case '6x6':
            return blockOffsets(6);
        case 'corner_se': // missing SE → occupy NW,NE,SW
            return [
                [0, 0],
                [0, 1],
                [1, 0],
            ];
        case 'corner_sw':
            return [
                [0, 0],
                [0, 1],
                [1, 1],
            ];
        case 'corner_ne':
            return [
                [0, 0],
                [1, 0],
                [1, 1],
            ];
        case 'corner_nw':
            return [
                [0, 1],
                [1, 0],
                [1, 1],
            ];
        case 'cross':
            return [
                [0, 1],
                [1, 0],
                [1, 1],
                [1, 2],
                [2, 1],
            ];
    }
}
function blockOffsets(n) {
    const out = [];
    for (let r = 0; r < n; r++)
        for (let c = 0; c < n; c++)
            out.push([r, c]);
    return out;
}
export function shapeDims(shape) {
    switch (shape) {
        case '2x1':
            return { rows: 1, cols: 2 };
        case '1x2':
            return { rows: 2, cols: 1 };
        case '2x2':
        case 'corner_ne':
        case 'corner_nw':
        case 'corner_se':
        case 'corner_sw':
            return { rows: 2, cols: 2 };
        case '3x3':
        case 'cross':
            return { rows: 3, cols: 3 };
        case '4x4':
            return { rows: 4, cols: 4 };
        case '6x6':
            return { rows: 6, cols: 6 };
    }
}
export function encodeMegaArtId(placeType, shape) {
    return `mega:${placeType}:${shape}`;
}
export function encodeMegaCoverArtId(anchorZoneKey) {
    return `mega_cover:${anchorZoneKey}`;
}
export function parseMegaArtId(artId) {
    if (!artId)
        return null;
    if (artId.startsWith('mega_cover:')) {
        const anchorKey = artId.slice('mega_cover:'.length);
        return anchorKey ? { kind: 'cover', anchorKey } : null;
    }
    if (artId.startsWith('mega:')) {
        const parts = artId.split(':');
        if (parts.length !== 3)
            return null;
        const placeType = parts[1];
        const shape = parseMegaShape(parts[2]);
        if (!isMegaMergeType(placeType) || !shape)
            return null;
        return { kind: 'anchor', placeType, shape };
    }
    return null;
}
function detectRectShape(h, w) {
    if (h === 1 && w === 2)
        return '2x1';
    if (h === 2 && w === 1)
        return '1x2';
    if (h === 2 && w === 2)
        return '2x2';
    if (h === 3 && w === 3)
        return '3x3';
    if (h === 4 && w === 4)
        return '4x4';
    if (h === 6 && w === 6)
        return '6x6';
    return null;
}
function detectCornerOrCross(set, minR, minC, h, w, count) {
    if (count === 3 && h === 2 && w === 2) {
        const has = (dr, dc) => set.has(`${minR + dr},${minC + dc}`);
        const nw = has(0, 0);
        const ne = has(0, 1);
        const sw = has(1, 0);
        const se = has(1, 1);
        if (nw && ne && sw && !se)
            return 'corner_se';
        if (nw && ne && se && !sw)
            return 'corner_sw';
        if (nw && sw && se && !ne)
            return 'corner_ne';
        if (ne && sw && se && !nw)
            return 'corner_nw';
    }
    if (count === 5 && h === 3 && w === 3) {
        const need = shapeCellOffsets('cross').map(([dr, dc]) => `${minR + dr},${minC + dc}`);
        if (need.every((k) => set.has(k)) && need.length === 5)
            return 'cross';
    }
    return null;
}
/** Majority placeType; prefers mergeable types on ties. */
export function majorityPlaceType(cells) {
    const counts = new Map();
    for (const c of cells) {
        const t = c.placeType || 'generic';
        counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    let best = cells[0]?.placeType ?? 'generic';
    let bestN = -1;
    for (const [t, n] of counts) {
        if (n > bestN) {
            best = t;
            bestN = n;
            continue;
        }
        if (n === bestN) {
            if (isMegaMergeType(t) && !isMegaMergeType(best))
                best = t;
        }
    }
    return best;
}
function pickMergeableType(cells) {
    const maj = majorityPlaceType(cells);
    if (isMegaMergeType(maj))
        return maj;
    const counts = new Map();
    for (const c of cells) {
        if (!isMegaMergeType(c.placeType))
            continue;
        counts.set(c.placeType, (counts.get(c.placeType) ?? 0) + 1);
    }
    let best = null;
    let bestN = 0;
    for (const [t, n] of counts) {
        if (n > bestN) {
            best = t;
            bestN = n;
        }
    }
    return best;
}
/**
 * Resolve merge from selection.
 * - Bounding box must be an allowed shape (or corner/cross footprint).
 * - For rect shapes, `pool` can fill missing cells in the bbox (select corners → full 3×3).
 * - placeType = `forcePlaceType` if mergeable, else majority among cells.
 */
export function validateMegaSelection(cells, pool, opts) {
    if (cells.length < 2)
        return { ok: false, error: 'Выберите минимум 2 клетки.' };
    const rows = cells.map((c) => c.gridRow);
    const cols = cells.map((c) => c.gridCol);
    const minR = Math.min(...rows);
    const maxR = Math.max(...rows);
    const minC = Math.min(...cols);
    const maxC = Math.max(...cols);
    const h = maxR - minR + 1;
    const w = maxC - minC + 1;
    const set = new Set(cells.map((c) => `${c.gridRow},${c.gridCol}`));
    const resolveType = (resolved) => {
        const forced = opts?.forcePlaceType && isMegaMergeType(opts.forcePlaceType) ? opts.forcePlaceType : null;
        if (forced)
            return forced;
        return pickMergeableType(resolved) ?? pickMergeableType(cells);
    };
    // L-corner / cross before incomplete 2×2 / 3×3 rect (3 of 4 cells ≠ 2×2).
    const special = detectCornerOrCross(set, minR, minC, h, w, cells.length);
    if (special) {
        const offsets = shapeCellOffsets(special);
        if (offsets.every(([dr, dc]) => set.has(`${minR + dr},${minC + dc}`)) && offsets.length === cells.length) {
            const placeType = resolveType(cells);
            if (!placeType) {
                return {
                    ok: false,
                    error: 'Выберите тип в «Объект» (штаб, дорога, дом…) — кисть задаёт mega.',
                };
            }
            return { ok: true, shape: special, placeType, originRow: minR, originCol: minC, cells };
        }
    }
    const rect = detectRectShape(h, w);
    if (rect) {
        let resolved = cells;
        if (cells.length !== h * w && pool && pool.length) {
            const filled = pool.filter((t) => t.gridRow >= minR && t.gridRow <= maxR && t.gridCol >= minC && t.gridCol <= maxC);
            if (filled.length === h * w)
                resolved = filled;
        }
        if (resolved.length !== h * w) {
            return {
                ok: false,
                error: `Для ${rect} нужно заполнить все ${h * w} клеток прямоугольника (сейчас ${cells.length}).`,
            };
        }
        for (let r = minR; r <= maxR; r++) {
            for (let c = minC; c <= maxC; c++) {
                if (!resolved.some((x) => x.gridRow === r && x.gridCol === c)) {
                    return { ok: false, error: 'Выделение должно быть сплошным прямоугольником.' };
                }
            }
        }
        const placeType = resolveType(resolved);
        if (!placeType) {
            return {
                ok: false,
                error: 'Выберите тип в «Объект» (штаб, дорога, дом…) — кисть задаёт mega.',
            };
        }
        return { ok: true, shape: rect, placeType, originRow: minR, originCol: minC, cells: resolved };
    }
    return {
        ok: false,
        error: 'Формы: 2×1, 1×2, 2×2, 3×3, 4×4 (прямоугольник), уголок (3) или крест (5).',
    };
}
export function assignShapeMegaRoles(originRow, originCol, shape) {
    const offsets = shapeCellOffsets(shape);
    const out = new Map();
    offsets.forEach(([dr, dc], i) => {
        out.set(`${originRow + dr},${originCol + dc}`, i === 0 ? 'anchor' : 'cover');
    });
    return out;
}
/** @deprecated use assignShapeMegaRoles */
export function assignRectMegaRoles(originRow, originCol, shape) {
    return assignShapeMegaRoles(originRow, originCol, shape);
}
function posKey(r, c) {
    return `${r},${c}`;
}
export function buildExplicitMegaInfo(tiles) {
    const byKey = new Map(tiles.map((t) => [t.zoneKey, t]));
    const byPos = new Map(tiles.map((t) => [posKey(t.gridRow, t.gridCol), t]));
    const out = new Map();
    for (const t of tiles) {
        const parsed = parseMegaArtId(t.artId);
        if (!parsed || parsed.kind !== 'anchor')
            continue;
        const offsets = shapeCellOffsets(parsed.shape);
        const originDr = offsets[0][0];
        const originDc = offsets[0][1];
        const originRow = t.gridRow - originDr;
        const originCol = t.gridCol - originDc;
        const cells = offsets
            .map(([dr, dc]) => byPos.get(posKey(originRow + dr, originCol + dc)))
            .filter(Boolean);
        if (cells.length === 0)
            continue;
        const x = Math.min(...cells.map((c) => c.x));
        const y = Math.min(...cells.map((c) => c.y));
        const x2 = Math.max(...cells.map((c) => c.x + c.w));
        const y2 = Math.max(...cells.map((c) => c.y + c.h));
        const span = { x, y, w: x2 - x, h: y2 - y };
        out.set(posKey(t.gridRow, t.gridCol), {
            role: 'anchor',
            placeType: parsed.placeType,
            shape: parsed.shape,
            anchorKey: t.zoneKey,
            span,
        });
        for (const c of cells) {
            if (c.zoneKey === t.zoneKey)
                continue;
            out.set(posKey(c.gridRow, c.gridCol), {
                role: 'cover',
                placeType: parsed.placeType,
                shape: parsed.shape,
                anchorKey: t.zoneKey,
            });
        }
    }
    for (const t of tiles) {
        const parsed = parseMegaArtId(t.artId);
        if (!parsed || parsed.kind !== 'cover')
            continue;
        const k = posKey(t.gridRow, t.gridCol);
        if (out.has(k))
            continue;
        const anchor = byKey.get(parsed.anchorKey);
        const anchorParsed = parseMegaArtId(anchor?.artId);
        out.set(k, {
            role: 'cover',
            placeType: anchorParsed?.kind === 'anchor' ? anchorParsed.placeType : 'park',
            shape: anchorParsed?.kind === 'anchor' ? anchorParsed.shape : '2x2',
            anchorKey: parsed.anchorKey,
        });
    }
    return out;
}
//# sourceMappingURL=districtMegaMerge.js.map