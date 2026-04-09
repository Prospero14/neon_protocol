import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const shop_scrap_dialogue: DialogueTree = new DialogueBuilder('shop_scrap').withDistrict('altufyevo')
  .withGreetings({
    neutral: ['intro', 'intro_v2']
  })
  .addNode('intro', 'СЕРЫЙ', 'Тише по шине — патруль Восхода любит слушать. Здесь не магазин, а кишечник города: корпорация выбросила, ты подобрал, кто-то третий уже следит по метаданным. Нужны утилиты — плати Bits, не нравится — иди к Петровичу за моралью.', [
    { text: 'Как движется торговля?', nextId: 'lore_trade' },
    { text: 'PING_REQUEST (15 Bits)', nextId: 'intro', cost: 15, effect: 'GIVE_CARD', cardRewardId: 'script_ping', subtext: 'Локальная утилита [SH]. Проверка узла.' },
    { text: 'LS_DIR (15 Bits)', nextId: 'intro', cost: 15, effect: 'GIVE_CARD', cardRewardId: 'script_ls', subtext: 'Локальная утилита [SH]. Листинг файлов.' },
    { text: 'CAT_FILE (20 Bits)', nextId: 'intro', cost: 20, effect: 'GIVE_CARD', cardRewardId: 'script_cat', subtext: 'Локальная утилита [SH]. Чтение данных.' },
    { text: 'Old HW: Fan (25 Bits)', nextId: 'intro', cost: 25, effect: 'GIVE_CARD', cardRewardId: 'infra_old_hw', subtext: 'Немного снижает Stress.' },
    { text: '[УЙТИ]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v2', 'СЕРЫЙ', '*перебирает платы* Партия с Измайла — почти не воняет озоном. Пока Восход не пришил маршрут, успеешь забрать, что нужно для своей «курсовой» в поле.', [
    { text: 'Покажи товар.', nextId: 'intro' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addLoreNode('lore_trade', 'СЕРЫЙ', 'Поток мусора с северных силосов — как кровь: всегда течёт, всегда чужой. Мы здесь не герои, а посредники между тем, кто выкинул, и тем, кто купит. Белый список Восхода узок — не влезь в кадр камеры. (+Intel: Scrap_Market)', 'intro')
  .build();
