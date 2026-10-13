import React, { useMemo, useState } from 'react';
import { Dices } from 'lucide-react';
import { C2185_ABILITIES, C2185_SAVING_THROWS, C2185_SKILLS } from '../logic/nriCarbon2185';
import {
  buildRollPool,
  executeRoll,
  formatRollChatText,
  type AbilityKey,
  type RollKind,
} from '../../shared/nri-domain/c2185RollPool';
import { getSheetCombatView } from '../logic/nriSheetCombat';
import type { NriClassId } from '../logic/nriClasses';
import { chatSendMessage } from '../logic/chatApi';
import type { NriInventoryItem } from '../logic/nriInventory';

type Props = {
  authToken: string;
  roomId: string;
  nriCode?: string;
  /** Sheet of the roller (or selected player for host). */
  sheet: unknown;
  inventory?: NriInventoryItem[] | unknown;
  classId?: string;
  displayName?: string;
  disabled?: boolean;
};

const KINDS: { id: RollKind; label: string }[] = [
  { id: 'skill', label: 'Навык' },
  { id: 'ability', label: 'Характеристика' },
  { id: 'save', label: 'Спасбросок' },
  { id: 'attack', label: 'Атака' },
  { id: 'initiative', label: 'Инициатива' },
  { id: 'death', label: 'Death save' },
  { id: 'lockpick', label: 'Взлом / lockpick' },
];

export const NriChatRollMenu: React.FC<Props> = ({
  authToken,
  roomId,
  nriCode,
  sheet,
  inventory,
  classId,
  displayName,
  disabled,
}) => {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<RollKind>('skill');
  const [skillName, setSkillName] = useState('Hacking');
  const [ability, setAbility] = useState<AbilityKey>('TEC');
  const [saveId, setSaveId] = useState('Fortitude');
  const [attackIdx, setAttackIdx] = useState(0);
  const [showAll, setShowAll] = useState(true);
  const [busy, setBusy] = useState(false);
  const [lastBreakdown, setLastBreakdown] = useState<string | null>(null);

  const combat = useMemo(() => {
    try {
      const augs =
        sheet && typeof sheet === 'object' && Array.isArray((sheet as { augmentations?: unknown }).augmentations)
          ? ((sheet as { augmentations: Parameters<typeof getSheetCombatView>[2] }).augmentations)
          : [];
      return getSheetCombatView(
        (sheet && typeof sheet === 'object' ? sheet : {}) as Parameters<typeof getSheetCombatView>[0],
        (classId as NriClassId) || 'hacker',
        augs,
        Array.isArray(inventory) ? (inventory as NriInventoryItem[]) : [],
      );
    } catch {
      return null;
    }
  }, [sheet, classId, inventory]);

  const roll = async () => {
    if (!authToken || busy) return;
    setBusy(true);
    const attack = combat?.attacks[attackIdx];
    const atkBonusRaw = attack?.atk?.replace(/^\+/, '');
    const attackBonus = atkBonusRaw != null && atkBonusRaw !== '' ? Number(atkBonusRaw) : undefined;
    const pool = buildRollPool({
      kind,
      sheet,
      inventory,
      skillName: kind === 'lockpick' ? 'Mechanics' : skillName,
      ability,
      saveId,
      attackName: attack?.name,
      attackBonus: Number.isFinite(attackBonus) ? attackBonus : undefined,
    });
    const executed = executeRoll(pool);
    setLastBreakdown(executed.breakdown);
    const audience = showAll ? 'table' : 'host_and_roller';
    const text = formatRollChatText(executed, {
      who: displayName,
      secret: !showAll,
    });
    await chatSendMessage(authToken, roomId, text, {
      nriCode,
      audience,
      payload: {
        type: 'nri_roll',
        audience,
        title: executed.title,
        total: executed.total,
        breakdown: executed.breakdown,
        kind: executed.kind,
      },
    });
    setBusy(false);
    setOpen(false);
  };

  return (
    <div className="nri-chat-roll">
      <button
        type="button"
        className={`neon-chat-glyph-toggle ${open ? 'active' : ''}`}
        disabled={disabled || busy}
        onClick={() => setOpen((v) => !v)}
        aria-label="Бросок C2185"
        title="Бросок по правилам"
      >
        <Dices size={18} />
      </button>
      {open && (
        <div className="nri-chat-roll__menu mono-text" role="dialog" aria-label="Бросок">
          <label>
            Тип
            <select value={kind} onChange={(e) => setKind(e.target.value as RollKind)}>
              {KINDS.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.label}
                </option>
              ))}
            </select>
          </label>
          {kind === 'skill' && (
            <label>
              Навык
              <select value={skillName} onChange={(e) => setSkillName(e.target.value)}>
                {C2185_SKILLS.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {kind === 'ability' && (
            <label>
              Характеристика
              <select value={ability} onChange={(e) => setAbility(e.target.value as AbilityKey)}>
                {C2185_ABILITIES.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </label>
          )}
          {kind === 'save' && (
            <label>
              Save
              <select value={saveId} onChange={(e) => setSaveId(e.target.value)}>
                {C2185_SAVING_THROWS.map((s) => (
                  <option key={s.id} value={s.label}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          )}
          {kind === 'attack' && (
            <label>
              Атака
              <select value={attackIdx} onChange={(e) => setAttackIdx(Number(e.target.value))}>
                {(combat?.attacks ?? []).map((a, i) => (
                  <option key={`${a.name}-${i}`} value={i}>
                    {a.name} ({a.atk})
                  </option>
                ))}
                {(combat?.attacks?.length ?? 0) === 0 && <option value={0}>Атака (DEX+prof)</option>}
              </select>
            </label>
          )}
          <label className="nri-chat-roll__check">
            <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
            Показать всем
          </label>
          {!showAll && <p className="opacity-60">Только вы и мастер увидят бросок.</p>}
          {lastBreakdown && <p className="nri-chat-roll__preview opacity-70">{lastBreakdown}</p>}
          <button type="button" className="nri-modal__submit" disabled={busy} onClick={() => void roll()}>
            {busy ? '…' : 'Бросить'}
          </button>
        </div>
      )}
    </div>
  );
};
