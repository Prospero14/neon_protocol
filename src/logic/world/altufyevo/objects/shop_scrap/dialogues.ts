import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const shop_scrap_dialogue: DialogueTree = new DialogueBuilder('shop_scrap')
  .withGreetings({
    neutral: ['intro', 'intro_v2']
  })
  .addNode('intro', 'СЕРЫЙ', 'Эй, кодер! Ищешь что-то по дешёвке? Свалка — это жизнь. Корпораты выбрасывают, мы подбираем. Главное — чтобы "Восход" не накрыл.', [
    { text: 'Как движется торговля?', nextId: 'lore_trade' },
    { text: 'System.out.print (20 Bits)', nextId: 'intro', cost: 20, effect: 'GIVE_CARD', cardRewardId: 'fn_sysout_print', subtext: 'Базовая карта отладки.' },
    { text: 'Old HW: Fan (30 Bits)', nextId: 'intro', cost: 30, effect: 'GIVE_CARD', cardRewardId: 'infra_old_hw', subtext: 'Немного снижает Stress.' },
    { text: '[УЙТИ]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v2', 'СЕРЫЙ', '*перебирает платы* Опа, клиент! Сегодня завезли партию с Измайловского рынка. Свежак, почти не горелый. Интересует?', [
    { text: 'Покажи товар.', nextId: 'intro' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addLoreNode('lore_trade', 'СЕРЫЙ', 'Да как... Свалка — это жизнь. Корпораты выбрасывают, мы подбираем. Главное — чтобы "Восход" не накрыл. (+Intel: Scrap_Market)', 'intro')
  .build();
