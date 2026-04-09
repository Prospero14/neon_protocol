import { DialogueBuilder } from '../../../../dialogueUtils';

export const combat_router_clash_dialogues = new DialogueBuilder('combat_router_clash').withDistrict('teply_stan')
  .addNode('intro', 'СТЫК РОУТЕРОВ', 'Два старых роутера пытаются занять одну и ту же частоту, создавая зону коллизий и помех. Разрешить конфликт?', [
    { text: '[ УСТРАНИТЬ КОЛЛИЗИЮ ]', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'combat_teply_stan_router_clash' },
    { text: '[ ОТСТУПИТЬ ]', nextId: 'LEAVE' }
  ])
  .build();
