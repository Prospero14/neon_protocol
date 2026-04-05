import React, { useState, useEffect } from 'react';
import { DIALOGUE_TREES } from '../logic/dialogues';
import type { DialogueNode, DialogueOption } from '../logic/dialogues';
import type { Trait } from '../logic/traits';
import { FACTIONS } from '../logic/factions';
import { NPC_PRESENCE_CONFIGS } from '../logic/npcPresence';
import { Cpu, Fingerprint } from 'lucide-react';

interface FixerBarSceneProps {
  locationId: string;
  playerBits: number;
  playerTraits: Trait[];
  playerReputation: Record<string, number>;
  canUnlockNow: boolean;
  onPay: (amount: number) => void;
  onRewardCard: (cardId: string) => void;
  onRewardTrait: (traitId: string) => void;
  onRewardBits: (amount: number) => void;
  onRestoreHp: (amount: number) => void;
  onSetProfession: (profId: string) => void;
  onStartCombat: (combatId: string) => void;
  onUnlockCity?: () => void;
  onRewardXp?: (amount: number) => void;
  onAwardQuest?: (questId: string) => void;
  activeQuestIds?: string[];
  onCompleteQuest?: (questId: string) => void;
  onDiscoverIntel?: (factionId: string, lore: string) => void;
  playerLevel: number;
  inventory: any[];
  onTravel?: (nodeId: string, type: string, cost?: number) => void;
  onLeave: () => void;
  homeDistrictId?: string;
  npcPresenceMap: Record<string, 'HOME' | 'AWAY'>;
  isPetrovichHomeUnlocked: boolean;
}

