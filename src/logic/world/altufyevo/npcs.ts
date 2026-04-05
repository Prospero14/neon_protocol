import type { NpcProfile } from '../types';

export const altufyevo_npcs: NpcProfile[] = [
  { id: 'npc_petrovich', name: 'Петрович', districtId: 'altufyevo', role: 'Техник', greeting: 'Плату в руки и не дыши.', shortLore: 'Старый мастер. На куртке засаленная нашивка Rust Valley.', factionId: 'RUST_VALLEY' },
  { id: 'npc_varvar', name: 'Варвар', districtId: 'altufyevo', role: 'Хакер-отшельник', greeting: 'Сначала проверка CRC, потом разговор.', shortLore: 'Параноик с логотипом Nullpointers на протезе руки.', factionId: 'NULLPOINTERS' },
  { id: 'npc_nixanna', name: 'Никсанна', districtId: 'altufyevo', role: 'Геймдизайнер', greeting: 'Баланс не баг, баланс - религия.', shortLore: 'Использует терминал от Silicon Hedge.', factionId: 'SILICON_HEDGE' },
  { id: 'job_board_alt', name: 'Доска Объявлений', districtId: 'altufyevo', role: 'Контракт-хаб', greeting: 'Берешь контракт - доводи до результата.', shortLore: 'Официальный терминал Net Drivers.', factionId: 'NET_DRIVERS' },
  { id: 'shop_scrap', name: 'Серый (Скупщик)', districtId: 'altufyevo', role: 'Торговец', greeting: 'Bits в руки - товар в деку. Никаких гарантий.', shortLore: 'Скупщик краденного и списанного железа. Всегда на связи с теневыми рынками.', factionId: 'INDEPENDENT' },
];
