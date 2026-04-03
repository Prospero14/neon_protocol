import React, { useState, useEffect } from 'react';
import { DIALOGUE_TREES } from '../logic/dialogues';
import type { DialogueNode } from '../logic/dialogues';
import type { Trait } from '../logic/traits';
import { Terminal, LogOut, Cpu, Fingerprint, Users, Wine, Coffee, Skull, Package, Shield } from 'lucide-react';

interface FixerBarSceneProps {
  locationId: string;
  playerBits: number;
  playerTraits: Trait[];
  playerReputation: Record<string, number>;
  canUnlockNow: boolean;
  onRewardReputation: (factionId: string, amount: number) => void;
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
  onLeave: () => void;
}

const FixerBarScene: React.FC<FixerBarSceneProps> = ({
  locationId,
  playerBits,
  playerTraits,
  playerReputation,
  canUnlockNow,
  onRewardReputation,
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
  onLeave
}) => {
  let tree = DIALOGUE_TREES[locationId];
  if (!tree) {
    console.warn(`[DIALOGUE] No tree for ${locationId}. Falling back to GENERIC_STUB.`);
    tree = DIALOGUE_TREES['GENERIC_STUB'];
  }

  const [currentNodeId, setCurrentNodeId] = useState<string>(tree.startNodeId);
  const [typedText, setTypedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  const node: DialogueNode = tree.nodes[currentNodeId];
  const isMenuMode = node.speaker === 'MENU';

  const visibleOptions = node.options.filter(opt => {
    if (opt.requireTrait) {
      if (!playerTraits.some((t: Trait) => t.id === opt.requireTrait)) return false;
    }
    if (opt.requireReputation) {
      const currentRep = playerReputation[opt.requireReputation.factionId] || 0;
      if (currentRep < opt.requireReputation.minPoints) return false;
    }
    if (opt.requireUnlock && !canUnlockNow) return false;
    if (opt.requireQuestId && !activeQuestIds.includes(opt.requireQuestId)) return false;
    return true;
  });

  useEffect(() => {
    let i = 0;
    setTypedText('');
    setIsTyping(true);
    const interval = setInterval(() => {
      setTypedText(node.text.slice(0, i + 1));
      i++;
      if (i > node.text.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 20); // slightly faster for better reading
    return () => clearInterval(interval);
  }, [currentNodeId, node.text]);

  const handleOptionClick = (option: any) => {
    if (isTyping) {
      setTypedText(node.text);
      setIsTyping(false);
      return;
    }

    if (option.cost && playerBits < option.cost) {
      alert('INSUFFICIENT_BIT_CREDITS');
      return;
    }

    if (option.cost) onPay(option.cost);

    if (option.effect === 'GIVE_CARD' && option.cardRewardId) {
      onRewardCard(option.cardRewardId);
    } else if (option.effect === 'GIVE_TRAIT' && option.cardRewardId) {
      onRewardTrait(option.cardRewardId); // Reusing field for trait ID
    } else if (option.effect === 'GIVE_BITS' && option.amount) {
      onRewardBits(option.amount);
    } else if (option.effect === 'RESTORE_HP' && option.amount) {
      onRestoreHp(option.amount);
    } else if (option.effect === 'SET_PROFESSION' && option.cardRewardId) {
      onSetProfession(option.cardRewardId); // Reusing cardRewardId as profId
    } else if (option.effect === 'SET_PROFESSION_WITH_ACADEMY' && option.cardRewardId) {
      onSetProfession(option.cardRewardId);
      if (onAwardQuest) onAwardQuest('q_neon_academy_bootcamp');
    } else if (option.effect === 'START_COMBAT' && option.cardRewardId) {
      onStartCombat(option.cardRewardId);
    } else if (option.effect === 'UNLOCK_CITY' && onUnlockCity) {
      onUnlockCity();
    } else if (option.effect === 'GIVE_XP' && option.amount && onRewardXp) {
      onRewardXp(option.amount);
    } else if (option.reputationReward) {
      onRewardReputation(option.reputationReward.factionId, option.reputationReward.amount);
    }

    if (option.completeQuestId && onCompleteQuest) {
      onCompleteQuest(option.completeQuestId);
    }

    if (option.nextId === 'LEAVE') {
      // Don't call onLeave if we just triggered a screen change effect
      if (option.effect !== 'START_COMBAT' && option.effect !== 'UNLOCK_CITY') {
        onLeave();
      }
    } else {
      setCurrentNodeId(option.nextId);
    }
  };

  // Вспомогательная логика для визуализации Меню Хаба
  const renderHubMenu = () => {
    return (
      <div className="hub-locations-grid">
        {visibleOptions.map((opt, idx) => {
          const cantAfford = opt.cost && playerBits < opt.cost;
          const isLeave = opt.nextId === 'LEAVE';
          
          let Icon = Users;
          let color = 'var(--neon-cyan)';
          
          if (opt.nextId.includes('spider')) { Icon = Cpu; color = 'var(--neon-green)'; }
          else if (opt.nextId.includes('mira')) { Icon = Wine; color = 'var(--neon-pink)'; }
          else if (opt.nextId.includes('ghost')) { Icon = Terminal; color = 'var(--neon-green)'; }
          else if (opt.nextId.includes('oracle')) { Icon = Fingerprint; color = '#a8e063'; }
          else if (opt.nextId.includes('zero')) { Icon = Skull; color = 'var(--neon-pink)'; }
          else if (opt.nextId.includes('junkie')) { Icon = Package; color = '#888'; }
          else if (opt.text.toLowerCase().includes('бармен')) { Icon = Coffee; color = 'var(--neon-amber)'; }
          else if (isLeave) { Icon = LogOut; color = '#555'; }

          return (
            <div 
              key={idx} 
              className={`npc-card neon-panel interactive ${cantAfford ? 'locked' : ''} ${isLeave ? 'leave-card' : ''}`}
              onClick={() => handleOptionClick(opt)}
            >
              <Icon size={48} color={color} className="npc-icon" />
              <div className="npc-details">
                <div className="npc-action">
                  {opt.nextId.includes('npc') && <Users size={16} className="inline mr-2" />}
                  {opt.nextId.includes('bar') && <Wine size={16} className="inline mr-2" />}
                  {opt.nextId.includes('shop') && <Package size={16} className="inline mr-2" />}
                  {opt.nextId.includes('term') && <Terminal size={16} className="inline mr-2" />}
                  {opt.text.split('-')[0]?.trim() || opt.text}
                </div>
                <div className="npc-subtext">{opt.subtext || 'ВЗАИМОДЕЙСТВИЕ AVAILABLE'}</div>
              </div>
              {opt.cost ? <div className="npc-cost">[{opt.cost} BITS]</div> : null}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixer-bar-view animate-float main-crt">
      <div className="scene-header">
        <h2 className="neon-text location-glitch">{locationId.toUpperCase()}_HUB</h2>
        <div className="header-stats">
          <Fingerprint size={16} /> BITS: {playerBits}
        </div>
      </div>

      <div className={`dialogue-container ${isMenuMode ? 'menu-mode' : ''}`}>
        
        {!isMenuMode && (() => {
           let SpeakerIcon = Cpu;
           let speakerColor = 'var(--neon-green)';
           if (node.speaker === 'MIRA') { SpeakerIcon = Wine; speakerColor = 'var(--neon-pink)'; }
           else if (node.speaker === 'SPIDER') { SpeakerIcon = Users; speakerColor = 'var(--neon-cyan)'; }
           else if (node.speaker === 'GHOST') { SpeakerIcon = Terminal; speakerColor = 'var(--neon-amber)'; }
           else if (node.speaker === 'ORACLE') { SpeakerIcon = Fingerprint; speakerColor = '#a8e063'; }
           else if (node.speaker === 'ZERO') { SpeakerIcon = Skull; speakerColor = 'var(--neon-pink)'; }
           else if (node.speaker === 'JUNKIE') { SpeakerIcon = Package; speakerColor = '#888'; }
           else if (node.speaker === 'СЕРЖАНТ') { SpeakerIcon = Shield; speakerColor = 'var(--neon-cyan)'; }

           return (
             <div className="speaker-avatar-v4">
                <div className="avatar-frame" style={{ borderColor: speakerColor }}>
                   <div className="avatar-scanline"></div>
                   <SpeakerIcon size={60} color={speakerColor} className="avatar-icon" />
                </div>
                <div className="speaker-name-v4 neon-text" style={{ color: speakerColor, textShadow: `0 0 10px ${speakerColor}` }}>
                  {node.speaker}
                </div>
                <div className="speaker-id mono-text">[ID_{locationId.toUpperCase().slice(0,8)}]</div>
             </div>
           );
        })()}

        <div className="dialogue-box-v4">
          <div className="text-wrap-v4">
            <div className="dialogue-text-v4 mono-text">
              <span className="text-content">{typedText}</span>
              {isTyping && <span className="terminal-cursor">█</span>}
            </div>
          </div>
          
          {isMenuMode && !isTyping ? renderHubMenu() : (
            <div className="dialogue-options-v4">
              {!isTyping && visibleOptions.map((opt, idx) => {
                const cantAfford = opt.cost && playerBits < opt.cost;
                return (
                  <button
                    key={idx}
                    className={`dialogue-btn-v4 ${cantAfford ? 'locked' : ''}`}
                    onClick={() => handleOptionClick(opt)}
                  >
                    <span className="opt-marker">{cantAfford ? '!!' : '>_'}</span>
                    <span className="opt-text">{opt.text}</span>
                    {opt.cost ? <span className="opt-cost">ƀ{opt.cost}</span> : null}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      {!isMenuMode && (
        <button className="exit-bar-btn mono-text" onClick={onLeave}>
          [ ABORT_CONNECTION ]
        </button>
      )}

      <style>{`
        .fixer-bar-view {
          height: 100%;
          display: flex;
          flex-direction: column;
          padding: 3rem 10%;
          background: #000;
          position: relative;
          overflow: hidden;
        }
        .fixer-bar-view::before {
          content: '';
          position: absolute; top:0; left:0; right:0; bottom:0;
          background: repeating-linear-gradient(0deg, rgba(0,0,0,0) 0px, rgba(0,0,0,0.1) 1px, rgba(0,0,0,0) 2px);
          pointer-events: none;
          z-index: 10;
        }

        .scene-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          border-left: 4px solid var(--neon-cyan);
          padding-left: 20px;
        }
        
        .dialogue-container {
          flex: 1;
          display: flex;
          gap: 4rem;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
        }

        .speaker-avatar-v4 {
          width: 240px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
        }
        .avatar-frame {
          width: 200px;
          height: 200px;
          border: 1px solid;
          background: rgba(0,0,0,0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          box-shadow: 0 0 30px rgba(0,0,0,1);
        }
        .avatar-scanline {
          position: absolute; top:0; left:0; width: 100%; height: 2px;
          background: rgba(255,255,255,0.1);
          animation: scanline 4s linear infinite;
        }
        @keyframes scanline { from { top: 0; } to { top: 100%; } }
        
        .speaker-name-v4 { font-size: 1.8rem; letter-spacing: 4px; font-weight: 900; }
        .speaker-id { font-size: 0.7rem; opacity: 0.4; }

        .dialogue-box-v4 {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 3rem;
          padding-top: 2rem;
        }
        .dialogue-text-v4 {
          font-size: 1.5rem;
          line-height: 1.6;
          color: #fff;
          text-shadow: 0 0 5px rgba(255,255,255,0.2);
          min-height: 150px;
        }
        .terminal-cursor { animation: blink 1s infinite; margin-left: 8px; color: var(--neon-cyan); }
        
        .dialogue-options-v4 {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }
        .dialogue-btn-v4 {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          color: #aaa;
          padding: 1.5rem 2rem;
          display: flex;
          align-items: center;
          gap: 20px;
          font-family: var(--font-mono);
          cursor: pointer;
          transition: 0.2s;
          text-align: left;
        }
        .dialogue-btn-v4:hover:not(.locked) {
          background: rgba(255,255,255,0.08);
          color: var(--neon-cyan);
          border-color: var(--neon-cyan);
          box-shadow: 0 0 20px rgba(0,255,255,0.1);
          transform: translateX(10px);
        }
        .opt-marker { color: var(--neon-cyan); font-weight: bold; width: 30px; }
        .opt-text { flex: 1; font-size: 1.1rem; }
        .opt-cost { color: var(--neon-amber); font-weight: bold; }

        .exit-bar-btn {
          margin-top: 3rem;
          align-self: center;
          background: none;
          border: 1px solid #333;
          color: #555;
          padding: 10px 30px;
          cursor: pointer;
          font-size: 0.8rem;
          transition: 0.2s;
        }
        .exit-bar-btn:hover { border-color: #666; color: #fff; }
      `}</style>
    </div>
  );
};

export default FixerBarScene;
