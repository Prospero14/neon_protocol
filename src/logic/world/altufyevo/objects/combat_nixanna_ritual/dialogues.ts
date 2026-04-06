import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const combat_nixanna_ritual_dialogue: DialogueTree = new DialogueBuilder('combat_nixanna_ritual')
  .addNode('intro', 'РИТУАЛ // АЛГОРИТМ', 'Перед тобой мерцает узел "Ритуал". Никсанна говорит, что здесь ломается реальность. Сетчатка глаза фиксирует артефакты рендеринга. Воздух дрожит — буфер глубины переполнен.', [
    { text: '[ ПОДКЛЮЧИТЬСЯ К УЗЛУ ]', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'combat_nixanna_ritual' },
    { text: '[ ОТКЛЮЧИТЬСЯ ]', nextId: 'LEAVE' }
  ])
  .build();
