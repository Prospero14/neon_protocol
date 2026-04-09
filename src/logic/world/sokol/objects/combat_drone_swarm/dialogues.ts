import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const combat_drone_swarm_dialogue: DialogueTree = new DialogueBuilder('combat_drone_swarm').withDistrict('sokol')
  .addNode('intro', 'РОЙ ДРОНОВ', 'Взломанная система защиты EU Syntax. Рой из сотни разведывательных модулей атакует всё, что не подписано цифровым ключом Сокола. Требуется принудительная синхронизация огнем.', [
    { text: '[ НАЧАТЬ СИНХРОНИЗАЦИЮ ]', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'combat_drone_swarm' },
    { text: '[ УКЛОНИТЬСЯ ОТ СКАНЕРОВ ]', nextId: 'LEAVE' }
  ])
  .build();
