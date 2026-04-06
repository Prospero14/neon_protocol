import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_informant_dialogues = new DialogueBuilder('npc_informant')
  .addNode('intro', 'ИНФОРМАТОР М.', 'Тише... Стены здесь не просто имеют уши, они пишут логи. Ищешь обходной путь в Ядро или просто хочешь купить свежий компромат на Инквизитора?', [
    { text: 'Нужен пропуск в Ядро.', nextId: 'quest_pass' },
    { text: 'Что ты знаешь об Инквизиции?', nextId: 'lore' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('quest_pass', 'ИНФОРМАТОР М.', 'Официальный пропуск? Забудь. Но я могу дать тебе перехватчик частот. Он обманет сканеры на шлюзе. Цена — 150 Bits.', [
    { text: 'Покупаю.', nextId: 'intro', cost: 150, effect: 'GIVE_CARD', cardRewardId: 'soft_bypass_key' },
    { text: 'Дорого.', nextId: 'intro' }
  ])
  .addLoreNode('lore', 'ИНФОРМАТОР М.', 'Они не люди. Они — функции, застрявшие в бесконечном цикле отладки мира. Хочешь выжить — не становись переменной в их уравнении.', 'intro')
  .build();
