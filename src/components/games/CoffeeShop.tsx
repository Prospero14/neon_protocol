import { useState, useEffect } from 'react';

/**
 * Характеристики игры Кофе-Шоп.
 */
interface CoffeeShopProps {
  onFinish: (bitsEarned: number) => void;
}

/**
 * CoffeeShop - мини-игра на соответствие последовательности.
 */
const CoffeeShop: React.FC<CoffeeShopProps> = ({ onFinish }) => {
  const [targetSequence, setTargetSequence] = useState<string[]>([]);
  const [userSequence, setUserSequence] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);

  const INGREDIENTS = ['ROAST_BEANS', 'HOT_WATER', 'VIRTUAL_MILK', 'BIT_SYRUP'];

  /**
   * Генерация новой последовательности "рецепта"
   */
  const generateNewRecipe = () => {
    const newSeq = [];
    for (let i = 0; i < 3; i++) {
      newSeq.push(INGREDIENTS[Math.floor(Math.random() * INGREDIENTS.length)]);
    }
    setTargetSequence(newSeq);
    setUserSequence([]);
  };

  /**
   * Инициализация
   */
  useEffect(() => {
    generateNewRecipe();
    
    // Таймер игры
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  /**
   * Трейт "Оптимизация кэша" (из будущих фич) может ускорять таймер
   */
  useEffect(() => {
    if (timeLeft === 0) {
      // Когда время вышло
    }
  }, [timeLeft]);

  /**
   * Обработка нажатия на ингредиент
   */
  const handleIngredientClick = (ing: string) => {
    if (timeLeft === 0) return;

    const nextUserSeq = [...userSequence, ing];
    setUserSequence(nextUserSeq);

    // Проверяем, совпадает ли текущий выбор с целью
    if (targetSequence[nextUserSeq.length - 1] === ing) {
      if (nextUserSeq.length === targetSequence.length) {
        // Рецепт собран!
        setScore((s) => s + 10);
        generateNewRecipe();
      }
    } else {
      // Ошибка! Сбрасываем текущий рецепт
      setUserSequence([]);
    }
  };

  return (
    <div className="game-overlay coffee-game">
      <div className="game-header">
        <h2 className="neon-text">SYSTEM_BREW: MARKET_OVERLAY</h2>
        <div className="hub-stats">
          <div className="mono-text">TIME: {timeLeft}s</div>
          <div className="mono-text">EARNED_BITS: {score} UC</div>
        </div>
      </div>

      <div className="order-panel">
        <h3 className="mono-text">[ TARGET_RECIPE ]</h3>
        <div className="recipe-display">
          {targetSequence.map((ing, idx) => (
            <div 
              key={idx} 
              className={`recipe-step ${userSequence.length > idx ? 'complete' : ''}`}
            >
              {ing}
            </div>
          ))}
        </div>
      </div>

      {timeLeft > 0 ? (
        <div className="interaction-area">
          <div className="ingredients-grid">
            {INGREDIENTS.map((ing) => (
              <button 
                key={ing} 
                className="ingredient-btn neon-border" 
                onClick={() => handleIngredientClick(ing)}
              >
                {ing}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="game-over-screen">
          <h3 className="neon-green">ORDER_SEQUENCE_COMPLETE</h3>
          <p>LOGS EXTRACTED SUCCESSFULLY</p>
          <button 
            className="action-button neon-border" 
            onClick={() => onFinish(score)}
          >
            [ EXTRACT_BITS_AND_EXIT ]
          </button>
        </div>
      )}
    </div>
  );
};

export default CoffeeShop;
