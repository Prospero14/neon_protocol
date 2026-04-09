import { DialogueBuilder } from '../../../../dialogueUtils';

export const term_forest_log_dialogues = new DialogueBuilder('term_forest_log').withDistrict('sokolniki')
  .addNode('intro', 'ЖУРНАЛ ЛЕСА', '[SYSTEM_LOGS] Данные о росте подсетей: 68% стабильности. Рекомендуется калибровка датчиков в 5-м секторе.', [
    { text: 'Запустить калибровку датчиков.', nextId: 'rank_check' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('rank_check', 'ЖУРНАЛ ЛЕСА', '[SCANNING...] ТРЕБУЕТСЯ УРОВЕНЬ 4+.', [
    { text: '[ Ждать ]', nextId: 'access_denied', requireMaxLevel: 3, isTraineeOnly: true },
    { text: '[ Ждать ]', nextId: 'access_granted', requireMinLevel: 4 },
    { text: '[ Ждать ]', nextId: 'access_granted', isProOnly: true }
  ])
  .addNode('access_denied', 'ЖУРНАЛ ЛЕСА', '[ERROR] НЕДОСТАТОЧНО ПРИВИТЫХ ПРАВ. (ACCESS_DENIED)', [
    { text: 'Вернусь позже.', nextId: 'LEAVE' }
  ])
  .addNode('access_granted', 'ЖУРНАЛ ЛЕСА', '[SUCCESS] СИСТЕМА СПИНХРОНИЗИРОВАНА. БОНУС: 50 Bits.', [
    { text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', effect: 'GIVE_BITS', amount: 50, awardQuestId: 'q_sokolniki_term_forest_calibration' }
  ])
  .build();
