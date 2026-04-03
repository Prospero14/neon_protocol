/**
 * Трейты (Черты персонажа / Мутации кода / Перки Хобби).
 * v0.13: Lore-Rich Script-Kiddo backgrounds. 
 * Removed overlaps with District bonuses (raw bits, energy, xp).
 */

export type TraitType = 'COMBAT' | 'RACING' | 'GENERAL' | 'DEBUFF' | 'HOBBY';
export type TraitCategory = 'SOFT' | 'TECH' | 'SOCIAL' | 'COMBAT' | 'SRE';

export interface Trait {
  id: string;
  name: string;
  type: TraitType;
  category: TraitCategory;
  description: string;
  effect?: any; 
}

export const TRAITS: Trait[] = [
  // --- HOBBY PERKS (Script-Kiddo Backgrounds) ---
  { 
    id: 'stack_archaeologist', name: 'STACK_ARCHAEOLOGIST', type: 'HOBBY', category: 'TECH',
    description: 'Ты годами копался в руинах Старой Сети (Web 2.0). Шанс 25% вернуть разыгранную SCRIPT карту в руку.' 
  },
  { 
    id: 'neural_sync_junkie', name: 'NEURAL_SYNC_JUNKIE', type: 'HOBBY', category: 'TECH',
    description: 'Твой мозг разогнан сильнее деки. В начале фазы CODING видишь 3 следующие карты Bug-стека врага.' 
  },
  { 
    id: 'zero_day_collector', name: 'ZERO_DAY_COLLECTOR', type: 'HOBBY', category: 'TECH',
    description: 'Ты торгуешь уязвимостями. FUNCTION карты игнорируют 5 ед. Integrity (брони) противника.' 
  },
  { 
    id: 'glitch_impressionist', name: 'GLITCH_IMPRESSIONIST', type: 'HOBBY', category: 'SOCIAL',
    description: 'Ты видишь красоту в системных ошибках. Кадый ход случайная карта в руке: +50% Power, но -50% Integrity.' 
  },
  { 
    id: 'packet_sniffer', name: 'PACKET_SNIFFER', type: 'HOBBY', category: 'SRE',
    description: 'Ни один пакет не проскочит мимо. После фазы TESTING шанс 30% получить случайную SOFT карту.' 
  },
  { 
    id: 'debug_masochist', name: 'DEBUG_MASOCHIST', type: 'HOBBY', category: 'SOFT',
    description: 'Ты любишь боль отладки. При нарушении Integrity от врага, следующая твоя карта дает +128 RAM.' 
  },
  { 
    id: 'corporate_contact', name: 'CORPORATE_CONTACT', type: 'HOBBY', category: 'SOCIAL',
    description: 'Знакомый корпорат. Репутация с GIGA_BANK и EU_SYNTAX +15. Доступ к закрытым API-каналам.' 
  },
  { 
    id: 'hardware_hoarder', name: 'HARDWARE_HOARDER', type: 'HOBBY', category: 'SRE',
    description: 'Легендарный Барахольщик. Твой риг из мусора выдает +256 RAM и +0.5 CPU для INFRASTRUCTURE карт.' 
  },
  { 
    id: 'script_ghost', name: 'SCRIPT_GHOST', type: 'HOBBY', category: 'SOFT',
    description: 'Ты не оставляешь следов. Пассивное накопление Stress от Deadline снижено на 50%.' 
  },
  { 
    id: 'legacy_diggr', name: 'LEGACY_DIGGR', type: 'HOBBY', category: 'TECH',
    description: 'Ты эксперт по COBOL и Fortran. SCRIPT карты стоят на 128 RAM меньше в фазе ARCHITECTURE.' 
  },

  // БОЕВЫЕ ТРЕЙТЫ (Reward-only)
  { 
    id: 'overclocked', name: 'OVERCLOCKED_CPU', type: 'COMBAT', category: 'COMBAT',
    description: '+256MB Infra (RAM) при старте, но +10% базовый Stress.' 
  },
  { 
    id: 'firewall_bypass', name: 'FIREWALL_BYPASS', type: 'COMBAT', category: 'COMBAT',
    description: 'Первый SCRIPT за ход требует на 128MB меньше Infra.' 
  },
  { 
    id: 'root_access', name: 'ROOT_ACCESS', type: 'COMBAT', category: 'COMBAT',
    description: 'Анализ Bug-стека: видишь следующую атаку врага.' 
  },

  // --- BEHAVIORAL TRAITS (Dialogue Rewards) ---
  {
    id: 'trait_merciless_validator', name: 'MERCILESS_VALIDATOR', type: 'GENERAL', category: 'COMBAT',
    description: '+10% урона, но -15% Max Stability (Stress limit). Твой код не прощает ошибок.'
  },
  {
    id: 'trait_silicon_altruist', name: 'SILICON_ALTRUIST', type: 'GENERAL', category: 'SOCIAL',
    description: 'На 20% дешевле сброс Stress у барменов. Репутация помощника систем.'
  },
  {
    id: 'trait_deep_packet_analyst', name: 'DEEP_PACKET_ANALYST', type: 'GENERAL', category: 'SOFT',
    description: 'Шанс 15% получить бесплатную карту после боя. Дотошность окупается.'
  },
  {
    id: 'trait_glitch_anarchist', name: 'GLITCH_ANARCHIST', type: 'GENERAL', category: 'SRE',
    description: '+2 слота Neural Bus, но Stress в бою растет быстрее.'
  },
  {
    id: 'trait_street_ethos', name: 'STREET_ETHOS', type: 'GENERAL', category: 'SOCIAL',
    description: '+50 Битов бонуса за выполнение квестов в жилых секторах.'
  }
];

export const getRandomTrait = (existingTraits: Trait[] = []): Trait | null => {
  const existingIds = new Set(existingTraits.map(t => t.id));
  const availableTraits = TRAITS.filter(t => !existingIds.has(t.id));
  if (availableTraits.length === 0) return null;
  return availableTraits[Math.floor(Math.random() * availableTraits.length)];
};

export const getTraitById = (id: string) => TRAITS.find(t => t.id === id);
