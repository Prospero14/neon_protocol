import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const job_board_bibi_dialogue: DialogueTree = new DialogueBuilder('job_board_bibi').withDistrict('bibirevo')
  .addNode('intro', 'ИНФО-ПАНЕЛЬ', 'СИСТЕМА: Узел Бибирево. Список запросов обновлен.', [
    { text: 'Взять: Fix Link (50 Bits)', nextId: 'accept', requireMaxLevel: 1 },
    { text: '[ЗАКРЫТЬ]', nextId: 'LEAVE' }
  ])
  .addNode('accept', 'ИНФО-ПАНЕЛЬ', 'Контракт активирован. Требуется зачистка узла от помех. КЛИЕНТ: Net Drivers. ОПЛАТА: 50 Bits.', [
    { text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', awardQuestId: 'q_bibirevo_job_fix_link' },
    { text: '[ НАЗАД ]', nextId: 'intro' }
  ])
  .build();
