/** Полевые досье игрока — ручные карточки без статов. */

export type NriFieldDossier = {
  id: string;
  name: string;
  affiliation: string;
  importance: string;
  belongings: string;
  marks: string;
  notes: string;
  updatedAt: number;
};

const MAX_DOSSIERS = 80;
const MAX_FIELD = 500;
const MAX_NOTES = 4000;

function asTrimmed(raw: unknown, max: number): string {
  if (typeof raw !== 'string') return '';
  return raw.trim().slice(0, max);
}

function asId(raw: unknown, fallback: string): string {
  if (typeof raw === 'string' && /^[a-zA-Z0-9_-]{1,64}$/.test(raw.trim())) {
    return raw.trim();
  }
  return fallback;
}

export function emptyFieldDossier(partial?: Partial<NriFieldDossier>): NriFieldDossier {
  const now = Date.now();
  const id =
    partial?.id && /^[a-zA-Z0-9_-]{1,64}$/.test(partial.id)
      ? partial.id
      : `fd_${now.toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`;
  return {
    id,
    name: asTrimmed(partial?.name, MAX_FIELD),
    affiliation: asTrimmed(partial?.affiliation, MAX_FIELD),
    importance: asTrimmed(partial?.importance, MAX_FIELD),
    belongings: asTrimmed(partial?.belongings, MAX_FIELD),
    marks: asTrimmed(partial?.marks, MAX_FIELD),
    notes: asTrimmed(partial?.notes, MAX_NOTES),
    updatedAt: typeof partial?.updatedAt === 'number' ? partial.updatedAt : now,
  };
}

/** Sanitize raw save / API payload → always an array. */
export function sanitizeFieldDossiers(raw: unknown): NriFieldDossier[] {
  if (!Array.isArray(raw)) return [];
  const out: NriFieldDossier[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < raw.length && out.length < MAX_DOSSIERS; i++) {
    const row = raw[i];
    if (!row || typeof row !== 'object' || Array.isArray(row)) continue;
    const o = row as Record<string, unknown>;
    const id = asId(o.id, `fd_${i}_${Date.now().toString(36)}`);
    if (seen.has(id)) continue;
    seen.add(id);
    const updatedAt =
      typeof o.updatedAt === 'number' && Number.isFinite(o.updatedAt) ? Math.floor(o.updatedAt) : Date.now();
    out.push({
      id,
      name: asTrimmed(o.name, MAX_FIELD),
      affiliation: asTrimmed(o.affiliation, MAX_FIELD),
      importance: asTrimmed(o.importance, MAX_FIELD),
      belongings: asTrimmed(o.belongings, MAX_FIELD),
      marks: asTrimmed(o.marks, MAX_FIELD),
      notes: asTrimmed(o.notes, MAX_NOTES),
      updatedAt,
    });
  }
  return out;
}

export const FIELD_DOSSIER_LIMITS = { MAX_DOSSIERS, MAX_FIELD, MAX_NOTES } as const;
