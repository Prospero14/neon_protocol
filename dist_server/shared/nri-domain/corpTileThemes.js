/** Палитры корпораций для HQ / корпусов / annex на карте квартала. */
const THEMES = {
    arasaka: {
        id: 'arasaka',
        primary: '#0c080c',
        secondary: '#181014',
        accent: '#c41e3a',
        glow: '#ff3a5a',
        label: 'Arasaka',
        abbrev: 'ARA',
    },
    militech: {
        id: 'militech',
        primary: '#0a0e10',
        secondary: '#12181c',
        accent: '#2a7a4a',
        glow: '#4dff8a',
        label: 'Militech',
        abbrev: 'MIL',
    },
    'kang tao': {
        id: 'kang_tao',
        primary: '#0c0a0e',
        secondary: '#161218',
        accent: '#c9a227',
        glow: '#ffe066',
        label: 'Kang Tao',
        abbrev: 'KT',
    },
    biotechnica: {
        id: 'biotechnica',
        primary: '#080e0c',
        secondary: '#101814',
        accent: '#2a9a6a',
        glow: '#5cffb0',
        label: 'Biotechnica',
        abbrev: 'BIO',
    },
    'trauma team': {
        id: 'trauma_team',
        primary: '#0e0a0a',
        secondary: '#181010',
        accent: '#e02020',
        glow: '#ff6666',
        label: 'Trauma Team',
        abbrev: 'TT',
    },
    netwatch: {
        id: 'netwatch',
        primary: '#080c12',
        secondary: '#101820',
        accent: '#2a6aaa',
        glow: '#4dc8ff',
        label: 'NetWatch',
        abbrev: 'NW',
    },
    zetatech: {
        id: 'zetatech',
        primary: '#0a0c10',
        secondary: '#12161e',
        accent: '#6a4aaa',
        glow: '#b48cff',
        label: 'Zetatech',
        abbrev: 'ZETA',
    },
    'orbital air': {
        id: 'orbital_air',
        primary: '#080c10',
        secondary: '#101820',
        accent: '#3a8aaa',
        glow: '#7ae0ff',
        label: 'Orbital Air',
        abbrev: 'OA',
    },
    sovoil: {
        id: 'sovoil',
        primary: '#0c0a08',
        secondary: '#16120e',
        accent: '#c87820',
        glow: '#ffb040',
        label: 'SovOil',
        abbrev: 'SOV',
    },
    ebm: {
        id: 'ebm',
        primary: '#080a0c',
        secondary: '#101418',
        accent: '#4a90b0',
        glow: '#80d0f0',
        label: 'EBM',
        abbrev: 'EBM',
    },
};
const FALLBACK = {
    id: 'default',
    primary: '#0a0e14',
    secondary: '#121820',
    accent: '#5a8aaa',
    glow: '#7ec8e8',
    label: 'Corp',
    abbrev: 'CORP',
};
export function corpTileTheme(corpName) {
    if (!corpName || !corpName.trim())
        return FALLBACK;
    const key = corpName.trim().toLowerCase();
    return THEMES[key] ?? FALLBACK;
}
export const KNOWN_CORP_NAMES = Object.values(THEMES).map((t) => t.label);
//# sourceMappingURL=corpTileThemes.js.map