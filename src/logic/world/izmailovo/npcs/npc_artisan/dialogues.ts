import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_artisan_dialogues = new DialogueBuilder('npc_artisan')
  .addNode('intro', 'РЕМЕСЛЕННИК_ЛИ', 'Код должен быть не только быстрым, но и красивым. Раньше у хакеров был почерк.', [
      { text: 'Рассказать об искусстве.', nextId: 'lore' },
      { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addLoreNode('lore', 'РЕМЕСЛЕННИК_ЛИ', 'Ядро хочет одинаковости. Но мы помним стиль. (+10 Репутации Neo Kyoto)', 'LEAVE', 'Neo Kyoto', { effect: 'GIVE_REPUTATION', amount: 10 })
  .build();
