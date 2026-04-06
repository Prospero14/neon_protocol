import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const combat_retro_virus_dialogue: DialogueTree = new DialogueBuilder('combat_retro_virus')
  .addNode('intro', 'РЕТРО-ВИРУС 86', 'Древняя цифровая зараза, которая переписывает таблицу разделов и взывает к 16-битной памяти. Она не понимает современных протоколов защиты. Либо ты её дефрагментируешь, либо она вернет твой IP в 1986 год.', [
    { text: '[ УДАЛИТЬ ВИРУС ]', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'combat_retro_virus' },
    { text: '[ ОТСТУПИТЬ ]', nextId: 'LEAVE' }
  ])
  .build();
