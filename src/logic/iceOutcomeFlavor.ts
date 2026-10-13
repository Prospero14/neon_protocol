/** Тематические подтверждения для финального окна ICE (по id игры). */

export type IceOutcomeFlavor = {
  /** Крупный штамп на карточке. */
  stamp: string;
  /** Короткая строка-лог под штампом. */
  line: string;
};

const WIN: Record<string, IceOutcomeFlavor> = {
  gibson_ice: {
    stamp: 'EXFIL COMPLETE',
    line: 'данные выгружены · пакеты в безопасном буфере',
  },
  port_sweep: {
    stamp: 'PORTS MAPPED',
    line: 'маршрут портов принят · anomaly cleared',
  },
  vuln_scan: {
    stamp: 'FIREWALL BYPASSED',
    line: 'открытый слот закреплён · sweep ok',
  },
  trace_rush: {
    stamp: 'BREACH SUCCESS',
    line: 'целевая последовательность собрана · buffer sealed',
  },
  opcode_forge: {
    stamp: 'PAYLOAD ARMED',
    line: 'exploit-цепочка собрана · daemon ready',
  },
  keyspace_prune: {
    stamp: 'KEY RECOVERED',
    line: 'hex-ключ восстановлен · vault unlocked',
  },
  handshake_drill: {
    stamp: 'HANDSHAKE OK',
    line: 'протокол согласован · tunnel up',
  },
  auth_bypass: {
    stamp: 'ВХОД ВЫПОЛНЕН',
    line: 'доступ предоставлен · auth ticket issued',
  },
  log_wipe: {
    stamp: 'AUDIT WIPED',
    line: 'красные логи стёрты · SIEM blind',
  },
  dead_sector: {
    stamp: 'SECTORS CLEAR',
    line: 'ICE-сектора погашены · grid quiet',
  },
  proxy_dodge: {
    stamp: 'PROXY CLEAN',
    line: 'сканеры обойдены · IP not leaked',
  },
  noise_floor: {
    stamp: 'ДАННЫЕ ПОЛУЧЕНЫ',
    line: 'carrier locked · radio exfil buffered',
  },
  circuit_splice: {
    stamp: 'CONDUIT RESTORED',
    line: 'канал к vault собран · link up',
  },
  likeness_vault: {
    stamp: 'VAULT OPEN',
    line: 'пароль принят · likeness match',
  },
  node_capture: {
    stamp: 'CORE CAPTURED',
    line: 'сегмент сети под контролем · probes spent',
  },
  cipher_rings: {
    stamp: 'CIPHER UNLOCKED',
    line: 'кольца совпали · vault latch open',
  },
  bit_sweep: {
    stamp: 'FIELD CLEARED',
    line: 'мины отмечены · safe bits extracted',
  },
};

const FAIL: Record<string, IceOutcomeFlavor> = {
  gibson_ice: {
    stamp: 'ICE ОТБИЛ АТАКУ',
    line: 'безопасники оказались сильнее · ваш IP перехвачен · оставайтесь на месте',
  },
  port_sweep: {
    stamp: 'IP ПЕРЕХВАЧЕН',
    line: 'маршрут сожжён · QRF уже строит трейс · не отключайтесь',
  },
  vuln_scan: {
    stamp: 'FIREWALL SNAP',
    line: 'ICE отбил sweep · honeypot сработал',
  },
  trace_rush: {
    stamp: 'МАТРИЦА ЗАКРЫТА',
    line: 'corp NOC сильнее · buffer dumped',
  },
  opcode_forge: {
    stamp: 'PAYLOAD REJECTED',
    line: 'стек разрушен · оставайтесь на линии',
  },
  keyspace_prune: {
    stamp: 'VAULT LOCKDOWN',
    line: 'ключ не взят · ваш IP в очереди на визит',
  },
  handshake_drill: {
    stamp: 'PROTOCOL FAIL',
    line: 'peer RST · безопасники фиксируют сессию',
  },
  auth_bypass: {
    stamp: 'ACCESS DENIED',
    line: 'вход не выполнен · auth gate + live operators',
  },
  log_wipe: {
    stamp: 'SIEM ALERTED',
    line: 'логи уцелели · группа быстрого реагирования в пути',
  },
  dead_sector: {
    stamp: 'ICE STILL HOT',
    line: 'wipe сорван · оставайтесь на месте',
  },
  proxy_dodge: {
    stamp: 'IP LEAKED',
    line: 'прокси слит · QRF хочет встретиться лично',
  },
  noise_floor: {
    stamp: 'CARRIER LOST',
    line: 'эфир перехватили · не отключайтесь от сети',
  },
  circuit_splice: {
    stamp: 'NOC OVERRIDE',
    line: 'канал перебит · безопасники сильнее',
  },
  likeness_vault: {
    stamp: 'VAULT SEALED',
    line: 'пароль не принят · ICE держит замок',
  },
  node_capture: {
    stamp: 'SEGMENT CUT',
    line: 'CORE не взят · corp isolation',
  },
  cipher_rings: {
    stamp: 'CIPHER LOCKOUT',
    line: 'кольца сброшены · vault sealed на вас',
  },
  bit_sweep: {
    stamp: 'MINE DETONATED',
    line: 'сегмент взорван · след зафиксирован',
  },
};

const FALLBACK_WIN: IceOutcomeFlavor = {
  stamp: 'BREACH OK',
  line: 'операция завершена · доступ получен',
};

const FALLBACK_FAIL: IceOutcomeFlavor = {
  stamp: 'ICE ОТБИЛ АТАКУ',
  line: 'безопасники оказались сильнее · ваш IP перехвачен · оставайтесь в сети, чтобы QRF мог встретиться с вами лично',
};

export function iceOutcomeFlavor(gameId: string, won: boolean): IceOutcomeFlavor {
  const table = won ? WIN : FAIL;
  return table[gameId] ?? (won ? FALLBACK_WIN : FALLBACK_FAIL);
}
