import { DialogueBuilder } from '../../../../dialogueUtils';

export const term_loom_control_dialogues = new DialogueBuilder('term_loom_control')
  .addNode('intro', 'ТЕРМИНАЛ-УПРАВЛЕНИЯ', 'Консоль управления 7-й линией. Системный статус: КРИТИЧЕСКИЕ ОШИБКИ.', [
    { text: 'Диагностика системы (Technical).', nextId: 'diag', requireMinLevel: 1 },
    { text: 'Просмотр логов (Quest).', nextId: 'quest_audit', requireQuestId: 'q_safety_audit' },
    { text: '[Выйти]', nextId: 'LEAVE' }
  ])
  .addNode('diag', 'СИСТЕМА', 'Обнаружены чужеродные скрипты. Рекомендуется полная очистка.', [
    { text: 'Вернуться.', nextId: 'intro' }
  ])
  .addNode('quest_audit', 'СИСТЕМА', 'Логи безопасности извлечены. Хеш совпадает с заданием Аудитора. (+Data: Audit_Log)', [
    { text: '[ЗАВЕРШИТЬ ЗАДАЧУ]', nextId: 'LEAVE', completeQuestId: 'q_safety_audit' }
  ])
  .build();
