import React from 'react';
import { Dices } from 'lucide-react';
import {
  NRI_ACTIVITIES,
  NRI_ORIGINS,
  type CharacterMetaDraft,
  type NriActivityId,
  type NriOriginId,
} from '../logic/nriCharacterGen';
import { rollCharacterName, rollNickname } from '../logic/nriNames';
import { BACKSTORY_POOL_SIZE } from '../logic/nriBackstories';
import { C2185_SKILLS } from '../logic/nriCarbon2185';
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

  const originId = meta.originId ?? 'neo_tokyo';
  const activityId = meta.activityId ?? 'street';

  return (
    <div className="nri-meta-form">
      <label className="nri-meta-form__field-row">
        <span className="nri-modal__field nri-meta-form__grow">
          <span>Имя персонажа</span>
          <input
            value={meta.characterName ?? ''}
            onChange={(e) => set('characterName', e.target.value)}
            placeholder="Yuki Sato"
          />
        </span>
        <button
          type="button"
          className="nri-lobby__copy"
          title="Случайное имя по происхождению"
          onClick={() => set('characterName', rollCharacterName(originId))}
        >
          <Dices size={14} />
        </button>
      </label>
      <label className="nri-meta-form__field-row">
        <span className="nri-modal__field nri-meta-form__grow">
          <span>Кличка / позывной</span>
          <input
            value={meta.nickname ?? sheet?.nickname ?? ''}
            onChange={(e) => set('nickname', e.target.value)}
            placeholder="Тень"
          />
        </span>
        <button
          type="button"
          className="nri-lobby__copy"
          title="Кличка по деятельности"
          onClick={() => set('nickname', rollNickname(activityId))}
        >
          <Dices size={14} />
        </button>
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
        <select value={originId} onChange={(e) => set('originId', e.target.value as NriOriginId)}>
          {NRI_ORIGINS.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <label className="nri-modal__field">
        <span>Деятельность / карьера</span>
        <select value={activityId} onChange={(e) => set('activityId', e.target.value as NriActivityId)}>
          {NRI_ACTIVITIES.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </select>
      </label>
      <p className="mono-text nri-meta-form__hint opacity-60">
        В системе {C2185_SKILLS.length} навыков; класс выбирает 2 из своего пула. Биографий в генераторе: {BACKSTORY_POOL_SIZE}+.
      </p>
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
