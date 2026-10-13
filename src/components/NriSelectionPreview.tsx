import React from 'react';
import {
  ITEM_CATEGORY_LABELS,
  isInscribableCatalogItem,
  isPersonalCatalogItem,
  getCatalogItem,
  type CatalogItem,
} from '../logic/nriItemCatalog';
import { formatSignedMod } from '../logic/nriSheetCombat';
import type { NriCyberProduct } from '../logic/nriApi';
import {
  ASSEMBLY_LABELS,
  C2185_ABILITY_LABELS,
  CYBER_SLOT_LABELS,
  buildCyberImplant,
  type CyberBlueprint,
  type CyberBuildResult,
  type CyberSlot,
} from '../logic/nriCyberware';
import { CYBER_EFFECT_META, type CyberEffectId } from '../logic/nriCyberEffects';
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
  if (c.tags?.length) {
    const cyber = c.tags.filter((t) => t.startsWith('cyber:')).map((t) => t.slice(6));
    if (cyber.length) parts.push(`hooks: ${cyber.join(', ')}`);
  }
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
      {isPersonalCatalogItem(item) && (
        <p className="mono-text opacity-60">Персональный предмет: после получения не передаётся.</p>
      )}
      {isInscribableCatalogItem(item) && (
        <p className="mono-text opacity-60">Имя владельца вписывается один раз после получения.</p>
      )}
      {item.tags && item.tags.length > 0 && (
        <p className="mono-text opacity-60">Теги: {item.tags.join(', ')}</p>
      )}
    </div>
  );
};

export const NriVehicleCatalogPreview: React.FC<{ catalogId: string; compact?: boolean }> = ({
  catalogId,
  compact,
}) => {
  const v = getVehicleDef(catalogId);
  if (!v) {
    return <p className="mono-text opacity-50 nri-selection-preview">Модель не найдена.</p>;
  }
  return <VehiclePreviewBody v={v} compact={compact} />;
};

const VehiclePreviewBody: React.FC<{ v: NriVehicleDef; compact?: boolean }> = ({ v, compact }) => (
  <div className={`nri-selection-preview nri-selection-preview--vehicle${compact ? ' compact' : ''}`}>
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

function asStringArray(raw: unknown): string[] {
  return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === 'string') : [];
}

/** Старые записи в БД без effects/partLines ломали превью (.length на undefined). */
function cyberBuildFromProduct(p: NriCyberProduct): CyberBuildResult | null {
  const bpRaw = p.blueprint;
  if (bpRaw && typeof bpRaw === 'object') {
    const bp = bpRaw as Partial<CyberBlueprint>;
    if (Array.isArray(bp.partIds)) {
      const slot = (typeof bp.slot === 'string' ? bp.slot : p.slot) as CyberSlot;
      return buildCyberImplant({
        slot,
        name: typeof bp.name === 'string' && bp.name.trim() ? bp.name : p.name,
        partIds: bp.partIds.filter((id): id is string => typeof id === 'string'),
        notes: typeof bp.notes === 'string' ? bp.notes : undefined,
      });
    }
  }
  if (!p.build || typeof p.build !== 'object') return null;
  const b = p.build as Partial<CyberBuildResult> & Record<string, unknown>;
  const mods =
    b.c2185Mods && typeof b.c2185Mods === 'object' && !Array.isArray(b.c2185Mods)
      ? (b.c2185Mods as CyberBuildResult['c2185Mods'])
      : {};
  const partLines = Array.isArray(b.partLines) ? b.partLines : [];
  const totals =
    b.totals && typeof b.totals === 'object'
      ? (b.totals as CyberBuildResult['totals'])
      : {
          cpuMhz: typeof b.cpuMhz === 'number' ? b.cpuMhz : 0,
          ramGb: typeof b.ramGb === 'number' ? b.ramGb : 0,
          powerWh: typeof b.powerWh === 'number' ? b.powerWh : 0,
          powerDrawW: typeof b.powerDrawW === 'number' ? b.powerDrawW : 0,
        };
  return {
    name: typeof b.name === 'string' ? b.name : p.name,
    slot: (typeof b.slot === 'string' ? b.slot : p.slot) as CyberSlot,
    c2185Mods: mods,
    acBonus: typeof b.acBonus === 'number' ? b.acBonus : 0,
    bloodTox: typeof b.bloodTox === 'number' ? b.bloodTox : 0,
    cpuMhz: typeof b.cpuMhz === 'number' ? b.cpuMhz : totals.cpuMhz,
    ramGb: typeof b.ramGb === 'number' ? b.ramGb : totals.ramGb,
    powerWh: typeof b.powerWh === 'number' ? b.powerWh : totals.powerWh,
    powerDrawW: typeof b.powerDrawW === 'number' ? b.powerDrawW : totals.powerDrawW,
    features: asStringArray(b.features),
    effects: asStringArray(b.effects) as CyberEffectId[],
    priceWonlongs: typeof b.priceWonlongs === 'number' ? b.priceWonlongs : p.priceWonlongs,
    overload: !!b.overload,
    blocked: !!b.blocked,
    canSave: b.canSave !== false && !b.blocked,
    warnings: asStringArray(b.warnings),
    totals,
    partLines,
  };
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
          const v = build.c2185Mods?.[k];
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
          {(build.partLines?.length ?? 0) > 0 && (
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
          {(build.effects?.length ?? 0) > 0 && (
            <p className="mono-text opacity-80">
              Hooks: {build.effects.map((id) => CYBER_EFFECT_META[id]?.label ?? id).join(' · ')}
            </p>
          )}
          {(build.features?.length ?? 0) > 0 && (
            <p className="mono-text opacity-60">Фичи: {build.features.join(' · ')}</p>
          )}
          {(build.warnings?.length ?? 0) > 0 && (
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
