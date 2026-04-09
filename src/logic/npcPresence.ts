import { NIGHT_CONTACT_PRESENCE } from './nightContacts';
import { DAY_CONTACT_PRESENCE } from './dayContacts';

export interface NpcPresenceConfig {
  npcId: string;
  name: string;
  homeNodeId: string;
  awayNodeId: string;
  awayDistrictId?: string;
  awayChance: number;
  awayNote: string;
  availablePhases?: NpcDayPhase[];
  unavailableNote?: string;
  discoveryQuestId?: string; // If set, home is hidden until quest is finished/talked
}

export type NpcDayPhase = 'morning' | 'day' | 'evening' | 'night';
const ALL_PHASES: NpcDayPhase[] = ['morning', 'day', 'evening', 'night'];

export const isNpcAvailableInPhase = (config: NpcPresenceConfig, phase: NpcDayPhase): boolean => {
  const phases = config.availablePhases?.length ? config.availablePhases : ALL_PHASES;
  return phases.includes(phase);
};

export const isNpcHomeAccessible = (
  config: NpcPresenceConfig,
  phase: NpcDayPhase,
  presenceMap: Record<string, 'HOME' | 'AWAY'>
): boolean => {
  if (!isNpcAvailableInPhase(config, phase)) return false;
  return presenceMap[config.npcId] !== 'AWAY';
};

export const NPC_PRESENCE_CONFIGS: Record<string, NpcPresenceConfig> = {
  npc_petrovich: {
    npcId: 'npc_petrovich',
    name: 'Петрович',
    homeNodeId: 'npc_petrovich',
    awayNodeId: 'bar_chips',
    awayChance: 0.3,
    awayNote: 'Записка на двери: Ушел в бар. Буду поздно.',
    availablePhases: ['morning', 'day', 'evening'],
    unavailableNote: 'Записка на двери: Ночью Петрович не принимает. Возвращайся после рассвета.',
    discoveryQuestId: 'q_kiddo_start'
  },
  npc_varvar: {
    npcId: 'npc_varvar',
    name: 'ВАРВАР',
    homeNodeId: 'npc_varvar',
    awayNodeId: 'term_silo_7',
    awayChance: 0.2,
    awayNote: 'Записка на двери: Прозваниваю порты на нижнем ярусе. Не входить.',
    availablePhases: ['morning', 'day'],
    unavailableNote: 'Записка на двери: ВАРВАР сменила смену. Работает только до заката.'
  },
  npc_nixanna: {
    npcId: 'npc_nixanna',
    name: 'НИКСАННА',
    homeNodeId: 'npc_nixanna',
    awayNodeId: 'combat_nixanna_ritual',
    awayChance: 0.4,
    awayNote: 'Записка на двери: Ушла в рендер. Буду когда догорит видюха.',
    availablePhases: ['evening', 'night'],
    unavailableNote: 'Записка на двери: Никсанна появится ближе к ночи. Раньше нет смысла ждать.'
  },
  shop_scrap: {
    npcId: 'shop_scrap',
    name: 'Серый',
    homeNodeId: 'shop_scrap',
    awayNodeId: 'bar_chips',
    awayChance: 0.15,
    awayNote: 'Записка на двери: Ушел пропивать выручку. Заходи завтра.'
  },
  npc_midnight_runner: {
    npcId: 'npc_midnight_runner',
    name: 'Миднайт Раннер',
    homeNodeId: 'npc_midnight_runner',
    awayNodeId: 'npc_barman',
    awayChance: 1,
    awayNote: 'Сигнал в терминале: RUNNER ушёл проверить закладку в переулке.',
    availablePhases: ['night']
  },
  npc_lumen: {
    npcId: 'npc_lumen',
    name: 'ЛЮМЕН',
    homeNodeId: 'npc_lumen',
    awayNodeId: 'bar_chips',
    awayChance: 1,
    awayNote: 'Голозаписка: LUMEN на обходе крыш. Вернется до рассвета.',
    availablePhases: ['night']
  },
  ...DAY_CONTACT_PRESENCE,
  ...NIGHT_CONTACT_PRESENCE
};
