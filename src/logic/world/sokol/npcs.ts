import type { NpcProfile } from '../types';

export const sokol_npcs: NpcProfile[] = [
  { id: 'npc_dean', name: 'Декан Колледжа', districtId: 'sokol', role: 'Академия', greeting: 'Диплом не спасает от багов. Мы здесь ради архитектурной чистоты.', shortLore: 'Архитектор EU Syntax. Курирует аттестацию системных администраторов и QA-инженеров.', factionId: 'EU_SYNTAX' },
  { id: 'npc_retired_tester', name: 'Семёныч', districtId: 'sokol', role: 'Бывалый тестер', greeting: 'В сороковые мы правили баги напрямую в памяти...', shortLore: 'Ветеран EU Syntax. Помнит времена, когда дронов собирали на коленке, а за синтаксическую ошибку могли лишить пайки.', factionId: 'EU_SYNTAX' },
  { id: 'npc_lab_assistant', name: 'Лаборант Илья', districtId: 'sokol', role: 'Ассистент', greeting: 'Осторожно, здесь высокое напряжение в логах.', shortLore: 'Помогает студентам с практическими работами по авионике.', factionId: 'EU_SYNTAX' },
  { id: 'npc_drone_pilot', name: 'Пилот Дронов', districtId: 'sokol', role: 'Оператор', greeting: 'Мой рой видит всё. Даже твои скрытые процессы.', shortLore: 'Специалист по разведывательным дронам, сдает модули в аренду.', factionId: 'EU_SYNTAX' },
  { id: 'npc_avionics_dev', name: 'Авионик-Разработчик', districtId: 'sokol', role: 'Инженер', greeting: 'Если код не летает - это не авионика, это мусор.', shortLore: 'Разработчик бортовых систем управления для беспилотников.', factionId: 'EU_SYNTAX' },
];
