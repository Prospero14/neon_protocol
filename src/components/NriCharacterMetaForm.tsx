import React from 'react';
import {
  NRI_ACTIVITIES,
  NRI_ORIGINS,
  type CharacterMetaDraft,
  type NriActivityId,
  type NriOriginId,
} from '../logic/nriCharacterGen';
import type { NriSheetData } from '../logic/nriNpcGenerator';

type Props = {
  meta: CharacterMetaDraft;
  onChange: (next: CharacterMetaDraft) => void;
  sheet?: NriSheetData | null;
  showBackstory?: boolean;
};

export const NriCharacterMetaForm: React.FC<Props> = ({ meta, onChange, sheet, showBackstory = true }) => {
  const set = <K extends keyof CharacterMetaDraft>(key: K, value: CharacterMetaDraft[K]) => {
    onChange({ ...meta, [key]: value });
  };

  return (
    <div className="nri-meta-form">
      <label className="nri-modal__field">
        <span>Имя персонажа</span>
        <input
          value={meta.characterName ?? ''}
          onChange={(e) => set('characterName', e.target.value)}
          placeholder="Jackie Chow"
        />
      </label>
      <div className="nri-meta-form__row">
        <label className="nri-modal__field">
          <span>Уровень</span>
          <input
            type="number"
            min={1}
            max={20}
            value={meta.level ?? sheet?.level ?? 1}
            onChange={(e) => set('level', Number(e.target.value) || 1)}
          />
        </label>
        <label className="nri-modal__field">
          <span>Возраст</span>
          <input value={meta.age ?? sheet?.age ?? ''} onChange={(e) => set('age', e.target.value)} />
        </label>
      </div>
      <label className="nri-modal__field">
        <span>Происхождение</span>
        <select
          value={meta.originId ?? 'neo_tokyo'}
          onChange={(e) => set('originId', e.target.value as NriOriginId)}
        >
          {NRI_ORIGINS.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <label className="nri-modal__field">
        <span>Деятельность / карьера</span>
        <select
          value={meta.activityId ?? 'street'}
          onChange={(e) => set('activityId', e.target.value as NriActivityId)}
        >
          {NRI_ACTIVITIES.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </select>
      </label>
      <label className="nri-modal__field">
        <span>Карьера (текст)</span>
        <input value={meta.career ?? sheet?.career ?? ''} onChange={(e) => set('career', e.target.value)} />
      </label>
      <div className="nri-meta-form__row">
        <label className="nri-modal__field">
          <span>Годы службы</span>
          <input
            value={meta.yearsServed ?? sheet?.yearsServed ?? ''}
            onChange={(e) => set('yearsServed', e.target.value)}
          />
        </label>
        <label className="nri-modal__field">
          <span>Уличное влияние</span>
          <input
            value={meta.streetInfluence ?? sheet?.streetInfluence ?? ''}
            onChange={(e) => set('streetInfluence', e.target.value)}
          />
        </label>
        <label className="nri-modal__field">
          <span>Корп. влияние</span>
          <input
            value={meta.corporateInfluence ?? sheet?.corporateInfluence ?? ''}
            onChange={(e) => set('corporateInfluence', e.target.value)}
          />
        </label>
      </div>
      {showBackstory && (
        <label className="nri-modal__field">
          <span>Бэкстори</span>
          <textarea
            rows={4}
            value={meta.backstory ?? sheet?.backstory ?? ''}
            onChange={(e) => set('backstory', e.target.value)}
          />
        </label>
      )}
    </div>
  );
};
