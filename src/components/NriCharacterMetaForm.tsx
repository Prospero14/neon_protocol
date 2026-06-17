import React from 'react';
import { Dices } from 'lucide-react';
import {
  NRI_ACTIVITIES,
  NRI_ORIGINS,
  archetypeForClass,
  type CharacterMetaDraft,
  type NriActivityId,
  type NriOriginId,
} from '../logic/nriCharacterGen';
import { rollCareer } from '../logic/nriCareers';
import { generateRichBackstory } from '../logic/nriBackstories';
import { generateRichClothing } from '../logic/nriClothing';
import { rollCharacterName, rollNickname } from '../logic/nriNames';
import type { NriClassId } from '../logic/nriClasses';
import type { NriSheetData } from '../logic/nriNpcGenerator';
import type { NriFaction } from '../logic/nriLore';

type Props = {
  meta: CharacterMetaDraft;
  onChange: (next: CharacterMetaDraft) => void;
  sheet?: NriSheetData | null;
  showBackstory?: boolean;
  classId?: NriClassId;
  factions?: NriFaction[];
};

export const NriCharacterMetaForm: React.FC<Props> = ({
  meta,
  onChange,
  sheet,
  showBackstory = true,
  classId,
  factions = [],
}) => {
  const set = <K extends keyof CharacterMetaDraft>(key: K, value: CharacterMetaDraft[K]) => {
    onChange({ ...meta, [key]: value });
  };

  const originId = meta.originId ?? 'neo_tokyo';
  const activityId = meta.activityId ?? 'street';

  const rollBackstory = () => {
    if (!classId) return;
    const arch = meta.npcArchetypeId ?? archetypeForClass(classId);
    const name = (meta.characterName ?? sheet?.characterName ?? '').trim() || 'Без имени';
    const career =
      (meta.career ?? sheet?.career)?.trim() ||
      rollCareer({ classId, activityId, archetypeId: arch });
    const text = generateRichBackstory({
      name,
      nickname: meta.nickname ?? sheet?.nickname,
      originId,
      activityId,
      archetypeId: arch,
      classId,
      career,
    });
    set('backstory', text);
    if (!meta.career?.trim() && !sheet?.career?.trim()) {
      set('career', career);
    }
  };

  const rollClothing = () => {
    if (!classId) return;
    const text = generateRichClothing({
      originId,
      activityId,
      archetypeId: meta.npcArchetypeId ?? archetypeForClass(classId),
      classId,
    });
    set('clothing', text);
  };

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
          onClick={() =>
            set(
              'nickname',
              rollNickname({
                activityId,
                classId,
                archetypeId: meta.npcArchetypeId ?? (classId ? archetypeForClass(classId) : undefined),
              })
            )
          }
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
      <label className="nri-modal__field">
        <span>Фракция</span>
        <select
          value={meta.factionId ?? sheet?.factionId ?? ''}
          onChange={(e) => set('factionId', e.target.value || null)}
        >
          <option value="">— без фракции —</option>
          {factions.map((f) => (
            <option key={f.id} value={f.id}>
              {f.displayName || f.name}
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
        <label className="nri-meta-form__field-row nri-meta-form__field-row--top">
          <span className="nri-modal__field nri-meta-form__grow">
            <span>Бэкстори</span>
            <textarea
              rows={4}
              value={meta.backstory ?? sheet?.backstory ?? ''}
              onChange={(e) => set('backstory', e.target.value)}
            />
          </span>
          <button
            type="button"
            className="nri-lobby__copy"
            title="Сгенерировать бэкстори по происхождению, деятельности и классу"
            disabled={!classId}
            onClick={rollBackstory}
          >
            <Dices size={14} />
          </button>
        </label>
      )}
      <label className="nri-meta-form__field-row nri-meta-form__field-row--top">
        <span className="nri-modal__field nri-meta-form__grow">
          <span>Одежда</span>
          <textarea
            rows={3}
            value={meta.clothing ?? sheet?.clothing ?? ''}
            onChange={(e) => set('clothing', e.target.value)}
            placeholder="Силуэт, слои, детали…"
          />
        </span>
        <button
          type="button"
          className="nri-lobby__copy"
          title="Сгенерировать описание одежды по происхождению, деятельности и архетипу"
          disabled={!classId}
          onClick={rollClothing}
        >
          <Dices size={14} />
        </button>
      </label>
    </div>
  );
};
