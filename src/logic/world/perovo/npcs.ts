import type { NpcProfile } from '../types';

export const perovo_npcs: NpcProfile[] = [
  { id: 'npc_marina', name: 'Марина', districtId: 'perovo', role: 'Архивариус', greeting: 'Тише... данные любят тишину.', shortLore: 'Хранительница разрушенных архивов Net Drivers.', factionId: 'NET_DRIVERS' },
  { id: 'npc_basement_coder', name: 'Подвальный кодер', districtId: 'perovo', role: 'Hacker', greeting: '...что? Мой скрипт еще не доработал...', shortLore: 'Представитель Nullpointers в Перово.', factionId: 'NULLPOINTERS' },
  { id: 'npc_resident_perovo', name: 'Местный житель', districtId: 'perovo', role: 'Civilian', greeting: 'Опять эти сервера гудят...', shortLore: 'Лоялист Federal Oversight, мечтает о порядке.', factionId: 'FEDERAL_OVERSIGHT' },
  { id: 'npc_commissar_byte', name: 'Комиссар Байт', districtId: 'perovo', role: 'Агитатор', greeting: 'Биты — народу!', shortLore: 'Лидер ячейки Киберкоммисов в Перово. Мечтает о цифровом равенстве.', factionId: 'CYBERCOMMIS' },
];
