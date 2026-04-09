import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const combat_magnus_toilet_dialogue: DialogueTree = new DialogueBuilder('combat_magnus_toilet').withDistrict('altufyevo')
  .addNode('intro', 'УБОРНАЯ №4 // LOCKOUT', 'Дверь заблокирована. Бот VOSKHOD яростно мигает красным. Слышно приглушенное мяуканье Магнуса. Система очистки считает тебя "критическим багом".', [
    { text: '[ ВЗЛОМАТЬ ЗАМОК ]', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'combat_magnus_toilet' },
    { text: '[ ОТСТУПИТЬ ]', nextId: 'LEAVE' }
  ])
  .build();
