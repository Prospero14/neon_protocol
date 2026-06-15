/** Короткий раунд «взлома льда» по мотивам Gibson: скан → эксплойт → эксfil. */

import type { IceDifficulty } from './nriGameCatalog';

export type IceService = {
  id: string;
  label: string;
  port: number;
  banner: string;
  vulnerable: boolean;
};

export type IceRunPhase = 'intro' | 'scan' | 'crack' | 'exfil' | 'win' | 'busted';

type ServiceTemplate = Omit<IceService, 'vulnerable' | 'banner'> & { banners: string[] };

const SERVICE_POOL: ServiceTemplate[] = [
  {
    id: 's1',
    label: 'AUTH_GATE',
    port: 443,
    banners: ['TLS/NEON-AUTH v3.1', 'TLS/NEON-AUTH v3.1 — mTLS enforced', 'corp-auth gateway · session pinned'],
  },
  {
    id: 's2',
    label: 'DATA_VAULT',
    port: 8443,
    banners: ['VAULT/SHARD-7 encrypted', 'shard replica · ACL strict', 'cold storage · audit log on'],
  },
  {
    id: 's3',
    label: 'LEGACY_FTP',
    port: 21,
    banners: ['ProFTPD 1.3.4 — anon OK', 'ProFTPD 1.3.5 — auth required', 'ftp relay · guest ro'],
  },
  {
    id: 's4',
    label: 'MEMCACHE',
    port: 11211,
    banners: ['memcached 1.6 open bind', 'memcached 1.6 · SASL on', 'cache node · bind localhost'],
  },
  {
    id: 's5',
    label: 'SSH_BASTION',
    port: 22,
    banners: ['OpenSSH_8.9 hardened', 'OpenSSH_9.2 · key-only', 'jump host · rate limit'],
  },
  {
    id: 's6',
    label: 'API_PROXY',
    port: 8080,
    banners: ['nginx/1.24 reverse', 'envoy/1.29 edge', 'api gw · WAF active'],
  },
  {
    id: 's7',
    label: 'REDIS_EDGE',
    port: 6379,
    banners: ['Redis 6.2 — no AUTH', 'Redis 7 · ACL enabled', 'pubsub bus · tls wrap'],
  },
  {
    id: 's8',
    label: 'SMB_RELAY',
    port: 445,
    banners: ['SMBv1 signing disabled', 'SMB3 · signing required', 'file share · domain joined'],
  },
];

/** Подсказки для уязвимого сервиса — похожи на decoy, но чуть «грязнее». */
const VULN_BANNER_HINTS = [
  'legacy build · patch queue empty',
  'anon allowed — audit pending',
  'bind 0.0.0.0 · corp VLAN edge',
  'deprecated cipher · still online',
  'guest rw — maint window',
];

function pickServices(count: number, seed: number): IceService[] {
  const pool = [...SERVICE_POOL];
  let s = seed;
  const picked: ServiceTemplate[] = [];
  while (picked.length < count && pool.length > 0) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const idx = s % pool.length;
    picked.push(pool.splice(idx, 1)[0]);
  }
  const vulnIdx = s % picked.length;
  return picked.map((svc, i) => {
    const vulnerable = i === vulnIdx;
    let banner: string;
    if (vulnerable) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      banner = VULN_BANNER_HINTS[s % VULN_BANNER_HINTS.length];
    } else {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      banner = svc.banners[s % svc.banners.length];
    }
    return { id: svc.id, label: svc.label, port: svc.port, banner, vulnerable };
  });
}

const CRACK_LEN: Record<IceDifficulty, number> = { easy: 4, medium: 5, hard: 6 };
const PORT_COUNT: Record<IceDifficulty, number> = { easy: 4, medium: 5, hard: 6 };
const SCAN_COUNT: Record<IceDifficulty, number> = { easy: 4, medium: 5, hard: 6 };

export function rollIceRun(
  seed = Date.now(),
  difficulty: IceDifficulty = 'medium'
): {
  services: IceService[];
  crackSequence: number[];
  portCount: number;
} {
  const services = pickServices(SCAN_COUNT[difficulty], seed);
  const portCount = PORT_COUNT[difficulty];
  const seqLen = CRACK_LEN[difficulty];
  const ports = Array.from({ length: portCount }, (_, i) => i + 1);
  const crackSequence: number[] = [];
  let s = seed ^ 0xdeadbeef;
  for (let i = 0; i < seqLen; i++) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    crackSequence.push(ports[s % ports.length]);
  }
  return { services, crackSequence, portCount };
}

export function iceRewardBits(exfilPct: number, iceTracePct: number): number {
  if (exfilPct < 100) return 0;
  const margin = Math.max(0, 100 - iceTracePct);
  return 15 + Math.floor(margin / 5) * 5;
}
