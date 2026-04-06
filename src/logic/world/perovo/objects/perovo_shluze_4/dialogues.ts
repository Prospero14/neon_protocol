import { DialogueBuilder } from '../../../../dialogueUtils';

export const perovo_shluze_4_dialogues = new DialogueBuilder('perovo_shluze_4')
  .addNode('intro', 'ШЛЮЗ №4: КОНВОЙ', 'Gigabank везет данные о долгах района через этот узел. Конвой охранят боты-регуляторы. Это битва за биты.', [
    { text: '[ ПРЕРВАТЬ КОНВОЙ ]', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'combat_perovo_shluze' },
    { text: '[ ОТСТУПИТЬ ]', nextId: 'LEAVE' }
  ])
  .build();
