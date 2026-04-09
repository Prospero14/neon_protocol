import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const term_archive_data_dialogue: DialogueTree = new DialogueBuilder('term_archive_data').withDistrict('vdnkh')
  .addNode('intro', 'АРХИВ ВДНХ', '[ACCESS_GRANTED] Исторические логи Pavilion Zero. Здесь хранятся сигнатуры тех, кто строил первый сегмент Москвы. Желаете извлечь архивные данные?', [
    { text: '[ ИЗВЛЕЧЬ ЛОГИ ] (Lore)', nextId: 'lore' },
    { text: '[ СИНХРОНИЗИРОВАТЬ ДЕКУ ]', nextId: 'LEAVE', effect: 'GIVE_BITS', amount: 30 },
    { text: '[ ВЫХОД ]', nextId: 'LEAVE' }
  ])
  .addLoreNode('lore', 'АРХИВ ВДНХ', 'ВДНХ был построен как гигантский хаб данных для всего Союза. Павильоны — это изолированные серверные ноды. (+10 Репутации Voskhod)', 'intro', 'Voskhod')
  .build();
