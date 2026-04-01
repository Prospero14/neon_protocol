/**
 * Трейты (Черты персонажа / Мутации кода / Перки Хобби).
 */

export type TraitType = 'COMBAT' | 'RACING' | 'GENERAL' | 'DEBUFF' | 'HOBBY';
export type TraitCategory = 'SOFT' | 'TECH' | 'SOCIAL' | 'COMBAT' | 'SRE';

export interface Trait {
  id: string;
  name: string;
  type: TraitType;
  category: TraitCategory; // NEW for Alpha 0.08
  description: string;
  effect?: any; 
}

export const TRAITS: Trait[] = [
  // --- HOBBY PERKS (Characters Generation) ---
  { 
    id: 'hobby_retro_gaming', name: 'RETRO_GAMER', type: 'HOBBY', category: 'TECH',
    description: '+15% Bits (UC) за любые активности. Ностальгия по старым системам окупается.' 
  },
  { 
    id: 'hobby_comp_coding', name: 'COMPETITIVE_CODER', type: 'HOBBY', category: 'TECH',
    description: '+1 Max Energy в бою. Ты привык писать код под давлением времени.' 
  },
  { 
    id: 'hobby_digital_art', name: 'DIGITAL_ARTIST', type: 'HOBBY', category: 'SOCIAL',
    description: '+10 Integrity ко всем Syntax картам. Твой код — это искусство.' 
  },
  { 
    id: 'hobby_modding', name: 'HARDWARE_MODDER', type: 'HOBBY', category: 'SRE',
    description: '-1 Energy Cost для всех FUNCTION карт. Железо оптимизировано вручную.' 
  },
  { 
    id: 'hobby_parkour', name: 'URBAN_EXPLORER', type: 'HOBBY', category: 'SOCIAL',
    description: '+10% Шанс уклонения в Taxi Race. Знание подворотен Москвы помогает.' 
  },
  { 
    id: 'hobby_investing', name: 'CYBER_TRADER', type: 'HOBBY', category: 'SOCIAL',
    description: '20% Скидка на все товары в магазинах. Рынок в твоей крови.' 
  },
  { 
    id: 'hobby_security', name: 'SECURITY_ENFORCER', type: 'HOBBY', category: 'SRE',
    description: '-5 урона от атак Bagg-ов (Bug Error). Протоколы защиты активны.' 
  },
  { 
    id: 'hobby_writing', name: 'TECH_WRITER', type: 'HOBBY', category: 'SOFT',
    description: 'Первая разыгранная карта за ход восполняет 5 HP. Код задокументирован.' 
  },
  { 
    id: 'hobby_music', name: 'PRODUCER_BEATS', type: 'HOBBY', category: 'SOCIAL',
    description: 'Снижает урон врага на 10% базово. Ритм нейронной сети сбивает врагов.' 
  },
  { 
    id: 'hobby_blogging', name: 'NIGHT_INFLUENCER', type: 'HOBBY', category: 'SOCIAL',
    description: '+25% XP gain. Твои подписчики следят за каждым твоим шагом.' 
  },

  // БОЕВЫЕ ТРЕЙТЫ (Старые)
  { 
    id: 'overclocked', name: 'OVERCLOCKED_CPU', type: 'COMBAT', category: 'COMBAT',
    description: '+1 Энергия в начале боя, но -10 HP базово.' 
  },
  { 
    id: 'firewall_bypass', name: 'FIREWALL_BYPASS', type: 'COMBAT', category: 'COMBAT',
    description: 'Первая карта HARD за ход стоит на 1 ед. энергии меньше.' 
  },
  { 
    id: 'root_access', name: 'ROOT_ACCESS', type: 'COMBAT', category: 'COMBAT',
    description: 'Видишь следующую карту, которую разыграет Враг-Баг.' 
  },
  // --- BEHAVIORAL TRAITS (Dialogue Rewards) ---
  {
    id: 'trait_merciless_validator', name: 'MERCILESS_VALIDATOR', type: 'GENERAL', category: 'COMBAT',
    description: '+10% урона по врагам, но -15 HP Макс. Твой код не прощает ошибок.'
  },
  {
    id: 'trait_silicon_altruist', name: 'SILICON_ALTRUIST', type: 'GENERAL', category: 'SOCIAL',
    description: 'На 20% дешевле восстановление HP у барменов. Репутация помощника систем.'
  },
  {
    id: 'trait_deep_packet_analyst', name: 'DEEP_PACKET_ANALYST', type: 'GENERAL', category: 'SOFT',
    description: 'Шанс 15% получить бесплатную карту после боя. Дотошность окупается.'
  },
  {
    id: 'trait_glitch_anarchist', name: 'GLITCH_ANARCHIST', type: 'GENERAL', category: 'SRE',
    description: '+2 слота в Neural Bus, но стабильность системы падает быстрее в бою.'
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
