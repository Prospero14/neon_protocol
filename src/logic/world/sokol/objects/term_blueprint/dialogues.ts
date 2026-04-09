import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const term_blueprint_dialogue: DialogueTree = new DialogueBuilder('term_blueprint').withDistrict('sokol')
  .addNode('intro', 'АРХИВ ЧЕРТЕЖЕЙ', '[AUTHORIZED_ONLY] Доступ к схемам авионики и чертежам дронов Сокола. Желаете извлечь архитектурные спецификации?', [
    { text: '[ ИЗВЛЕЧЬ ЛОГИ ] (Lore)', nextId: 'lore' },
    { text: '[ СКАНИРОВАТЬ СЕТЬ ]', nextId: 'LEAVE', effect: 'GIVE_BITS', amount: 40 },
    { text: '[ ВЫХОД ]', nextId: 'LEAVE' }
  ])
  .addLoreNode('lore', 'АРХИВ ЧЕРТЕЖЕЙ', 'Сокол — это не просто район, это гигантская взлетная полоса для системных обновлений Москвы. EU Syntax считает, что без чистой авионики город упадет в вечный лаг. (+10 Репутации EU Syntax)', 'intro', 'EU Syntax')
  .build();
