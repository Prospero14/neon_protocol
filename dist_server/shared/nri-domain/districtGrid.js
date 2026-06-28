/** Сетка квартала — типы клеток, стили, decay, соседи. См. docs/NRI_DISTRICT_GRID.md */
export const PLACE_TYPES = [
    'generic',
    'road',
    'bridge',
    'crossing',
    'house',
    'restaurant',
    'shop',
    'secondhand',
    'alley',
    'park',
    'plaza',
    'parking',
    'metro',
    'exit',
];
export const DISTRICT_STYLES = [
    'residential',
    'chinatown',
    'corp_clean',
    'slum',
    'industrial',
    'park_mixed',
];
const PLACE_SET = new Set(PLACE_TYPES);
const STYLE_SET = new Set(DISTRICT_STYLES);
export function isPlaceType(v) {
    return PLACE_SET.has(v);
}
export function isDistrictStyle(v) {
    return STYLE_SET.has(v);
}
export function normalizePlaceType(raw) {
    if (typeof raw === 'string' && isPlaceType(raw))
        return raw;
    return 'generic';
}
export function normalizeDistrictStyle(raw) {
    if (typeof raw === 'string' && isDistrictStyle(raw))
        return raw;
    return null;
}
/** Стиль по умолчанию от gameplay zoneType родителя. */
export function defaultDistrictStyle(zoneType) {
    switch (zoneType) {
        case 'corp':
            return 'corp_clean';
        case 'slum':
            return 'slum';
        case 'industrial':
            return 'industrial';
        case 'park':
            return 'park_mixed';
        default:
            return 'residential';
    }
}
/** 0 = центр квартала, 1 = угол/край. */
export function tileCenterDecay(row, col, rows, cols) {
    if (rows <= 1 || cols <= 1)
        return 1;
    const cy = (rows - 1) / 2;
    const cx = (cols - 1) / 2;
    const dy = Math.abs(row - cy) / Math.max(cy, 0.5);
    const dx = Math.abs(col - cx) / Math.max(cx, 0.5);
    return Math.min(1, Math.sqrt(dx * dx + dy * dy));
}
/** Уровень «грязи» / декора для пропсов и бомжей. */
export function tileDecayAmount(decay, style, placeType) {
    if (placeType === 'park' || placeType === 'plaza' || placeType === 'exit')
        return decay * 0.35;
    if (style === 'corp_clean')
        return decay * 0.15;
    if (style === 'slum')
        return 0.35 + decay * 0.65;
    if (style === 'chinatown')
        return decay * 0.45;
    return decay * 0.55;
}
export function neighborsForTile(row, col, byPos) {
    const at = (r, c) => byPos.get(`${r},${c}`);
    return {
        n: at(row - 1, col),
        s: at(row + 1, col),
        e: at(row, col + 1),
        w: at(row, col - 1),
    };
}
export function subTileZoneKey(parentZoneKey, row, col) {
    return `${parentZoneKey}__${row}_${col}`;
}
export function parseSubTileGrid(zoneKey) {
    const i = zoneKey.lastIndexOf('__');
    if (i < 0)
        return null;
    const tail = zoneKey.slice(i + 2);
    const m = /^(\d+)_(\d+)$/.exec(tail);
    if (!m)
        return null;
    return { row: Number(m[1]), col: Number(m[2]) };
}
export const PLACE_TYPE_LABELS = {
    generic: 'Пусто',
    road: 'Дорога',
    bridge: 'Мост',
    crossing: 'Перекрёсток',
    house: 'Жилой дом',
    restaurant: 'Ресторан',
    shop: 'Магазин',
    secondhand: 'Секонд-хенд',
    alley: 'Переулок',
    park: 'Парк',
    plaza: 'Площадь',
    parking: 'Парковка',
    metro: 'Подземка',
    exit: 'Выход в район',
};
export const DISTRICT_STYLE_LABELS = {
    residential: 'Спальный',
    chinatown: 'Чайна-таун',
    corp_clean: 'Корп (чисто)',
    slum: 'Трущобы',
    industrial: 'Промзона',
    park_mixed: 'Парк / зелень',
};
/** Детерминированный seed для пропсов клетки. */
export function tileDecorSeed(zoneKey) {
    let h = 0;
    for (let i = 0; i < zoneKey.length; i++) {
        h = (h * 31 + zoneKey.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
}
//# sourceMappingURL=districtGrid.js.map