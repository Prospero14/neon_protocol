import React from 'react';
import { Home, User, Map as MapIcon, Database, Book } from 'lucide-react';

interface ResponsiveNavProps {
  currentView: string;
  onViewChange: (view: any) => void;
  hp: number;
  level: number;
}

const ResponsiveNav: React.FC<ResponsiveNavProps> = ({ currentView, onViewChange, hp, level }) => {
  const navItems = [
    { id: 'HUB', label: 'БАЗА', icon: Home },
    { id: 'CHARACTER', label: 'ПРОФИЛЬ', icon: User },
    { id: 'DECK_BUILDER', label: 'КОЛОДА', icon: Database },
    { id: 'MAP', label: 'РАДАР', icon: MapIcon },
    { id: 'REFERENCE', label: 'ДОКИ', icon: Book },
  ];

  return (
    <nav className="game-nav">
      <div className="nav-brand mono-text">
        <span className="brand-icon">◆</span>
        NEON_PROTOCOL
        <span className="brand-ver">v0.07</span>
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
        <span className="nav-hp">❤ {hp}%</span>
        <span className="nav-lvl">LVL {level}</span>
      </div>
    </nav>
  );
};

export default ResponsiveNav;
