import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const term_silo_7_dialogue: DialogueTree = new DialogueBuilder('term_silo_7').withDistrict('altufyevo')
  .addNode('intro', 'СИЛОС_#7', '[SYSTEM_ALERT] Температура: 115°C. Ошибка контура. Сервисный лог: Нашествие вредителей ("rats").', [
    { text: 'Провести диагностику охлаждения', nextId: 'diag_finish', requireQuestId: 'q_altufyevo_silo_scout' },
    { text: '[ВЫХОД]', nextId: 'LEAVE' }
  ])
  .addNode('diag_finish', 'СИЛОС_#7', '[SUCCESS] Пингую систему... Узел заблокирован физически. Требуется локальная зачистка.', [
    { text: '[ ЗАВЕРШИТЬ ДИАГНОСТИКУ ]', nextId: 'LEAVE', effect: 'GIVE_BITS', amount: 40 }
  ])
  .build();
