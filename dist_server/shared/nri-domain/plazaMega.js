/** Mega-блоки N×N (площадь / трущобы / корп HQ / корпус) → якорь + cover-клетки. */
export function blockShapeNxN(n) {
    const out = [];
    for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++)
            out.push([r, c]);
    }
    return out;
}
const BLOCK_2X2 = blockShapeNxN(2);
/** Форма 2×2 для генерации кластеров площади / shack / office. */
export const PLAZA_BLOCK_SHAPE = BLOCK_2X2;
export const CORP_HQ_SIZE = 6;
export const CORP_OFFICE_SIZE = 2;
export const CORP_HQ_SHAPE = blockShapeNxN(CORP_HQ_SIZE);
function posKey(r, c) {
    return `${r},${c}`;
}
/**
 * Жадный разбор: сверху-слева ищем неразмеченные size×size заданного типа.
 */
export function assignBlockMegaRoles(byPos, placeType, size = 2) {
    const out = new Map();
    const claimed = new Set();
    const shape = blockShapeNxN(size);
    const rows = new Set();
    const cols = new Set();
    for (const k of byPos.keys()) {
        const [rs, cs] = k.split(',');
        rows.add(Number(rs));
        cols.add(Number(cs));
    }
    const rowList = [...rows].sort((a, b) => a - b);
    const colList = [...cols].sort((a, b) => a - b);
    for (const r of rowList) {
        for (const c of colList) {
            const k0 = posKey(r, c);
            if (claimed.has(k0))
                continue;
            if (byPos.get(k0) !== placeType)
                continue;
            const cells = shape.map(([dr, dc]) => posKey(r + dr, c + dc));
            if (cells.some((k) => claimed.has(k) || byPos.get(k) !== placeType))
                continue;
            out.set(cells[0], 'anchor');
            for (let i = 1; i < cells.length; i++)
                out.set(cells[i], 'cover');
            for (const k of cells)
                claimed.add(k);
        }
    }
    return out;
}
export function assignPlazaMegaRoles(byPos) {
    return assignBlockMegaRoles(byPos, 'plaza', 2);
}
/**
 * Жадный разбор нескольких квадратных размеров (крупные сначала).
 * Для corp_hq: [6,4,3,2] чтобы кластеры не рассыпались на одиночные штабы.
 */
export function buildBlockMegaInfoMultiSize(tiles, placeType, kind, sizes) {
    const byPos = new Map();
    const geom = new Map();
    for (const t of tiles) {
        const k = posKey(t.gridRow, t.gridCol);
        byPos.set(k, t.placeType);
        geom.set(k, { x: t.x, y: t.y, w: t.w, h: t.h });
    }
    const claimed = new Set();
    const out = new Map();
    const sorted = [...sizes].filter((n) => n >= 2).sort((a, b) => b - a);
    const rows = new Set();
    const cols = new Set();
    for (const k of byPos.keys()) {
        const [rs, cs] = k.split(',');
        rows.add(Number(rs));
        cols.add(Number(cs));
    }
    const rowList = [...rows].sort((a, b) => a - b);
    const colList = [...cols].sort((a, b) => a - b);
    for (const size of sorted) {
        const shape = blockShapeNxN(size);
        for (const r of rowList) {
            for (const c of colList) {
                const k0 = posKey(r, c);
                if (claimed.has(k0))
                    continue;
                if (byPos.get(k0) !== placeType)
                    continue;
                const cellKeys = shape.map(([dr, dc]) => posKey(r + dr, c + dc));
                if (cellKeys.some((k) => claimed.has(k) || byPos.get(k) !== placeType))
                    continue;
                const cells = cellKeys.map((k) => geom.get(k));
                const x = Math.min(...cells.map((g) => g.x));
                const y = Math.min(...cells.map((g) => g.y));
                const x2 = Math.max(...cells.map((g) => g.x + g.w));
                const y2 = Math.max(...cells.map((g) => g.y + g.h));
                out.set(cellKeys[0], {
                    kind,
                    role: 'anchor',
                    size,
                    span: { x, y, w: x2 - x, h: y2 - y },
                });
                for (let i = 1; i < cellKeys.length; i++) {
                    out.set(cellKeys[i], { kind, role: 'cover', size });
                }
                for (const k of cellKeys)
                    claimed.add(k);
            }
        }
    }
    return out;
}
export function buildBlockMegaInfo(tiles, placeType, kind, size = 2) {
    return buildBlockMegaInfoMultiSize(tiles, placeType, kind, [size]);
}
export function buildPlazaMegaInfo(tiles) {
    const m = buildBlockMegaInfo(tiles, 'plaza', 'plaza', 2);
    const out = new Map();
    for (const [k, v] of m)
        out.set(k, { role: v.role, span: v.span });
    return out;
}
export function normalizePlazaLayout(grid) {
    const rows = grid.length;
    const cols = grid[0]?.length ?? 0;
    const locked = new Set();
    for (let r = 0; r < rows - 1; r++) {
        for (let c = 0; c < cols - 1; c++) {
            if (grid[r][c] === 'plaza' &&
                grid[r][c + 1] === 'plaza' &&
                grid[r + 1][c] === 'plaza' &&
                grid[r + 1][c + 1] === 'plaza') {
                locked.add(posKey(r, c));
                locked.add(posKey(r, c + 1));
                locked.add(posKey(r + 1, c));
                locked.add(posKey(r + 1, c + 1));
            }
        }
    }
    let changed = 0;
    const demote = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (grid[r][c] !== 'plaza')
                continue;
            if (locked.has(posKey(r, c)))
                continue;
            const touch = [
                grid[r - 1]?.[c],
                grid[r + 1]?.[c],
                grid[r]?.[c - 1],
                grid[r]?.[c + 1],
            ].some((t) => t === 'plaza');
            if (touch)
                demote.push([r, c]);
        }
    }
    for (const [r, c] of demote) {
        if (grid[r][c] !== 'plaza')
            continue;
        grid[r][c] = 'house';
        changed++;
    }
    return changed;
}
/**
 * Не больше 1 парковки на 10 жилых клеток (house + shack + hotel + service).
 * В industrial — 1 на 14.
 */
