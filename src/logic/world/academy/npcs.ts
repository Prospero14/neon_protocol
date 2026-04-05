import type { NpcProfile } from '../types';

export const academy_npcs: NpcProfile[] = [
  { 
    id: 'npc_professor_arkhipov', 
    name: 'Профессор Архипов', 
    districtId: 'academy', 
    role: 'Deus Ex Academia', 
    greeting: 'IDENTITY_VERIFIED: Поздравляю con получением лицензии.', 
    shortLore: 'Академик Silicon Hedge. Верит в чистоту кода и дисциплину.', 
    factionId: 'SILICON_HEDGE' 
  },
  { 
    id: 'npc_academy_tutor', 
    name: 'Тьютор-бот "Индекс"', 
    districtId: 'academy', 
    role: 'Training Assistant', 
    greeting: 'Готов к дебагу в реальном времени?', 
    shortLore: 'Учебный бот. Помогает новичкам освоить архитектурный бой.', 
    factionId: 'SILICON_HEDGE' 
  },
  { 
    id: 'npc_academy_student', 
    name: 'Студент-Прикладник', 
    districtId: 'academy', 
    role: 'Research Assistant', 
    greeting: 'У тебя есть пара лишних циклов? Мне нужно собрать данные для курсовой.', 
    shortLore: 'Студент Академии, заваленный дедлайнами по низкоуровневому программированию.', 
    factionId: 'SILICON_HEDGE' 
  },
];
