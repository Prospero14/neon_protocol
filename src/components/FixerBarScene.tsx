import React, { useState, useEffect } from 'react';
import { DIALOGUE_TREES } from '../logic/dialogues';
import type { DialogueNode, DialogueOption } from '../logic/dialogues';
import type { Trait } from '../logic/traits';
import { FACTIONS } from '../logic/factions';
import { NPC_PRESENCE_CONFIGS, isNpcAvailableInPhase, type NpcDayPhase } from '../logic/npcPresence';
import { Cpu, Fingerprint } from 'lucide-react';
import { QUEST_LIBRARY } from '../logic/questData';
import type { CombatCard } from '../logic/combatCards';
import type { GameItem } from '../logic/items';
import { MAP_NODES } from '../logic/mapData';

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
  inventory: CombatCard[];
  activeDeck: CombatCard[];
  onTravel?: (nodeId: string, type: string, cost?: number) => void;
  onRewardItem?: (itemId: string, amount?: number) => void;
  onRemoveItem?: (itemId: string) => void;
  /** Предметы с квестов / лута (не карты колоды). */
  playerLoot?: GameItem[];
  onUseLootItem?: (itemId: string) => void;
  currentDay?: number;
  dayPhase?: NpcDayPhase;
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
  activeDeck,
  onTravel,
  onRewardItem,
  onRemoveItem,
  playerLoot = [],
  onUseLootItem,
  currentDay = 1,
  dayPhase = 'day',
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
  const [isTransitioning, setIsTransitioning] = useState(false);


  // v0.10: Handle Presence Overrides (Note on door)
  useEffect(() => {
    const config = Object.values(NPC_PRESENCE_CONFIGS).find(c => c.homeNodeId === locationId);
    if (config && !isNpcAvailableInPhase(config, dayPhase)) {
      if (tree.nodes['intro_note']) {
        setCurrentNodeId('intro_note');
      } else {
        setTypedText(config.unavailableNote || 'Записка на двери: приём в эту фазу суток отключён.');
      }
    } else if (config && npcPresenceMap[config.npcId] === 'AWAY') {
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
  }, [locationId, tree.startNodeId, npcPresenceMap, dayPhase]);

  const node: DialogueNode = (() => {
    const resolved = tree.nodes[currentNodeId] || tree.nodes[tree.startNodeId];
    if (resolved) return resolved;
    return {
      id: '__dialogue_fallback',
      speaker: 'SYSTEM',
      text: '[СБОЙ_ПРОТОКОЛА] Узел диалога не найден. Закройте сессию и откройте локацию снова.',
      options: [{ text: '[ РАЗОРВАТЬ СОЕДИНЕНИЕ ]', nextId: 'LEAVE' }],
    };
  })();

  const visibleOptions = node.options.filter(opt => {
    if (opt.requireTrait && !playerTraits.some((t: Trait) => t.id === opt.requireTrait)) return false;
    if (opt.requireReputation && (playerReputation[opt.requireReputation.factionId] || 0) < opt.requireReputation.minPoints) return false;
    if (opt.requireUnlock && !canUnlockNow) return false;
    if (opt.requireQuestId && !activeQuestIds.includes(opt.requireQuestId) && !readyQuestIds.includes(opt.requireQuestId)) return false;
    if (opt.requireActiveQuestId && !activeQuestIds.includes(opt.requireActiveQuestId)) return false;
    if (opt.requireReadyQuestId && !readyQuestIds.includes(opt.requireReadyQuestId)) return false;
    if (opt.requireCompletedQuestId && !completedQuestIds.includes(opt.requireCompletedQuestId)) return false;
    if (opt.requireItemId && !inventory.some(i => i.id === opt.requireItemId)) return false;
    if (opt.requireLootItemId && !playerLoot.some(i => i.id === opt.requireLootItemId)) return false;
    if (opt.requireMinLevel && playerLevel < opt.requireMinLevel) return false;
    if (opt.requireMaxLevel && playerLevel > opt.requireMaxLevel) return false;
    if (opt.isProOnly && !canUnlockNow) return false; 
    if (opt.isTraineeOnly && canUnlockNow) return false;
    if (opt.effect === 'AWARD_QUEST' && opt.cardRewardId && activeQuestIds.includes(opt.cardRewardId)) return false;
    if (opt.awardQuestId && activeQuestIds.includes(opt.awardQuestId)) return false;

    return true;
  });

  const detectDistrictFromLocation = (id: string): string => {
    const byDistrictId = MAP_NODES.find((d) => d.id === id)?.id;
    if (byDistrictId) return byDistrictId;
    for (const d of MAP_NODES) {
      if (d.subNodes?.some((s) => s.id === id)) return d.id;
    }
    const known = [
      'altufyevo', 'bibirevo', 'chertanovo', 'fili', 'izmailovo', 'maryino', 'mitino',
      'perovo', 'sokol', 'sokolniki', 'south_west', 'taganka', 'tekstilschiki',
      'teply_stan', 'vdnkh', 'vykhino', 'kitay_gorod', 'academy'
    ];
    const hit = known.find((d) => id.includes(d));
    return hit || 'unknown';
  };

  const locationDistrict = detectDistrictFromLocation(locationId);

  // v0.10: Inject Guest NPCs if they are present at this location
  const finalOptions = [...visibleOptions];
  if (currentNodeId === tree.startNodeId) {
    Object.values(NPC_PRESENCE_CONFIGS).forEach(config => {
      if (!isNpcAvailableInPhase(config, dayPhase)) return;
      const inConfiguredNode = config.awayNodeId === locationId;
      const inConfiguredDistrict = config.awayDistrictId === locationDistrict;
      if (!inConfiguredNode && !inConfiguredDistrict) return;
      // Show Petrovich in bar if he's not unlocked OR rolled as AWAY at bar
      const isPetrovichSpecial = config.npcId === 'npc_petrovich' && !isPetrovichHomeUnlocked;
      if (npcPresenceMap[config.npcId] === 'AWAY' || isPetrovichSpecial) {
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
  const hashSeed = (s: string) => {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return Math.abs(h >>> 0);
  };
  const serviceOptionsRaw = finalOptions.filter(o => (o.cost || 0) > 0);
  const serviceOptions = (() => {
    if (serviceOptionsRaw.length <= 4) return serviceOptionsRaw;
    const scored = serviceOptionsRaw.map((opt, idx) => ({
      opt,
      idx,
      score: hashSeed(`${locationId}_${currentDay}_${opt.cardRewardId || opt.text}_${idx}`),
    }));
    scored.sort((a, b) => a.score - b.score);
    return scored.slice(0, 4).map((x) => x.opt);
  })();
  const primaryOptions = finalOptions.filter(o => !((o.cost || 0) > 0));

  const regionalMultiplier = (() => {
    if (!homeDistrictId || homeDistrictId === 'unknown') return 1;
    if (homeDistrictId === locationDistrict) return 0.88;
    if (locationDistrict === 'taganka' || locationDistrict === 'vykhino') return 1.16;
    if (locationDistrict === 'south_west' || locationDistrict === 'sokol') return 1.04;
    return 1.0;
  })();
  const vendorMultiplier = (() => {
    if (locationId.includes('black_market') || locationId.includes('state_secret')) return 1.12;
    if (locationId.includes('pharmacy')) return 0.96;
    if (locationId.includes('scrap') || locationId.includes('north_link')) return 0.98;
    return 1.0;
  })();
  const reputationMultiplier = (() => {
    if (currentRep >= 40) return 0.9;
    if (currentRep >= 20) return 0.95;
    if (currentRep <= -40) return 1.2;
    if (currentRep <= -20) return 1.1;
    return 1.0;
  })();

  const totalCopiesOfCard = (id?: string) => {
    if (!id) return 0;
    const invCount = inventory.filter((c: CombatCard) => c.id === id).length;
    const deckCount = activeDeck.filter((c: CombatCard) => c.id === id).length;
    return invCount + deckCount;
  };

  const isLocalThemed = (cardId: string, distId: string) => {
    const themes: Record<string, string[]> = {
      altufyevo: ['script_ping', 'script_ls', 'script_cat', 'script_sudo_fix', 'soft_coffee', 'infra_old_hw', 'infra_mesh_relay'],
      maryino: ['script_grep', 'script_auth', 'script_wash_logs', 'soft_ai_ask', 'soft_tactical_breath', 'soft_patch_drill'],
      bibirevo: ['fn_ping_flood', 'infra_hub', 'soft_signal_prediction', 'infra_quarantine_vm'],
      fili: ['infra_street_fusion', 'infra_orbital_uplink', 'soft_deadline_trance'],
      chertanovo: ['fn_grep_recursive', 'fn_sudo_fix', 'script_rm'],
    };
    const activeDist = Object.keys(themes).find(d => distId.includes(d));
    return (activeDist && themes[activeDist]?.includes(cardId)) || false;
  };

  const getEffectiveCost = (option: DialogueOption): number => {
    let effectiveCost = option.cost || 0;
    if (effectiveCost <= 0) return 0;
    if (option.effect === 'GIVE_CARD' && option.cardRewardId && isLocalThemed(option.cardRewardId, locationId)) {
      effectiveCost = Math.floor(effectiveCost * 0.85);
    }
    const combined = regionalMultiplier * vendorMultiplier * reputationMultiplier;
    return Math.max(1, Math.floor(effectiveCost * combined));
  };

  useEffect(() => {
    if (node && node.text) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setTypedText(node.text);
        setIsTyping(false);
        setIsTransitioning(false);
      }, 140);
      return () => clearTimeout(timer);
    }
  }, [currentNodeId, node]);

  const handleOptionClick = (option: DialogueOption) => {
    if (isTyping) { setTypedText(node.text); setIsTyping(false); return; }

    let effectiveCost = getEffectiveCost(option);
    
    // Purchase Limit Logic
    if (option.effect === 'GIVE_CARD' && option.cardRewardId) {
       if (totalCopiesOfCard(option.cardRewardId) >= 3) {
          // Block purchase
          return;
       }
       // already baked into getEffectiveCost
    }

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
    else if (option.effect === 'GIVE_ITEM' && option.cardRewardId && onRewardItem) {
       onRewardItem(option.cardRewardId, 1);
    }
    else if (option.effect === 'USE_GAME_ITEM' && option.cardRewardId && onUseLootItem) {
       onUseLootItem(option.cardRewardId);
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
      setIsTyping(true);
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentNodeId(option.nextId);
      }, 110);
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
            <div className={`text-scroll ${isTransitioning ? 'is-transitioning' : ''}`}>
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
                       <div className="tile-price">ƀ{getEffectiveCost(opt)}</div>
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
        .text-scroll { font-size: 1.1rem; line-height: 1.5; color: #d0d0d0; transition: opacity 140ms ease, transform 140ms ease; opacity: 1; transform: translateY(0); }
        .text-scroll.is-transitioning { opacity: 0.35; transform: translateY(2px); }
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

        @media (max-width: 1280px) {
          .fixer-bar-view { padding: 1rem 1.2rem; }
          .bar-main-grid { grid-template-columns: 220px 1fr; gap: 1.2rem; }
          .service-grid { grid-template-columns: 1fr; }
          .btn-t { font-size: 0.9rem; }
        }

        @media (max-width: 920px) {
          .fixer-bar-view { height: auto; min-height: 100vh; overflow-y: auto; }
          .bar-header { margin-bottom: 1rem; flex-wrap: wrap; gap: 8px; }
          .bar-main-grid { grid-template-columns: 1fr; overflow: visible; }
          .bar-aside { order: 2; height: auto; }
          .action-center { order: 1; overflow: visible; padding-right: 0; }
          .interaction-matrix { gap: 1rem; }
          .primary-action-v4:hover { transform: none; }
        }
      `}</style>
    </div>
  );
};

export default FixerBarScene;
