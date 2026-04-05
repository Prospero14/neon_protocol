import type { NpcProfile } from '../types';

export const south_west_npcs: NpcProfile[] = [
  { id: 'npc_professor', name: 'Профессор Архипов', districtId: 'south_west', role: 'Наставник', greeting: 'Класс начинается с main.', shortLore: 'Академик Silicon Hedge. Верит в чистоту кода и дисциплину.', factionId: 'SILICON_HEDGE' },
  { id: 'npc_compiler', name: 'Компилятор', districtId: 'south_west', role: 'Мастер кода', greeting: 'Байт-код не врет.', shortLore: 'Оптимизатор из EU Syntax. Ищет идеальную структуру.', factionId: 'EU_SYNTAX' },
  { id: 'npc_alumini', name: 'Беглый Выпускник', districtId: 'south_west', role: 'Трафикер', greeting: 'У тебя нет лишнего доступа?', shortLore: 'Маргинал Nullpointers. Знает грязные секреты GIGA_BANK.', factionId: 'NULLPOINTERS' },
];
