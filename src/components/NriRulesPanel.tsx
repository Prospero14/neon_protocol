import React, { useState } from 'react';
import { C2185_RULES } from '../logic/nriCarbon2185';
import {
  C2185_CLASS_GUIDES,
  C2185_ENVIRONMENT_RULES,
} from '../logic/nriCarbon2185RulesExtended';
import {
  C2185_COMBAT_RULES,
  C2185_CYBERPSYCHOSIS_RULES,
  C2185_ECONOMY_RULES,
  C2185_LIFE_RULES,
} from '../logic/nriCarbon2185RulesLifeEconomyCombat';

type Props = { onClose: () => void };

type TabId = 'core' | 'life' | 'economy' | 'combat' | 'cyberpsychosis' | 'environment' | 'classes';

const TABS: { id: TabId; label: string; hint: string }[] = [
  { id: 'core', label: 'Основное', hint: 'Характеристики, броски, лист' },
  { id: 'life', label: 'Жизнь', hint: 'стр. 100–108 рульника' },
  { id: 'economy', label: 'Экономика', hint: 'стр. 110–115' },
  { id: 'combat', label: 'Бой', hint: 'стр. 116–126' },
  { id: 'cyberpsychosis', label: 'Киберпсихоз', hint: 'Blood Tox, стр. 87' },
  { id: 'environment', label: 'Среда', hint: 'стр. 133+ рульника' },
  { id: 'classes', label: 'Классы', hint: 'стр. 27+ рульника' },
];

const TAB_INTROS: Record<TabId, string> = {
  core:
    'Базовая механика Carbon 2185: что бросать, когда это нужно и как читать лист в Neon Protocol. Начните отсюда, если правила кажутся сухими.',
  life:
    'Жизнь между перестрелками: зависимости, репутация, отдых, переговоры и чем занять простой. Всё, что не укладывается в один раунд боя.',
  economy:
    'Деньги и быт: сколько стоит жить в городе, как устроена аренда и почему у большинства вечный долг.',
  combat:
    'Бой пошагово: порядок ходов, действия, укрытия, урон и что происходит на 0 HP.',
  cyberpsychosis:
    'Токсичность крови от имплантов и «киберпсихоз» — как перегруз хрома отражается на персонаже и что с этим делать.',
  environment:
    'Состояния, падения, прыжки, дыхание и видимость — правила среды вне чистого «стреляй в AC».',
  classes:
    'Шесть классов Carbon 2185: кратко о роли, броне, оружии и способностях по уровням.',
};

function RulesSections({
  sections,
  tabIntro,
}: {
  sections: { title: string; intro?: string; lines: string[]; examples?: string[] }[];
  tabIntro?: string;
}) {
  return (
    <div className="nri-rules__sections">
      {tabIntro && <p className="nri-rules__tab-intro">{tabIntro}</p>}
      {sections.map((sec) => (
        <section key={sec.title} className="nri-rules__section">
          <h3 className="nri-rules__heading">{sec.title}</h3>
          {sec.intro && <p className="nri-rules__section-intro">{sec.intro}</p>}
          <ul className="nri-rules__list">
            {sec.lines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          {sec.examples && sec.examples.length > 0 && (
            <div className="nri-rules__examples">
              <p className="nri-rules__examples-label">Примеры на столе</p>
              <ul className="nri-rules__list nri-rules__list--examples">
                {sec.examples.map((ex) => (
                  <li key={ex}>{ex}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

export const NriRulesPanel: React.FC<Props> = ({ onClose }) => {
  const [tab, setTab] = useState<TabId>('core');

  return (
    <div className="nri-modal-overlay" onClick={onClose}>
      <div className="nri-modal nri-modal--wide nri-rules" onClick={(e) => e.stopPropagation()}>
        <h2 className="nri-modal__title">Carbon 2185 — правила</h2>
        <p className="mono-text nri-modal__hint">
          Сводка для игроков: сначала вводный абзац вкладки, затем правила и примеры. Полный текст — в PDF
          Dragon Turtle Games.
        </p>

        <nav className="nri-rules__tabs" aria-label="Разделы правил">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`nri-rules__tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
              title={t.hint}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="nri-rules__body">
          {tab === 'core' && <RulesSections sections={C2185_RULES} tabIntro={TAB_INTROS.core} />}

          {tab === 'life' && <RulesSections sections={C2185_LIFE_RULES} tabIntro={TAB_INTROS.life} />}

          {tab === 'economy' && <RulesSections sections={C2185_ECONOMY_RULES} tabIntro={TAB_INTROS.economy} />}

          {tab === 'combat' && <RulesSections sections={C2185_COMBAT_RULES} tabIntro={TAB_INTROS.combat} />}

          {tab === 'cyberpsychosis' && (
            <RulesSections sections={C2185_CYBERPSYCHOSIS_RULES} tabIntro={TAB_INTROS.cyberpsychosis} />
          )}

          {tab === 'environment' && (
            <RulesSections sections={C2185_ENVIRONMENT_RULES} tabIntro={TAB_INTROS.environment} />
          )}

          {tab === 'classes' && (
            <div className="nri-rules__sections">
              <p className="nri-rules__tab-intro">{TAB_INTROS.classes}</p>
              {C2185_CLASS_GUIDES.map((cls) => (
                <article key={cls.id} className="nri-rules__class-card">
                  <header className="nri-rules__class-head">
                    <h3 className="nri-rules__class-name">
                      {cls.name}
                      <span className="nri-rules__class-en">{cls.carbonName}</span>
                    </h3>
                    <p className="mono-text nri-rules__class-tag">{cls.tagline}</p>
                  </header>
                  <p className="nri-rules__class-summary">{cls.summary}</p>
                  <dl className="nri-rules__class-meta mono-text">
                    <div>
                      <dt>Hit Die</dt>
                      <dd>{cls.hitDie}</dd>
                    </div>
                    <div>
                      <dt>Saves</dt>
                      <dd>{cls.saves}</dd>
                    </div>
                    <div>
                      <dt>Броня</dt>
                      <dd>{cls.armor}</dd>
                    </div>
                    <div>
                      <dt>Оружие</dt>
                      <dd>{cls.weapons}</dd>
                    </div>
                  </dl>
                  <section className="nri-rules__section">
                    <h4 className="nri-rules__subheading">Уровни</h4>
                    <ul className="nri-rules__level-list">
                      {cls.levelFeatures.map((row) => (
                        <li key={row.level}>
                          <strong>{row.level} ур.</strong>
                          <ul>
                            {row.features.map((f) => (
                              <li key={f}>{f}</li>
                            ))}
                          </ul>
                        </li>
                      ))}
                    </ul>
                  </section>
                  {cls.archetypes.length > 0 && (
                    <section className="nri-rules__section">
                      <h4 className="nri-rules__subheading">Архетипы / фокус</h4>
                      {cls.archetypes.map((arch) => (
                        <div key={arch.name} className="nri-rules__archetype">
                          <h5 className="nri-rules__archetype-name">{arch.name}</h5>
                          <ul className="nri-rules__list">
                            {arch.lines.map((line) => (
                              <li key={line}>{line}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </section>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>

        <button type="button" className="nri-modal__submit" onClick={onClose}>
          Закрыть
        </button>
      </div>
    </div>
  );
};
