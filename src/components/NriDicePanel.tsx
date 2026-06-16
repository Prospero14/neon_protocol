import React, { useCallback, useState } from 'react';
import { Dices } from 'lucide-react';
import { sendNriChatMessage } from '../logic/nriChatDispatch';
import { DICE_SIDES_OPTIONS, formatDiceRollMessage, rollDice, type DiceRollResult } from '../logic/nriDice';
import { NriChatSendBar } from './NriChatSendBar';
import type { VaultRecipient } from './NriVaultTab';

type Props = {
  authToken: string;
  roomId: string;
  nriCode: string;
  recipients: VaultRecipient[];
  currentUserId?: string;
};

export const NriDicePanel: React.FC<Props> = ({
  authToken,
  roomId,
  nriCode,
  recipients,
  currentUserId,
}) => {
  const [count, setCount] = useState(1);
  const [sides, setSides] = useState<4 | 6 | 8 | 10 | 12 | 20 | 100>(20);
  const [modifier, setModifier] = useState(0);
  const [result, setResult] = useState<DiceRollResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const doRoll = useCallback(() => {
    const r = rollDice(count, sides, modifier);
    setResult(r);
    return r;
  }, [count, sides, modifier]);

  const sendRoll = async (target: { kind: 'table' } | { kind: 'dm'; userId: string }, roll?: DiceRollResult) => {
    const r = roll ?? result ?? doRoll();
    setResult(r);
    setBusy(true);
    setNotice(null);
    const text = formatDiceRollMessage(r);
    const ok = await sendNriChatMessage(authToken, roomId, nriCode, text, target);
    setBusy(false);
    setNotice(ok ? (target.kind === 'table' ? 'Бросок в чат стола' : 'Бросок в личку') : 'Не удалось отправить');
  };

  return (
    <div className="nri-dice-panel">
      <header className="nri-dice-panel__head">
        <Dices size={18} />
        <div>
          <h3 className="nri-dice-panel__title">Кубики</h3>
          <p className="mono-text nri-dice-panel__hint">Бросок виден только вам, пока не отправите в чат.</p>
        </div>
      </header>

      <div className="nri-dice-panel__controls mono-text">
        <label>
          Кубов
          <input
            type="number"
            min={1}
            max={20}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
          />
        </label>
        <label>
          Тип
          <select value={sides} onChange={(e) => setSides(Number(e.target.value) as typeof sides)}>
            {DICE_SIDES_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Мод
          <input
            type="number"
            min={-20}
            max={20}
            value={modifier}
            onChange={(e) => setModifier(Number(e.target.value) || 0)}
          />
        </label>
        <button type="button" className="nri-modal__submit" onClick={() => doRoll()}>
          Бросить
        </button>
      </div>

      {result && (
        <div className="nri-dice-panel__result" aria-live="polite">
          <span className="nri-dice-panel__formula">
            {result.count}d{result.sides}
            {result.modifier ? (result.modifier > 0 ? `+${result.modifier}` : result.modifier) : ''}
          </span>
          <span className="nri-dice-panel__rolls">[{result.rolls.join(' + ')}]</span>
          <span className="nri-dice-panel__total">= {result.total}</span>
        </div>
      )}

      <NriChatSendBar
        recipients={recipients}
        currentUserId={currentUserId}
        busy={busy}
        label="Отправить бросок"
        onSend={(target) => sendRoll(target)}
      />

      {notice && <p className="mono-text nri-dice-panel__notice">{notice}</p>}
    </div>
  );
};
