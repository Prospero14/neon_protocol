/** Diegetic «масштаб мегаполиса» — лор-поля, не симуляция населения. */
const POPULATION_LABELS = {
    under_50k: 'до 50 тыс.',
    '50k_500k': '50–500 тыс.',
    '500k_2m': '0,5–2 млн',
    megablock: 'мегаблок (1M+)',
};
const POPULATION_SHORT = {
    under_50k: '~30k',
    '50k_500k': '~180k',
    '500k_2m': '~0,9M',
    megablock: '~1,2M+',
};
export function isPopulationBand(v) {
    return v === 'under_50k' || v === '50k_500k' || v === '500k_2m' || v === 'megablock';
}
export function defaultPopulationBand(zoneType) {
    switch (zoneType) {
        case 'corp':
            return '500k_2m';
        case 'slum':
        case 'industrial':
            return '500k_2m';
        case 'mid':
            return '50k_500k';
        case 'park':
        case 'highway':
        case 'overpass':
        case 'tunnel':
            return 'under_50k';
        default:
            return '50k_500k';
    }
}
export function defaultDensityLabel(zoneType) {
    switch (zoneType) {
        case 'corp':
            return 'корп-кластер, контролируемая плотность';
        case 'slum':
            return 'перенаселённый спальный массив';
        case 'industrial':
            return 'рабочие койки и общаги';
        case 'mid':
            return 'средняя плотность, смешанная застройка';
        case 'park':
            return 'зелёный коридор';
        case 'highway':
        case 'overpass':
            return 'транзитный поток';
        default:
            return 'городская застройка';
    }
}
export function defaultTrafficLevel(zoneType) {
    switch (zoneType) {
        case 'highway':
        case 'overpass':
            return 3;
        case 'corp':
        case 'mid':
        case 'slum':
            return 2;
        case 'industrial':
            return 1;
        default:
            return 0;
    }
}
export function defaultNightlifeLevel(zoneType) {
    switch (zoneType) {
        case 'mid':
        case 'slum':
            return 2;
        case 'corp':
            return 1;
        default:
            return 0;
    }
}
export function resolveCityScale(zone) {
    return {
        populationBand: isPopulationBand(zone.populationBand) ? zone.populationBand : defaultPopulationBand(zone.zoneType),
        densityLabel: typeof zone.densityLabel === 'string' && zone.densityLabel.trim()
            ? zone.densityLabel.trim()
            : defaultDensityLabel(zone.zoneType),
        trafficLevel: typeof zone.trafficLevel === 'number' && zone.trafficLevel >= 0 && zone.trafficLevel <= 3
            ? zone.trafficLevel
            : defaultTrafficLevel(zone.zoneType),
        nightlifeLevel: typeof zone.nightlifeLevel === 'number' && zone.nightlifeLevel >= 0 && zone.nightlifeLevel <= 3
            ? zone.nightlifeLevel
            : defaultNightlifeLevel(zone.zoneType),
    };
}
export function formatPopulationBand(band) {
    return POPULATION_LABELS[band];
}
export function formatPopulationShort(band) {
    return POPULATION_SHORT[band];
}
export function formatTrafficDots(level) {
    const n = Math.max(0, Math.min(3, Math.round(level)));
    return '▮'.repeat(n) + '▯'.repeat(3 - n);
}
export function formatCityScaleLine(scale) {
    const pop = formatPopulationShort(scale.populationBand);
    const traffic = formatTrafficDots(scale.trafficLevel);
    return `население ${pop} · ${scale.densityLabel} · трафик ${traffic}`;
}
//# sourceMappingURL=cityScale.js.map