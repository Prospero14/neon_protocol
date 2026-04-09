import { DialogueBuilder } from '../../../../dialogueUtils';

export const combat_forest_hunt_dialogues = new DialogueBuilder('combat_forest_hunt').withDistrict('teply_stan')
  .addNode('intro', 'ОХОТА НА БАГ-ТВАРЕЙ', 'Дикий код принял форму мерцающих химер. Они вытягивают энергию из ближайших реле. Очистить сектор?', [
    { text: '[ НАЧАТЬ ОХОТУ ]', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'combat_teply_stan_hunt' },
    { text: '[ ОТСТУПИТЬ ]', nextId: 'LEAVE' }
  ])
  .build();
