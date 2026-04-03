export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic';
export type ItemKind = 'consumable' | 'component' | 'token' | 'booster' | 'key';

export interface GameItem {
  id: string;
  name: string;
  kind: ItemKind;
  rarity: ItemRarity;
  description: string;
  valueBits: number;
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
    return {
      id: `${prefix}_${idx + 1}`,
      name,
      kind,
      rarity,
      description: `${name}: ${kind} item for contracts and survival.`,
      valueBits: valueBase,
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
    description: 'A data packet recovered from Moscow Zero. Contains fragments of history.',
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
  }
];

export const getItemById = (id: string) => ITEM_LIBRARY.find((i) => i.id === id);
