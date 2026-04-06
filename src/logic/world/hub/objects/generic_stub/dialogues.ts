import { DialogueBuilder } from '../../../../dialogueUtils';

export const generic_stub_dialogues = new DialogueBuilder('GENERIC_STUB')
  .addNode('intro', 'SYSTEM', '[ОШИБКА_ИНИЦИАЛИЗАЦИИ] Узел существует в топологии, но протокол диалога не найден. Скорее всего, данные повреждены или находятся в разработке.', [
    { text: '[ ПИНГОВАТЬ СНОВА ]', nextId: 'intro' },
    { text: '[ РАЗОРВАТЬ СОЕДИНЕНИЕ ]', nextId: 'LEAVE' }
  ])
  .build();
