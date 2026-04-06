import { DialogueBuilder } from '../../../../dialogueUtils';

export const job_board_hub_dialogues = new DialogueBuilder('job_board_hub')
  .addNode('intro', 'ДОСКА ЗАКАЗОВ: THE SOCKET', 'Высокоуровневые контракты. Только для верифицированных операторов.', [
    { text: 'Цифровая подпись Хаба (Level 3+)', nextId: 'quest_sig', requireMinLevel: 3 },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('quest_sig', 'ДОСКА ЗАКАЗОВ', '[CONTRACT] Получить подпись Аудитора GigaBank. Открывает доступ в Верхний Город. Награда: 200 Bits + репутация.', [
    { text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', awardQuestId: 'q_hub_digital_signature' }
  ])
  .build();
