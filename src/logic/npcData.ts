import { NPC_LIBRARY as MODULAR_NPC_LIBRARY } from './world';

export interface NpcProfile {
  id: string;
  name: string;
  districtId: string;
  role: string;
  greeting: string;
  shortLore: string;
  image?: string;
}

export const NPC_LIBRARY: NpcProfile[] = MODULAR_NPC_LIBRARY;
