import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const shop_pharmacy_dialogue: DialogueTree = new DialogueBuilder('shop_pharmacy').withDistrict('maryino')
  .withGreetings({
    neutral: ['intro', 'intro_v2']
  })
  .addNode('intro', 'ДАТА_АПТЕКА', 'Ампулы с жидким кодом. Патчи для оболочек. Очистка кэша и стабилизация сигнала.', [
    { text: 'Патч "Стабильность" (40 Bits)', nextId: 'intro', cost: 40, effect: 'GIVE_CARD', cardRewardId: 'def_stability_patch', subtext: 'Увеличивает защиту деки.' },
    { text: 'Сборка "Анти-фриз" (60 Bits)', nextId: 'intro', cost: 60, effect: 'GIVE_CARD', cardRewardId: 'reac_antifreeze', subtext: 'Снимает дебаффы скорости.' },
    { text: 'Нейро-мазь «Холодный шов» (35)', nextId: 'intro', cost: 35, awardItemId: 'itm_neural_salve', subtext: 'Чуть дешевле, чем на свалке.' },
    { text: 'Синт-кофе «Дедлайн» (14)', nextId: 'intro', cost: 14, awardItemId: 'itm_synth_coffee', subtext: 'Лёгкий буст стресса.' },
    { text: '[USE] Debug Tea (из добычи)', nextId: 'intro', requireLootItemId: 'itm_cons_2', effect: 'USE_GAME_ITEM', cardRewardId: 'itm_cons_2', subtext: 'Применить расходник из рюкзака.' },
    { text: '[USE] Hotfix Capsule', nextId: 'intro', requireLootItemId: 'itm_cons_8', effect: 'USE_GAME_ITEM', cardRewardId: 'itm_cons_8', subtext: 'Снять стресс.' },
    { text: '[USE] Burst Script (бустер)', nextId: 'intro', requireLootItemId: 'itm_boost_1', effect: 'USE_GAME_ITEM', cardRewardId: 'itm_boost_1', subtext: 'Стресс + микро-биты.' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v2', 'ДАТА_АПТЕКА', 'Твой сигнал дрожит? У нас есть лучшие библиотеки оптимизации. Плати — и рендеринг станет плавным.', [
    { text: 'Покажи товар.', nextId: 'intro' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .build();
