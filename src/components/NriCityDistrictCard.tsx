import React from 'react';
import { DISTRICT_TYPE_LABELS, type NeonCityDistrictType } from '../logic/nriNeonCityMap';
import type { NriMapZone } from '../logic/nriApi';
import { NriCityDistrictDossier } from './NriCityDistrictDossier';

type Props = {
  zone: NriMapZone;
  megaLabel?: string | null;
  selected?: boolean;
  drillLabel?: string | null;
  onDrill?: () => void;
  children?: React.ReactNode;
};

/** Карточка района на обзорной карте — имя, тип, POI и блок населения/трафика. */
export const NriCityDistrictCard: React.FC<Props> = ({
  zone,
  megaLabel,
  selected,
  drillLabel,
  onDrill,
  children,
}) => {
  const typeLabel = DISTRICT_TYPE_LABELS[zone.zoneType as NeonCityDistrictType] ?? zone.zoneType;
  return (
    <article className={`nri-district-card${selected ? ' nri-district-card--selected' : ''}`}>
      <header className="nri-district-card__head">
        {selected ? <span className="nri-district-card__tag">выбран</span> : null}
        {megaLabel ? <span className="nri-district-card__mega">{megaLabel}</span> : null}
        <h3 className="nri-district-card__title">{zone.name}</h3>
        <p className="nri-district-card__meta mono-text">
          {typeLabel}
          {zone.corpName ? ` · ${zone.corpName}` : ''}
          {zone.locked ? ' · доступ только корпам' : ''}
        </p>
        {zone.pois?.length ? (
          <p className="nri-district-card__pois mono-text">{zone.pois.join(' · ')}</p>
        ) : null}
      </header>
      <NriCityDistrictDossier zoneType={zone.zoneType} scale={zone} megaLabel={null} embedded />
      {drillLabel && onDrill ? (
        <button type="button" className="nri-modal__submit nri-district-card__drill" onClick={onDrill}>
          {drillLabel}
        </button>
      ) : null}
      {children}
    </article>
  );
};
