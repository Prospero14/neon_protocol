import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapPin, Plus, RefreshCw, Trash2, Users } from 'lucide-react';
import { getNriClass } from '../logic/nriClasses';
import { sendNriChatMessage } from '../logic/nriChatDispatch';
import { chatSendFile, chatSendFileToUser } from '../logic/chatApi';
import {
  buildTacticalSvg,
  CLASS_TOKEN_COLORS,
  newTokenId,
  TACTICAL_BOARD_H,
  TACTICAL_BOARD_W,
  TACTICAL_PRESETS,
  tacticalSummaryText,
  type TacticalMapState,
  type TacticalObstacle,
  type TacticalPresetId,
  type TacticalToken,
} from '../logic/nriTacticalMap';
import { nriCreateVaultFile, nriFetchCombatants, type NriCombatant, type NriRosterPlayer } from '../logic/nriApi';
import { NriChatSendBar } from './NriChatSendBar';
import type { VaultRecipient } from './NriVaultTab';

type Props = {
  authToken: string;
  roomId: string;
  nriCode: string;
  roster: NriRosterPlayer[];
  recipients: VaultRecipient[];
  currentUserId?: string;
  onVaultCreated?: () => void;
};

type PlaceMode = 'select' | 'enemy' | 'wall' | 'cover';

function defaultPlayerPositions(n: number): { x: number; y: number }[] {
  const baseY = 72;
  const startX = 18;
  const step = Math.min(14, 60 / Math.max(n, 1));
  return Array.from({ length: n }, (_, i) => ({ x: startX + i * step, y: baseY }));
}

