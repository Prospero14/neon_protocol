import type { NpcProfile } from '../types';

export const maryino_npcs: NpcProfile[] = [
  { id: 'npc_tanya', name: 'Trace', districtId: 'maryino', role: 'Lead QA', greeting: 'Memory integrity compromised. Establish connection or leave.', shortLore: 'Элитный аудитор Federal Oversight. Известна под ником "Trace".', factionId: 'FEDERAL_OVERSIGHT' },
  { id: 'npc_rat', name: 'Крыса-курьер', districtId: 'maryino', role: 'Informant', greeting: 'Пи-пи... Вижу тебя.', shortLore: 'Маленький лазутчик Nullpointers.', factionId: 'NULLPOINTERS' },
  { id: 'npc_sarge', name: 'Сержант', districtId: 'maryino', role: 'Security', greeting: 'Твой ID не в белом списке. Разворачивайся.', shortLore: 'Ветеран Federal Oversight, контролирует южные шлюзы.', factionId: 'FEDERAL_OVERSIGHT' },
];
