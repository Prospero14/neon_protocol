export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic';
export type ItemKind = 'consumable' | 'component' | 'token' | 'booster' | 'key';

/** Одноразовый эффект при «использовании» предмета (диалог аптеки / будущий инвентарь). */
export type ItemUseEffect =
  | { kind: 'stress_relief'; amount: number }
  | { kind: 'grant_bits'; amount: number }
  | { kind: 'raise_max_stress'; amount: number };

export interface GameItem {
  id: string;
  name: string;
  kind: ItemKind;
  rarity: ItemRarity;
  description: string;
  valueBits: number;
  /** Не попадает в rollLoot (только квесты / покупки). */
  lootExclude?: boolean;
  /** Срабатывает при USE_GAME_ITEM: снимает 1 экземпляр из loot и применяет эффекты. */
  onUse?: ItemUseEffect[];
}

const baseNames = {
  consumable: ['NanoPatch', 'RAMShot', 'Debug Tea', 'Coolant Gel', 'Focus Pill', 'Signal Amp', 'Hotfix Capsule', 'Pulse Injector', 'Loop Stabilizer', 'SafeMode Kit', 'Checksum Soda', 'Fallback Foam'],
  component: ['Fiber Coil', 'Old PCB', 'Neon Capacitor', 'Kernel Dust', 'Proxy Core', 'Thermal Plate', 'Signal Crystal', 'Hex Rivet', 'Edge Relay', 'Bus Joint', 'Matrix Clamp', 'Port Lens'],
  token: ['Tutor Token', 'Archive Pass', 'Compiler Ticket', 'Metro Permit', 'Sandbox Pass', 'Exam Voucher', 'Dojo Coin', 'Audit Stamp', 'Pilot License', 'Node Permit', 'Ops Badge', 'Mentor Ticket'],
  booster: ['Burst Script', 'Shield Macro', 'Cache Bloom', 'Stability Aura', 'Refactor Pulse', 'Latency Breaker', 'Crit Trace', 'Safe Deploy', 'Code Surge', 'Resilience Flag', 'Async Spark', 'Pulse Frame'],
  key: ['Taxi Key', 'Vault Key', 'Proxy Key', 'Lab Key', 'Forest Key', 'Bunker Key', 'Panel Key', 'Gate Key', 'Moscow Key', 'Debug Key', 'Node Key', 'Relay Key'],
} as const;

const rarityCycle: ItemRarity[] = ['common', 'common', 'uncommon', 'uncommon', 'rare', 'epic'];

function makeItems(kind: ItemKind, prefix: string): GameItem[] {
  return baseNames[kind].map((name, idx) => {
    const rarity = rarityCycle[idx % rarityCycle.length];
    const valueBase = rarity === 'common' ? 10 : rarity === 'uncommon' ? 24 : rarity === 'rare' ? 55 : 120;
    let onUse: ItemUseEffect[] | undefined;
    if (kind === 'consumable') {
      onUse = [{ kind: 'stress_relief', amount: 6 + (idx % 5) * 2 }];
    } else if (kind === 'booster') {
      onUse = [
        { kind: 'stress_relief', amount: 4 + (idx % 3) },
        { kind: 'grant_bits', amount: 4 + (idx % 4) * 2 },
      ];
    }
    return {
      id: `${prefix}_${idx + 1}`,
      name,
      kind,
      rarity,
      description:
        kind === 'consumable'
          ? `${name}: снимает стресс при применении (инвентарь / аптека).`
          : kind === 'booster'
            ? `${name}: бустер — стресс + немного битов при активации.`
            : `${name}: ${kind} — можно сдать или обменять по контракту.`,
      valueBits: valueBase,
      onUse,
    };
  });
}

