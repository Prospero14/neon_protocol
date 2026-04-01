import React, { useState, useEffect } from 'react';
import { DIALOGUE_TREES } from '../logic/dialogues';
import type { DialogueNode } from '../logic/dialogues';
import type { Trait } from '../logic/traits';
import { Terminal, LogOut, Cpu, Fingerprint, Users, Wine, Coffee, Skull, Package } from 'lucide-react';

interface FixerBarSceneProps {
  locationId: string; // 'kitay_gorod', 'vdnkh', 'komsomolskaya', 'chertanovo'
  playerBits: number;
  playerTraits: Trait[];
  onPay: (amount: number) => void;
  onRewardCard: (cardId: string) => void;
  onRewardTrait: (traitId: string) => void;
  onRewardBits: (amount: number) => void;
  onRestoreHp: (amount: number) => void;
  onSetProfession: (profId: string) => void;
  onStartCombat: (combatId: string) => void;
  onUnlockCity?: () => void;
  onLeave: () => void;
}

const FixerBarScene: React.FC<FixerBarSceneProps> = ({
  locationId,
  playerBits,
  playerTraits,
  onPay,
  onRewardCard,
  onRewardTrait,
  onRewardBits,
  onRestoreHp,
  onSetProfession,
  onStartCombat,
  onUnlockCity,
  onLeave
}) => {
  const tree = DIALOGUE_TREES[locationId];
  
  if (!tree) {
    return <div style={{color:'red'}}>ERROR: NO DIALOGUE TREE FOUND FOR {locationId}</div>;
  }

  const [currentNodeId, setCurrentNodeId] = useState<string>(tree.startNodeId);
  const [typedText, setTypedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  const node: DialogueNode = tree.nodes[currentNodeId];
  const isMenuMode = node.speaker === 'MENU';

  const visibleOptions = node.options.filter(opt => {
    if (opt.requireTrait) {
      return playerTraits.some(t => t.id === opt.requireTrait);
    }
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
    } else if (option.effect === 'START_COMBAT' && option.cardRewardId) {
      onStartCombat(option.cardRewardId);
    } else if (option.effect === 'UNLOCK_CITY' && onUnlockCity) {
      onUnlockCity();
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
                <div className="npc-action">{opt.text.split('-')[0]?.trim() || opt.text}</div>
                {opt.text.split('-')[1] && <div className="npc-subtext mono-text">{opt.text.split('-')[1].trim()}</div>}
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

      <div className={`dialogue-container neon-panel ${isMenuMode ? 'menu-mode' : ''}`}>
        
        {!isMenuMode && (() => {
           let SpeakerIcon = Cpu;
           let speakerColor = 'var(--neon-green)';
           if (node.speaker === 'MIRA') { SpeakerIcon = Wine; speakerColor = 'var(--neon-pink)'; }
           else if (node.speaker === 'SPIDER') { SpeakerIcon = Users; speakerColor = 'var(--neon-cyan)'; }
           else if (node.speaker === 'GHOST') { SpeakerIcon = Terminal; speakerColor = 'var(--neon-amber)'; }
           else if (node.speaker === 'ORACLE') { SpeakerIcon = Fingerprint; speakerColor = '#a8e063'; }
           else if (node.speaker === 'ZERO') { SpeakerIcon = Skull; speakerColor = 'var(--neon-pink)'; }
           else if (node.speaker === 'JUNKIE') { SpeakerIcon = Package; speakerColor = '#888'; }

           return (
             <div className="speaker-avatar">
               <div className="avatar-noise" style={{ borderColor: speakerColor }}>
                  <SpeakerIcon size={70} color={speakerColor} />
               </div>
               <div className="speaker-name neon-text">{node.speaker}</div>
             </div>
           );
        })()}

        <div className="dialogue-box">
          <div className="dialogue-text mono-text" style={{ color: isMenuMode ? 'var(--neon-amber)' : '#fff', fontSize: isMenuMode ? '1.1rem' : '1.25rem' }}>
            {typedText}
            {isTyping && <span className="cursor">_</span>}
          </div>
          
          {isMenuMode && !isTyping ? renderHubMenu() : (
            <div className="dialogue-options">
              {!isTyping && visibleOptions.map((opt, idx) => {
                const cantAfford = opt.cost && playerBits < opt.cost;
                return (
                  <button
                    key={idx}
                    className={`dialogue-btn ${cantAfford ? 'locked' : ''}`}
                    onClick={() => handleOptionClick(opt)}
                  >
                    <Terminal size={14} />
                    <span className="opt-text">{opt.text}</span>
                    {opt.cost ? <span className="opt-cost">[-{opt.cost} BITS]</span> : null}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      {!isMenuMode && (
        <button className="back-btn logout-bar" onClick={onLeave}>
          <LogOut size={16} /> [ EXIT_CONNECTION ]
        </button>
      )}

      <style>{`
        .fixer-bar-view {
          height: 100%;
          display: flex;
          flex-direction: column;
          padding: 2rem;
          background: radial-gradient(circle at center, #111 0%, #000 100%);
          color: var(--neon-cyan);
        }
        .scene-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          border-bottom: 1px solid var(--glass-border);
          padding-bottom: 1rem;
        }
        .location-glitch { font-size: 2rem; text-shadow: 0 0 10px var(--neon-cyan), 2px 0 var(--neon-pink), -2px 0 var(--neon-amber); }
        .header-stats { display: flex; align-items: center; gap: 8px; font-family: var(--font-mono); font-weight: bold; background: rgba(0,0,0,0.5); padding: 8px 16px; border-radius: 4px; border: 1px solid var(--neon-cyan); }
        
        .dialogue-container {
          flex: 1;
          display: flex;
          gap: 2rem;
          background: rgba(0, 20, 20, 0.4);
          padding: 2rem;
          box-shadow: inset 0 0 50px rgba(0, 255, 255, 0.05);
          transition: all 0.5s ease;
        }
        .dialogue-container.menu-mode {
          background: rgba(20, 10, 0, 0.4);
          box-shadow: inset 0 0 50px rgba(255, 191, 0, 0.1);
          flex-direction: column;
        }
        
        .speaker-avatar {
          width: 250px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          border-right: 1px solid var(--glass-border);
          padding-right: 2rem;
        }

        .avatar-noise {
          width: 180px;
          height: 180px;
          border: 2px dashed;
          border-color: var(--neon-green);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          background: repeating-linear-gradient(0deg, rgba(0,255,0,0.1), rgba(0,255,0,0.1) 1px, transparent 1px, transparent 2px);
          animation: glitch-anim 2s infinite alternate;
        }
        @keyframes glitch-anim {
          0% { filter: hue-rotate(0deg) contrast(1); }
          100% { filter: hue-rotate(45deg) contrast(1.5); }
        }
        .speaker-name {
          font-size: 2rem;
          letter-spacing: 0.2rem;
          text-align: center;
        }

        .dialogue-box {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        .dialogue-text {
          font-size: 1.25rem;
          line-height: 1.6;
          min-height: 80px;
          text-shadow: 0 0 2px rgba(0,0,0,0.8);
          background: rgba(0,0,0,0.5);
          padding: 1rem;
          border-radius: 4px;
          border-left: 3px solid currentColor;
        }
        .cursor {
          animation: blink 1s step-end infinite;
        }
        @keyframes blink { 50% { opacity: 0; } }

        /* Dialog UI */
        .dialogue-options {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: auto;
        }
        .dialogue-btn {
          background: rgba(0, 255, 255, 0.05);
          border: 1px solid var(--glass-border);
          color: var(--neon-cyan);
          padding: 1rem 1.5rem;
          display: flex;
          align-items: center;
          gap: 16px;
          font-family: var(--font-mono);
          font-size: 1.1rem;
          cursor: pointer;
          transition: 0.2s;
          text-align: left;
          border-radius: 4px;
        }
        .dialogue-btn:hover:not(.locked) {
          background: var(--neon-cyan);
          color: #000;
          box-shadow: 0 0 15px var(--neon-cyan-glow);
          transform: translateX(10px);
        }
        .dialogue-btn.locked {
          opacity: 0.5;
          cursor: not-allowed;
          border-color: var(--neon-pink);
          color: var(--neon-pink);
        }
        .opt-text { flex: 1; }
        .opt-cost { font-weight: bold; background: rgba(0,0,0,0.4); padding: 4px 8px; border-radius: 4px; border: 1px solid currentColor; }
        
        /* Hub Menu Grid UI */
        .hub-locations-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin-top: 1rem;
        }
        .npc-card {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 1.5rem;
          background: rgba(0,0,0,0.6);
          border: 1px solid rgba(255,191,0,0.3);
          border-radius: 8px;
          cursor: pointer;
          transition: 0.3s;
          position: relative;
          overflow: hidden;
        }
        .npc-card::before {
          content: '';
          position: absolute; top:0; left:0; right:0; bottom:0;
          background: linear-gradient(45deg, transparent, rgba(255,191,0,0.05), transparent);
          transform: translateX(-100%);
          transition: transform 0.6s;
        }
        .npc-card:hover:not(.locked)::before {
          transform: translateX(100%);
        }
        .npc-card:hover:not(.locked) {
          border-color: var(--neon-amber);
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(255,191,0,0.1);
        }
        .leave-card {
          border-color: #333;
          opacity: 0.8;
        }
        .leave-card:hover:not(.locked) {
          border-color: #777;
          box-shadow: none;
        }
        .npc-card.locked {
           opacity: 0.5;
           cursor: not-allowed;
           border-color: var(--neon-pink);
        }
        .npc-details {
          flex: 1;
        }
        .npc-action {
          font-size: 1.2rem;
          font-weight: bold;
          color: #fff;
          margin-bottom: 4px;
        }
        .npc-subtext {
          font-size: 0.85rem;
          color: #888;
        }
        .npc-cost {
          font-weight: bold;
          color: var(--neon-amber);
          background: rgba(0,0,0,0.5);
          padding: 4px 8px;
          border-radius: 4px;
        }
        .npc-icon {
          flex-shrink: 0;
          filter: drop-shadow(0 0 5px currentColor);
        }

        .logout-bar {
          margin-top: 1rem;
          align-self: flex-start;
          border-color: var(--neon-amber);
          color: var(--neon-amber);
        }
        .logout-bar:hover {
          background: rgba(255,191,0,0.1);
        }
      `}</style>
    </div>
  );
};

export default FixerBarScene;
