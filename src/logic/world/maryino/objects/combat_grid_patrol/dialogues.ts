import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const combat_grid_patrol_dialogue: DialogueTree = new DialogueBuilder('combat_grid_patrol')
  .addNode('intro', 'ПАТРУЛЬ СЕТКИ', 'Дроны-надзиратели VOSKHOD. Они сканируют каждый бит твоего интерфейса. Нарушение субординации карается удалением.', [
    { text: '[ ПРЕРВАТЬ ПАТРУЛИРОВАНИЕ ]', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'combat_grid_patrol' },
    { text: '[ УКЛОНИТЬСЯ ОТ СКАНЕРА ]', nextId: 'LEAVE' }
  ])
  .build();