export function normalizeParkingQuota(grid, style) {
    const rows = grid.length;
    const cols = grid[0]?.length ?? 0;
    let homes = 0;
    const parks = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const t = grid[r][c];
            if (t === 'house' || t === 'shack' || t === 'hotel' || t === 'service')
                homes++;
            if (t === 'parking') {
                let score = 0;
                for (const [dr, dc] of [
                    [-1, 0],
                    [1, 0],
                    [0, -1],
                    [0, 1],
                ]) {
                    const n = grid[r + dr]?.[c + dc];
                    if (n === 'road' || n === 'bridge' || n === 'crossing')
                        score += 3;
                    if (n === 'shop' || n === 'electronics' || n === 'gunshop')
                        score += 1;
                }
                parks.push({ r, c, score });
            }
        }
    }
    const per = style === 'industrial' ? 14 : 10;
    const maxPark = Math.floor(homes / per);
    if (parks.length <= maxPark)
        return 0;
    parks.sort((a, b) => b.score - a.score || a.r - b.r || a.c - b.c);
    let changed = 0;
    for (const p of parks.slice(maxPark)) {
        if (grid[p.r][p.c] !== 'parking')
            continue;
        grid[p.r][p.c] = style === 'corp_clean' ? 'service' : 'house';
        changed++;
    }
    return changed;
}
function canAbsorbToShack(t) {
    return t === 'shack' || t === 'house' || t === 'generic' || t === 'secondhand';
}
export const SHACK_SINGLES_PER_MEGA = 6;
export function ensureShackMegaBlocks(grid, rng) {
    const rows = grid.length;
    const cols = grid[0]?.length ?? 0;
    if (rows < 2 || cols < 2)
        return 0;
    const locked = new Set();
    let megas = 0;
    for (let r = 0; r < rows - 1; r++) {
        for (let c = 0; c < cols - 1; c++) {
            if (grid[r][c] === 'shack' &&
                grid[r][c + 1] === 'shack' &&
                grid[r + 1][c] === 'shack' &&
                grid[r + 1][c + 1] === 'shack') {
                const cells = [posKey(r, c), posKey(r, c + 1), posKey(r + 1, c), posKey(r + 1, c + 1)];
                if (cells.some((k) => locked.has(k)))
                    continue;
                for (const k of cells)
                    locked.add(k);
                megas++;
            }
        }
    }
    let shackTotal = 0;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (grid[r][c] === 'shack')
                shackTotal++;
        }
    }
    if (shackTotal < 4)
        return 0;
    const singles = Math.max(0, shackTotal - megas * 4);
    let target = Math.max(megas, Math.ceil(singles / SHACK_SINGLES_PER_MEGA));
    if (shackTotal >= 8 && target < 1)
        target = 1;
    if (megas >= target)
        return 0;
    const cands = [];
    for (let r = 0; r < rows - 1; r++) {
        for (let c = 0; c < cols - 1; c++) {
            const cells = [
                [r, c],
                [r, c + 1],
                [r + 1, c],
                [r + 1, c + 1],
            ];
            if (cells.some(([rr, cc]) => locked.has(posKey(rr, cc))))
                continue;
            if (cells.some(([rr, cc]) => !canAbsorbToShack(grid[rr][cc])))
                continue;
            let score = 0;
            for (const [rr, cc] of cells) {
                if (grid[rr][cc] === 'shack')
                    score += 3;
                else if (grid[rr][cc] === 'house')
                    score += 1;
            }
            score += rng() * 0.5;
            cands.push({ r, c, score });
        }
    }
    cands.sort((a, b) => b.score - a.score || a.r - b.r || a.c - b.c);
    let stamped = 0;
    for (const cand of cands) {
        if (megas >= target)
            break;
        const cells = [
            [cand.r, cand.c],
            [cand.r, cand.c + 1],
            [cand.r + 1, cand.c],
            [cand.r + 1, cand.c + 1],
        ];
        if (cells.some(([rr, cc]) => locked.has(posKey(rr, cc))))
            continue;
        if (cells.some(([rr, cc]) => !canAbsorbToShack(grid[rr][cc])))
            continue;
        for (const [rr, cc] of cells) {
            grid[rr][cc] = 'shack';
            locked.add(posKey(rr, cc));
        }
        megas++;
        stamped++;
    }
    return stamped;
}
//# sourceMappingURL=plazaMega.js.map