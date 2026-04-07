import React, { useState, useEffect } from 'react';
import { DIALOGUE_TREES } from '../logic/dialogues';
import type { DialogueNode, DialogueOption } from '../logic/dialogues';
import type { Trait } from '../logic/traits';
import { FACTIONS } from '../logic/factions';
import { NPC_PRESENCE_CONFIGS } from '../logic/npcPresence';
import { Cpu, Fingerprint } from 'lucide-react';
import { QUEST_LIBRARY } from '../logic/questData';

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
  readyQuestIds?: string[];
  completedQuestIds?: string[];
  onCompleteQuest?: (questId: string) => void;
  onDiscoverIntel?: (factionId: string, lore: string) => void;
  playerLevel: number;
  inventory: any[];
  onTravel?: (nodeId: string, type: string, cost?: number) => void;
  onRewardItem?: (itemId: string, amount?: number) => void;
  onRemoveItem?: (itemId: string) => void;
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
  readyQuestIds = [],
  completedQuestIds = [],
  onCompleteQuest,
  playerLevel,
  inventory,
  onTravel,
  onRewardItem,
  onRemoveItem,
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
  let npcFactionId: string = 'NET_DRIVERS';
  if (locationId.includes('corp')) npcFactionId = 'KRYLOVO_CORP';
  if (locationId.includes('bank') || locationId.includes('gigabank')) npcFactionId = 'GIGABANK';
  if (locationId.includes('null') || locationId.includes('hacker') || locationId.includes('chertanovo') || locationId.includes('altufyevo')) npcFactionId = 'NULLPOINTERS';
  if (locationId.includes('rust') || locationId.includes('scav') || locationId.includes('vykhino')) npcFactionId = 'RUST_VALLEY';
  if (locationId.includes('regulator') || locationId.includes('federal') || locationId.includes('over')) npcFactionId = 'REGULATORS';
  if (locationId.includes('bio')) npcFactionId = 'BIOSYNDICATE';
  if (locationId.includes('hedge') || locationId.includes('south_west')) npcFactionId = 'SILICON_HEDGE';
  if (locationId.includes('redundant')) npcFactionId = 'REDUNDANTS';
  if (locationId.includes('commis') || locationId.includes('perovo')) npcFactionId = 'CYBERCOMMIS';

  const faction = FACTIONS[npcFactionId];
  const currentRep = faction ? (playerReputation[faction.id] || 0) : 0;

  const [currentNodeId, setCurrentNodeId] = useState<string>(tree.startNodeId);
  const [typedText, setTypedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);


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
    if (opt.requireQuestId && !activeQuestIds.includes(opt.requireQuestId) && !readyQuestIds.includes(opt.requireQuestId)) return false;
    if (opt.requireActiveQuestId && !activeQuestIds.includes(opt.requireActiveQuestId)) return false;
    if (opt.requireReadyQuestId && !readyQuestIds.includes(opt.requireReadyQuestId)) return false;
    if (opt.requireCompletedQuestId && !completedQuestIds.includes(opt.requireCompletedQuestId)) return false;
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
         finalOptions.push({
           text: `ПОГОВОРИТЬ: ${config.name.toUpperCase()}`,
           nextId: 'TRAVEL_GUEST',
           cardRewardId: config.npcId, // Use as target nodeId
           subtext: 'ПРИСУТСТВУЕТ_В_ЛОКАЦИИ',
           isNpcInteraction: true
         } as any);
      }
    });

    const readyStarterQuest = readyQuestIds.find(id => id.startsWith('q_kiddo_'));
    if (readyStarterQuest) {
      const qDef = QUEST_LIBRARY.find(q => q.id === readyStarterQuest);
      finalOptions.unshift({
        text: `[ ЗАВЕРШИТЬ: ${qDef?.title || 'ОБУЧЕНИЕ'} ]`,
        nextId: 'LEAVE',
        subtext: 'СИНХРОНИЗАЦИЯ_С_РАЙОНОМ',
        effect: 'COMPLETE_TALK_QUEST',
        cardRewardId: readyStarterQuest,
      } as unknown as DialogueOption);
    }
  }

  // v0.10: Categorize for Layout
  const serviceOptions = finalOptions.filter(o => (o.cost || 0) > 0);
  const primaryOptions = finalOptions.filter(o => !((o.cost || 0) > 0));

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

    let effectFired = false;
    if (option.effect === 'GIVE_CARD') {
       if (option.cardRewardId) onRewardCard(option.cardRewardId);
       if (option.cardRewardIds && option.cardRewardIds.length > 0) {
           option.cardRewardIds.forEach(id => onRewardCard(id));
       }
    }
    else if (option.effect === 'GIVE_TRAIT' && option.cardRewardId) onRewardTrait(option.cardRewardId);
    else if (option.effect === 'GIVE_BITS' && option.amount) onRewardBits(option.amount);
    else if (option.effect === 'RESTORE_HP' && option.amount) onRestoreHp(option.amount);
    else if (option.effect === 'SET_PROFESSION' && option.cardRewardId) onSetProfession(option.cardRewardId);
    else if (option.effect === 'START_COMBAT' && option.cardRewardId) { onStartCombat(option.cardRewardId); effectFired = true; }
    else if (option.effect === 'UNLOCK_CITY' && onUnlockCity) { onUnlockCity(); effectFired = true; }
    else if (option.effect === 'TRAVEL' && onTravel && option.cardRewardId) { onTravel(option.cardRewardId, 'district', option.cost); effectFired = true; }
    else if (option.effect === 'GIVE_XP' && option.amount && onRewardXp) onRewardXp(option.amount);
    else if (option.effect === 'AWARD_QUEST' && option.cardRewardId && onAwardQuest) onAwardQuest(option.cardRewardId);
    else if (option.effect === 'COMPLETE_TALK_QUEST' && option.cardRewardId && onCompleteQuest) onCompleteQuest(option.cardRewardId);

    if (option.completeQuestId && onCompleteQuest) onCompleteQuest(option.completeQuestId);
    if (option.awardQuestId && onAwardQuest) onAwardQuest(option.awardQuestId);
    if (option.awardItemId && onRewardItem) onRewardItem(option.awardItemId, option.amount);
    if (option.removeItemId && onRemoveItem) onRemoveItem(option.removeItemId);

    if (option.nextId === 'LEAVE') {
      if (!effectFired) onLeave();
    } else {
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

      <main className="bar-main-grid">
        {/* LEFT: SPEAKER / ASIDE */}
        <aside className="bar-aside neon-panel">
          <div className="speaker-label mono-text">
             <Fingerprint size={14} color="var(--neon-cyan)" />
             <span>ID_{locationId.toUpperCase()}</span>
          </div>
          <div className="speaker-avatar-frame">
             <div className="avatar-noise"></div>
             <Cpu size={64} strokeWidth={1} className="avatar-icon" />
             <div className="frame-scanner"></div>
          </div>
          <div className="speaker-metadata mono-text">
            <div className="meta-f">@ {faction?.name || 'UNKNOWN'}</div>
            <div className="meta-r gold">RECOGNITION_{currentRep}</div>
          </div>
        </aside>

        {/* RIGHT: CONTENT & ACTION CENTER */}
        <section className="action-center">
          <div className="story-area neon-panel arctic-monolith">
            <div className="text-scroll">
              <span className="prompt-v4">{">_"}</span> {typedText}
            </div>
          </div>

          <div className="interaction-matrix">
            {/* SERVICES GRID */}
            {serviceOptions.length > 0 && (
              <div className="service-matrix">
                <div className="matrix-label mono-text">ЛОКАЛЬНЫЙ_СЕРВИС [BITS_REQUIRED]</div>
                <div className="service-grid">
                  {serviceOptions.map((opt, idx) => (
                    <button key={idx} className="service-tile interactive" onClick={() => handleOptionClick(opt)}>
                       <div className="tile-text">{opt.text}</div>
                       <div className="tile-price">ƀ{opt.cost}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* PRIMARY ACTIONS LIST */}
            <div className="primary-actions-list">
              {primaryOptions.map((opt, idx) => {
                const isNpc = (opt as any).isNpcInteraction;
                const isLeave = opt.nextId === 'LEAVE';
                return (
                  <button 
                    key={idx} 
                    className={`primary-action-v4 interactive ${isNpc ? 'npc-glow' : ''} ${isLeave ? 'leave-btn' : ''}`}
                    onClick={() => handleOptionClick(opt)}
                  >
                    <span className="btn-p">{(isNpc ? '://' : '>_')}</span>
                    <div className="btn-content">
                       <div className="btn-t">{opt.text}</div>
                       {opt.subtext && <div className="btn-s">{opt.subtext}</div>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <style>{`
        .fixer-bar-view {
          height: 100vh;
          background: radial-gradient(circle at center, #0a0e14 0%, #000 100%);
          display: flex;
          flex-direction: column;
          color: #e0e0e0;
          padding: 1.5rem 2rem;
          box-sizing: border-box;
          overflow: hidden;
          font-family: var(--font-mono);
        }

        .bar-header {
          display: flex;
          justify-content: space-between;
          padding: 8px 15px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          margin-bottom: 2rem;
          background: rgba(255,255,255,0.02);
          border-radius: 4px;
        }
        .header-marker { width: 4px; height: 14px; background: var(--neon-cyan); box-shadow: 0 0 10px var(--neon-cyan); }
        .location-tag { font-size: 0.8rem; font-weight: bold; letter-spacing: 2px; }
        .header-right { font-size: 0.8rem; color: var(--neon-amber); font-weight: bold; }

        .bar-main-grid {
          flex: 1;
          display: grid;
          grid-template-columns: 240px 1fr;
          gap: 2rem;
          overflow: hidden;
        }

        .bar-aside {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 15px;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(10px);
          height: fit-content;
        }
        .speaker-label { font-size: 0.65rem; opacity: 0.5; display: flex; gap: 8px; align-items: center; }
        .speaker-avatar-frame {
           height: 180px;
           background: #000;
           border: 1px solid rgba(255,255,255,0.1);
           display: flex;
           align-items: center;
           justify-content: center;
           position: relative;
           overflow: hidden;
        }
        .avatar-noise { position: absolute; inset: 0; background: url('https://grainy-gradients.vercel.app/noise.svg'); opacity: 0.1; }
        .avatar-icon { color: var(--neon-cyan); opacity: 0.8; filter: drop-shadow(0 0 10px var(--neon-cyan-glow)); }
        .frame-scanner { position: absolute; width: 100%; height: 2px; background: rgba(0,255,255,0.2); animation: scan 3s linear infinite; }
        .speaker-metadata { font-size: 0.7rem; display: flex; flex-direction: column; gap: 4px; }
        
        .action-center {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          overflow-y: auto;
          padding-right: 10px;
        }
        .story-area {
          padding: 20px;
          background: rgba(255,255,255,0.03);
          border-left: 3px solid var(--neon-cyan);
          min-height: 120px;
          display: flex;
          align-items: center;
        }
        .text-scroll { font-size: 1.1rem; line-height: 1.5; color: #d0d0d0; }
        .prompt-v4 { color: var(--neon-cyan); font-weight: bold; margin-right: 10px; }

        .interaction-matrix {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        .matrix-label { font-size: 0.6rem; opacity: 0.4; letter-spacing: 2px; margin-bottom: 8px; }
        
        .service-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .service-tile {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.1);
          padding: 12px 15px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          transition: 0.2s;
          border-radius: 4px;
        }
        .service-tile:hover {
          background: rgba(255,191,0,0.1);
          border-color: var(--neon-amber);
          transform: translateY(-2px);
        }
        .tile-text { font-size: 0.8rem; color: #ccc; }
        .service-tile:hover .tile-text { color: #fff; }
        .tile-price { color: var(--neon-amber); font-weight: bold; font-size: 0.75rem; }

        .primary-actions-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .primary-action-v4 {
          background: rgba(0,255,255,0.03);
          border: 1px solid rgba(0,255,255,0.15);
          padding: 15px 20px;
          display: flex;
          align-items: center;
          gap: 15px;
          cursor: pointer;
          transition: 0.3s;
          border-radius: 6px;
        }
        .primary-action-v4:hover {
          background: rgba(0,255,255,0.1);
          border-color: var(--neon-cyan);
          box-shadow: 0 0 20px rgba(0,255,255,0.1);
          transform: translateX(10px);
        }
        .primary-action-v4.npc-glow { border-color: rgba(0,255,255,0.4); background: rgba(0,255,255,0.06); }
        .primary-action-v4.leave-btn { border-color: rgba(255,0,100,0.3); background: rgba(255,0,100,0.03); margin-top: 10px; }
        .primary-action-v4.leave-btn:hover { background: rgba(255,0,100,0.1); border-color: var(--neon-pink); color: #fff; }
        
        .btn-p { font-weight: bold; color: var(--neon-cyan); width: 25px; }
        .leave-btn .btn-p { color: var(--neon-pink); }
        .btn-t { font-size: 0.95rem; font-weight: 800; color: #fff; }
        .btn-s { font-size: 0.6rem; opacity: 0.6; text-transform: uppercase; margin-top: 2px; }

        @keyframes scan { from { top: 0%; } to { top: 100%; } }
        .gold { color: var(--neon-amber); }
      `}</style>
    </div>
  );
};

export default FixerBarScene;
