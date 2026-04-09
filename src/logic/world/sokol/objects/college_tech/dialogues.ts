import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const college_tech_dialogue: DialogueTree = new DialogueBuilder('college_tech').withDistrict('sokol')
  .addNode('intro', 'КОЛЛЕДЖ ИНФОРМАТИКИ', 'Академический центр EU Syntax. Здесь знания — это закон, а типизация — религия. Что желаете проиндексировать в своей памяти?', [
    { text: 'Библиотека "Advanced Typings" (80 Bits)', nextId: 'intro', cost: 80, effect: 'GIVE_CARD', cardRewardId: 'def_strict_typing', subtext: 'Повышает устойчивость к системным ошибкам.' },
    { text: 'Пакет "Legacy Support" (40 Bits)', nextId: 'intro', cost: 40, effect: 'GIVE_CARD', cardRewardId: 'reac_legacy_buffer', subtext: 'Увеличение кэша памяти.' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .build();
