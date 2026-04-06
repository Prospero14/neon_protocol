import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const term_404_dialogue: DialogueTree = new DialogueBuilder('term_404')
  .addNode('intro', 'ТЕРМИНАЛ_#404', '[SYSTEM_ERROR] Файл не найден. Обнаружены скрытые дампы и призраки старого Web 2.0.', [
    { text: 'Вскрыть логи (25 Bits)', nextId: 'lore', cost: 25 },
    { text: 'Восстановить разделы.', nextId: 'quest_404_accept' },
    { text: 'Сектора восстановлены.', nextId: 'quest_404_finish', requireQuestId: 'q_maryino_terminal_404' },
    { text: '[Выход]', nextId: 'LEAVE' }
  ])
  .addNode('quest_404_accept', 'ТЕРМИНАЛ_#404', '[WARNING] Требуется перезапись MFT. Риск повреждения деки. Начать процесс восстановления?', [
    { text: '[ ПОРТ: CONNECT ]', nextId: 'LEAVE', awardQuestId: 'q_maryino_terminal_404' },
    { text: 'Отмена.', nextId: 'intro' }
  ])
  .addNode('quest_404_finish', 'ТЕРМИНАЛ_#404', '[SUCCESS] Обнаружен Bits-архив. Сектора 404-408 снова доступны.', [
    { text: '[ ВЫЙТИ ]', nextId: 'LEAVE', effect: 'GIVE_BITS', amount: 120, completeQuestId: 'q_maryino_terminal_404' }
  ])
  .addLoreNode('lore', 'ТЕРМИНАЛ_#404', 'Марьино — цифровое кладбище. Призраки Web 2.0. (+10 Void)', 'intro', 'Void')
  .build();
