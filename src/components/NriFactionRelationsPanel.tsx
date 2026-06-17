import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Save, Users } from 'lucide-react';
import { nriFetchLore, nriPatchFactionRelations } from '../logic/nriApi';
import type { NriFaction, FactionRelationMatrix } from '../logic/nriLore';
import {
  FACTION_STANCES,
  getFactionRelation,
  isFactionRelationsActive,
  relationKey,
  type FactionStance,
} from '../../shared/nri-domain/factionRelations';

type Props = {
  inviteCode: string;
  authToken: string;
};

export const NriFactionRelationsPanel: React.FC<Props> = ({ inviteCode, authToken }) => {
  const [factions, setFactions] = useState<NriFaction[]>([]);
  const [matrix, setMatrix] = useState<FactionRelationMatrix>({ enabled: false, edges: {} });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!authToken) return;
    const loreRes = await nriFetchLore(authToken, inviteCode);
    if (!loreRes.ok) {
      setErr(loreRes.error || 'Не удалось загрузить фракции. Создайте их во вкладке «Лор».');
      return;
    }
    const lore = loreRes.data;
    setErr(null);
    setFactions(lore.factions);
    setMatrix(lore.factionRelations ?? { enabled: false, edges: {} });
  }, [authToken, inviteCode]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const pairs = useMemo(() => {
    const out: { a: NriFaction; b: NriFaction; key: string }[] = [];
    for (let i = 0; i < factions.length; i++) {
      for (let j = i + 1; j < factions.length; j++) {
        const a = factions[i]!;
        const b = factions[j]!;
        out.push({ a, b, key: relationKey(a.id, b.id) });
      }
    }
    return out;
  }, [factions]);

  const save = async (patch: { enabled?: boolean; edges?: Record<string, string | null> }) => {
    if (!authToken) return;
    setBusy(true);
    setErr(null);
    setOkMsg(null);
    const next = await nriPatchFactionRelations(authToken, inviteCode, patch);
    setBusy(false);
    if (!next) {
      setErr('Не удалось сохранить матрицу отношений.');
      return;
    }
    setMatrix(next);
    setOkMsg('Сохранено.');
  };

  const setStance = (key: string, stance: FactionStance) => {
    const edges = { ...matrix.edges, [key]: stance };
    setMatrix({ ...matrix, edges });
  };

  return (
    <div className="nri-faction-relations">
      <header className="nri-chars__head">
        <h3 className="mono-text">
          <Users size={14} /> Взаимоотношения фракций
        </h3>
        <p className="mono-text opacity-70">
          Настройте связи между бандами, корпорациями и кланами из лора. После включения матрицы татуировки
          организаций и фракция НПС влияют на шкалу отношения.
        </p>
      </header>

      {factions.length < 2 ? (
        <p className="mono-text opacity-60">
          Добавьте минимум две фракции во вкладке «Лор», чтобы настроить отношения.
        </p>
      ) : (
        <>
          <label className="nri-modal__field nri-faction-relations__toggle">
            <input
              type="checkbox"
              checked={matrix.enabled}
              disabled={busy}
              onChange={(e) => save({ enabled: e.target.checked })}
            />
            <span>Включить влияние отношений на НПС (тату, фракции)</span>
          </label>
          {matrix.enabled && !isFactionRelationsActive(matrix) && (
            <p className="mono-text nri-cyber__install-hint warn">
              Матрица включена, но все связи нейтральны — задайте вражду или союз хотя бы для одной пары.
            </p>
          )}

          <div className="nri-faction-relations__table-wrap">
            <table className="nri-faction-relations__table mono-text">
              <thead>
                <tr>
                  <th>Фракция A</th>
                  <th>Фракция B</th>
                  <th>Отношение</th>
                </tr>
              </thead>
              <tbody>
                {pairs.map(({ a, b, key }) => (
                  <tr key={key}>
                    <td>{a.displayName || a.name}</td>
                    <td>{b.displayName || b.name}</td>
                    <td>
                      <select
                        value={getFactionRelation(matrix, a.id, b.id)}
                        disabled={busy}
                        onChange={(e) => setStance(key, e.target.value as FactionStance)}
                      >
                        {FACTION_STANCES.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            className="nri-modal__submit"
            disabled={busy || factions.length < 2}
            onClick={() => save({ edges: matrix.edges })}
          >
            <Save size={14} /> Сохранить матрицу
          </button>
        </>
      )}

      {err && <p className="mono-text nri-cyber__install-hint warn">{err}</p>}
      {okMsg && <p className="mono-text nri-cyber__install-hint ok">{okMsg}</p>}
    </div>
  );
};
