import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_mitino_trader_dialogues = new DialogueBuilder('npc_mitino_trader')
  .addNode('intro', 'БАРЫГА МИША', 'Bits вперед, товар потом. Никаких возвратов, никаких жалоб в Ядро. Что ищешь?', [
    { text: 'Я пришел по поводу долга Флэша.', nextId: 'quest_debt_check', requireQuestId: 'q_mitino_debt' },
    { text: 'Купить ключ (60 Bits)', nextId: 'intro', cost: 60, effect: 'GIVE_CARD', cardRewardId: 'fn_ping' },
    { text: 'Уйти', nextId: 'LEAVE' }
  ])
  .addNode('quest_debt_check', 'БАРЫГА МИША', 'Флэш? Этот тормоз всё ещё должен мне. Либо гони 200 Bits прямо сейчас, либо добудь мне ядро с дрона-инспектора.', [
    { text: 'Плачу 200 Bits.', nextId: 'quest_debt_finish', cost: 200 },
    { text: 'Я добуду ядро. (Combat)', nextId: 'quest_debt_combat' },
    { text: 'Позже.', nextId: 'intro' }
  ])
  .addNode('quest_debt_finish', 'БАРЫГА МИША', 'Умный ход. Скажи Флэшу, что он чист... пока что.', [
    { text: 'Передам.', nextId: 'intro', completeQuestId: 'q_mitino_debt' }
  ])
  .addNode('quest_debt_combat', 'БАРЫГА МИША', 'Смело. Охранный дрон в северном узле. Свалишь его — долг обнулим.', [
    { text: '[ В ПУТЬ ]', nextId: 'LEAVE', awardQuestId: 'q_mitino_combat_drone_hunt_bug_sweep' }
  ])
  .build();
