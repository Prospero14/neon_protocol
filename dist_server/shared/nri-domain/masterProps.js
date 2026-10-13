/** Сессионные мастерские пропы: корзина «для игры» + замки. */
export function emptyMasterProps() {
    return { playBasket: [], locks: [] };
}
export function readMasterProps(raw) {
    if (!raw || typeof raw !== 'object')
        return emptyMasterProps();
    const o = raw;
    const playBasket = Array.isArray(o.playBasket)
        ? o.playBasket
            .filter((e) => e && typeof e === 'object')
            .map((e) => {
            const x = e;
            return {
                id: typeof x.id === 'string' ? x.id : `b_${Math.random().toString(36).slice(2, 8)}`,
                catalogId: typeof x.catalogId === 'string' ? x.catalogId : undefined,
                label: typeof x.label === 'string' && x.label.trim() ? x.label.trim() : 'Item',
                qty: typeof x.qty === 'number' && x.qty > 0 ? Math.floor(x.qty) : 1,
                itemKind: x.itemKind === 'quest' ? 'quest' : 'ordinary',
                source: typeof x.source === 'string' ? x.source : undefined,
                notes: typeof x.notes === 'string' ? x.notes : undefined,
                lockId: typeof x.lockId === 'string' ? x.lockId : undefined,
            };
        })
        : [];
    const locks = Array.isArray(o.locks)
        ? o.locks
            .filter((e) => e && typeof e === 'object')
            .map((e) => {
            const x = e;
            const kind = ['door', 'vehicle', 'safe', 'drawer', 'shelf', 'crate'].includes(x.kind)
                ? x.kind
                : 'door';
            const method = ['mechanical', 'electronic', 'biometric'].includes(x.method)
                ? x.method
                : 'mechanical';
            const state = ['locked', 'unlocked', 'jammed', 'broken'].includes(x.state)
                ? x.state
                : 'locked';
            const anchorType = x.anchorType === 'zone' || x.anchorType === 'vehicle' || x.anchorType === 'basket'
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
            };
        })
        : [];
    return { playBasket, locks };
}
export function newId(prefix) {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}
//# sourceMappingURL=masterProps.js.map