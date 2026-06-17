/** Индекс карточек лора для подсветки и поп-апов в чате / сценарии. */

export type LoreCardRef = {
  id: string;
  title: string;
  /** Краткая сводка для игроков в чате. */
  summary: string;
  kind: 'place' | 'faction' | 'entry';
  iconId?: string | null;
  subtitle?: string;
};

function norm(s: string): string {
  return s
    .replace(/^\[[^\]]+\]\s*/, '')
    .trim()
    .toLowerCase();
}

function fallbackSummary(summary: string | undefined, body: string | undefined, max = 280): string {
  const s = summary?.trim();
  if (s) return s;
  const b = body?.trim();
  if (!b) return '';
  if (b.length <= max) return b;
  const cut = b.slice(0, max);
  return cut.replace(/\s+\S*$/, '').trim() + '…';
}

export function buildLoreCardIndex(bundle: {
  places?: Array<{
    id: string;
    title: string;
    summary?: string;
    body: string;
    iconId?: string | null;
  }>;
  factions?: Array<{
    id: string;
    name: string;
    displayName?: string;
    summary?: string;
    description: string;
    iconId?: string | null;
  }>;
  entries?: Array<{ id: string; title: string; summary?: string; body: string }>;
}): LoreCardRef[] {
  const out: LoreCardRef[] = [];
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

export function findLoreCardByTitle(cards: LoreCardRef[] | null | undefined, rawTitle: string): LoreCardRef | null {
  if (!Array.isArray(cards) || !rawTitle?.trim()) return null;
  try {
    const key = norm(rawTitle);
    if (!key) return null;
    for (const c of cards) {
      if (!c?.title) continue;
      if (norm(c.title) === key) return c;
      if (c.subtitle && norm(c.subtitle) === key) return c;
    }
    return null;
  } catch {
    return null;
  }
}

export function loreCardsToHighlightEntities(cards: LoreCardRef[]): { title: string; kind?: string }[] {
  return cards.map((c) => ({ title: c.title, kind: c.kind }));
}
