import { altufyevo } from './altufyevo/index';
import { vykhino } from './vykhino/index';
import { maryino } from './maryino/index';
import { chertanovo } from './chertanovo/index';
import { south_west } from './south_west/index';
import { teply_stan } from './teply_stan/index';
import { izmailovo } from './izmailovo/index';
import { bibirevo } from './bibirevo/index';
import { tekstilschiki } from './tekstilschiki/index';
import { perovo } from './perovo/index';
import { sokol } from './sokol/index';
import { vdnkh } from './vdnkh/index';
import { hub } from './hub/index';
import { sokolniki } from './sokolniki/index';
import { fili } from './fili/index';
import { taganka } from './taganka/index';
import { mitino } from './mitino/index';
import { academy } from './academy/index';
import { punitive_dialogues } from './punitive/dialogues';

import type { WorldDistrict } from './types';
import type { MapNode } from '../mapData';
import type { NpcProfile } from '../npcData';
import type { DialogueTree } from '../dialogues';

const ALL_DISTRICTS: WorldDistrict[] = [
  altufyevo,
  vykhino,
  maryino,
  chertanovo,
  south_west,
  teply_stan,
  izmailovo,
  bibirevo,
  tekstilschiki,
  perovo,
  sokol,
  vdnkh,
  hub,
  sokolniki,
  fili,
  taganka,
  mitino,
  academy
];

export const MAP_NODES: MapNode[] = ALL_DISTRICTS.map(d => d.node);

export const NPC_LIBRARY: NpcProfile[] = ALL_DISTRICTS.flatMap(d => d.npcs);

export const DIALOGUE_TREES: Record<string, DialogueTree> = {
  ...ALL_DISTRICTS.reduce((acc, d) => ({ ...acc, ...d.dialogues }), {}),
  ...punitive_dialogues
};
