/** Индекс карточек лора для подсветки и поп-апов в чате / сценарии. */
function norm(s) {
    return s
        .replace(/^\[[^\]]+\]\s*/, '')
        .trim()
        .toLowerCase();
}
function fallbackSummary(summary, body, max = 280) {
    const s = summary?.trim();
    if (s)
        return s;
    const b = body?.trim();
    if (!b)
        return '';
    if (b.length <= max)
        return b;
    const cut = b.slice(0, max);
    return cut.replace(/\s+\S*$/, '').trim() + '…';
}
export function buildLoreCardIndex(bundle) {
    const out = [];
    for (const p of bundle.places ?? []) {
        out.push({
            id: p.id,
            title: p.title,
            summary: fallbackSummary(p.summary, p.body),
            kind: 'place',
            iconId: p.iconId,
        });
    }
    for (const f of bundle.factions ?? []) {
        out.push({
            id: f.id,
            title: f.name,
            summary: fallbackSummary(f.summary, f.description),
            kind: 'faction',
            iconId: f.iconId,
            subtitle: f.displayName,
        });
    }
    for (const e of bundle.entries ?? []) {
        out.push({
            id: e.id,
            title: e.title,
            summary: fallbackSummary(e.summary, e.body),
            kind: 'entry',
        });
    }
    return out;
}
export function findLoreCardByTitle(cards, rawTitle) {
    if (!Array.isArray(cards) || !rawTitle?.trim())
        return null;
    try {
        const key = norm(rawTitle);
        if (!key)
            return null;
        for (const c of cards) {
            if (!c?.title)
                continue;
            if (norm(c.title) === key)
                return c;
            if (c.subtitle && norm(c.subtitle) === key)
                return c;
        }
        return null;
    }
    catch {
        return null;
    }
}
export function loreCardsToHighlightEntities(cards) {
    return cards.map((c) => ({ title: c.title, kind: c.kind }));
}
//# sourceMappingURL=loreCards.js.map