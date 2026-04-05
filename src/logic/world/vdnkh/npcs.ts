import type { NpcProfile } from '../types';

export const vdnkh_npcs: NpcProfile[] = [
  { id: 'npc_besm', name: 'Генерал БЭСМ', districtId: 'vdnkh', role: 'Легенда', greeting: 'Память длиннее ваших релизов.', shortLore: 'ИИ-призрак прошлого из фракции Voskhod. Хранитель Pavilion Zero.', factionId: 'VOSKHOD' },
  { id: 'npc_guide_vdnkh', name: 'Гид Раиса', districtId: 'vdnkh', role: 'Экскурсовод', greeting: 'Посмотрите налево - здесь был первый мейнфрейм.', shortLore: 'Архивариус Voskhod. Знает каждый байт в заброшенных павильонах.', factionId: 'VOSKHOD' },
  { id: 'npc_tea_master', name: 'Олег (Мастер Чая)', districtId: 'vdnkh', role: 'Бариста', greeting: 'Пей чай, забудь о дедлайне.', shortLore: 'Нейтральный миротворец. Основатель фракции Дзен-ЦОД. Помогает кодерам Net Drivers и фрилансерам найти баланс.', factionId: 'ZEN_DPC' },
];
