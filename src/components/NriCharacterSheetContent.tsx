import React, { useMemo } from 'react';
import { getNriClass, type NriClassId } from '../logic/nriClasses';
import {
  C2185_ABILITIES,
  C2185_SAVING_THROWS,
  C2185_SKILLS,
  getC2185ClassTemplate,
} from '../logic/nriCarbon2185';
import { parseNriInventory, type NriInventoryItem } from '../logic/nriInventory';
import { abilityModifier, parseNriSheet } from '../logic/nriNpcGenerator';
import { ensureCompleteSheet } from '../logic/nriCharacterGen';
import { readWonlongs } from '../logic/nriWallet';
import { parseAugmentedSheet, getBloodToxLimit } from '../logic/nriCyberInstall';
import { formatSignedMod, getSheetCombatView } from '../logic/nriSheetCombat';
import { applyEquippedToSheet, attacksFromEquippedGear } from '../logic/nriItemEquip';
import { CYBER_SLOT_LABELS, type CyberSlot } from '../logic/nriCyberware';
import {
  collectPlayerCyberEffects,
  CYBER_EFFECT_LABELS,
  hasCyberEffect,
} from '../logic/nriCyberEffects';
import { encumbranceLabel, inventoryCarriedLb, maxCarryLbFromSheet } from '../logic/nriEncumbrance';
import { sheetAutoFillSummary } from '../logic/nriSheetStatus';
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
  const completed = useMemo(
    () => ensureCompleteSheet(profile.sheet, profile.classId as NriClassId, profile.displayName),
    [profile.sheet, profile.classId, profile.displayName]
  );
  const sheet = parseNriSheet(completed);
  const effectiveSheet = sheet ? applyEquippedToSheet(sheet, inventory) : null;
  const augSheet = parseAugmentedSheet(completed);
  const augmentations = augSheet?.augmentations ?? [];
  const bloodToxCurrent = augSheet?.bloodToxCurrent ?? augmentations.reduce((s, a) => s + a.bloodTox, 0);
  const bloodToxLimit = getBloodToxLimit(augSheet);
  const combat = effectiveSheet
    ? getSheetCombatView(effectiveSheet, profile.classId as NriClassId, augmentations)
    : null;
  const gearAttacks = effectiveSheet ? attacksFromEquippedGear(effectiveSheet, inventory) : [];
  const cyberEffects = useMemo(
    () => collectPlayerCyberEffects(inventory, augmentations),
    [inventory, augmentations]
  );
  const carriedLb = useMemo(
    () => inventoryCarriedLb(inventory, augmentations),
    [inventory, augmentations]
  );
  const maxCarryLb = useMemo(() => maxCarryLbFromSheet(sheet), [sheet]);
  const encLabel = encumbranceLabel(carriedLb, maxCarryLb);
  const classFeatures = sheet?.classFeatures?.length
    ? sheet.classFeatures
    : tpl
      ? [tpl.signature, ...tpl.traits]
      : [];
  const displayAttacks =
    gearAttacks.length > 0
      ? gearAttacks.map((a) => ({
          name: a.name,
          atk: formatSignedMod(a.atkBonus),
          damage: a.damage,
        }))
      : combat?.attacks ?? [];
  const dexMod = effectiveSheet ? abilityModifier(effectiveSheet.abilities.DEX) : null;

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
          {sheetAutoFillSummary(profile.sheet, profile.classId as NriClassId)}
        </p>
      </header>

      <div className="nri-c2185-grid nri-c2185-grid--meta">
        <Field label="CHARACTER NAME" value={sheet?.characterName ?? profile.displayName} wide />
        <Field label="PLAYER NAME" value={accountUsername ? `@${accountUsername}` : undefined} />
        <Field
          label="CLASS & LEVEL"
          value={tpl ? `${tpl.carbonName} · ${sheet?.level ?? 1}` : cls?.name}
        />
        <Field label="ORIGIN" value={sheet?.origin} />
        <Field label="EXPERIENCE POINTS" value={sheet?.xp != null ? String(sheet.xp) : '0'} />
        <Field label="AGE" value={sheet?.age} />
        <Field label="CAREER" value={sheet?.career ?? sheet?.activity} />
        <Field label="YEARS SERVED" value={sheet?.yearsServed} />
        <Field label="STREET INFLUENCE" value={sheet?.streetInfluence} />
        <Field label="CORPORATE INFLUENCE" value={sheet?.corporateInfluence} />
      </div>

      <div className="nri-c2185-grid nri-c2185-grid--stats">
        {C2185_ABILITIES.map((ab) => {
          const score = effectiveSheet?.abilities?.[ab];
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
        <Field label="PROFICIENCY BONUS" value={effectiveSheet ? `+${effectiveSheet.proficiencyBonus}` : '+2'} />
        <Field label="ARMOR CLASS" value={effectiveSheet?.ac != null ? String(effectiveSheet.ac) : undefined} />
        <Field label="INITIATIVE" value={dexMod !== null ? formatSignedMod(dexMod) : undefined} />
        <Field label="SPEED" value="30 ft" />
        <Field label="HP MAX" value={sheet?.hpMax != null ? String(sheet.hpMax) : tpl?.hpAt1} />
        <Field label="HIT DICE" value={tpl ? `1${tpl.hitDie}` : undefined} />
        <Field label="HIT POINTS" value={sheet?.hp != null ? String(sheet.hp) : undefined} />
        <Field label="D/R" value={sheet?.dr} />
        <Field label="BLOOD TOX LIMIT" value={String(bloodToxLimit)} />
        <Field
          label="CURRENT BLOOD TOX"
          value={augmentations.length > 0 || bloodToxCurrent > 0 ? String(bloodToxCurrent) : '0'}
        />
        <Field label="ПОРОК" value={sheet?.vice} />
        <Field
          label="WONLONGS"
          value={
            sheet
              ? `₩${readWonlongs(sheet)}${
                  hasCyberEffect(cyberEffects, 'currency_uv') || hasCyberEffect(cyberEffects, 'vision_uv')
                    ? ' · УФ-метки видны'
                    : ''
                }`
              : undefined
          }
        />
      </div>

      <div className="nri-c2185-cols">
        <section className="nri-c2185-block">
          <h4 className="nri-c2185-block__title">SAVING THROWS</h4>
          <ul className="nri-c2185-checklist">
            {(combat?.saves ?? C2185_SAVING_THROWS.map((s) => ({ ...s, modifier: null as number | null, proficient: false }))).map(
              (s) => (
                <li key={s.id}>
                  <span className="nri-c2185-check">
                    {typeof s.modifier === 'number' ? formatSignedMod(s.modifier) : blank}
                  </span>
                  {s.label} ({s.ability})
                  {s.proficient ? ' ★' : ''}
                </li>
              )
            )}
          </ul>
        </section>

        <section className="nri-c2185-block">
          <h4 className="nri-c2185-block__title">DEATH SAVES</h4>
          <p className="mono-text nri-c2185-death">
            SUCCESSES {sheet?.deathSaveSuccesses ?? 0} · FAILURES {sheet?.deathSaveFailures ?? 0}
          </p>
        </section>
      </div>

      <section className="nri-c2185-block">
        <h4 className="nri-c2185-block__title">SKILLS</h4>
        <ul className="nri-c2185-skills">
          {(combat?.skills ?? C2185_SKILLS.map((sk) => ({ ...sk, modifier: null as number | null, proficient: false }))).map(
            (sk) => (
              <li key={sk.name}>
                <span className="nri-c2185-check">
                  {typeof sk.modifier === 'number' ? formatSignedMod(sk.modifier) : blank}
                </span>
                {sk.name} ({sk.ability})
                {sk.proficient ? ' ★' : ''}
              </li>
            )
          )}
        </ul>
      </section>

      <section className="nri-c2185-block">
        <h4 className="nri-c2185-block__title">ATTACKS</h4>
        <div className="nri-c2185-attacks">
          <span>NAME</span>
          <span>ATK</span>
          <span>DAMAGE/TYPE</span>
          {(displayAttacks.length ? displayAttacks : [{ name: blank, atk: blank, damage: blank }]).map((a, i) => (
            <React.Fragment key={`${a.name}-${i}`}>
              <span>{a.name}</span>
              <span>{a.atk}</span>
              <span>{a.damage}</span>
            </React.Fragment>
          ))}
        </div>
      </section>

      <section className="nri-c2185-block">
        <h4 className="nri-c2185-block__title">BACKSTORY</h4>
        <p className="mono-text nri-c2185-trait">{sheet?.backstory ?? blank}</p>
      </section>

      <section className="nri-c2185-block">
        <h4 className="nri-c2185-block__title">FEATURES AND TRAITS</h4>
        <ul className="nri-c2185-trait-list">
          {classFeatures.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        {sheet?.vice && (
          <p className="mono-text nri-c2185-trait">
            <strong>Порок:</strong> {sheet.vice}
          </p>
        )}
        {sheet?.notes && <p className="mono-text opacity-70">{sheet.notes}</p>}
      </section>

      <section className="nri-c2185-block">
        <h4 className="nri-c2185-block__title">PROFICIENCIES</h4>
        {tpl && (
          <ul className="nri-c2185-trait-list">
            <li>Armor: {tpl.armor}</li>
            <li>Weapons: {tpl.weapons}</li>
            <li>
              Skills (владение):{' '}
              {(sheet?.skillProficiencies ?? []).length > 0
                ? sheet!.skillProficiencies!.join(', ')
                : blank}
            </li>
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

      {cyberEffects.length > 0 && (
        <section className="nri-c2185-block">
          <h4 className="nri-c2185-block__title">CYBER ABILITIES</h4>
          <ul className="nri-c2185-trait-list">
            {cyberEffects.map((fx) => (
              <li key={fx}>{CYBER_EFFECT_LABELS[fx]}</li>
            ))}
          </ul>
        </section>
      )}

      <div className="nri-c2185-grid nri-c2185-grid--bio">
        <Field label="HEIGHT" value={sheet?.height} />
        <Field label="WEIGHT" value={sheet?.weight} />
        <Field label="SKIN" value={sheet?.skin} />
        <Field label="HAIR" value={sheet?.hair} />
        <Field label="EYES" value={sheet?.eyes} />
        <Field label="CULTURE" value={sheet?.culture} />
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
        <p className={`mono-text nri-c2185-encumbrance nri-c2185-encumbrance--${encLabel.status}`}>
          Нагрузка: <strong>{encLabel.text}</strong>
          {sheet?.weight && <span className="opacity-60"> · вес тела {sheet.weight}</span>}
        </p>
      </section>

      <section className="nri-c2185-block">
        <h4 className="nri-c2185-block__title">CHARACTER BACKSTORY · NOTES</h4>
        <p className="mono-text opacity-50">{blank}</p>
      </section>
    </div>
  );
};