const FixerBarScene: React.FC<FixerBarSceneProps> = ({
  locationId,
  playerBits,
  playerTraits,
  playerReputation,
  canUnlockNow,
  onPay,
  onRewardCard,
  onRewardTrait,
  onRewardBits,
  onRestoreHp,
  onSetProfession,
  onStartCombat,
  onUnlockCity,
  onRewardXp,
  onAwardQuest,
  activeQuestIds = [],
  onCompleteQuest,
  playerLevel,
  inventory,
  onTravel,
  onLeave,
  homeDistrictId,
  npcPresenceMap,
  isPetrovichHomeUnlocked
}) => {
  let tree = DIALOGUE_TREES[locationId];
  if (!tree) {
    console.warn(`[DIALOGUE] No tree for ${locationId}. Falling back to GENERIC_STUB.`);
    tree = DIALOGUE_TREES['GENERIC_STUB'];
  }

  // Find NPC faction. 
  let npcFactionId = 'NET_DRIVERS';
  if (locationId.includes('corp') || locationId.includes('regulator')) npcFactionId = 'KRYLOVO_CORP';
  if (locationId.includes('bank') || locationId.includes('gigabank')) npcFactionId = 'GIGABANK';
  if (locationId.includes('null') || locationId.includes('hacker') || locationId.includes('chertanovo')) npcFactionId = 'NULLPOINTERS';
  if (locationId.includes('rust') || locationId.includes('scav') || locationId.includes('vykhino') || locationId.includes('altufyevo')) npcFactionId = 'RUST_VALLEY';
  if (locationId.includes('federal') || locationId.includes('over')) npcFactionId = 'FEDERAL_OVERSIGHT';
  if (locationId.includes('bio')) npcFactionId = 'BIOSYNDICATE';
  if (locationId.includes('hedge') || locationId.includes('south_west')) npcFactionId = 'SILICON_HEDGE';
  if (locationId.includes('redundant')) npcFactionId = 'REDUNDANTS';
  if (locationId.includes('commis') || locationId.includes('perovo')) npcFactionId = 'CYBERCOMMIS';

  const faction = FACTIONS[npcFactionId];
  const currentRep = faction ? (playerReputation[faction.id] || 0) : 0;

  const [currentNodeId, setCurrentNodeId] = useState<string>(tree.startNodeId);
  const [typedText, setTypedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [dialogueTurn, setDialogueTurn] = useState(0);

  // v0.10: Handle Presence Overrides (Note on door)
  useEffect(() => {
    const config = Object.values(NPC_PRESENCE_CONFIGS).find(c => c.homeNodeId === locationId);
    if (config && npcPresenceMap[config.npcId] === 'AWAY') {
       // Check if there is an intro_note node in this tree (to be added in next phase)
       if (tree.nodes['intro_note']) {
         setCurrentNodeId('intro_note');
       } else {
         // Fallback: modify the intro text temporarily if node doesn't exist yet
         setTypedText(config.awayNote);
       }
    } else {
       setCurrentNodeId(tree.startNodeId);
    }
    setTypedText('');
    setIsTyping(true);
  }, [locationId, tree.startNodeId, npcPresenceMap]);

  const node: DialogueNode = tree.nodes[currentNodeId] || tree.nodes[tree.startNodeId];

  const visibleOptions = node.options.filter(opt => {
    if (opt.requireTrait && !playerTraits.some((t: Trait) => t.id === opt.requireTrait)) return false;
    if (opt.requireReputation && (playerReputation[opt.requireReputation.factionId] || 0) < opt.requireReputation.minPoints) return false;
    if (opt.requireUnlock && !canUnlockNow) return false;
    if (opt.requireQuestId && !activeQuestIds.includes(opt.requireQuestId)) return false;
    if (opt.requireItemId && !inventory.some(i => i.id === opt.requireItemId)) return false;
    if (opt.requireMinLevel && playerLevel < opt.requireMinLevel) return false;
    if (opt.requireMaxLevel && playerLevel > opt.requireMaxLevel) return false;
    if (opt.isProOnly && !canUnlockNow) return false; 
    if (opt.isTraineeOnly && canUnlockNow) return false;
    if (opt.effect === 'AWARD_QUEST' && opt.cardRewardId && activeQuestIds.includes(opt.cardRewardId)) return false;
    if (opt.awardQuestId && activeQuestIds.includes(opt.awardQuestId)) return false;

    return true;
  });

  // v0.10: Inject Guest NPCs if they are present at this location
  const finalOptions = [...visibleOptions];
  if (currentNodeId === tree.startNodeId) {
    Object.values(NPC_PRESENCE_CONFIGS).forEach(config => {
      // Show Petrovich in bar if he's not unlocked OR rolled as AWAY at bar
      const isPetrovichSpecial = config.npcId === 'npc_petrovich' && !isPetrovichHomeUnlocked;
      if (config.awayNodeId === locationId && (npcPresenceMap[config.npcId] === 'AWAY' || isPetrovichSpecial)) {
         finalOptions.unshift({
           text: `ПОГОВОРИТЬ: ${config.name.toUpperCase()}`,
           nextId: 'TRAVEL_GUEST',
           cardRewardId: config.npcId, // Use as target nodeId
           subtext: 'ПРИСУТСТВУЕТ_В_ЛОКАЦИИ'
         } as any);
      }
    });
  }

  useEffect(() => {
    if (node && node.text) {
      setTypedText(node.text);
      setIsTyping(false);
    }
  }, [currentNodeId, node]);

  const handleOptionClick = (option: DialogueOption) => {
    if (isTyping) { setTypedText(node.text); setIsTyping(false); return; }

    const isAltufyevoResident = homeDistrictId === 'altufyevo';
    const isLocalAltufyevo = locationId.includes('altufyevo') || (['npc_petrovich', 'shop_scrap', 'npc_varvar', 'npc_nixanna', 'job_board_alt', 'term_silo_7', 'bar_chips'].includes(locationId));
    const hasDiscount = isAltufyevoResident && isLocalAltufyevo;
    
    let effectiveCost = option.cost || 0;
    if (hasDiscount && effectiveCost > 0) effectiveCost = Math.floor(effectiveCost * 0.9);

    if (effectiveCost > 0 && playerBits < effectiveCost) return;
    if (effectiveCost > 0) onPay(effectiveCost);

    // v0.10: Handle Guest Navigation
    if (option.nextId === 'TRAVEL_GUEST' && option.cardRewardId && onTravel) {
       onTravel(option.cardRewardId, 'npc', 0);
       return;
    }

    if (option.effect === 'GIVE_CARD' && option.cardRewardId) onRewardCard(option.cardRewardId);
    else if (option.effect === 'GIVE_TRAIT' && option.cardRewardId) onRewardTrait(option.cardRewardId);
    else if (option.effect === 'GIVE_BITS' && option.amount) onRewardBits(option.amount);
    else if (option.effect === 'RESTORE_HP' && option.amount) onRestoreHp(option.amount);
    else if (option.effect === 'SET_PROFESSION' && option.cardRewardId) onSetProfession(option.cardRewardId);
    else if (option.effect === 'START_COMBAT' && option.cardRewardId) onStartCombat(option.cardRewardId);
    else if (option.effect === 'UNLOCK_CITY' && onUnlockCity) onUnlockCity();
    else if (option.effect === 'TRAVEL' && onTravel && option.cardRewardId) onTravel(option.cardRewardId, 'district', option.cost);
    else if (option.effect === 'GIVE_XP' && option.amount && onRewardXp) onRewardXp(option.amount);
    else if (option.effect === 'AWARD_QUEST' && option.cardRewardId && onAwardQuest) onAwardQuest(option.cardRewardId);
    else if (option.effect === 'COMPLETE_TALK_QUEST' && option.cardRewardId && onCompleteQuest) onCompleteQuest(option.cardRewardId);

    if (option.completeQuestId && onCompleteQuest) onCompleteQuest(option.completeQuestId);
    if (option.awardQuestId && onAwardQuest) onAwardQuest(option.awardQuestId);

    if (option.nextId === 'LEAVE') {
      onLeave();
    } else {
      if (option.nextId === tree.startNodeId) setDialogueTurn(prev => prev + 1);
      setCurrentNodeId(option.nextId);
    }
  };

  return (
    <div className="fixer-bar-view main-crt">
      <header className="bar-header">
        <div className="header-left">
          <div className="header-marker"></div>
          <span className="location-tag mono-text">{locationId.toUpperCase()}_ХАБ</span>
        </div>
        <div className="header-right mono-text">
          <Fingerprint size={14} className="bits-icon" /> БИТЫ: {playerBits}
        </div>
      </header>

      <main className="bar-main">
        <aside className="bar-sidebar">
          <div className="node-title neon-text green">{tree.nodes[tree.startNodeId].speaker || 'ОБЪЕКТ'}</div>
          <div className="node-icon-frame">
            <div className="icon-container">
              <Cpu size={80} strokeWidth={1} className="chip-icon" />
            </div>
            <div className="frame-footer"></div>
          </div>
          <div className="node-meta mono-text">
            @ {faction?.name || 'UNKNOWN'} | REP: {currentRep}
          </div>
        </aside>

        <section className="bar-content">
          <div className="content-text-area mono-text">
            {typedText}
          </div>

          <div className="content-actions">
            {finalOptions.map((opt, idx) => {
              const cantAfford = opt.cost && playerBits < opt.cost;
              return (
                <button
                  key={idx}
                  className={`action-button mono-text ${cantAfford ? 'locked' : ''}`}
                  onClick={() => handleOptionClick(opt)}
                >
                  <div className="action-main">
                    <span className="action-prompt">{">_"}</span>
                    <span className="action-text">{opt.text}</span>
                  </div>
                  {opt.cost && <div className="action-cost amber">b{opt.cost}</div>}
                </button>
              );
            })}
          </div>
        </section>
      </main>

      <style>{`
        .fixer-bar-view {
          height: 100vh;
          background: #000;
          display: flex;
          flex-direction: column;
          color: #e0e0e0;
          padding: 2rem 4rem;
          box-sizing: border-box;
          overflow: hidden;
        }

        .bar-header {
          display: flex;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          padding-bottom: 1rem;
          margin-bottom: 3rem;
        }
        .header-left { display: flex; align-items: center; gap: 12px; }
        .header-marker { width: 4px; height: 18px; background: #00ff99; }
        .location-tag { font-size: 1.1rem; letter-spacing: 1px; }
        .header-right { opacity: 0.8; display: flex; align-items: center; gap: 8px; }
        .bits-icon { color: #ffcc00; }

        .bar-main {
          flex: 1;
          display: flex;
          gap: 5rem;
        }

        .bar-sidebar {
          width: 280px;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .node-title { font-size: 1.5rem; text-transform: uppercase; letter-spacing: 2px; }
        .node-icon-frame {
           border: 1px solid #00ff99;
           padding: 2px;
           background: rgba(0,255,153,0.03);
           position: relative;
        }
        .icon-container {
           height: 240px;
           display: flex;
           align-items: center;
           justify-content: center;
           border: 1px solid rgba(0,255,153,0.3);
           background: #000;
        }
        .chip-icon { color: #00ff99; opacity: 0.8; filter: drop-shadow(0 0 10px rgba(0,255,153,0.3)); }
        .frame-footer { height: 30px; border-top: 1px solid #00ff99; background: rgba(0,255,153,0.05); }
        .node-meta { font-size: 0.75rem; opacity: 0.5; text-transform: uppercase; }

        .bar-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4rem;
          padding-top: 2rem;
        }
        .content-text-area {
          font-size: 1.4rem;
          line-height: 1.7;
          max-width: 800px;
          min-height: 200px;
        }

        .content-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-width: 650px;
        }
        .action-button {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          padding: 1.2rem 1.8rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          transition: 0.2s;
          color: #a0a0a0;
        }
        .action-button:hover:not(.locked) {
          background: rgba(0,255,153,0.05);
          border-color: #00ff99;
          color: #fff;
          transform: translateX(10px);
        }
        .action-main { display: flex; gap: 20px; align-items: center; }
        .action-prompt { color: #00ff99; font-weight: bold; }
        .action-text { font-size: 1.1rem; }
        .action-cost { font-weight: bold; font-size: 0.9rem; }

        .neon-text.green { color: #00ff99; text-shadow: 0 0 10px rgba(0,255,153,0.3); }
        .amber { color: #ffcc00; }
        .mono-text { font-family: 'JetBrains Mono', 'Courier New', monospace; }
      `}</style>
    </div>
  );
};

export default FixerBarScene;
