import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const coop_trader_ops_dialogue: DialogueTree = new DialogueBuilder('coop_trader_ops').withDistrict('coop_yard')
  .withGreetings({
    neutral: ['intro', 'intro_v2']
  })
  .addNode('intro', 'ОПЕРАТОР «СПРИНТ»', 'Я закрываю «длинный хвост» операций: туннели, копии, права. Для парной сессии — без сюрпризов на шине.', [
    { text: 'SSH (28 Bits)', nextId: 'intro', cost: 28, effect: 'GIVE_CARD', cardRewardId: 'script_ssh', subtext: 'Туннель.' },
    { text: 'SCP (32 Bits)', nextId: 'intro', cost: 32, effect: 'GIVE_CARD', cardRewardId: 'script_scp', subtext: 'Копирование.' },
    { text: 'SUDO_FIX (35 Bits)', nextId: 'intro', cost: 35, effect: 'GIVE_CARD', cardRewardId: 'script_sudo_fix', subtext: 'Принудительный фикс.' },
    { text: 'Edge Cache (42 Bits)', nextId: 'intro', cost: 42, effect: 'GIVE_CARD', cardRewardId: 'infra_edge_cache', subtext: 'Стабильность шины.' },
    { text: 'Safe Proxy (48 Bits)', nextId: 'intro', cost: 48, effect: 'GIVE_CARD', cardRewardId: 'infra_safe_proxy', subtext: 'Меньше шума.' },
    { text: 'Нейро-мазь (35)', nextId: 'intro', cost: 35, awardItemId: 'itm_neural_salve', subtext: 'Снятие стресса.' },
    { text: '[Выход]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v2', 'ОПЕРАТОР «СПРИНТ»', 'Если рейтинг горит — добейся стабильности на контуре, потом уже красота кода.', [
    { text: 'К товару.', nextId: 'intro' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .build();
