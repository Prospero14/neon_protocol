import type { NpcProfile } from '../types';

export const bibirevo_npcs: NpcProfile[] = [
  { id: 'npc_signalman', name: 'Связист Моня', districtId: 'bibirevo', role: 'Связист', greeting: 'Линия живая? Тогда живем.', shortLore: 'Старый мастер Net Drivers. Знает каждый узел Северного Потока.', factionId: 'NET_DRIVERS' },
  { id: 'npc_bibirevo_coder', name: 'Сонный Кодер', districtId: 'bibirevo', role: 'Программист', greeting: '...еще пять минут...', shortLore: 'Фрилансер на контракте у Net Drivers. Нуждается в стимуляторах.', factionId: 'NET_DRIVERS' },
  { id: 'npc_old_admin', name: 'Старый Админ', districtId: 'bibirevo', role: 'Архивариус', greeting: 'Помню я... телнет...', shortLore: 'Ветеран Nullpointers. Хранит ключи к заброшенным подсетям.', factionId: 'NULLPOINTERS' },
  { id: 'job_board_bibi', name: 'Инфо-панель', districtId: 'bibirevo', role: 'Контракты', greeting: 'Север не спит.', shortLore: 'Технические поручения от Net Drivers по обслуживанию реле.', factionId: 'NET_DRIVERS' },
  { id: 'npc_jitter_signal', name: 'Джиттер (Связист)', districtId: 'bibirevo', role: 'Перехватчик', greeting: 'Пинг — это жизнь. Пакет — это всё.', shortLore: 'Молодой связист из Net Drivers. Мечтает о полной монополии на трафик Севера.', factionId: 'NET_DRIVERS' },
  { id: 'npc_crawler', name: 'Кроулер', districtId: 'bibirevo', role: 'Исследователь', greeting: 'В пустоте всегда есть что-то ценное. Если умеешь искать.', shortLore: 'Профессиональный добытчик данных. Ищет заброшенные подсети в Северном Потоке.', factionId: 'NULLPOINTERS' },
];
