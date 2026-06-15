import React, { useCallback, useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useAuth } from '../logic/AuthContext';
import { readNeonAuthToken } from '../logic/authTokenStorage';
import {
  nriCreateVehicle,
  nriDeleteVehicle,
  nriFetchVehicles,
  nriPatchVehicle,
  type NriRosterPlayer,
  type NriTableVehicle,
} from '../logic/nriApi';
import { getNriClass } from '../logic/nriClasses';
import { parseNriSheet, abilityModifier } from '../logic/nriNpcGenerator';
import { C2185_ABILITIES } from '../logic/nriCarbon2185';
import { getVehicleDef, NRI_VEHICLE_CATALOG } from '../logic/nriVehicles';
import { NriVehicleCatalogPreview } from './NriSelectionPreview';

type Props = {
  inviteCode: string;
  isHost: boolean;
  roster: NriRosterPlayer[];
};

export const NriTransportPanel: React.FC<Props> = ({ inviteCode, isHost, roster }) => {
  const { token } = useAuth();
  const authToken = readNeonAuthToken() ?? token;
  const [vehicles, setVehicles] = useState<NriTableVehicle[]>([]);
  const [catalogId, setCatalogId] = useState(NRI_VEHICLE_CATALOG[0]?.id ?? 'thornton_galena');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!authToken) return;
    const list = await nriFetchVehicles(authToken, inviteCode);
    setVehicles(list);
  }, [authToken, inviteCode]);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 8000);
    return () => clearInterval(t);
  }, [refresh]);

  const addVehicle = async () => {
    if (!authToken || !isHost) return;
    setBusy(true);
    setErr(null);
    const res = await nriCreateVehicle(authToken, inviteCode, { catalogId });
    setBusy(false);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    await refresh();
  };

  const assign = async (vehicleId: string, userId: string) => {
    if (!authToken || !isHost) return;
    setBusy(true);
    await nriPatchVehicle(authToken, inviteCode, vehicleId, {
      assignedUserId: userId || null,
    });
    setBusy(false);
    await refresh();
  };

  const remove = async (id: string) => {
    if (!authToken || !isHost || !window.confirm('Убрать транспорт со стола?')) return;
    setBusy(true);
    await nriDeleteVehicle(authToken, inviteCode, id);
    setBusy(false);
    await refresh();
  };

  return (
    <div className="nri-transport">
      <h3 className="mono-text">Транспорт стола</h3>
      <p className="mono-text opacity-70">
        Carbon 2185: Body, Speed, места, груз. Водитель — навык {NRI_VEHICLE_CATALOG[0]?.skill ?? 'Vehicles (Land)'}.
        Все игроки видят выданный транспорт и характеристики водителя.
      </p>

      {isHost && (
        <div className="nri-transport__form">
          <select value={catalogId} onChange={(e) => setCatalogId(e.target.value)}>
            {NRI_VEHICLE_CATALOG.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
          <NriVehicleCatalogPreview catalogId={catalogId} />
          <button type="button" className="nri-modal__submit" disabled={busy} onClick={addVehicle}>
            Добавить на стол
          </button>
        </div>
      )}

      {err && <p className="nri-lobby__err mono-text">{err}</p>}

      <ul className="nri-transport__list">
        {vehicles.map((v) => {
          const def = getVehicleDef(v.catalogId);
          const ownerSheet = parseNriSheet(v.ownerSheet);
          const cls = v.ownerClassId ? getNriClass(v.ownerClassId) : null;
          return (
            <li key={v.id} className="nri-transport__card">
              <div className="nri-transport__card-head">
                <strong>{v.label || def?.name || v.catalogId}</strong>
                {isHost && (
                  <button type="button" className="nri-lobby__close" disabled={busy} onClick={() => remove(v.id)}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              {def && (
                <p className="mono-text opacity-70">
                  Body {def.body} · Speed {def.speed} · AC {def.ac} · мест {def.seats} · груз {def.cargoLb} lb ·{' '}
                  {def.skill}
                </p>
              )}
              {def?.blurb && <p className="mono-text opacity-60">{def.blurb}</p>}

              {isHost ? (
                <label className="nri-transport__assign mono-text">
                  <span>Водитель</span>
                  <select
                    value={v.assignedUserId ?? ''}
                    disabled={busy}
                    onChange={(e) => assign(v.id, e.target.value)}
                  >
                    <option value="">— не назначен —</option>
                    {roster.map((p) => (
                      <option key={p.userId} value={p.userId}>
                        {p.displayName}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <p className="mono-text">
                  Водитель: <strong>{v.assignedDisplayName ?? '—'}</strong>
                </p>
              )}

              {v.assignedUserId && ownerSheet && (
                <div className="nri-transport__owner mono-text">
                  <span>
                    {cls?.name ?? v.ownerClassId} · DEX {ownerSheet.abilities.DEX} (
                    {abilityModifier(ownerSheet.abilities.DEX) >= 0 ? '+' : ''}
                    {abilityModifier(ownerSheet.abilities.DEX)}) · {def?.skill}
                  </span>
                  <span className="nri-transport__owner-stats">
                    {C2185_ABILITIES.map((ab) => (
                      <span key={ab}>
                        {ab} {ownerSheet.abilities[ab]}
                      </span>
                    ))}
                  </span>
                </div>
              )}
            </li>
          );
        })}
        {vehicles.length === 0 && (
          <li className="mono-text opacity-50">Транспорт не выдан — мастер добавляет с вкладки.</li>
        )}
      </ul>
    </div>
  );
};
