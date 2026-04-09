import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const combat_anarcho_cell_dialogue: DialogueTree = new DialogueBuilder('combat_anarcho_cell').withDistrict('chertanovo')
  .addNode('intro', 'ЯЧЕЙКА АНАРХИСТОВ', 'Радикалы Нулевых Указателей. Они не признают типов, классов и субординации. Тренировочный бой — лучший способ доказать свою приверженность Пустоте.', [
    { text: '[ СТОЛКНУТЬСЯ С ЯЧЕЙКОЙ ]', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'combat_anarcho_cell' },
    { text: '[ ОТСТУПИТЬ ]', nextId: 'LEAVE' }
  ])
  .build();