export const NriTacticalMapPanel: React.FC<Props> = ({
  authToken,
  roomId,
  nriCode,
  roster,
  recipients,
  currentUserId,
  onVaultCreated,
}) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const [presetId, setPresetId] = useState<TacticalPresetId>('alley');
  const [tokens, setTokens] = useState<TacticalToken[]>([]);
  const [obstacles, setObstacles] = useState<TacticalObstacle[]>([]);
  const [placeMode, setPlaceMode] = useState<PlaceMode>('select');
  const [enemyName, setEnemyName] = useState('Враг');
  const [combatants, setCombatants] = useState<NriCombatant[]>([]);
  const [pickedCombatantId, setPickedCombatantId] = useState('');
  const [dragId, setDragId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const state: TacticalMapState = useMemo(
    () => ({ presetId, tokens, obstacles }),
    [presetId, tokens, obstacles]
  );

  const svgMarkup = useMemo(() => buildTacticalSvg(state), [state]);
  const boardSvg = useMemo(() => buildTacticalSvg(state, { includeTokens: false }), [state]);

  const syncPlayers = useCallback(() => {
    const positions = defaultPlayerPositions(roster.length);
    const next: TacticalToken[] = roster.map((p, i) => ({
      id: `pl_${p.userId}`,
      kind: 'player' as const,
      label: p.displayName || p.username,
      classId: p.classId,
      userId: p.userId,
      x: positions[i]?.x ?? 20 + i * 12,
      y: positions[i]?.y ?? 70,
    }));
    setTokens((prev) => [...prev.filter((t) => t.kind !== 'player'), ...next]);
    setNotice(`Игроков на схеме: ${next.length}`);
  }, [roster]);

  useEffect(() => {
    nriFetchCombatants(authToken, nriCode).then((list) => {
      if (list) setCombatants(list);
    });
    const t = setInterval(() => {
      nriFetchCombatants(authToken, nriCode).then((list) => {
        if (list) setCombatants(list);
      });
    }, 12_000);
    return () => clearInterval(t);
  }, [authToken, nriCode]);

  useEffect(() => {
    if (!tokens.some((t) => t.kind === 'player') && roster.length > 0) {
      syncPlayers();
    }
  }, [roster.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const pctFromEvent = (e: React.PointerEvent | PointerEvent) => {
    const el = boardRef.current;
    if (!el) return { x: 50, y: 50 };
    const rect = el.getBoundingClientRect();
    const x = Math.max(4, Math.min(96, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(6, Math.min(94, ((e.clientY - rect.top) / rect.height) * 100));
    return { x, y };
  };

  const onBoardPointerDown = (e: React.PointerEvent) => {
    if (dragId) return;
    const { x, y } = pctFromEvent(e);
    if (placeMode === 'enemy') {
      const combatant = pickedCombatantId
        ? combatants.find((c) => c.id === pickedCombatantId)
        : undefined;
      setTokens((prev) => [
        ...prev,
        {
          id: combatant ? `cb_${combatant.id}` : newTokenId('en'),
          kind: 'enemy',
          label: combatant?.name ?? (enemyName.trim() || 'Враг'),
          classId: (combatant?.classId as TacticalToken['classId']) ?? undefined,
          combatantId: combatant?.id,
          x,
          y,
        },
      ]);
      return;
    }
    if (placeMode === 'wall') {
      setObstacles((prev) => [
        ...prev,
        { id: newTokenId('ob'), shape: 'rect', x: x - 5, y: y - 2, w: 10, h: 4 },
      ]);
      return;
    }
    if (placeMode === 'cover') {
      setObstacles((prev) => [
        ...prev,
        { id: newTokenId('ob'), shape: 'circle', x: x - 4, y: y - 4, w: 8, h: 8 },
      ]);
    }
  };

  const onTokenPointerDown = (id: string, e: React.PointerEvent) => {
    e.stopPropagation();
    setDragId(id);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onBoardPointerMove = (e: React.PointerEvent) => {
    if (!dragId) return;
    const { x, y } = pctFromEvent(e);
    setTokens((prev) => prev.map((t) => (t.id === dragId ? { ...t, x, y } : t)));
  };

  const onBoardPointerUp = () => setDragId(null);

  const removeToken = (id: string) => setTokens((prev) => prev.filter((t) => t.id !== id));

  const sendScheme = async (target: { kind: 'table' } | { kind: 'dm'; userId: string }) => {
    setBusy(true);
    setNotice(null);
    try {
      const preset = TACTICAL_PRESETS.find((p) => p.id === presetId);
      const title = `Схема: ${preset?.label ?? presetId}`;
      const body = svgMarkup;
      if (body.length > 7800) {
        setNotice('SVG слишком большой — уберите лишние метки');
        return;
      }
      const created = await nriCreateVaultFile(authToken, nriCode, { title, body });
      if (!created.ok) {
        setNotice(created.error ?? 'Не удалось сохранить схему');
        return;
      }
      onVaultCreated?.();
      const summary = tacticalSummaryText(state);
      await sendNriChatMessage(authToken, roomId, nriCode, summary, target);
      if (target.kind === 'dm') {
        await chatSendFileToUser(authToken, created.file.id, target.userId);
      } else {
        await chatSendFile(authToken, roomId, created.file.id);
      }
      setNotice(target.kind === 'table' ? 'Схема в чате стола' : 'Схема отправлена в личку');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="nri-tactical">
      <header className="nri-tactical__head">
        <MapPin size={18} />
        <div>
          <h3 className="nri-tactical__title">Схема боя</h3>
          <p className="mono-text nri-tactical__hint">
            Вид сверху · перетаскивайте фишки · отправка — картинка-SVG в файлохранилище + сообщение в чат
          </p>
        </div>
      </header>

      <div className="nri-tactical__toolbar mono-text">
        <label className="nri-tactical__field">
          Локация
          <select value={presetId} onChange={(e) => setPresetId(e.target.value as TacticalPresetId)}>
            {TACTICAL_PRESETS.map((p) => (
              <option key={p.id} value={p.id} title={p.hint}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="nri-tactical__tool" onClick={syncPlayers} title="Подтянуть игроков из ростра">
          <Users size={14} /> Игроки
        </button>
        <button
          type="button"
          className={`nri-tactical__tool ${placeMode === 'enemy' ? 'active' : ''}`}
          onClick={() => setPlaceMode(placeMode === 'enemy' ? 'select' : 'enemy')}
        >
          <Plus size={14} /> Враг
        </button>
        <label className="nri-tactical__field nri-tactical__field--combatant">
          Боевик
          <select
            value={pickedCombatantId}
            onChange={(e) => {
              const id = e.target.value;
              setPickedCombatantId(id);
              const c = combatants.find((x) => x.id === id);
              if (c) setEnemyName(c.name);
            }}
          >
            <option value="">— вручную —</option>
            {combatants.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.threatTier ? ` · ${c.threatTier}` : ''}
              </option>
            ))}
          </select>
        </label>
        <input
          className="nri-tactical__enemy-name"
          value={enemyName}
          onChange={(e) => setEnemyName(e.target.value)}
          placeholder="Имя врага"
          maxLength={24}
        />
        <button
          type="button"
          className={`nri-tactical__tool ${placeMode === 'wall' ? 'active' : ''}`}
          onClick={() => setPlaceMode(placeMode === 'wall' ? 'select' : 'wall')}
        >
          Стена
        </button>
        <button
          type="button"
          className={`nri-tactical__tool ${placeMode === 'cover' ? 'active' : ''}`}
          onClick={() => setPlaceMode(placeMode === 'cover' ? 'select' : 'cover')}
        >
          Укрытие
        </button>
        <button
          type="button"
          className="nri-tactical__tool"
          onClick={() => {
            setObstacles([]);
            setNotice('Укрытия сброшены');
          }}
        >
          <RefreshCw size={14} />
        </button>
      </div>

      <div
        ref={boardRef}
        className="nri-tactical__board"
        style={{ aspectRatio: `${TACTICAL_BOARD_W} / ${TACTICAL_BOARD_H}` }}
        onPointerDown={onBoardPointerDown}
        onPointerMove={onBoardPointerMove}
        onPointerUp={onBoardPointerUp}
        onPointerLeave={onBoardPointerUp}
      >
        <div
          className="nri-tactical__bg"
          dangerouslySetInnerHTML={{ __html: boardSvg }}
        />
        {tokens.map((tok) => {
          const cls = tok.classId ? CLASS_TOKEN_COLORS[tok.classId] : null;
          const isEnemy = tok.kind === 'enemy';
          return (
            <button
              key={tok.id}
              type="button"
              className={`nri-tactical__token ${isEnemy ? 'nri-tactical__token--enemy' : 'nri-tactical__token--player'}`}
              style={{
                left: `${tok.x}%`,
                top: `${tok.y}%`,
                ['--tok-fill' as string]: isEnemy ? '#5c1818' : cls?.fill ?? '#333',
                ['--tok-stroke' as string]: isEnemy ? '#ff5555' : cls?.stroke ?? '#aaa',
              }}
              onPointerDown={(e) => onTokenPointerDown(tok.id, e)}
              title={tok.classId ? getNriClass(tok.classId)?.name : undefined}
            >
              <span className="nri-tactical__token-glyph">
                {isEnemy ? '×' : cls?.glyph ?? '?'}
              </span>
              <span className="nri-tactical__token-label">{tok.label}</span>
              <span
                className="nri-tactical__token-remove"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  removeToken(tok.id);
                }}
              >
                <Trash2 size={10} />
              </span>
            </button>
          );
        })}
      </div>

      <p className="mono-text nri-tactical__mode-hint">
        {placeMode === 'select' && 'Режим: перетаскивание фишек. Враг/стена/укрытие — клик по полю.'}
        {placeMode === 'enemy' && 'Клик по полю — поставить врага.'}
        {placeMode === 'wall' && 'Клик — прямоугольная стена.'}
        {placeMode === 'cover' && 'Клик — круглое укрытие.'}
      </p>

      <NriChatSendBar
        recipients={recipients}
        currentUserId={currentUserId}
        busy={busy}
        label="Отправить схему"
        onSend={sendScheme}
      />

      {notice && <p className="mono-text nri-tactical__notice">{notice}</p>}
    </div>
  );
};
