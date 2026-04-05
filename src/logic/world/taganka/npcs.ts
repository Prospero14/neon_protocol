import type { NpcProfile } from '../types';

export const taganka_npcs: NpcProfile[] = [
  { id: 'npc_auditor', name: 'Инквизитор', districtId: 'taganka', role: 'Аудитор ядра', greeting: 'Сначала отчёт, потом доступ.', shortLore: 'Высокопоставленный чиновник Krylovo Corp. Проверяет зрелость данных.', factionId: 'KRYLOVO_CORP' },
  { id: 'npc_informant', name: 'Информатор М.', districtId: 'taganka', role: 'Посредник', greeting: 'Тайны продаются поминутно.', shortLore: 'Двойной агент Nullpointers. Продает секреты бункера.', factionId: 'NULLPOINTERS' },
  { id: 'npc_bunker_guard', name: 'Сержант Глухов', districtId: 'taganka', role: 'Охрана Бункера', greeting: 'Пропуск или пуля. Логика проста.', shortLore: 'Спецназ Federal Oversight. Охраняет покой Ядра.', factionId: 'FEDERAL_OVERSIGHT' },
];
