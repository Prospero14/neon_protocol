import { DialogueBuilder } from '../../../../dialogueUtils';

export const term_central_gate_dialogues = new DialogueBuilder('term_central_gate').withDistrict('taganka')
  .addNode('intro', 'ЦЕНТРАЛЬНЫЙ ШЛЮЗ', '[SYSTEM_LOGS] Доступ к Ядру Октября ограничен Инквизицией. Введите ключ допуска Crimson Access.', [
    { text: 'Использовать Crimson Access Key.', nextId: 'access_granted', requireItemId: 'item_gate_key_taganka' },
    { text: 'Обходной путь (Informant M Bypass).', nextId: 'access_granted', requireItemId: 'soft_bypass_key' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('access_granted', 'ЦЕНТРАЛЬНЫЙ ШЛЮЗ', '[SUCCESS] ПШИК... ТЯЖЕЛЫЙ ГЕРМОЗАТВОР МЕДЛЕННО ОТКРЫВАЕТСЯ. ПУТЬ К ЯДРУ СВОБОДЕН.', [
    { text: '[ ВОЙТИ В ЯДРО ]', nextId: 'LEAVE', awardQuestId: 'q_taganka_core_access_granted' }
  ])
  .build();