export const ITEM_LIBRARY: GameItem[] = [
  ...makeItems('consumable', 'itm_cons'),
  ...makeItems('component', 'itm_comp'),
  ...makeItems('token', 'itm_token'),
  ...makeItems('booster', 'itm_boost'),
  ...makeItems('key', 'itm_key'),
  {
    id: 'art_necron_miniature',
    name: 'Necron Miniature [ARTIFACT]',
    kind: 'token',
    rarity: 'epic',
    description: 'A physical miniature from the "Pre-Core" era. Highly valued by collectors in VOID.',
    valueBits: 500
  },
  {
    id: 'art_archive_core',
    name: 'Encrypted Archive Core',
    kind: 'token',
    rarity: 'rare',
    description: 'A data packet recovered from OctoberLine archives. Contains fragments of history.',
    valueBits: 200
  },
  {
    id: 'art_void_shard',
    name: 'Void Shard',
    kind: 'token',
    rarity: 'epic',
    description: 'A crystalline fragment that hums with static. It feels like it is watching you.',
    valueBits: 750
  },
  {
    id: 'art_old_world_badge',
    name: 'Pre-Collapse Badge',
    kind: 'token',
    rarity: 'uncommon',
    description: 'A rusted metal badge from a defunct government agency.',
    valueBits: 80
  },
  {
    id: 'art_monya_taxi_pass',
    name: 'Жетон на такси (Северный Поток)',
    kind: 'token',
    rarity: 'uncommon',
    description: 'Старый жетон для проезда в беспилотном такси. Позволяет совершить одну поездку между Алтуфьево и Бибирево.',
    valueBits: 0
  },
  {
    id: 'itm_taxi_token',
    name: 'Транспортный Жетон',
    kind: 'token',
    rarity: 'common',
    description: 'Магнитный жетон корпорации МосТранс. Дает право на одну поездку в такси или метро.',
    valueBits: 15,
    lootExclude: true,
  },
  {
    id: 'item_zero_point_chip',
    name: 'Чип «Нулевая точка»',
    kind: 'component',
    rarity: 'rare',
    description: 'Квестовый модуль Марыино. Ценится скупщиками; можно сдать за биты.',
    valueBits: 140,
    lootExclude: true,
  },
  {
    id: 'item_strizh_chip',
    name: 'Чип Стриж-линка',
    kind: 'component',
    rarity: 'uncommon',
    description: 'Авиационный идентификатор с Сокола. Обмен и репутация.',
    valueBits: 95,
    lootExclude: true,
  },
  {
    id: 'itm_neural_salve',
    name: 'Нейро-мазь «Холодный шов»',
    kind: 'consumable',
    rarity: 'uncommon',
    description: 'Снимает воспаление оболочки после оверклока. Сильное снятие стресса.',
    valueBits: 32,
    onUse: [{ kind: 'stress_relief', amount: 22 }],
    lootExclude: true,
  },
  {
    id: 'itm_bit_cache_usb',
    name: 'USB «Кэш битов»',
    kind: 'booster',
    rarity: 'rare',
    description: 'Подделка под корпоративный кошелёк. Одноразовый всплеск ликвидности.',
    valueBits: 90,
    onUse: [{ kind: 'grant_bits', amount: 35 }],
    lootExclude: true,
  },
  {
    id: 'itm_synth_coffee',
    name: 'Синт-кофе «Дедлайн»',
    kind: 'consumable',
    rarity: 'common',
    description: 'Горький, как legacy. Чуть поднимает потолок стресса до следующего отдыха.',
    valueBits: 14,
    onUse: [
      { kind: 'stress_relief', amount: 8 },
      { kind: 'raise_max_stress', amount: 5 },
    ],
    lootExclude: true,
  },
  {
    id: 'itm_oc_shunt',
    name: 'Шунт разгона ОЦ',
    kind: 'component',
    rarity: 'epic',
    description: 'Редкий мод — снимает перегрев нервной шины. Дорого продаётся.',
    valueBits: 200,
    onUse: [{ kind: 'stress_relief', amount: 35 }],
    lootExclude: true,
  },
];

export const getItemById = (id: string) => ITEM_LIBRARY.find((i) => i.id === id);
