/** Visual skins: form moodboard (3) + moodboard-20 metaphors. */

export type NriLobbySkinId =
  | 'terminal'
  | 'deck'
  | 'manga'
  | 'jack'
  | 'booth'
  | 'militech'
  | 'trauma'
  | 'arasaka'
  | 'street'
  | 'ice'
  | 'cork'
  | 'wonlong'
  | 'vault'
  | 'blueprint'
  | 'psychosis'
  | 'holo'
  | 'spam'
  | 'scenario'
  | 'tokens'
  | 'dual'
  | 'handheld'
  | 'packet'
  | 'wrist';

export type NriLobbySkin = {
  id: NriLobbySkinId;
  short: string;
  label: string;
  group: 'form' | 'mood20';
};

export const NRI_LOBBY_SKINS: NriLobbySkin[] = [
  { id: 'terminal', short: 'TERM', label: 'Terminal window', group: 'form' },
  { id: 'deck', short: 'DECK', label: 'Physical deck', group: 'form' },
  { id: 'manga', short: 'MANGA', label: 'Manga page', group: 'form' },
  { id: 'jack', short: '01', label: '01 · Jack-In Deck', group: 'mood20' },
  { id: 'booth', short: '02', label: '02 · Afterlife Booth', group: 'mood20' },
  { id: 'militech', short: '03', label: '03 · Militech Dispatch', group: 'mood20' },
  { id: 'trauma', short: '04', label: '04 · Trauma Team PDA', group: 'mood20' },
  { id: 'arasaka', short: '05', label: '05 · Arasaka Glass', group: 'mood20' },
  { id: 'street', short: '06', label: '06 · Street Fixed Deck', group: 'mood20' },
  { id: 'ice', short: '07', label: '07 · ICE Atmosphere', group: 'mood20' },
  { id: 'cork', short: '08', label: '08 · Field Corkboard', group: 'mood20' },
  { id: 'wonlong', short: '09', label: '09 · Wonlong Terminal', group: 'mood20' },
  { id: 'vault', short: '10', label: '10 · Vault Evidence', group: 'mood20' },
  { id: 'blueprint', short: '11', label: '11 · Carbon Blueprint', group: 'mood20' },
  { id: 'psychosis', short: '12', label: '12 · Psychosis Static', group: 'mood20' },
  { id: 'holo', short: '13', label: '13 · Live Holo Call', group: 'mood20' },
  { id: 'spam', short: '14', label: '14 · Spam Relay Skin', group: 'mood20' },
  { id: 'scenario', short: '15', label: '15 · Scenario Blueprint Desk', group: 'mood20' },
  { id: 'tokens', short: '16', label: '16 · Table Tokens Rail', group: 'mood20' },
  { id: 'dual', short: '17', label: '17 · Dual Monitor Ops', group: 'mood20' },
  { id: 'handheld', short: '18', label: '18 · Handheld Slate', group: 'mood20' },
  { id: 'packet', short: '19', label: '19 · Encrypted Packet', group: 'mood20' },
  { id: 'wrist', short: '20', label: '20 · Session Wristband', group: 'mood20' },
];

const SKIN_IDS = new Set<string>(NRI_LOBBY_SKINS.map((s) => s.id));

export const NRI_LOBBY_SKIN_DEFAULT: NriLobbySkinId = 'terminal';
export const NRI_LOBBY_SKIN_STORAGE_KEY = 'neon_nri_lobby_skin';

export function isNriLobbySkinId(v: unknown): v is NriLobbySkinId {
  return typeof v === 'string' && SKIN_IDS.has(v);
}

export function readNriLobbySkin(): NriLobbySkinId {
  if (typeof window === 'undefined') return NRI_LOBBY_SKIN_DEFAULT;
  try {
    const raw = localStorage.getItem(NRI_LOBBY_SKIN_STORAGE_KEY);
    return isNriLobbySkinId(raw) ? raw : NRI_LOBBY_SKIN_DEFAULT;
  } catch {
    return NRI_LOBBY_SKIN_DEFAULT;
  }
}

export function writeNriLobbySkin(id: NriLobbySkinId): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(NRI_LOBBY_SKIN_STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
}

export function nriLobbySkinLabel(id: NriLobbySkinId): string {
  return NRI_LOBBY_SKINS.find((s) => s.id === id)?.label ?? id;
}
