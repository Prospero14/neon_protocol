import React from 'react';
import { QUEST_LIBRARY } from '../logic/questData';
import { type QuestState } from '../logic/questEngine';
import { CheckCircle, Clock, Shield, Search, Terminal } from 'lucide-react';

interface QuestLogProps {
  questStates: QuestState[];
  onBack: () => void;
}

const difficultyMultiplier = {
  'quick': 1,
  'standard': 2,
  'hard': 3
};

const QuestLog: React.FC<QuestLogProps> = ({ questStates, onBack }) => {
  const activeQuests = questStates.filter(s => s.status === 'active');
  const completedQuests = questStates.filter(s => s.status === 'completed');

  const renderQuestCard = (state: QuestState, isCompleted: boolean) => {
    const q = QUEST_LIBRARY.find(x => x.id === state.questId);
    if (!q) return null;

    return (
      <div key={state.questId} className={`quest-log-card ${isCompleted ? 'completed' : 'active'}`}>
        <div className="quest-card-header">
          <div className="quest-type-tag">
            {q.type === 'combat' && <Shield size={12} />}
            {q.type === 'talk' && <Terminal size={12} />}
            {q.type === 'delivery' && <Search size={12} />}
            <span>
              {q.type === 'combat' ? 'БОЕВОЙ_КОНТРАКТ' : 
               q.type === 'talk' ? 'ИНФО_ЗАПРОС' : 
               'ДОСТАВКА_ПАКЕТОВ'}
            </span>
          </div>
          <div className="quest-tier">УРОВЕНЬ_{q.tier}</div>
        </div>
        
        <h3 className="quest-title">{q.title.includes(']') ? q.title.split(']')[1].trim() : q.title}</h3>
        <p className="quest-desc mono-text">{q.description}</p>
        
        <div className="quest-card-footer">
          <div className="quest-status">
            {isCompleted ? (
              <><CheckCircle size={14} className="icon-done" /> <span>КОНТРАКТ_ВЫПОЛНЕН</span></>
            ) : (
              <><Clock size={14} className="icon-active" /> <span>АКТИВНАЯ_ДИРЕКТИВА</span></>
            )}
          </div>
          <div className="quest-reward">
            НАГРАДА: <span className="bits-val">ƀ{difficultyMultiplier[q.difficulty] * 50}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="quest-log-view animate-float">
      <header className="log-header">
        <h1 className="neon-text glow-cyan">ЖУРНАЛ_КОНТРАКТОВ <span className="log-count">[{questStates.length}]</span></h1>
        <button className="back-btn-v4 mono-text" onClick={onBack}>[ ВЕРНУТЬСЯ_В_ХАБ ]</button>
      </header>

      <div className="log-grid">
        <section className="log-section">
          <h2 className="section-title active"><Clock size={18} /> ТЕКУЩИЕ_ДИРЕКТИВЫ</h2>
          <div className="quest-list">
            {activeQuests.length === 0 ? (
              <div className="empty-log mono-text">АКТИВНЫХ_КОНТРАКТОВ_НЕ_НАЙДЕНО</div>
            ) : (
              activeQuests.map(s => renderQuestCard(s, false))
            )}
          </div>
        </section>

        <section className="log-section">
          <h2 className="section-title completed"><CheckCircle size={18} /> ИСТОРИЯ_МИССИЙ</h2>
          <div className="quest-list">
            {completedQuests.length === 0 ? (
              <div className="empty-log mono-text">АРХИВ_ПУСТ</div>
            ) : (
              completedQuests.map(s => renderQuestCard(s, true))
            )}
          </div>
        </section>
      </div>

      <style>{`
        .quest-log-view {
          height: 100%;
          display: flex;
          flex-direction: column;
          padding: 2rem 5%;
          background: #000;
        }
        .log-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 3rem;
          border-bottom: 1px solid rgba(0, 255, 255, 0.2);
          padding-bottom: 1rem;
        }
        .log-count { font-size: 1rem; opacity: 0.5; margin-left: 10px; }
        
        .log-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3rem;
          flex: 1;
          overflow-y: auto;
          padding-bottom: 2rem;
        }
        
        .section-title {
          font-family: var(--font-mono);
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 1.2rem;
          margin-bottom: 1.5rem;
          letter-spacing: 2px;
        }
        .section-title.active { color: var(--neon-cyan); }
        .section-title.completed { color: var(--neon-green); opacity: 0.7; }

        .quest-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .quest-log-card {
          background: rgba(0, 255, 255, 0.03);
          border: 1px solid rgba(0, 255, 255, 0.1);
          padding: 1.5rem;
          position: relative;
          transition: 0.3s;
        }
        .quest-log-card:hover {
          background: rgba(0, 255, 255, 0.07);
          border-color: var(--neon-cyan);
          transform: translateX(5px);
        }
        .quest-log-card.completed {
          background: rgba(0, 255, 0, 0.02);
          border-color: rgba(0, 255, 0, 0.1);
          opacity: 0.6;
        }

        .quest-card-header {
          display: flex;
          justify-content: space-between;
          font-size: 0.7rem;
          font-family: var(--font-mono);
          margin-bottom: 1rem;
          opacity: 0.6;
        }
        .quest-type-tag { display: flex; align-items: center; gap: 6px; }
        
        .quest-title {
          font-size: 1.3rem;
          margin-bottom: 1rem;
          color: #fff;
        }
        .quest-desc {
          font-size: 0.85rem;
          line-height: 1.5;
          color: #aaa;
          margin-bottom: 1.5rem;
        }

        .quest-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding-top: 1rem;
          font-family: var(--font-mono);
          font-size: 0.75rem;
        }
        .quest-status { display: flex; align-items: center; gap: 8px; }
        .icon-active { color: var(--neon-cyan); }
        .icon-done { color: var(--neon-green); }
        .bits-val { color: var(--neon-amber); font-weight: bold; }

        .empty-log {
          padding: 3rem;
          text-align: center;
          border: 1px dashed #333;
          color: #444;
          font-size: 0.8rem;
        }

        .back-btn-v4 {
          background: none;
          border: 1px solid #333;
          color: #666;
          padding: 8px 16px;
          cursor: pointer;
          transition: 0.2s;
        }
        .back-btn-v4:hover { border-color: var(--neon-cyan); color: #fff; }
      `}</style>
    </div>
  );
};

export default QuestLog;
