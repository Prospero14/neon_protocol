import React from 'react';
import {
  ITEM_CATEGORY_LABELS,
  getCatalogItem,
  type CatalogItem,
} from '../logic/nriItemCatalog';
import { formatSignedMod } from '../logic/nriSheetCombat';
import type { NriCyberProduct } from '../logic/nriApi';
import {
  ASSEMBLY_LABELS,
  C2185_ABILITY_LABELS,
  CYBER_SLOT_LABELS,
  type CyberBuildResult,
  type CyberSlot,
} from '../logic/nriCyberware';
import { getVehicleDef, type NriVehicleDef } from '../logic/nriVehicles';

function catalogModsLine(c: CatalogItem): string {
  const parts: string[] = [];
  if (c.c2185Mods) {
    for (const [k, v] of Object.entries(c.c2185Mods)) {
      if (typeof v === 'number') parts.push(`${k} ${formatSignedMod(v)}`);
    }
  }
  if (typeof c.acBonus === 'number') parts.push(`AC +${c.acBonus}`);
  if (c.attack) parts.push(`${c.attack.damageDice} ${c.attack.damageType} (${c.attack.ability})`);
  return parts.join(' · ') || 'без боевых бонусов';
}

export const NriCatalogItemPreview: React.FC<{ catalogId: string }> = ({ catalogId }) => {
  const item = getCatalogItem(catalogId);
  if (!item) {
    return <p className="mono-text opacity-50 nri-selection-preview">Предмет не найден в каталоге.</p>;
  }
  return (
    <div className="nri-selection-preview nri-selection-preview--item">
      <h4 className="mono-text">{item.name}</h4>
      <p className="mono-text opacity-70">
        {ITEM_CATEGORY_LABELS[item.category]} · слот {item.slot}
        {item.priceWonlongs != null && ` · ₩${item.priceWonlongs}`}
      </p>
      <p className="mono-text">{item.blurb}</p>
      <p className="mono-text nri-selection-preview__stats">{catalogModsLine(item)}</p>
      {item.tags && item.tags.length > 0 && (
        <p className="mono-text opacity-60">Теги: {item.tags.join(', ')}</p>
      )}
    </div>
  );
};

export const NriVehicleCatalogPreview: React.FC<{ catalogId: string }> = ({ catalogId }) => {
  const v = getVehicleDef(catalogId);
  if (!v) {
    return <p className="mono-text opacity-50 nri-selection-preview">Модель не найдена.</p>;
  }
  return <VehiclePreviewBody v={v} />;
};

const VehiclePreviewBody: React.FC<{ v: NriVehicleDef }> = ({ v }) => (
  <div className="nri-selection-preview nri-selection-preview--vehicle">
    <h4 className="mono-text">{v.name}</h4>
    <p className="mono-text opacity-70">
      {v.type} · навык {v.skill}
    </p>
    <ul className="nri-selection-preview__grid mono-text">
      <li>Body <strong>{v.body}</strong></li>
      <li>Speed <strong>{v.speed}</strong></li>
      <li>AC <strong>{v.ac}</strong></li>
      <li>Мест <strong>{v.seats}</strong></li>
      <li>Груз <strong>{v.cargoLb} lb</strong></li>
    </ul>
    {v.blurb && <p className="mono-text opacity-60">{v.blurb}</p>}
  </div>
);

function cyberBuildFromProduct(p: NriCyberProduct): CyberBuildResult | null {
  if (!p.build || typeof p.build !== 'object') return null;
  return p.build as CyberBuildResult;
}

export const NriCyberProductPreview: React.FC<{ product: NriCyberProduct; compact?: boolean }> = ({
  product,
  compact,
}) => {
  const build = cyberBuildFromProduct(product);
  const slot = product.slot as CyberSlot;
  const modLine = build
    ? (['STR', 'DEX', 'CON', 'INT', 'TEC', 'PEO'] as const)
        .map((k) => {
          const v = build.c2185Mods[k];
          if (!v) return null;
          return `${C2185_ABILITY_LABELS[k]} ${v >= 0 ? '+' : ''}${v}`;
        })
        .filter(Boolean)
        .join(' · ')
    : '';

  return (
    <div className={`nri-selection-preview nri-selection-preview--cyber ${compact ? 'compact' : ''}`}>
      <h4 className="mono-text">{product.name}</h4>
      <p className="mono-text opacity-70">
        {CYBER_SLOT_LABELS[slot] ?? product.slot}
        {build && ` · BT ${build.bloodTox}`}
        {product.priceWonlongs > 0 && ` · ₩${product.priceWonlongs}`}
        {build?.overload && ' · перегруз'}
        {build?.blocked && ' · ошибка сборки'}
      </p>
      {build && (
        <>
          <p className="mono-text nri-selection-preview__stats">{modLine || '— без модов характеристик'}</p>
          <ul className="nri-selection-preview__grid mono-text">
            <li>
              {ASSEMBLY_LABELS.cpuMhz} <strong>{build.cpuMhz}</strong>
            </li>
            <li>
              {ASSEMBLY_LABELS.ramGb} <strong>{build.ramGb}</strong>
            </li>
            <li>
              {ASSEMBLY_LABELS.powerWh} <strong>{build.powerWh}</strong>
            </li>
            <li>
              {ASSEMBLY_LABELS.powerDrawW} <strong>{build.powerDrawW}</strong>
            </li>
          </ul>
          {build.partLines.length > 0 && (
            <ul className="mono-text opacity-70 nri-selection-preview__parts">
              {build.partLines.map((line) => (
                <li key={line.partId}>
                  {line.partName}
                  {line.powerWh > 0 && ` · +${line.powerWh} Вт·ч`}
                  {line.powerDrawW > 0 && ` · ${line.powerDrawW} Вт`}
                </li>
              ))}
            </ul>
          )}
          {build.features.length > 0 && (
            <p className="mono-text opacity-60">Эффекты: {build.features.join(' · ')}</p>
          )}
          {build.warnings.length > 0 && (
            <ul className="nri-selection-preview__warnings mono-text">
              {build.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
};
