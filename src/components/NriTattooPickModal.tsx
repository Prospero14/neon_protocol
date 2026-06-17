import React, { useEffect, useState } from 'react';
import { nriApplyHoloTattooPick, nriFetchHoloTattooOptions, type HoloTattooOption } from '../logic/nriApi';
import type { NriPlayerProfile } from '../logic/nriApi';

type Props = {
  inviteCode: string;
  authToken: string;
  profile: NriPlayerProfile;
  onProfileUpdate: (p: NriPlayerProfile) => void;
};

export const NriTattooPickModal: React.FC<Props> = ({ inviteCode, authToken, profile, onProfileUpdate }) => {
  const [options, setOptions] = useState<HoloTattooOption[]>([]);
  const [picked, setPicked] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!authToken) return;
    const sheet = profile.sheet as { pendingHoloTattoo?: boolean } | null | undefined;
    if (!sheet?.pendingHoloTattoo) {
      setOpen(false);
      return;
    }
    nriFetchHoloTattooOptions(authToken, inviteCode).then((res) => {
      if (!res?.pending) {
        setOpen(false);
        return;
      }
      setOptions(res.options);
      setPicked(res.options[0]?.id ?? '');
      setOpen(true);
    });
  }, [authToken, inviteCode, profile.sheet]);

  if (!open) return null;

  const submit = async () => {
    if (!authToken || !picked) return;
    setBusy(true);
    setErr(null);
    const res = await nriApplyHoloTattooPick(authToken, inviteCode, picked);
    setBusy(false);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    onProfileUpdate(res.player);
    setOpen(false);
  };

  return (
    <div className="nri-modal-host" role="dialog" aria-modal="true" aria-labelledby="nri-tattoo-pick-title">
      <div className="nri-modal nri-tattoo-pick">
        <h3 id="nri-tattoo-pick-title" className="mono-text">
          Выбор голо-татуировки
        </h3>
        <p className="mono-text opacity-70">
          Голо-тату проектор установлен. Выберите проекцию один раз — потом сменить нельзя.
        </p>
        <div className="nri-tattoo-pick__list">
          {options.map((o) => (
            <label key={o.id} className={`nri-tattoo-pick__opt ${picked === o.id ? 'active' : ''}`}>
              <input
                type="radio"
                name="holo-tattoo"
                value={o.id}
                checked={picked === o.id}
                onChange={() => setPicked(o.id)}
              />
              <strong>{o.label}</strong>
              <span className="mono-text opacity-70">{o.blurb}</span>
            </label>
          ))}
        </div>
        {err && <p className="mono-text nri-cyber__install-hint warn">{err}</p>}
        <div className="nri-modal__actions">
          <button type="button" className="nri-modal__submit" disabled={busy || !picked} onClick={submit}>
            Зафиксировать тату
          </button>
        </div>
      </div>
    </div>
  );
};
