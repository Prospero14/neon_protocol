import { DialogueBuilder } from '../../../../dialogueUtils';

export const term_radio_relay_dialogues = new DialogueBuilder('term_radio_relay').withDistrict('mitino')
  .addNode('intro', 'РАДИО-РЕЛЕ', 'Древнее, но надежное оборудование. Позволяет транслировать данные на большие расстояния через старые частоты.', [
    { text: 'Обновить таблицу маршрутов.', nextId: 'rank_check' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('rank_check', 'РАДИО-РЕЛЕ', '[SCANNING...] ТРЕБУЕТСЯ УРОВЕНЬ 3+.', [
    { text: '[ Ждать ]', nextId: 'access_denied', requireMaxLevel: 2, isTraineeOnly: true },
    { text: '[ Ждать ]', nextId: 'access_granted', requireMinLevel: 3 },
    { text: '[ Ждать ]', nextId: 'access_granted', isProOnly: true }
  ])
  .addNode('access_denied', 'РАДИО-РЕЛЕ', '[ERROR] НЕДОСТАТОЧНО ОПЫТА ДЛЯ КАЛИБРОВКИ. (ACCESS_DENIED)', [
    { text: 'Понял.', nextId: 'LEAVE' }
  ])
  .addNode('access_granted', 'РАДИО-РЕЛЕ', '[SUCCESS] КАНАЛ СТАБИЛИЗИРОВАН. БОНУС: 50 Bits.', [
    { text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', effect: 'GIVE_BITS', amount: 50, awardQuestId: 'q_mitino_term_relay_stabilizer' }
  ])
  .build();
