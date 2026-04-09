import { DialogueBuilder } from '../../../../dialogueUtils';

export const term_sub_net_dialogues = new DialogueBuilder('term_sub_net').withDistrict('perovo')
  .addNode('intro', 'ПОДСЕТЬ ПЕРОВО', '[SYSTEM] Доступ к локальным данным. Протокол 14 активен.', [
      { text: 'Сканировать битые сектора (Energy: 5)', nextId: 'scan_results' },
      { text: '[ ВЫХОД ]', nextId: 'LEAVE' }
  ])
  .addNode('scan_results', 'ПОДСЕТЬ ПЕРОВО', '[DATA] Найдено: 15 Bits и куча зашифрованных логов Net Drivers.', [
      { text: '[ ЗАБРАТЬ BITS ]', nextId: 'LEAVE', effect: 'GIVE_BITS', amount: 15 }
  ])
  .build();
