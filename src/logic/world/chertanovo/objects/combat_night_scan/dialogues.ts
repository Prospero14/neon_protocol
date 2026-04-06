import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const combat_night_scan_dialogue: DialogueTree = new DialogueBuilder('combat_night_scan')
  .addNode('intro', 'НОЧНОЙ СКАН', 'Обнаружен враждебный процесс-перехватчик. Он сканирует твой трафик и пытается выделить заголовок. Нужно вмешательство (Stress-Test), прежде чем он вызовет патруль.', [
    { text: '[ ПРЕРВАТЬ СКАН ]', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'combat_night_scan' },
    { text: '[ ОТСТУПИТЬ ]', nextId: 'LEAVE' }
  ])
  .build();
