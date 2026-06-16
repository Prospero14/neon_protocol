import React from 'react';
import { Construction } from 'lucide-react';

type Props = {
  inviteCode?: string | null;
  onLeave: () => void;
};

export const NriInDevelopmentView: React.FC<Props> = ({ inviteCode, onLeave }) => (
  <div className="nri-dev-gate main-crt">
    <div className="nri-dev-gate__panel">
      <Construction size={40} className="nri-dev-gate__icon" aria-hidden />
      <div className="nri-dev-gate__kicker mono-text">NEON_PROTOCOL // НРИ</div>
      <h1 className="nri-dev-gate__title">В разработке</h1>
      <p className="nri-dev-gate__text mono-text">
        Настольный режим по приглашению пока недоступен на этом сервере.
        {inviteCode ? (
          <>
            {' '}
            Код стола <strong>{inviteCode}</strong> сохранён — зайдите позже.
          </>
        ) : (
          ' Зайдите позже или свяжитесь с мастером.'
        )}
      </p>
      <p className="nri-dev-gate__hint mono-text opacity-70">
        Solo и Co-op доступны с экрана выбора режима.
      </p>
      <button type="button" className="session-resume-btn session-resume-btn--solo" onClick={onLeave}>
        К выбору режима
      </button>
    </div>
  </div>
);
