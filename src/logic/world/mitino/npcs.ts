import type { NpcProfile } from '../types';

export const mitino_npcs: NpcProfile[] = [
  { id: 'npc_mentor', name: 'Ментор курсов', districtId: 'mitino', role: 'Spring Mentor', greeting: 'Контроллер без теста - миф.', shortLore: 'Учебный центр Telecon. Готовит элитные кадры для Корпораций.', factionId: 'TELECON' },
  { id: 'npc_radio_ham', name: 'Дядя Ваня', districtId: 'mitino', role: 'Радиолюбитель', greeting: 'Слышу шум из подпространства.', shortLore: 'Скрап-инженер Rust Valley. Ловит сигналы древних радио-реле.', factionId: 'RUST_VALLEY' },
  { id: 'npc_hardware_modder', name: 'Флэш', districtId: 'mitino', role: 'Разгонщик', greeting: 'Твой кулер не справится с моей логикой.', shortLore: 'Мастер оверклокинга Redundants. Ненавидит софтверные эмуляторы.', factionId: 'REDUNDANTS' },
  { id: 'npc_mitino_trader', name: 'Барыга Миша', districtId: 'mitino', role: 'Перекуп', greeting: 'Есть ключи на любой замок.', shortLore: 'Черный рынок Nullpointers. Продает нелегальные лицензии.', factionId: 'NULLPOINTERS' },
  { id: 'npc_slick_shady', name: 'Слик (Скупщик)', districtId: 'mitino', role: 'Теневой Брокер', greeting: 'Слышишь этот треск? Это Bits перетекают в правильные карманы.', shortLore: 'Скупщик краденого софта. Понимает язык радио-волн лучше, чем живых людей.', factionId: 'REDUNDANTS' },
  { id: 'npc_hardware_dealer', name: 'Рэйвидж', districtId: 'mitino', role: 'Hardware Dealer', greeting: 'Чип без перегрева - это просто кусок кремния.', shortLore: 'Конкурент Барыги Миши. Специализируется на запрещенных разогнанных модулях памяти.', factionId: 'REDUNDANTS' },
];
