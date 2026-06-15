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
import { metro_stub } from './metro_stub/index';
import { coop_yard } from './coop_yard/index';

import type { WorldDistrict, MapNodeData } from './types';

/** Районы без night/day контактов — безопасно импортировать до mapData. */
export const ALL_DISTRICTS: WorldDistrict[] = [
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
  academy,
  metro_stub,
  coop_yard,
];

export const MAP_NODES: MapNodeData[] = ALL_DISTRICTS.map((d) => d.node);
