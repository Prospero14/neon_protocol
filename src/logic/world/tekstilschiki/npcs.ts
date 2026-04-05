import type { NpcProfile } from '../types';

export const tekstilschiki_npcs: NpcProfile[] = [
  { id: 'npc_vlad', name: 'Влад-Ткач', districtId: 'tekstilschiki', role: 'Инженер защит', greeting: 'Плетем защиту, а не сказки.', shortLore: 'Мастер Redundants. Знает, как сплести файрвол из старых паттернов.', factionId: 'REDUNDANTS' },
  { id: 'npc_weaver_senior', name: 'Старший Ткач', districtId: 'tekstilschiki', role: 'Мастер паттернов', greeting: 'Узор должен быть безупречным.', shortLore: 'Хранитель традиций Redundants. Помнит код до "Октября".', factionId: 'REDUNDANTS' },
  { id: 'npc_safety_auditor', name: 'Аудитор Безопасности', districtId: 'tekstilschiki', role: 'Инспектор', greeting: 'Инспекция системной чистоты.', shortLore: 'Лиазон GigaBank. Проверяет промзону на наличие эксплойтов.', factionId: 'GIGABANK' },
  { id: 'job_board_tekstil', name: 'Узел Текстильщики', districtId: 'tekstilschiki', role: 'Контракты', greeting: 'Заказы на чистку ждут.', shortLore: 'Боевые задачи Redundants по защите оборудования.', factionId: 'REDUNDANTS' },
];
