import { DialogueBuilder } from '../../../../dialogueUtils';

export const combat_modder_clash_dialogues = new DialogueBuilder('combat_modder_clash').withDistrict('mitino')
  .addNode('intro', 'СТЫК РАЗГОНЩИКОВ', 'Группа оверклокеров не поделила партию разогнанных чипов. Ситуация накаляется. Хотите вмешаться?', [
    { text: '[ РАЗРУЛИТЬ КОНФЛИКТ (БОЙ) ]', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'combat_mitino_modder' },
    { text: '[ ОТСТУПИТЬ ]', nextId: 'LEAVE' }
  ])
  .build();
