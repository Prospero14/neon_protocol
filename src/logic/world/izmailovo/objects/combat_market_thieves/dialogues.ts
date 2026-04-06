import { DialogueBuilder } from '../../../../dialogueUtils';

export const combat_market_thieves_dialogues = new DialogueBuilder('combat_market_thieves')
  .addNode('intro', 'РЫНОЧНЫЕ ВОРЫ', 'Группа хакеров пытается взломать твой инвентарь прямо в толпе. Твои Bits начинают таять на глазах!', [
    { text: '[ ЗАЩИТИТЬ ДАННЫЕ ]', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'combat_izmailovo_thieves' },
    { text: '[ ОТСТУПИТЬ ]', nextId: 'LEAVE' }
  ])
  .build();
