import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const shop_north_link_dialogue: DialogueTree = new DialogueBuilder('shop_north_link').withDistrict('bibirevo')
  .withGreetings({
    neutral: ['intro', 'intro_v2']
  })
  .addNode('intro', 'СЕВЕРНЫЙ ПОТОК', 'Высокочастотные модули связи. Идеально для тех, кто не любит ждать.', [
    { text: 'Ping Flood (45 Bits)', nextId: 'intro', cost: 45, effect: 'GIVE_CARD', cardRewardId: 'fn_ping_flood', subtext: 'Наносит урон по CPU.' },
    { text: 'Network Hub (80 Bits)', nextId: 'intro', cost: 80, effect: 'GIVE_CARD', cardRewardId: 'infra_hub', subtext: 'Снижает стоимость команд.' },
    { text: '[Выход]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v2', 'СЕВЕРНЫЙ ПОТОК', 'Сегодня завезли партию волноводов от Net Drivers. Качество 10/10. Хочешь апгрейд?', [
    { text: 'Покажи товар.', nextId: 'intro' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .build();
