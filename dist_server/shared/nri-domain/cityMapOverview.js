/** Силуэт района на обзорной карте — несколько «пиков», без мелкой сетки. */
/** Подписи на обзорной карте — по словам, без рваного split по символам. */
export function overviewLabelLines(name, zoneType, corpName) {
    if (zoneType === 'corp') {
        const label = corpName || name;
        const parts = label.split(/\s+/).filter(Boolean);
        return parts.length > 1 ? [parts[0], parts.slice(1).join(' ')] : [label];
    }
    if (['park', 'mid', 'slum', 'industrial'].includes(zoneType)) {
        const words = name.split(/\s+/).filter(Boolean);
        if (words.length <= 2)
            return [name];
        const mid = Math.ceil(words.length / 2);
        return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
    }
    if (name.length > 14) {
        const words = name.split(/\s+/).filter(Boolean);
        if (words.length > 1) {
            const mid = Math.ceil(words.length / 2);
            return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
        }
    }
    return [name];
}
export function computeDistrictPeaks(zoneKey, zoneType, zx, zy, zw, zh) {
    if (['highway', 'overpass', 'tunnel'].includes(zoneType))
        return [];
    if (zw < 6 || zh < 4)
        return [];
    const baseY = zy + zh * 0.92;
    const floor = zh * (zoneType === 'corp' ? 0.35 : zoneType === 'park' ? 0.2 : 0.28);
    if (zoneType === 'corp' || zw < 18) {
        const h = floor * 0.9;
        return [{ x: zx + zw * 0.05, y: baseY - h, w: zw * 0.9, h }];
    }
    let hash = 0;
    for (let i = 0; i < zoneKey.length; i++)
        hash = (hash * 31 + zoneKey.charCodeAt(i)) | 0;
    const count = zoneType === 'industrial' ? 3 : zoneType === 'park' ? 2 : 3;
    const peaks = [];
    for (let i = 0; i < count; i++) {
        const seed = (hash + i * 53) | 0;
        const slotW = zw / count;
        const w = slotW * (0.5 + (Math.abs(seed) % 28) / 100);
        const h = floor * (0.55 + (Math.abs(seed >> 4) % 45) / 100);
        peaks.push({
            x: zx + slotW * i + (slotW - w) / 2 + (slotW * 0.08 * (i % 2 === 0 ? 1 : -1)),
            y: baseY - h,
            w,
            h,
        });
    }
    return peaks;
}
/** Цвет неоновой обводки по типу района. */
export function districtNeonStroke(zoneType) {
    switch (zoneType) {
        case 'corp':
            return 'rgba(210, 120, 255, 0.75)';
        case 'slum':
            return 'rgba(255, 90, 120, 0.65)';
        case 'industrial':
            return 'rgba(255, 180, 70, 0.6)';
        case 'park':
            return 'rgba(90, 230, 140, 0.55)';
        case 'highway':
            return 'rgba(255, 210, 90, 0.7)';
        case 'overpass':
            return 'rgba(180, 190, 220, 0.55)';
        default:
            return 'rgba(110, 180, 255, 0.6)';
    }
}
export function districtPlateFill(zoneType) {
    switch (zoneType) {
        case 'highway':
            return 'rgba(16, 14, 12, 0.92)';
        case 'overpass':
            return 'rgba(14, 14, 20, 0.9)';
        case 'corp':
            return 'rgba(10, 6, 18, 0.88)';
        case 'slum':
            return 'rgba(16, 6, 10, 0.86)';
        case 'industrial':
            return 'rgba(14, 10, 6, 0.86)';
        case 'park':
            return 'rgba(6, 16, 10, 0.82)';
        default:
            return 'rgba(8, 12, 22, 0.86)';
    }
}
//# sourceMappingURL=cityMapOverview.js.map