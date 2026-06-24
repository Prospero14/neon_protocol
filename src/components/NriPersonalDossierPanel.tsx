import React, { useMemo } from 'react';
import {
  achievementsForClass,
  NRI_DRUG_CATALOG_IDS,
  type NriAchievementDef,
  type NriAchievementId,
  type NriClassId,
} from '../../shared/nri-domain/achievements';
import { getNriClass } from '../logic/nriClasses';
import type { NriPlayerDossier, NriPlayerAchievements } from '../logic/nriApi';

type Props = {
  profileName: string;
  classId: string;
  dossier: NriPlayerDossier;
  achievements: NriPlayerAchievements;
};

function progressHint(id: NriAchievementId, achievements: NriPlayerAchievements): string | null {
  const unlocked = new Set(achievements.unlocked.map((a) => a.id));
  if (unlocked.has(id)) return null;
  if (id === 'stoned_all_drugs') {
    const n = achievements.progress.drugsUsed.length;
    return `${n}/${NRI_DRUG_CATALOG_IDS.length} наркотиков`;
  }
  if (id === 'cartographer') {
    const n = achievements.progress.zonesVisited.length;
    return `${n}/5 районов`;
  }
  if (id === 'detective_trail') {
    const n = achievements.progress.zonesVisited.length;
    return `${n}/3 районов`;
  }
  if (id === 'doc_triage_master') {
    const n = achievements.progress.medConsumablesUsed.length;
    return `${n}/3 расходника`;
  }
  if (id === 'merc_patrol') {
    const n = achievements.progress.mercWeaponZones.length;
    return `${n}/3 района с оружием`;
  }
  return null;
}

export const NriPersonalDossierPanel: React.FC<Props> = ({
  profileName,
  classId,
  dossier,
  achievements,
}) => {
  const unlockedIds = new Set(achievements.unlocked.map((a) => a.id));
  const cls = getNriClass(classId);
  const catalog = useMemo(() => achievementsForClass(classId), [classId]);
  const universal = catalog.filter((a) => !a.classId);
  const classAchievements = catalog.filter((a) => a.classId);

  const renderList = (items: NriAchievementDef[]) => (
    <ul className="nri-dossier__ach-list">
      {items.map((def) => {
        const got = unlockedIds.has(def.id);
        const hint = progressHint(def.id, achievements);
        return (
          <li
            key={def.id}
            className={`nri-dossier__ach ${got ? 'nri-dossier__ach--unlocked' : 'nri-dossier__ach--locked'}`}
          >
            <span className="nri-dossier__ach-icon" aria-hidden>
              {def.icon}
            </span>
            <div>
              <strong className="nri-dossier__ach-title">{def.title}</strong>
              <p className="mono-text opacity-70 nri-dossier__ach-blurb">{def.blurb}</p>
              {!got && hint && <span className="mono-text opacity-50 nri-dossier__ach-progress">{hint}</span>}
            </div>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="nri-dossier">
      <header className="nri-chars__head">
        <h3 className="mono-text">Личное дело</h3>
        <p className="mono-text opacity-70">
          {profileName}
          {cls ? ` · ${cls.name}` : ''} · копия описания из чарника · ачивки за ролевку и действия за столом
        </p>
      </header>

      <section className="nri-dossier__sheet">
        <h4 className="mono-text nri-dossier__section-title">Описание персонажа</h4>
        <dl className="nri-dossier__fields mono-text">
          <div>
            <dt>Имя</dt>
            <dd>{dossier.characterName}</dd>
          </div>
          <div>
            <dt>Возраст</dt>
            <dd>{dossier.age}</dd>
          </div>
          <div>
            <dt>Карьера</dt>
            <dd>{dossier.career}</dd>
          </div>
          <div className="nri-dossier__field--wide">
            <dt>Одежда / образ</dt>
            <dd>{dossier.clothing}</dd>
          </div>
          <div className="nri-dossier__field--wide">
            <dt>Бэкстори</dt>
            <dd className="nri-dossier__backstory">{dossier.backstory}</dd>
          </div>
        </dl>
        <p className="mono-text opacity-50 nri-dossier__readonly">
          Редактируется на листе персонажа или мастером — здесь только копия для игрока.
        </p>
      </section>

      <section className="nri-dossier__achievements">
        <h4 className="mono-text nri-dossier__section-title">
          Общие · {achievements.unlocked.filter((a) => !a.classId).length}/{universal.length}
        </h4>
        {renderList(universal)}
      </section>

      {classAchievements.length > 0 && (
        <section className="nri-dossier__achievements">
          <h4 className="mono-text nri-dossier__section-title">
            Класс {cls?.name ?? classId} ·{' '}
            {achievements.unlocked.filter((a) => a.classId === (classId as NriClassId)).length}/
            {classAchievements.length}
          </h4>
          {renderList(classAchievements)}
        </section>
      )}
    </div>
  );
};
