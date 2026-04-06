import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const shop_shady_dialogue: DialogueTree = new DialogueBuilder('shop_shady')
  .withGreetings({
    neutral: ['intro', 'intro_v2']
  })
  .addNode('intro', 'ЛАВКА_ШРАМА', 'Хочешь взломать реальность? У меня есть скрипты, которые Ядро пытается стереть. Запрещенные библиотеки, грязные пайпы.', [
    { text: 'Покажи товар.', nextId: 'trade' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v2', 'ЛАВКА_ШРАМА', '*шепотом* Свежий дам из Октябрьской... Хочешь "Sudo"? Только Bits, никакого кредита. Быстрее, пока патруль не засек сигнал.', [
    { text: 'Показывай.', nextId: 'trade' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('trade', 'ЛАВКА_ШРАМА', 'Только Bits, никакого кредита. Выбирай, кодер. Эти файлы спасут твой IP.', [
    { text: 'Grep Recursion (45 Bits)', nextId: 'intro', cost: 45, effect: 'GIVE_CARD', cardRewardId: 'fn_grep_recursive', subtext: 'Глубокий поиск ошибок врага.' },
    { text: 'Sudo Overload (70 Bits)', nextId: 'intro', cost: 70, effect: 'GIVE_CARD', cardRewardId: 'fn_sudo_fix', subtext: 'Принудительное выполнение команд.' },
    { text: '[Назад]', nextId: 'intro' }
  ])
  .build();
