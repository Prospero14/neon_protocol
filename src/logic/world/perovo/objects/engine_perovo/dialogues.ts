import { DialogueBuilder } from '../../../../dialogueUtils';

export const engine_perovo_dialogues = new DialogueBuilder('engine_perovo')
  .addNode('intro', 'ЗАВОДСКАЯ ТУРБИНА', '[STATUS] Вибрация. Калибровка фазового сдвига. Авторизоваться?', [
      { text: '[ ПРОВЕСТИ КАЛИБРОВКУ ]', nextId: 'success', requireQuestId: 'q_perovo_engine_repair' },
      { text: '[ ВЫХОД ]', nextId: 'LEAVE' }
  ])
  .addNode('success', 'ЗАВОДСКАЯ ТУРБИНА', '[SUCCESS] Вибрация устранена. Тайминги синхронизированы.', [
      { text: '[ ВЫЙТИ ]', nextId: 'LEAVE' }
  ])
  .build();
