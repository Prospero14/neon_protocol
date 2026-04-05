import type { NpcProfile } from '../types';

export const fili_npcs: NpcProfile[] = [
  { id: 'npc_kosmos', name: 'Космос', districtId: 'fili', role: 'SRE Nomad', greeting: 'Запуск без логов - самоубийство.', shortLore: 'Скиталец Silicon Hedge. Ищет путь к полному слиянию с Облаком.', factionId: 'SILICON_HEDGE' },
  { id: 'npc_rocket_eng', name: 'Степаныч', districtId: 'fili', role: 'Ракетчик', greeting: 'Тяга кода в норме, поехали.', shortLore: 'Инженер Redundants. Хранит секреты старых ракетных систем Хруничева.', factionId: 'REDUNDANTS' },
  { id: 'npc_orbit_stalker', name: 'Луна', districtId: 'fili', role: 'Orbit Stalker', greeting: 'Спутники шепчут твоё имя.', shortLore: 'Аналитик Telecon. Перехватывает данные с орбитальных узлов.', factionId: 'TELECON' },
  { id: 'npc_echo_broker', name: 'Эхо (Медиа-брокер)', districtId: 'fili', role: 'Медиа-хантер', greeting: 'Правда не всегда хорошо дебажится, но я её добуду.', shortLore: 'Главный редактор "Moscow Echo". Ищет утечки в корпоративной сети.', factionId: 'REDUNDANTS' },
  { id: 'npc_archivist', name: 'Архивариус', districtId: 'fili', role: 'System Admin', greeting: 'Все поиски в Октябре начинаются с индексации.', shortLore: 'Старый системный администратор узла связи Фили. Хранит забытые ключи и логи.', factionId: 'REDUNDANTS' },
];
