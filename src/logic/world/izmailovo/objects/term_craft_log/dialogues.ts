import { DialogueBuilder } from '../../../../dialogueUtils';

export const term_craft_log_dialogues = new DialogueBuilder('term_craft_log')
  .addNode('intro', 'ЖУРНАЛ МАСТЕРА', '[SYSTEM] ДОСТУП К РЕЦЕПТАМ ОТКРЫТ. ВЫБЕРИТЕ КАТЕГОРИЮ:', [
      { text: 'Архитектура Деки', nextId: 'lore' },
      { text: '[Выход]', nextId: 'LEAVE' }
  ])
  .addLoreNode('lore', 'ЖУРНАЛ МАСТЕРА', '[DATA] Баланс между CPU и RAM. Избыток одного без другого ведет к фризу.', 'intro')
  .build();
