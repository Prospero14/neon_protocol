import React from 'react';
import { getNriClass } from '../logic/nriClasses';
import {
  C2185_ABILITIES,
  C2185_SAVING_THROWS,
  C2185_SKILLS,
  getC2185ClassTemplate,
} from '../logic/nriCarbon2185';
import { parseNriInventory, type NriInventoryItem } from '../logic/nriInventory';
import { abilityModifier, parseNriSheet } from '../logic/nriNpcGenerator';
import { parseAugmentedSheet, getBloodToxLimit } from '../logic/nriCyberInstall';
import { CYBER_SLOT_LABELS, type CyberSlot } from '../logic/nriCyberware';
import type { NriPlayerProfile } from '../logic/nriApi';

type Props = {
  profile: NriPlayerProfile;
  accountUsername?: string;
  compact?: boolean;
};

const blank = '—';

const Field: React.FC<{ label: string; value?: string; wide?: boolean }> = ({ label, value, wide }) => (
  <div className={`nri-c2185-field ${wide ? 'nri-c2185-field--wide' : ''}`}>
    <span className="nri-c2185-field__label">{label}</span>
    <span className="nri-c2185-field__val">{value || blank}</span>
  </div>
);

export const NriCharacterSheetContent: React.FC<Props> = ({ profile, accountUsername, compact }) => {
  const cls = getNriClass(profile.classId);
  const tpl = getC2185ClassTemplate(profile.classId);
  const inventory: NriInventoryItem[] = parseNriInventory(profile.inventory);
  const sheet = parseNriSheet(profile.sheet);
  const augSheet = parseAugmentedSheet(profile.sheet);
  const augmentations = augSheet?.augmentations ?? [];
  const bloodToxCurrent = augSheet?.bloodToxCurrent ?? augmentations.reduce((s, a) => s + a.bloodTox, 0);
  const bloodToxLimit = getBloodToxLimit(augSheet);

  if (compact) {
    return (
      <div className="nri-sheet-content nri-sheet-content--compact">
        <p className="nri-modal__hero">{profile.displayName}</p>
        {accountUsername && (
          <p className="mono-text nri-sheet-content__account">@{accountUsername}</p>
        )}
        <p className="mono-text">
          {cls?.name ?? profile.classId}
          {tpl ? ` · ${tpl.carbonName} · HD ${tpl.hitDie}` : ''}
        </p>
        {tpl && <p className="mono-text opacity-70">{tpl.signature}</p>}
        {inventory.length > 0 && (
          <ul className="nri-sheet-inventory__list">
            {inventory.map((item) => (
              <li key={item.id}>
                <strong>{item.name}</strong>
                {item.qty && item.qty > 1 ? ` ×${item.qty}` : ''}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="nri-sheet-content nri-c2185-sheet">
      <header className="nri-c2185-sheet__head">
        {profile.portraitUrl && (
          <img src={profile.portraitUrl} alt="" className="nri-c2185-sheet__portrait" />
        )}
        <span className="nri-c2185-sheet__brand">CARBON 2185 · CHARACTER SHEET</span>
        <p className="nri-c2185-sheet__note mono-text">
          Шаблон по листу из правил — заполните на столе. Класс: {cls?.name ?? profile.classId}
          {tpl ? ` (${tpl.carbonName})` : ''}.
        </p>
      </header>

      <div className="nri-c2185-grid nri-c2185-grid--meta">
        <Field label="CHARACTER NAME" value={profile.displayName} wide />
        <Field label="PLAYER NAME" value={accountUsername ? `@${accountUsername}` : undefined} />
        <Field label="CLASS & LEVEL" value={tpl ? `${tpl.carbonName} · ${sheet?.level ?? 1}` : cls?.name} />
        <Field label="ORIGIN" />
        <Field label="EXPERIENCE POINTS" value="0" />
        <Field label="AGE" />
        <Field label="CAREER" />
        <Field label="YEARS SERVED" />
        <Field label="STREET INFLUENCE" />
        <Field label="CORPORATE INFLUENCE" />
      </div>

      <div className="nri-c2185-grid nri-c2185-grid--stats">
        {C2185_ABILITIES.map((ab) => {
          const score = sheet?.abilities?.[ab];
          const mod = typeof score === 'number' ? abilityModifier(score) : null;
          return (
            <div key={ab} className="nri-c2185-stat">
              <span className="nri-c2185-stat__ab">{ab}</span>
              <span className="nri-c2185-stat__score">{score ?? blank}</span>
              <span className="nri-c2185-stat__mod">
                {mod !== null ? (mod >= 0 ? `+${mod}` : String(mod)) : blank}
              </span>
            </div>
          );
        })}
      </div>

      <div className="nri-c2185-grid nri-c2185-grid--combat">
        <Field label="PROFICIENCY BONUS" value={sheet ? `+${sheet.proficiencyBonus}` : '+2'} />
        <Field label="ARMOR CLASS" value={sheet?.ac != null ? String(sheet.ac) : undefined} />
        <Field label="INITIATIVE" />
        <Field label="SPEED" value="30 ft" />
        <Field label="HP MAX" value={sheet?.hpMax != null ? String(sheet.hpMax) : tpl?.hpAt1} />
        <Field label="HIT DICE" value={tpl ? `1${tpl.hitDie}` : undefined} />
        <Field label="HIT POINTS" value={sheet?.hp != null ? String(sheet.hp) : undefined} />
        <Field label="D/R" />
        <Field label="BLOOD TOX LIMIT" value={String(bloodToxLimit)} />
        <Field
          label="CURRENT BLOOD TOX"
          value={augmentations.length > 0 ? String(bloodToxCurrent) : undefined}
        />
        <Field label="VICE" />
        <Field label="WONLONGS" />
      </div>

      <div className="nri-c2185-cols">
        <section className="nri-c2185-block">
          <h4 className="nri-c2185-block__title">SAVING THROWS</h4>
          <ul className="nri-c2185-checklist">
            {C2185_SAVING_THROWS.map((s) => (
              <li key={s.id}>
                <span className="nri-c2185-check">{blank}</span>
                {s.label} ({s.ability})
                {tpl?.saveProficiencies.includes(s.label) ? ' ★' : ''}
              </li>
            ))}
          </ul>
        </section>

        <section className="nri-c2185-block">
          <h4 className="nri-c2185-block__title">DEATH SAVES</h4>
          <p className="mono-text nri-c2185-death">
            SUCCESSES {blank} · FAILURES {blank}
          </p>
        </section>
      </div>

      <section className="nri-c2185-block">
        <h4 className="nri-c2185-block__title">SKILLS</h4>
        <ul className="nri-c2185-skills">
          {C2185_SKILLS.map((sk) => (
            <li key={sk.name}>
              <span className="nri-c2185-check">{blank}</span>
              {sk.name} ({sk.ability})
            </li>
          ))}
        </ul>
      </section>

      <section className="nri-c2185-block">
        <h4 className="nri-c2185-block__title">ATTACKS</h4>
        <div className="nri-c2185-attacks">
          <span>NAME</span>
          <span>ATK</span>
          <span>DAMAGE/TYPE</span>
          {[0, 1, 2].map((i) => (
            <React.Fragment key={i}>
              <span>{blank}</span>
              <span>{blank}</span>
              <span>{blank}</span>
            </React.Fragment>
          ))}
        </div>
      </section>

      <section className="nri-c2185-block">
        <h4 className="nri-c2185-block__title">FEATURES AND TRAITS</h4>
        {tpl && (
          <>
            <p className="mono-text nri-c2185-trait">{tpl.signature}</p>
            <ul className="nri-c2185-trait-list">
              {tpl.traits.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </>
        )}
        <p className="mono-text opacity-50">Доп. черты — заполнить на столе.</p>
      </section>

      <section className="nri-c2185-block">
        <h4 className="nri-c2185-block__title">PROFICIENCIES</h4>
        {tpl && (
          <ul className="nri-c2185-trait-list">
            <li>Armor: {tpl.armor}</li>
            <li>Weapons: {tpl.weapons}</li>
            <li>Skills: {tpl.skillsPick}</li>
            <li>Saves: {tpl.saveProficiencies.join(', ') || blank}</li>
          </ul>
        )}
      </section>

      <section className="nri-c2185-block">
        <h4 className="nri-c2185-block__title">AUGMENTATIONS</h4>
        {augmentations.length === 0 ? (
          <p className="mono-text opacity-50">Нет установленных имплантов.</p>
        ) : (
          <ul className="nri-sheet-inventory__list">
            {augmentations.map((a) => (
              <li key={a.itemId}>
                <strong>{a.name}</strong>
                <span className="mono-text opacity-70">
                  {' '}
                  · {CYBER_SLOT_LABELS[a.slot as CyberSlot] ?? a.slot} · BT {a.bloodTox}
                </span>
                {a.blurb && <span className="mono-text opacity-60"> — {a.blurb}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="nri-c2185-grid nri-c2185-grid--bio">
        <Field label="HEIGHT" />
        <Field label="WEIGHT" />
        <Field label="SKIN" />
        <Field label="HAIR" />
        <Field label="EYES" />
        <Field label="CULTURE" />
      </div>

      <section className="nri-c2185-block">
        <h4 className="nri-c2185-block__title">EQUIPMENT</h4>
        <div className="nri-sheet-inventory">
          {inventory.length === 0 ? (
            <p className="mono-text opacity-50">Пусто — предметы от мастера появятся здесь.</p>
          ) : (
            <ul className="nri-sheet-inventory__list">
              {inventory.map((item) => (
                <li key={item.id}>
                  <strong>{item.name}</strong>
                  {item.qty && item.qty > 1 ? ` ×${item.qty}` : ''}
                  {item.blurb && <span className="mono-text opacity-70"> — {item.blurb}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
        <p className="mono-text opacity-50">
          Encumbered / Heavily encumbered / Max carry — заполнить по весу.
        </p>
      </section>

      <section className="nri-c2185-block">
        <h4 className="nri-c2185-block__title">CHARACTER BACKSTORY · NOTES</h4>
        <p className="mono-text opacity-50">{blank}</p>
      </section>
    </div>
  );
};
