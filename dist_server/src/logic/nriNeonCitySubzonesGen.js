import { defaultDistrictStyle, subTileZoneKey, } from '../../shared/nri-domain/districtGrid.js';
import { canDrillIntoDistrict } from '../../shared/nri-domain/mapZones.js';
const CELL = 5.5;
const GAP = 0.32;
const PAD = 0.55;
/** Холст клеточного района — совпадает с aspect-ratio карты (240×165). */
export const DISTRICT_DRILL_CANVAS = { w: 240, h: 165 };
function distributeInt(total, count) {
    if (count <= 0)
        return [];
    const base = Math.floor(total / count);
    const rem = total - base * count;
    return Array.from({ length: count }, (_, i) => base + (i < rem ? 1 : 0));
}
/** Размер сетки клеток на drill-холсте (не от bbox района на карте города). */
export function computeDistrictGridLayout(canvas = DISTRICT_DRILL_CANVAS) {
    const innerW = canvas.w - PAD * 2;
    const innerH = canvas.h - PAD * 2;
    const cols = Math.max(8, Math.min(14, Math.floor((innerW + GAP) / (CELL + GAP))));
    const rows = Math.max(6, Math.min(12, Math.floor((innerH + GAP) / (CELL + GAP))));
    const colWidths = distributeInt(Math.max(1, Math.round(innerW - GAP * Math.max(0, cols - 1))), cols);
    const rowHeights = distributeInt(Math.max(1, Math.round(innerH - GAP * Math.max(0, rows - 1))), rows);
    return { rows, cols, colWidths, rowHeights, canvasW: canvas.w, canvasH: canvas.h };
}
/** Пересчёт x/y/w/h клеток по gridRow/gridCol на полный drill-холст. */
export function relayoutDistrictGridTiles(tiles, layout = computeDistrictGridLayout()) {
    const { colWidths, rowHeights } = layout;
    const colX = [];
    const rowY = [];
    let x = PAD;
    for (let c = 0; c < colWidths.length; c++) {
        colX[c] = x;
        x += colWidths[c] + GAP;
    }
    let y = PAD;
    for (let r = 0; r < rowHeights.length; r++) {
        rowY[r] = y;
        y += rowHeights[r] + GAP;
    }
    return tiles.map((tile) => {
        const r = tile.gridRow ?? 0;
        const c = tile.gridCol ?? 0;
        return {
            ...tile,
            x: colX[c] ?? PAD,
            y: rowY[r] ?? PAD,
            w: colWidths[c] ?? CELL,
            h: rowHeights[r] ?? CELL,
        };
    });
}
function perimeterPlaceType(row, col, rows, cols) {
    const onEdge = row === 0 || col === 0 || row === rows - 1 || col === cols - 1;
    if (!onEdge)
        return 'generic';
    const midC = Math.floor(cols / 2);
    const midR = Math.floor(rows / 2);
    if (row === 0 && col === midC)
        return 'exit';
    if (row === rows - 1 && col === midC)
        return 'exit';
    if (col === 0 && row === midR)
        return 'exit';
    if (col === cols - 1 && row === midR)
        return 'exit';
    return 'generic';
}
/** Полная сетка клеток внутри родителя. */
export function generateDistrictGrid(parent) {
    if (!canDrillIntoDistrict(parent))
        return [];
    const { rows, cols, colWidths, rowHeights } = computeDistrictGridLayout();
    const style = defaultDistrictStyle(parent.zoneType);
    const out = [];
    let y = PAD;
    for (let r = 0; r < rows; r++) {
        let x = PAD;
        const h = rowHeights[r];
        for (let c = 0; c < cols; c++) {
            const w = colWidths[c];
            const placeType = perimeterPlaceType(r, c, rows, cols);
            out.push({
                zoneKey: subTileZoneKey(parent.zoneKey, r, c),
                sortOrder: parent.sortOrder + 1000 + r * cols + c,
                name: placeType === 'exit' ? 'Выход' : `Клетка ${r + 1}.${c + 1}`,
                zoneType: parent.zoneType,
                parentZoneKey: parent.zoneKey,
                placeType,
                districtStyle: style,
                gridRow: r,
                gridCol: c,
                x: parent.x + x,
                y: parent.y + y,
                w,
                h,
                megaDistrict: parent.megaDistrict,
                corpName: parent.corpName,
                pois: [],
            });
            x += w + GAP;
        }
        y += h + GAP;
    }
    return out;
}
export function generateAllSubZones(parents) {
    const top = parents.filter((z) => !z.parentZoneKey);
    const subs = [];
    for (const p of top) {
        subs.push(...generateDistrictGrid(p));
    }
    return subs;
}
/** Алиас для тестов и обратной совместимости. */
export function generateSubZonesForParent(parent) {
    return generateDistrictGrid(parent);
}
//# sourceMappingURL=nriNeonCitySubzonesGen.js.map