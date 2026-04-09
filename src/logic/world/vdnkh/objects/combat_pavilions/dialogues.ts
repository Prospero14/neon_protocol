import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const combat_pavilions_dialogue: DialogueTree = new DialogueBuilder('combat_pavilions').withDistrict('vdnkh')
  .addNode('intro', 'ЗАЧИСТКА ПАВИЛЬОНОВ', 'Руины выставочных залов кишат старыми ботами-уборщиками, чья логика перепутала "мусор" и "неавторизованного пользователя". Требуется принудительная очистка оверлея.', [
    { text: '[ НАЧАТЬ ЗАЧИСТКУ ]', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'combat_pavilions' },
    { text: '[ ОТСТУПИТЬ ]', nextId: 'LEAVE' }
  ])
  .build();
