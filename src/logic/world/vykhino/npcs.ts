import type { NpcProfile } from '../types';

export const vykhino_npcs: NpcProfile[] = [
  { id: 'npc_grey', name: 'Грей', districtId: 'vykhino', role: 'Гоп-хакер', greeting: 'Метро - это мой VPN.', shortLore: 'Уличный оперативник Redundants. Знает все лазейки метро-шлюзов.', factionId: 'REDUNDANTS' },
  { id: 'npc_vykhino_loader', name: 'Грузчик', districtId: 'vykhino', role: 'Транспортировщик', greeting: 'Осторожно, хрупкие байты!', shortLore: 'Сотрудник логистики Net Drivers. Переносит данные физически.', factionId: 'NET_DRIVERS' },
  { id: 'npc_job_boss', name: 'Фиксер Батя', districtId: 'vykhino', role: 'Фиксер', greeting: 'Работа грязная, оплата чистая.', shortLore: 'Независимый посредник. Имеет связи со всеми фракциями хаба.', factionId: 'NET_DRIVERS' },
  { id: 'npc_corp_scout', name: 'Скаут GIGA_BANK', districtId: 'vykhino', role: 'Рекрутер', greeting: 'Выглядишь перспективно.', shortLore: 'Ищет дешевую рабочую силу для корпоративных дата-центров.', factionId: 'GIGABANK' },
];
