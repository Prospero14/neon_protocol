import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const shop_vintage_dialogue: DialogueTree = new DialogueBuilder('shop_vintage').withDistrict('vdnkh')
  .withGreetings({
    neutral: ['intro', 'intro_v2']
  })
  .addNode('intro', 'ЛАВКА_РЕТРО_ТЕХ', 'Редкое Legacy. Магнитные катушки, ламповые процессоры, перфокарты с "чистым" энтропийным шумом. То, что Ядро не может проиндексировать.', [
    { text: 'Катушка "Мир-1" (120 Bits)', nextId: 'intro', cost: 120, effect: 'GIVE_CARD', cardRewardId: 'def_legacy_shield', subtext: 'Ультра-защита от современных сканеров.' },
    { text: 'Перфокарта "Zero" (45 Bits)', nextId: 'intro', cost: 45, effect: 'GIVE_CARD', cardRewardId: 'fn_legacy_overflow', subtext: 'Старая добрая ошибка переполнения.' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v2', 'ЛАВКА_РЕТРО_ТЕХ', '*пахнет озоном и старым пластиком* Ты ищешь фундамент. Мы продаем то, на чем стоит эта реальность. Без Bits не входить.', [
    { text: 'Покажи товар.', nextId: 'intro' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .build();
