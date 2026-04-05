import type { NpcProfile } from '../types';

export const teply_stan_npcs: NpcProfile[] = [
  { id: 'npc_ranger', name: 'Егерь', districtId: 'teply_stan', role: 'SRE-патруль', greeting: 'Стабильность - это дисциплина.', shortLore: 'Офицер Federal Oversight. Очищает лес от системного мусора.', factionId: 'FEDERAL_OVERSIGHT' },
  { id: 'npc_hermit_forest', name: 'Лесной Отшельник', districtId: 'teply_stan', role: 'Био-хакер', greeting: 'Чего ты ищешь в моем уединении?', shortLore: 'Симбиот Biosyndicate. Слышит шепот дикого кода.', factionId: 'BIOSYNDICATE' },
  { id: 'npc_sre_recruit', name: 'Рекрут Патруля', districtId: 'teply_stan', role: 'Стажер', greeting: 'Егерь сказал, что я еще не готов...', shortLore: 'Новичок Federal Oversight. Мечтает о подвигах.', factionId: 'FEDERAL_OVERSIGHT' },
];
