import { ALL_DISTRICTS } from './mapNodes';
import { punitive_dialogues } from './punitive/dialogues';
import { NIGHT_CONTACT_DIALOGUES, NIGHT_CONTACT_PROFILES } from '../nightContacts';
import { DAY_CONTACT_DIALOGUES, DAY_CONTACT_PROFILES } from '../dayContacts';

import type { NpcProfile } from '../npcData';
import type { DialogueTree } from '../dialogues';

export { ALL_DISTRICTS, MAP_NODES } from './mapNodes';

const SAFE_DAY_CONTACT_PROFILES = Array.isArray(DAY_CONTACT_PROFILES) ? DAY_CONTACT_PROFILES : [];
const SAFE_NIGHT_CONTACT_PROFILES = Array.isArray(NIGHT_CONTACT_PROFILES) ? NIGHT_CONTACT_PROFILES : [];
const SAFE_DAY_CONTACT_DIALOGUES =
  DAY_CONTACT_DIALOGUES && typeof DAY_CONTACT_DIALOGUES === 'object' ? DAY_CONTACT_DIALOGUES : {};
const SAFE_NIGHT_CONTACT_DIALOGUES =
  NIGHT_CONTACT_DIALOGUES && typeof NIGHT_CONTACT_DIALOGUES === 'object' ? NIGHT_CONTACT_DIALOGUES : {};

export const NPC_LIBRARY: NpcProfile[] = [
  ...ALL_DISTRICTS.flatMap((d) => d.npcs),
  ...SAFE_DAY_CONTACT_PROFILES,
  ...SAFE_NIGHT_CONTACT_PROFILES,
];

export const DIALOGUE_TREES: Record<string, DialogueTree> = {
  ...ALL_DISTRICTS.reduce((acc, d) => ({ ...acc, ...d.dialogues }), {}),
  ...SAFE_DAY_CONTACT_DIALOGUES,
  ...SAFE_NIGHT_CONTACT_DIALOGUES,
  ...punitive_dialogues,
};
