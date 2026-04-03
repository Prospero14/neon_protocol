import { altufyevo } from './altufyevo';
import { vykhino } from './vykhino';
import { maryino } from './maryino';
import { chertanovo } from './chertanovo';
import { south_west } from './south_west';
import { teply_stan } from './teply_stan';
import { izmailovo } from './izmailovo';
import { bibirevo } from './bibirevo';
import { tekstilschiki } from './tekstilschiki';
import { perovo } from './perovo';
import { sokol } from './sokol';
import { vdnkh } from './vdnkh';
import { hub } from './hub';
import { academy_training } from './academy';
import { high_tier } from './high_tier';
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
  ...high_tier
];

export const MAP_NODES: MapNode[] = ALL_DISTRICTS.map(d => d.node);

export const NPC_LIBRARY: NpcProfile[] = ALL_DISTRICTS.flatMap(d => d.npcs);

export const DIALOGUE_TREES: Record<string, DialogueTree> = {
  ...ALL_DISTRICTS.reduce((acc, d) => ({ ...acc, ...d.dialogues }), {}),
  ...academy_training
};
