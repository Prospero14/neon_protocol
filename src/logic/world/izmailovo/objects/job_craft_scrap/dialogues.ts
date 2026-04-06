import { DialogueBuilder } from '../../../../dialogueUtils';

export const job_craft_scrap_dialogues = new DialogueBuilder('job_craft_scrap')
  .addNode('intro', 'СБОР ДЕТАЛЕЙ', 'На свалке лежат "корзины" памяти. Боты Silicon Hedge считают их своими. Вырезать защиту и забрать модули?', [
    { text: '[ НАЧАТЬ СБОР ЛОМА ]', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'combat_izmailovo_scrap' },
    { text: '[ ОТСТУПИТЬ ]', nextId: 'LEAVE' }
  ])
  .build();
