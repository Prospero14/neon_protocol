/** Публичный чат: стабильные «живые» ники без префиксов npc_ / SYSTEM-меток в тексте. */

const CYBER_NICKS = [
  'null_route_09',
  'ice_corridor',
  'nezumi_7',
  'void_echo',
  'packet_loss',
  'ghost_vlan',
  'synth_walker',
  'chrome_breath',
  'wetware_junkie',
  'relay_404',
  'midnight_stack',
  'oxidized_wire',
  'quiet_handshake',
  'basement_root',
  'rain_uplink',
  'signal_bleed',
  'proxy_haze',
  'dead_drop_12',
  'neon_cough',
  'flatline_fm',
  'shard_moth',
  'metro_static',
  'tapeworm_io',
  'cold_boot_kid',
  'lag_spirit',
  'echo_warden',
  'rust_parser',
  'glass_eye_3',
  'subnet_rat',
  'overclocked_mom',
  'no_logs_plz',
  'burner_mesh',
  'last_mile_ghost',
  'cipher_smoke',
  'junk_dns',
  'parking_lot_api',
  'after_hours_op',
  'low_orbit_txt',
  'thermal_paste',
  'handshake_fail',
  'drift_node',
  'коридор_0x',
  'тихий_пинг',
  'провод_мокрый',
  'нейросквоттер',
  'пакет_с_дырой',
];

function fnv1a32(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Один и тот же id (npc_*, node) всегда даёт один ник в сессии чата. */
export function publicChatNickForSeed(seed: string): string {
  if (!seed) return CYBER_NICKS[0];
  const idx = fnv1a32(seed) % CYBER_NICKS.length;
  return CYBER_NICKS[idx];
}

export function randomPublicChatNick(): string {
  return CYBER_NICKS[Math.floor(Math.random() * CYBER_NICKS.length)];
}
