import { DialogueBuilder } from '../../../../dialogueUtils';

export const term_library_dialogues = new DialogueBuilder('term_library')
  .addNode('intro', 'БИБЛИОТЕКА КОДА', 'Интерфейс: БИБЛИОТЕКА_КОДА. Доступные архивы:', [
    { text: 'История Ядра и Net Drivers', nextId: 'lore_1' },
    { text: 'Принципы Java Core', nextId: 'lore_2' },
    { text: '[Выход]', nextId: 'LEAVE' }
  ])
  .addLoreNode('lore_1', 'БИБЛИОТЕКА КОДА', 'В 2042 году Ядро было признано единым управляющим интерфейсом Москвы. Net Drivers стали его хранителями.', 'intro')
  .addLoreNode('lore_2', 'БИБЛИОТЕКА КОДА', 'Java — это язык, на котором написано само выживание города. Вся Москва — это одна большая JVM.', 'intro')
  .build();
