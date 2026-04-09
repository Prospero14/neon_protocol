import { DialogueBuilder } from '../../../../dialogueUtils';

export const combat_wild_firewall_dialogues = new DialogueBuilder('combat_wild_firewall').withDistrict('sokolniki')
  .addNode('intro', 'ДИКИЙ ФАЙРВОЛ', 'Статус: АКТИВЕН. Защитный контур, забытый со времен Первого Хакерского Восстания. Он не узнает вашу сигнатуру.', [
    { text: '[ ПРОБИТЬ ЗАЩИТУ ]', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'combat_sokolniki_firewall' },
    { text: '[ ОТСТУПИТЬ ]', nextId: 'LEAVE' }
  ])
  .build();
