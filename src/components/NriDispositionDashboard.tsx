import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { nriFetchLore, type NriNpc, type NriRosterPlayer } from '../logic/nriApi';
import type { FactionRelationMatrix, NriFaction } from '../logic/nriLore';
import { parseNriSheet } from '../logic/nriNpcGenerator';
import {
  computeNpcDispositionToViewer,
  dispositionLabel,
  type DispositionBreakdown,
} from '../../shared/nri-domain/disposition';
import { isFactionRelationsActive } from '../../shared/nri-domain/factionRelations';
import type { FactionRef } from '../../shared/nri-domain/tattoos';

type Props = {
  inviteCode: string;
  authToken: string;
  roster: NriRosterPlayer[];
  npcs: NriNpc[];
};

type NpcDispositionRow = {
  npcId: string;
  npcName: string;
  factionName: string;
  breakdown: DispositionBreakdown;
};

function dispositionColor(score: number): string {
  if (score >= 60) return '#34d399';
  if (score >= 25) return '#6ee7b7';
  if (score >= -24) return '#94a3b8';
  if (score >= -59) return '#fbbf24';
  return '#f87171';
}

const DispositionBar: React.FC<{ value: number; compact?: boolean }> = ({ value, compact }) => {
  const clamped = Math.max(-100, Math.min(100, value));
  const markerLeft = ((clamped + 100) / 200) * 100;
  const half = Math.abs(clamped) / 2;
  const fillStyle =
    clamped >= 0
      ? { left: '50%', width: `${half}%` }
      : { left: `${markerLeft}%`, width: `${half}%` };

  return (
    <div className={`nri-disposition-bar ${compact ? 'nri-disposition-bar--compact' : ''}`}>
      <div className="nri-disposition-bar__track" aria-hidden>
        <div className="nri-disposition-bar__zero" />
        <div className="nri-disposition-bar__fill" style={{ ...fillStyle, background: dispositionColor(clamped) }} />
        <div className="nri-disposition-bar__marker" style={{ left: `${markerLeft}%` }} />
      </div>
      <span className="nri-disposition-bar__val" style={{ color: dispositionColor(clamped) }}>
        {clamped > 0 ? `+${clamped}` : clamped}
      </span>
    </div>
  );
};

