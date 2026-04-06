import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const combat_overflow_dialogue: DialogueTree = new DialogueBuilder('combat_overflow')
  .addNode('intro', 'BUFFER OVERFLOW ZONE', 'Здесь данные выплескиваются за пределы сегментов. Виртуальная среда нестабильна. Код разрывает сам себя. Будь осторожен, в этой зоне память — твой враг.', [
    { text: '[ СТАБИЛИЗИРОВАТЬ ПАМЯТЬ ]', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'combat_overflow' },
    { text: '[ ОТСТУПИТЬ ]', nextId: 'LEAVE' }
  ])
  .build();
