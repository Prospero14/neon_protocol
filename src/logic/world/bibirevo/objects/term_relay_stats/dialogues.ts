import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const term_relay_stats_dialogue: DialogueTree = new DialogueBuilder('term_relay_stats')
  .addNode('intro', 'СТАТИСТИКА РЕЛЕ', '[SYSTEM] ЛОГИ_СЕВЕРНОГО_УЗЛА. ПРОВЕРКА_ТРАФИКА:', [
    { text: 'Посмотреть загрузку (5 Bits)', nextId: 'lore', cost: 5 },
    { text: '[Выход]', nextId: 'LEAVE' }
  ])
  .addNode('lore', 'СТАТИСТИКА РЕЛЕ', '[LOG] Пакеты теряются в 32% случаев. Основные помехи: "Jitter_Ghost" и "Static_Void". Рекомендуется дефрагментация.', [
    { text: 'Назад', nextId: 'intro' }
  ])
  .build();
