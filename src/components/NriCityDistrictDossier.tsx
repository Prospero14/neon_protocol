import React from 'react';
import {
  formatPopulationBand,
  formatPopulationShort,
  resolveCityScale,
  type CityScaleFields,
} from '../../shared/nri-domain/cityScale';

type Props = {
  zoneType: string;
  scale: CityScaleFields;
  megaLabel?: string | null;
  compact?: boolean;
  /** Внутри NriCityDistrictCard — без второй рамки. */
  embedded?: boolean;
};

function Meter({ label, level, max = 3, tone }: { label: string; level: number; max?: number; tone: string }) {
  const pct = Math.max(0, Math.min(100, (level / max) * 100));
  return (
    <div className="nri-district-dossier__meter">
      <span className="nri-district-dossier__meter-label">{label}</span>
      <div className="nri-district-dossier__meter-track" aria-hidden>
        <div className={`nri-district-dossier__meter-fill nri-district-dossier__meter-fill--${tone}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="nri-district-dossier__meter-val">{level}/{max}</span>
    </div>
  );
}

/** Карточка «масштаба района» — заметнее одной строки mono-text. */
export const NriCityDistrictDossier: React.FC<Props> = ({ zoneType, scale, megaLabel, compact, embedded }) => {
  const resolved = resolveCityScale({ zoneType, ...scale });
  return (
    <div
      className={`nri-district-dossier${compact ? ' nri-district-dossier--compact' : ''}${embedded ? ' nri-district-dossier--embedded' : ''}`}
    >
      {megaLabel ? <span className="nri-district-dossier__mega">{megaLabel}</span> : null}
      <div className="nri-district-dossier__hero">
        <span className="nri-district-dossier__pop">{formatPopulationShort(resolved.populationBand)}</span>
        <span className="nri-district-dossier__pop-band">{formatPopulationBand(resolved.populationBand)}</span>
      </div>
      <p className="nri-district-dossier__density">{resolved.densityLabel}</p>
      <div className="nri-district-dossier__meters">
        <Meter label="Трафик" level={resolved.trafficLevel} tone="traffic" />
        <Meter label="Ночь" level={resolved.nightlifeLevel} tone="night" />
      </div>
    </div>
  );
};
