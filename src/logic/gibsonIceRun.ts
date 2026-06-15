/** Короткий раунд «взлома льда» по мотивам Gibson: скан → эксплойт → эксfil. */

export type IceService = {
  id: string;
  label: string;
  port: number;
  banner: string;
  vulnerable: boolean;
};

export type IceRunPhase = 'intro' | 'scan' | 'crack' | 'exfil' | 'win' | 'busted';

const SERVICE_POOL: Omit<IceService, 'vulnerable'>[] = [
  { id: 's1', label: 'AUTH_GATE', port: 443, banner: 'TLS/NEON-AUTH v3.1' },
  { id: 's2', label: 'DATA_VAULT', port: 8443, banner: 'VAULT/SHARD-7 encrypted' },
  { id: 's3', label: 'LEGACY_FTP', port: 21, banner: 'ProFTPD 1.3.4 — anon OK' },
  { id: 's4', label: 'MEMCACHE', port: 11211, banner: 'memcached 1.6 open bind' },
  { id: 's5', label: 'SSH_BASTION', port: 22, banner: 'OpenSSH_8.9 hardened' },
  { id: 's6', label: 'API_PROXY', port: 8080, banner: 'nginx/1.24 reverse' },
];

function pickServices(count: number, seed: number): IceService[] {
  const pool = [...SERVICE_POOL];
  let s = seed;
  const picked: Omit<IceService, 'vulnerable'>[] = [];
  while (picked.length < count && pool.length > 0) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const idx = s % pool.length;
    picked.push(pool.splice(idx, 1)[0]);
  }
  const vulnIdx = s % picked.length;
  return picked.map((svc, i) => ({ ...svc, vulnerable: i === vulnIdx }));
}

export function rollIceRun(seed = Date.now()): {
  services: IceService[];
  crackSequence: number[];
} {
  const services = pickServices(4, seed);
  const crackSequence = Array.from({ length: 4 }, (_, i) => i + 1);
  // shuffle ports order for crack mini-game
  let s = seed ^ 0xdeadbeef;
  for (let i = crackSequence.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [crackSequence[i], crackSequence[j]] = [crackSequence[j], crackSequence[i]];
  }
  return { services, crackSequence };
}

export function iceRewardBits(exfilPct: number, iceTracePct: number): number {
  if (exfilPct < 100) return 0;
  const margin = Math.max(0, 100 - iceTracePct);
  return 15 + Math.floor(margin / 5) * 5;
}
