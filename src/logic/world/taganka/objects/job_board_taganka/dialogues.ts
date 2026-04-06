import { DialogueBuilder } from '../../../../dialogueUtils';

export const job_board_taganka_dialogues = new DialogueBuilder('job_board_taganka')
  .addNode('intro', 'ДОСКА РОЗЫСКА: ТАГАНКА', 'Список нарушителей констант Krylovo и ренегатов, скрывающихся в технических туннелях. Награда выплачивается Bits или Репутацией.', [
    { text: 'Охота: Теневой Кодер (Level 5+)', nextId: 'quest_accept_1', requireMinLevel: 5 },
    { text: 'Охота: Призрак Модема (Level 8+)', nextId: 'quest_accept_2', requireMinLevel: 8 },
    { text: '[Выход]', nextId: 'LEAVE' }
  ])
  .addNode('quest_accept_1', 'ДОСКА РОЗЫСКА', 'Объект: Теневой Кодер. Место: Техподполье. Награда: 200 Bits.', [
    { text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', awardQuestId: 'q_taganka_bounty_shadow_coder' }
  ])
  .addNode('quest_accept_2', 'ДОСКА РОЗЫСКА', 'Объект: Призрак Модема. Место: Глубокие Шлюзы. Награда: 500 Bits + 50 Rep (Federal Oversight).', [
    { text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', awardQuestId: 'q_taganka_bounty_modem_ghost' }
  ])
  .build();
