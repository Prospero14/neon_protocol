import type { NpcProfile } from '../types';

export const sokolniki_npcs: NpcProfile[] = [
  { id: 'npc_hermit', name: 'Отшельник', districtId: 'sokolniki', role: 'Лесной админ', greeting: 'Тишина лечит stack overflow.', shortLore: 'Бывший архитектор Nullpointers, ушедший в тень Серверного Леса.', factionId: 'NULLPOINTERS' },
  { id: 'npc_druid_coder', name: 'Друид Арборис', districtId: 'sokolniki', role: 'Био-хакер', greeting: 'Код должен расти как дуб.', shortLore: 'Мастер Biosyndicate. Верит в слияние органики и алгоритмов.', factionId: 'BIOSYNDICATE' },
  { id: 'npc_forest_guard', name: 'Лесник', districtId: 'sokolniki', role: 'SYS_SEC', greeting: 'Посторонним вход в подсеть запрещен.', shortLore: 'Охранник GigaBank. Следит за физической сохранностью стоек.', factionId: 'GIGABANK' },
  { id: 'npc_ghost_server', name: 'Призрак Серверной', districtId: 'sokolniki', role: 'Когнитивное Эхо', greeting: 'Ч... Чередование... 0 и 1... Оно никогда не кончается.', shortLore: 'Фрагмент сознания сисадмина, загрузившегося в облако слишком глубоко.', factionId: 'NULLPOINTERS' },
];
