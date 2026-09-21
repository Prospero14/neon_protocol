/** Derived underhive frames + corp underground mirrors from city top zones. */
import { corpTileTheme } from './corpTileThemes.js';
const SKIP_TYPES = new Set(['highway', 'overpass', 'tunnel']);
export function deriveUnderhiveDistrictFrames(zones) {
    return zones
        .filter((z) => !z.parentZoneKey && !SKIP_TYPES.has(z.zoneType) && z.zoneType !== 'corp')
        .map((z) => ({
        zoneKey: z.zoneKey,
        name: z.name,
        zoneType: z.zoneType,
        x: z.x,
        y: z.y,
        w: z.w,
        h: z.h,
        color: z.color ?? null,
    }));
}
/** Corp HQ / campus tiles mirrored into underhive as corporate undergrounds. */
export function deriveCorpUndergrounds(zones) {
    return zones
        .filter((z) => !z.parentZoneKey && z.zoneType === 'corp')
        .map((z) => {
        const corpName = z.corpName?.trim() || null;
        const theme = corpTileTheme(corpName || z.name);
        return {
            sourceZoneKey: z.zoneKey,
            corpName,
            name: `${theme.label} · подземелья`,
            zoneType: 'corp_underground',
            x: z.x,
            y: z.y,
            w: z.w,
            h: z.h,
            theme,
        };
    });
}
//# sourceMappingURL=underhiveDerive.js.map