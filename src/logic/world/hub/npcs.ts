import type { NpcProfile } from '../types';

export const hub_npcs: NpcProfile[] = [
  { id: 'npc_spider', name: 'Spider', districtId: 'kitay_gorod', role: 'Связник Nullpointers', greeting: 'Тише, неофит.', shortLore: 'Ищет правду под слоями шифрования. Оперативник Анархистов.', factionId: 'NULLPOINTERS' },
  { id: 'npc_mira', name: 'Mira (NK)', districtId: 'kitay_gorod', role: 'Silicon Hedge Rep', greeting: 'Точность. Честь. Кремний.', shortLore: 'Представитель ИИ-культистов. Продает технологии будущего.', factionId: 'SILICON_HEDGE' },
  { id: 'npc_gb_agent', name: 'Агент ГБ', districtId: 'kitay_gorod', role: 'Сотрудник СБ', greeting: 'Гражданин, ваши логи...', shortLore: 'Инспектор GigaBank. Следит за "чистотой" банковских операций.', factionId: 'GIGABANK' },
];
