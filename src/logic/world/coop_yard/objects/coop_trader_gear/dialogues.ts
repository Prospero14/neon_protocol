import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const coop_trader_gear_dialogue: DialogueTree = new DialogueBuilder('coop_trader_gear').withDistrict('coop_yard')
  .withGreetings({
    neutral: ['intro', 'intro_v2']
  })
  .addNode('intro', 'ЖЁЛТЫЙ ЯЩИК', 'Спринт-полигон: всё по накладной, без бумажек. Карты и расходники — чтобы не утонуть в первом же бою.', [
    { text: 'PING (12 Bits)', nextId: 'intro', cost: 12, effect: 'GIVE_CARD', cardRewardId: 'script_ping', subtext: 'Проверка узла.' },
    { text: 'LS (12 Bits)', nextId: 'intro', cost: 12, effect: 'GIVE_CARD', cardRewardId: 'script_ls', subtext: 'Листинг.' },
    { text: 'CAT (18 Bits)', nextId: 'intro', cost: 18, effect: 'GIVE_CARD', cardRewardId: 'script_cat', subtext: 'Чтение дампа.' },
    { text: 'GREP (22 Bits)', nextId: 'intro', cost: 22, effect: 'GIVE_CARD', cardRewardId: 'script_grep', subtext: 'Фильтр строк.' },
    { text: 'Old HW (22 Bits)', nextId: 'intro', cost: 22, effect: 'GIVE_CARD', cardRewardId: 'infra_old_hw', subtext: 'Чуть −стресс.' },
    { text: 'Синт-кофе (14)', nextId: 'intro', cost: 14, awardItemId: 'itm_synth_coffee', subtext: 'Расходник: −стресс.' },
    { text: '[Выход]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v2', 'ЖЁЛТЫЙ ЯЩИК', 'Новая партия утилит — пока шина не перегрелась, бери что нужно.', [
    { text: 'К ассортименту.', nextId: 'intro' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .build();
