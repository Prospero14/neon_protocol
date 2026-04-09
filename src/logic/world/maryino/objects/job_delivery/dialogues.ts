import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const job_delivery_dialogue: DialogueTree = new DialogueBuilder('job_delivery').withDistrict('maryino')
  .addNode('intro', 'ДОСТАВКА ДАННЫХ', 'Простая работа за 30 Bits. Нужно доставить пакет данных в соседний хаб. Но дорога кишит "битыми" кадрами.', [
    { text: '[ ПРИНЯТЬ ЗАКАЗ ]', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'job_delivery' },
    { text: '[ ОТКАЗАТЬСЯ ]', nextId: 'LEAVE' }
  ])
  .build();
