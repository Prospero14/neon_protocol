import React from 'react';
import { Home, User, Map as MapIcon, Database, Book, ClipboardList } from 'lucide-react';

interface ResponsiveNavProps {
  currentView: string;
  onViewChange: (view: any) => void;
  hp: number;
  maxStress: number;
  level: number;
  onLogout?: () => void;
  /** Строка игровых часов для верхней панели. */
  gameClockLine?: string;
}

const ResponsiveNav: React.FC<ResponsiveNavProps> = ({ currentView, onViewChange, hp, maxStress, level, onLogout, gameClockLine }) => {
  const navItems = [
    { id: 'HUB', label: 'БАЗА', icon: Home },
    { id: 'CHARACTER', label: 'ПРОФИЛЬ', icon: User },
    { id: 'DECK_BUILDER', label: 'КОЛОДА', icon: Database },
    { id: 'MAP', label: 'РАДАР', icon: MapIcon },
    { id: 'QUEST_LOG', label: 'БЭКЛОГ', icon: ClipboardList },
    { id: 'REFERENCE', label: 'ДОКИ', icon: Book },
  ];

  return (
    <nav className="game-nav">
      <div className="nav-brand mono-text">
        <span className="brand-icon">◆</span>
        НЕОН_ПРОТОКОЛ
        <span className="brand-ver">v0.09</span>
      </div>
      <div className="nav-links">
        {navItems.map((item) => (
          <button 
            key={item.id} 
            className={`nav-link ${currentView === item.id ? 'active' : ''}`}
            onClick={() => onViewChange(item.id)}
          >
            <item.icon size={16} />
            <span>{item.label}</span>
          </button>
        ))}
      </div>
      <div className="nav-stats mono-text">
        {gameClockLine && (
          <span className="nav-game-clock" title="Игровое время (12 ч игры = 4 ч реальных)">
            {gameClockLine}
          </span>
        )}
        <span className="nav-hp">STRESS: {Math.round((hp/maxStress)*100)}%</span>
        <span className="nav-lvl">STATUS: {level >= 5 ? 'PROFESSIONAL' : 'SCRIPT-KIDDO'}</span>
        {onLogout && (
          <button className="nav-logout-btn" onClick={onLogout} title="ВЫХОД">
            ✖
          </button>
        )}
      </div>
    </nav>
  );
};

export default ResponsiveNav;