const OverviewChart: React.FC<{ rows: NpcDispositionRow[] }> = ({ rows }) => {
  const maxAbs = Math.max(20, ...rows.map((r) => Math.abs(r.breakdown.total)));
  const h = 120;
  const w = Math.max(280, rows.length * 48);
  const barW = Math.min(36, (w - 40) / Math.max(1, rows.length) - 8);

  return (
    <svg className="nri-disposition-chart" viewBox={`0 0 ${w} ${h + 28}`} role="img" aria-label="Сводка отношений НПС">
      <line x1="20" y1={h / 2} x2={w - 10} y2={h / 2} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
      {rows.map((row, i) => {
        const x = 24 + i * (barW + 12);
        const total = row.breakdown.total;
        const barH = (Math.abs(total) / maxAbs) * (h / 2 - 8);
        const y = total >= 0 ? h / 2 - barH : h / 2;
        return (
          <g key={row.npcId}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={Math.max(2, barH)}
              rx="3"
              fill={dispositionColor(total)}
              opacity={0.9}
            />
            <text x={x + barW / 2} y={h + 14} textAnchor="middle" className="nri-disposition-chart__label">
              {row.npcName.length > 8 ? `${row.npcName.slice(0, 7)}…` : row.npcName}
            </text>
            <text x={x + barW / 2} y={total >= 0 ? y - 4 : y + barH + 12} textAnchor="middle" className="nri-disposition-chart__score">
              {total > 0 ? `+${total}` : total}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

function factionName(factions: NriFaction[], factionId?: string): string {
  if (!factionId) return '—';
  const f = factions.find((x) => x.id === factionId);
  return f?.displayName || f?.name || factionId;
}

export const NriDispositionDashboard: React.FC<Props> = ({ inviteCode, authToken, roster, npcs }) => {
  const [factions, setFactions] = useState<NriFaction[]>([]);
  const [matrix, setMatrix] = useState<FactionRelationMatrix>({ enabled: false, edges: {} });
  const [selectedUserId, setSelectedUserId] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const players = useMemo(() => roster.filter((r) => r.userId), [roster]);

  const refreshLore = useCallback(async () => {
    if (!authToken) return;
    const loreRes = await nriFetchLore(authToken, inviteCode);
    if (!loreRes.ok) {
      setErr(loreRes.error || 'Не удалось загрузить фракции и матрицу отношений.');
      return;
    }
    const lore = loreRes.data;
    setErr(null);
    setFactions(lore.factions);
    setMatrix(lore.factionRelations ?? { enabled: false, edges: {} });
  }, [authToken, inviteCode]);

  useEffect(() => {
    refreshLore();
    const t = setInterval(refreshLore, 12000);
    return () => clearInterval(t);
  }, [refreshLore]);

  useEffect(() => {
    if (!selectedUserId && players[0]) setSelectedUserId(players[0].userId);
  }, [players, selectedUserId]);

  const factionRefs: FactionRef[] = useMemo(
    () => factions.map((f) => ({ id: f.id, kind: f.kind, name: f.name, displayName: f.displayName })),
    [factions]
  );

  const selectedPlayer = players.find((p) => p.userId === selectedUserId) ?? players[0];

  const rows: NpcDispositionRow[] = useMemo(() => {
    if (!selectedPlayer) return [];
    const viewerSheet =
      selectedPlayer.sheet && typeof selectedPlayer.sheet === 'object'
        ? (selectedPlayer.sheet as Record<string, unknown>)
        : null;
    return npcs.map((npc) => {
      const sheet = parseNriSheet(npc.sheet);
      const npcSheet = sheet as Record<string, unknown> | null;
      const breakdown = computeNpcDispositionToViewer(npcSheet, viewerSheet, matrix, factionRefs);
      return {
        npcId: npc.id,
        npcName: npc.name,
        factionName: factionName(factions, sheet?.factionId),
        breakdown,
      };
    });
  }, [selectedPlayer, npcs, matrix, factionRefs, factions]);

  const buckets = useMemo(() => {
    let friendly = 0;
    let neutral = 0;
    let hostile = 0;
    for (const r of rows) {
      if (r.breakdown.total >= 25) friendly++;
      else if (r.breakdown.total <= -25) hostile++;
      else neutral++;
    }
    return { friendly, neutral, hostile, total: rows.length || 1 };
  }, [rows]);

  if (!players.length) {
    return <p className="mono-text opacity-60 nri-disposition-dash__empty">Игроки ещё не за столом — не к чему привязать отношение.</p>;
  }

  if (!npcs.length) {
    return <p className="mono-text opacity-60 nri-disposition-dash__empty">Нет НПС — создайте их в разделе «Люди».</p>;
  }

  return (
    <div className="nri-disposition-dash">
      <header className="nri-disposition-dash__head">
        <p className="mono-text opacity-70">
          Отношение НПС к выбранному игроку. Учитываются базовый настрой НПС, фракция и татуировки (если матрица
          фракций включена).
        </p>
        {!isFactionRelationsActive(matrix) && (
          <p className="mono-text nri-cyber__install-hint warn">
            Матрица фракций не активна — виден только базовый disposition НПС. Включите в «Мастер → Фракции».
          </p>
        )}
      </header>

      <label className="nri-modal__field nri-disposition-dash__pick">
        <span>Игрок</span>
        <select value={selectedPlayer?.userId ?? ''} onChange={(e) => setSelectedUserId(e.target.value)}>
          {players.map((p) => (
            <option key={p.userId} value={p.userId}>
              {p.displayName} (@{p.username})
            </option>
          ))}
        </select>
      </label>

      <div className="nri-disposition-dash__summary">
        <div className="nri-disposition-dash__donut" aria-hidden>
          <svg viewBox="0 0 100 100">
            {(() => {
              const parts = [
                { n: buckets.friendly, color: '#34d399' },
                { n: buckets.neutral, color: '#94a3b8' },
                { n: buckets.hostile, color: '#f87171' },
              ];
              let acc = 0;
              return parts.map((p, i) => {
                const frac = p.n / buckets.total;
                const dash = `${frac * 251.2} 251.2`;
                const rot = (acc / buckets.total) * 360 - 90;
                acc += p.n;
                return (
                  <circle
                    key={i}
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke={p.color}
                    strokeWidth="18"
                    strokeDasharray={dash}
                    transform={`rotate(${rot} 50 50)`}
                  />
                );
              });
            })()}
          </svg>
          <span className="nri-disposition-dash__donut-label">{rows.length} НПС</span>
        </div>
        <ul className="nri-disposition-dash__legend mono-text">
          <li>
            <span className="dot" style={{ background: '#34d399' }} /> Расположены: {buckets.friendly}
          </li>
          <li>
            <span className="dot" style={{ background: '#94a3b8' }} /> Нейтрал: {buckets.neutral}
          </li>
          <li>
            <span className="dot" style={{ background: '#f87171' }} /> Враждебны: {buckets.hostile}
          </li>
        </ul>
        <div className="nri-disposition-dash__overview">
          <h4 className="mono-text">Сводка по столу</h4>
          <OverviewChart rows={rows} />
        </div>
      </div>

      <div className="nri-disposition-dash__grid">
        {rows.map((row) => (
          <article key={row.npcId} className="nri-disposition-card">
            <header>
              <strong>{row.npcName}</strong>
              <span className="mono-text opacity-60">{row.factionName}</span>
            </header>
            <DispositionBar value={row.breakdown.total} />
            <p className="mono-text nri-disposition-card__label">{dispositionLabel(row.breakdown.total)}</p>
            <dl className="nri-disposition-card__breakdown mono-text">
              <div>
                <dt>База</dt>
                <dd>{row.breakdown.base > 0 ? `+${row.breakdown.base}` : row.breakdown.base}</dd>
              </div>
              <div>
                <dt>Тату / фракции</dt>
                <dd>
                  {row.breakdown.tattooModifier > 0 ? `+${row.breakdown.tattooModifier}` : row.breakdown.tattooModifier}
                </dd>
              </div>
            </dl>
            {row.breakdown.notes.length > 0 && (
              <ul className="nri-disposition-card__notes mono-text opacity-70">
                {row.breakdown.notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </div>

      {err && <p className="mono-text nri-cyber__install-hint warn">{err}</p>}
    </div>
  );
};
