import { useState, useEffect, useRef } from 'react';
import type { Trait } from '../../logic/traits';

interface TaxiRaceProps {
  playerTraits: Trait[];
  onFinish: (bitsEarned: number) => void;
}

type GameStatus = 'PREP' | 'PLAYING' | 'GAMEOVER';
type ControlType = 'KEYBOARD' | 'MOUSE';

/**
 * TaxiRace 2.0 - С подготовкой, выбором управления и влиянием трейтов.
 */
const TaxiRace: React.FC<TaxiRaceProps> = ({ playerTraits, onFinish }) => {
  const [status, setStatus] = useState<GameStatus>('PREP');
  const [controls, setControls] = useState<ControlType>('KEYBOARD');
  
  const [lane, setLane] = useState(1);
  const [score, setScore] = useState(0);
  const [obstacles, setObstacles] = useState<{ id: number; lane: number; y: number }[]>([]);

  // Влияние трейтов
  const hasReactionBoost = playerTraits.some(t => t.id === 'reaction_boost');
  const hasNitro = playerTraits.some(t => t.id === 'nitro_injection');
  
  const gameSpeed = hasReactionBoost ? 40 : 50; // Замедление препятствий

  /**
   * УПРАВЛЕНИЕ: Клавиатура
   */
  useEffect(() => {
    if (status !== 'PLAYING' || controls !== 'KEYBOARD') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'a' || e.key === 'ArrowLeft') setLane(l => Math.max(0, l - 1));
      if (e.key === 'd' || e.key === 'ArrowRight') setLane(l => Math.min(2, l + 1));
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, controls]);

  /**
   * УПРАВЛЕНИЕ: Мышь (движение за курсором)
   */
  const handleMouseMove = (e: React.MouseEvent) => {
    if (status !== 'PLAYING' || controls !== 'MOUSE') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newLane = Math.floor((x / rect.width) * 3);
    setLane(Math.max(0, Math.min(2, newLane)));
  };

  // Используем ref для lane, чтобы не пересоздавать интервал при каждом движении
  const laneRef = useRef(lane);
  useEffect(() => { laneRef.current = lane; }, [lane]);

  /**
   * ИГРОВОЙ ЦИКЛ & КОЛЛИЗИИ
   */
  useEffect(() => {
    if (status !== 'PLAYING') return;

    const gameLoop = setInterval(() => {
      setObstacles((prev) => {
        const next = prev
          .map((obs) => ({ ...obs, y: obs.y + (hasNitro ? 7 : 5) }))
          .filter((obs) => obs.y < 100);

        // Проверка коллизий внутри цикла (без каскадных рендеров)
        const crash = next.some(obs => obs.lane === laneRef.current && obs.y > 80 && obs.y < 95);
        if (crash) {
          setStatus('GAMEOVER');
          clearInterval(gameLoop);
        }
        return next;
      });

      setObstacles((prev) => {
         if (Math.random() < 0.1) {
            return [...prev, { id: Date.now(), lane: Math.floor(Math.random() * 3), y: 0 }];
         }
         return prev;
      });

      setScore((s) => s + 1);
    }, gameSpeed);

    return () => clearInterval(gameLoop);
  }, [status, hasNitro, gameSpeed]);

  return (
    <div className="game-overlay taxi-game-v2">
      {/* ЭКРАН ПОДГОТОВКИ */}
      {status === 'PREP' && (
        <div className="prep-screen">
          <h2 className="neon-text">VYKHINO_RUSH: PRE_FLIGHT_CHECK</h2>
          
          <div className="prep-details">
            <div className="traits-impact">
              <h3 className="mono-text">DETECTED_TRAITS:</h3>
              {playerTraits.filter(t => t.type === 'RACING').map(t => (
                <div key={t.id} className="trait-line neon-green">{">> "} {t.name}: {t.description}</div>
              ))}
              {playerTraits.filter(t => t.type === 'RACING').length === 0 && <div className="opacity-50">NO_RACING_MODS_FOUND</div>}
            </div>

            <div className="control-selector">
              <h3 className="mono-text">CHOOSE_INTERFACE:</h3>
              <button 
                className={`control-btn ${controls === 'KEYBOARD' ? 'active' : ''}`}
                onClick={() => setControls('KEYBOARD')}
              >
                [ KEYBOARD_WASD ]
              </button>
              <button 
                className={`control-btn ${controls === 'MOUSE' ? 'active' : ''}`}
                onClick={() => setControls('MOUSE')}
              >
                [ MOUSE_LINK ]
              </button>
            </div>
          </div>

          <button className="start-btn neon-border" onClick={() => setStatus('PLAYING')}>
            [ INITIATE_DELIVERY ]
          </button>
        </div>
      )}

      {/* ИГРОВОЙ ПРОЦЕСС */}
      {status === 'PLAYING' && (
        <div className="game-screen" onMouseMove={handleMouseMove}>
          <div className="game-header">
            <div className="mono-text">SCORE: {score}</div>
            <div className="mono-text">BITS: {Math.floor(score / 10)} UC</div>
          </div>
          <div className="race-track">
            <div className="lane"></div><div className="lane"></div><div className="lane"></div>
            {obstacles.map(obs => (
              <div key={obs.id} className="obstacle" style={{ left: `${obs.lane * 33.3}%`, top: `${obs.y}%` }}></div>
            ))}
            <div className="player-car" style={{ left: `${lane * 33.3}%` }}>
              <div className="propulsion-flare"></div>
            </div>
          </div>
        </div>
      )}

      {/* ФИНАЛ */}
      {status === 'GAMEOVER' && (
        <div className="game-over-screen">
          <h2 className="neon-purple">CONNECTION_CRASHED</h2>
          <p className="mono-text">EARNED: {Math.floor(score / 10)} UC</p>
          <button className="action-button neon-border" onClick={() => onFinish(Math.floor(score / 10))}>
            [ EXTRACT_AND_EXIT ]
          </button>
        </div>
      )}
    </div>
  );
};

export default TaxiRace;
