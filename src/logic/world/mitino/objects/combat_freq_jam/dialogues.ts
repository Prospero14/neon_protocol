import { DialogueBuilder } from '../../../../dialogueUtils';

export const combat_freq_jam_dialogues = new DialogueBuilder('combat_freq_jam').withDistrict('mitino')
  .addNode('intro', 'ПОДАВЛЕНИЕ ЧАСТОТ', 'Белый шум дезориентирует. Регуляторы GigaBank пытаются заглушить подсеть. Чтобы пробить их щиты, нужен ритм: сначала найти узел (ls), затем пингануть его (ping).', [
    { text: '[ ВСТУПИТЬ В БОЙ ]', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'combat_mitino_jam' },
    { text: '[ ОТСТУПИТЬ ]', nextId: 'LEAVE' }
  ])
  .build();
