import type { NpcProfile } from '../types';

export const izmailovo_npcs: NpcProfile[] = [
  { id: 'npc_master', name: 'Мастер Верстак', districtId: 'izmailovo', role: 'Крафтер', greeting: 'Из лома делаем легенды.', shortLore: 'Хранитель старых схем. На столе стоит терминал Резервистов.', factionId: 'REDUNDANTS' },
  { id: 'npc_artisan', name: 'Ремесленник Ли', districtId: 'izmailovo', role: 'Художник кода', greeting: 'Красота в логике.', shortLore: 'Стилист Silicon Hedge. Гравирует код на алмазах.', factionId: 'SILICON_HEDGE' },
  { id: 'npc_collector', name: 'Коллекционер', districtId: 'izmailovo', role: 'Архивариус', greeting: 'Дампы не горят.', shortLore: 'Ищет данные v0.04 для Redundants.', factionId: 'REDUNDANTS' },
  { id: 'npc_gennady', name: 'Гена (Скупщик)', districtId: 'izmailovo', role: 'Черный рынок', greeting: 'Шепотом говори, у стен есть уши.', shortLore: 'Брокер Net Drivers в Измайлово.', factionId: 'NET_DRIVERS' },
  { id: 'npc_old_timer', name: 'Старый Радист', districtId: 'izmailovo', role: 'Ветеран', greeting: 'Ловлю помехи из прошлого.', shortLore: 'Бывший связист Voskhod. Считает, что Октябрь — это всего лишь глюк.', factionId: 'VOSKHOD_OFFICE' },
];
