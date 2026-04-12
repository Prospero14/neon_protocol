import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const coop_trader_ops_dialogue: DialogueTree = new DialogueBuilder('coop_trader_ops').withDistrict('coop_yard')
  .withGreetings({
    neutral: ['intro', 'intro_v2']
  })
  .addNode('intro', 'ОПЕРАТОР «СПРИНТ»', 'Я закрываю «длинный хвост» операций: туннели, копии, права. Для парной сессии — без сюрпризов на шине.', [
    { text: 'SSH (82 Bits)', nextId: 'intro', cost: 82, effect: 'GIVE_CARD', cardRewardId: 'script_ssh', subtext: 'Туннель.' },
    { text: 'SCP (92 Bits)', nextId: 'intro', cost: 92, effect: 'GIVE_CARD', cardRewardId: 'script_scp', subtext: 'Копирование.' },
    { text: 'SUDO_FIX (100 Bits)', nextId: 'intro', cost: 100, effect: 'GIVE_CARD', cardRewardId: 'script_sudo_fix', subtext: 'Принудительный фикс.' },
    { text: 'Edge Cache (120 Bits)', nextId: 'intro', cost: 120, effect: 'GIVE_CARD', cardRewardId: 'infra_edge_cache', subtext: 'Стабильность шины.' },
    { text: 'Safe Proxy (138 Bits)', nextId: 'intro', cost: 138, effect: 'GIVE_CARD', cardRewardId: 'infra_safe_proxy', subtext: 'Меньше шума.' },
    { text: 'Нейро-мазь (100)', nextId: 'intro', cost: 100, awardItemId: 'itm_neural_salve', subtext: 'Снятие стресса.' },
    { text: '[Выход]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v2', 'ОПЕРАТОР «СПРИНТ»', 'Если рейтинг горит — добейся стабильности на контуре, потом уже красота кода.', [
    { text: 'К товару.', nextId: 'intro' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .build();
