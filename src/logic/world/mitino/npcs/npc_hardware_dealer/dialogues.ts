import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_hardware_dealer_dialogues = new DialogueBuilder('npc_hardware_dealer').withDistrict('mitino')
  .addNode('intro', 'РЭЙВИДЖ', 'Миша торгует старьем. У меня — модули, от которых плавится корпус. Хочешь почувствовать настоящую скорость или боишься вылета в синий экран?', [
    { text: 'Что у тебя есть?', nextId: 'shop_hardware' },
    { text: 'Кто ты такой?', nextId: 'lore' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('shop_hardware', 'РЭЙВИДЖ', 'Выбирай. Только не жалуйся, если кулер не вытянет.', [
    { text: 'Overclocked RAM (75 Bits)', nextId: 'intro', cost: 75, effect: 'GIVE_CARD', cardRewardId: 'soft_boost_ram' },
    { text: 'Liquid Cooling Kit (110 Bits)', nextId: 'intro', cost: 110, effect: 'RESTORE_HP', amount: 100 },
    { text: 'Назад', nextId: 'intro' }
  ])
  .addLoreNode('lore', 'РЭЙВИДЖ', 'Я — Рэйвидж. Лучший оверклокер сектора. Работаю с Redundants, потому что они знают толк в экстремальных нагрузках.', 'intro')
  .build();
