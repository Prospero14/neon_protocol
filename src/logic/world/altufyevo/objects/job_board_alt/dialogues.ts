import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const job_board_alt_dialogue: DialogueTree = new DialogueBuilder('job_board_alt')
  .addNode('intro', 'ДОСКА_ОБЪЯВЛЕНИЙ', 'АКТИВНЫЕ ЦИКЛЫ: 104. ОШИБКИ ДОСТУПА: 0. Список контрактов Северных Силосов:', [
    { text: 'Взять: Доставка в Лабораторию (50 Bits)', nextId: 'job_delivery_accept' },
    { text: 'Взять: Зачистка Силоса #7 (40 Bits)', nextId: 'job_zombie_accept' },
    { text: '[ЗАКРЫТЬ]', nextId: 'LEAVE' }
  ])
  .addNode('job_delivery_accept', 'ДОСКА_ОБЪЯВЛЕНИЙ', 'ОПИСАНИЕ: Доставить партию методичек в Академию. КЛИЕНТ: Илья. ОПЛАТА: 50 Bits.', [
    { text: '[ ПРИНЯТЬ ]', nextId: 'LEAVE', awardQuestId: 'q_sokol_talk_lab_delivery' }
  ])
  .addNode('job_zombie_accept', 'ДОСКА_ОБЪЯВЛЕНИЙ', 'ОПИСАНИЕ: Активность ботов в коллекторах Силоса #7. ТРЕБУЕТСЯ: Дефрагментация. ОПЛАТА: 40 Bits.', [
    { text: '[ ПРИНЯТЬ ]', nextId: 'LEAVE', awardQuestId: 'q_altufyevo_silo_scout' }
  ])
  .build();
