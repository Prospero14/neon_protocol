import React, { useState } from 'react';
import { NriScenarioPanel } from './NriScenarioPanel';
import { NriLorePanel } from './NriLorePanel';

type Props = { inviteCode: string };

type HubTab = 'scenario' | 'lore';

export const NriScenarioHub: React.FC<Props> = ({ inviteCode }) => {
  const [tab, setTab] = useState<HubTab>('scenario');

  return (
    <div className="nri-scenario-hub">
      <nav className="nri-people-subtabs nri-scenario-hub__tabs">
        <button
          type="button"
          className={`nri-people-subtabs__btn ${tab === 'scenario' ? 'active' : ''}`}
          onClick={() => setTab('scenario')}
        >
          Сценарий
        </button>
        <button
          type="button"
          className={`nri-people-subtabs__btn ${tab === 'lore' ? 'active' : ''}`}
          onClick={() => setTab('lore')}
        >
          Лор
        </button>
      </nav>
      {tab === 'scenario' && <NriScenarioPanel inviteCode={inviteCode} />}
      {tab === 'lore' && <NriLorePanel inviteCode={inviteCode} />}
    </div>
  );
};
