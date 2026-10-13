/** Сессионные мастерские пропы: корзина «для игры» + замки. */

export type PlayBasketItemKind = 'ordinary' | 'quest';

export type MasterLockKind = 'door' | 'vehicle' | 'safe' | 'drawer' | 'shelf' | 'crate';
export type MasterLockMethod = 'mechanical' | 'electronic' | 'biometric';
export type MasterLockState = 'locked' | 'unlocked' | 'jammed' | 'broken';

export type MasterLock = {
  id: string;
  label: string;
  kind: MasterLockKind;
  method: MasterLockMethod;
  dc: number;
  state: MasterLockState;
  /** zoneKey | vehicleId | basketEntryId | free */
  anchorType: 'zone' | 'vehicle' | 'basket' | 'free';
  anchorId?: string;
  notes?: string;
};

export type PlayBasketEntry = {
  id: string;
  catalogId?: string;
  label: string;
  qty: number;
  itemKind: PlayBasketItemKind;
  source?: string;
  notes?: string;
  lockId?: string;
};

export type MasterPropsState = {
  playBasket: PlayBasketEntry[];
  locks: MasterLock[];
};

export function emptyMasterProps(): MasterPropsState {
  return { playBasket: [], locks: [] };
}

export function readMasterProps(raw: unknown): MasterPropsState {
  if (!raw || typeof raw !== 'object') return emptyMasterProps();
  const o = raw as { playBasket?: unknown; locks?: unknown };
  const playBasket = Array.isArray(o.playBasket)
    ? o.playBasket
        .filter((e) => e && typeof e === 'object')
        .map((e) => {
          const x = e as PlayBasketEntry;
          return {
            id: typeof x.id === 'string' ? x.id : `b_${Math.random().toString(36).slice(2, 8)}`,
            catalogId: typeof x.catalogId === 'string' ? x.catalogId : undefined,
            label: typeof x.label === 'string' && x.label.trim() ? x.label.trim() : 'Item',
            qty: typeof x.qty === 'number' && x.qty > 0 ? Math.floor(x.qty) : 1,
            itemKind: x.itemKind === 'quest' ? 'quest' : 'ordinary',
            source: typeof x.source === 'string' ? x.source : undefined,
            notes: typeof x.notes === 'string' ? x.notes : undefined,
            lockId: typeof x.lockId === 'string' ? x.lockId : undefined,
          } satisfies PlayBasketEntry;
        })
    : [];
  const locks = Array.isArray(o.locks)
    ? o.locks
        .filter((e) => e && typeof e === 'object')
        .map((e) => {
          const x = e as MasterLock;
          const kind: MasterLockKind = (['door', 'vehicle', 'safe', 'drawer', 'shelf', 'crate'] as const).includes(
            x.kind as MasterLockKind,
          )
            ? (x.kind as MasterLockKind)
            : 'door';
          const method: MasterLockMethod = (['mechanical', 'electronic', 'biometric'] as const).includes(
            x.method as MasterLockMethod,
          )
            ? (x.method as MasterLockMethod)
            : 'mechanical';
          const state: MasterLockState = (['locked', 'unlocked', 'jammed', 'broken'] as const).includes(
            x.state as MasterLockState,
          )
            ? (x.state as MasterLockState)
            : 'locked';
          const anchorType =
            x.anchorType === 'zone' || x.anchorType === 'vehicle' || x.anchorType === 'basket'
              ? x.anchorType
              : 'free';
          return {
            id: typeof x.id === 'string' ? x.id : `l_${Math.random().toString(36).slice(2, 8)}`,
            label: typeof x.label === 'string' && x.label.trim() ? x.label.trim() : 'Lock',
            kind,
            method,
            dc: typeof x.dc === 'number' && Number.isFinite(x.dc) ? Math.max(5, Math.min(30, Math.floor(x.dc))) : 15,
            state,
            anchorType,
            anchorId: typeof x.anchorId === 'string' ? x.anchorId : undefined,
            notes: typeof x.notes === 'string' ? x.notes : undefined,
          } satisfies MasterLock;
        })
    : [];
  return { playBasket, locks };
}

export function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}
