import React from 'react';
import { Skull, ShieldAlert, Radio } from 'lucide-react';

type Props = {
  tableAllBanned?: boolean;
  onClose: () => void;
  onOpenInventory?: () => void;
};

export const IceHardwareBanPopup: React.FC<Props> = ({
  tableAllBanned,
  onClose,
  onOpenInventory,
}) => (
  <div className="ice-ban-overlay" role="dialog" aria-modal="true" aria-labelledby="ice-ban-title">
    <div className="ice-ban-modal">
      <div className="ice-ban-skulls" aria-hidden>
        <Skull size={28} />
        <Skull size={36} className="ice-ban-skulls__main" />
        <Skull size={28} />
      </div>
      <p className="ice-ban-kicker mono-text">CORPSEC // TRACE LOCK</p>
      <h3 id="ice-ban-title" className="ice-ban-title">
        БАН ПО ЖЕЛЕЗУ
      </h3>
      <p className="ice-ban-text">
        Ваш MAC и нейро-подпись зафиксированы. ICE передал дамп в{' '}
        <strong>полицию</strong> и <strong>отдел кибербезопасности</strong>.
      </p>
      <p className="ice-ban-text ice-ban-text--warn">
        <ShieldAlert size={14} /> Прямой джек-ин с этого железа заблокирован.
      </p>
      {tableAllBanned ? (
        <p className="ice-ban-text ice-ban-text--table">
          <Radio size={14} /> Весь стол в тени. Чтобы снова взломать систему, обновите{' '}
          <strong>нейролинк</strong> (имплант в слот neural) или достаньте{' '}
          <strong>«Кибер-деку»</strong> — левая дека с незасвеченным железом.
        </p>
      ) : (
        <p className="ice-ban-text ice-ban-text--hint">
          Обновите <strong>нейролинк</strong> или купите <strong>«Кибер-деку»</strong> (незасвеченное железо).
        </p>
      )}
      <div className="ice-ban-actions">
        {onOpenInventory && (
          <button type="button" className="ice-btn" onClick={onOpenInventory}>
            ИНВЕНТАРЬ
          </button>
        )}
        <button type="button" className="ice-btn primary" onClick={onClose}>
          [ ОТКЛЮЧИТЬСЯ ]
        </button>
      </div>
    </div>
  </div>
);
