/** Активные способности с киберимплантов (бой, сенсоры, сеть, сюжетные крючки). */

import type { InstalledAugmentation } from './nriCyberInstall';
import type { NriInventoryItem } from './nriInventory';

export type CyberEffectId =
  | 'vision_uv'
  | 'currency_uv'
  | 'vision_thermal'
  | 'vision_night'
  | 'weapon_smartlink'
  | 'weapon_conceal'
  | 'surveillance_detect'
  | 'net_deep_scan'
  /** Сюжет / социалка / исследование — мастер использует как разрешение сцены. */
  | 'voice_synth_fake'
  | 'face_scrambler'
  | 'scent_mask'
  | 'pain_editor'
  | 'memory_wipe_local'
  | 'corp_badge_spoof'
  | 'lie_pulse'
  | 'corpse_id_scan'
  | 'ghost_handshake'
  | 'black_market_ping'
  | 'fashion_signal'
  | 'silent_step'
  | 'crowd_read'
  | 'polyglot_chip'
  | 'evidence_wire'
  | 'trauma_buffer'
  | 'ad_drip' // минус: HUD-реклама
  | 'wetware_leak' // минус: био-след
  | 'debt_beacon' // минус: видимость для коллекторов
  /** Боевые / сенсорные контры (броня, внешние модули, снаряга). */
  | 'smartlink_jam'
  | 'optic_flare'
  | 'thermal_baffle'
  | 'uv_cloak'
  | 'mesh_faraday'
  | 'biometric_lock'
  | 'scent_flare'
  | 'pulse_shield'
  | 'voice_auth'
  | 'evidence_scrub'
  | 'conceal_scan';

export type CyberEffectCategory = 'combat' | 'sense' | 'net' | 'story' | 'social' | 'drawback' | 'counter';

export const CYBER_EFFECT_META: Record<
  CyberEffectId,
  { label: string; category: CyberEffectCategory; blurb: string }
> = {
  vision_uv: {
    label: 'УФ-зрение',
    category: 'sense',
    blurb: 'Скрытые метки, чернила, «невидимые» надписи на стенах и документах.',
  },
  currency_uv: {
    label: 'Скан ₩',
    category: 'sense',
    blurb: 'Видны УФ-метки на валюте — подделки и партии банкнот.',
  },
  vision_thermal: {
    label: 'Тепловизор',
    category: 'sense',
    blurb: 'Тепловые контуры сквозь дым; засады и свежие следы.',
  },
  vision_night: {
    label: 'Ночное зрение',
    category: 'sense',
    blurb: 'Без штрафа в темноте улиц и подвалов.',
  },
  weapon_smartlink: {
    label: 'Смартлинк',
    category: 'combat',
    blurb:
      '+1 к атаке встроенным / smart-оружием (не стакается). Глушилка смартлинка на цели снимает этот +1.',
  },
  weapon_conceal: {
    label: 'Маскировка оружия',
    category: 'combat',
    blurb: '+2 к проверке скрытого ношения встроенного оружия. Сканер маскировки у цели/обыска — без бонуса.',
  },
  surveillance_detect: {
    label: 'Антислежка',
    category: 'sense',
    blurb: 'Жучки, маяки, близкий mesh. Faraday-подкладка глушит детект рядом с носителем.',
  },
  net_deep_scan: {
    label: 'Deep-scan сети',
    category: 'net',
    blurb: 'Скрытые узлы ICE. Faraday / тихий mesh на цели усложняет скан (решение мастера / −advantage).',
  },
  voice_synth_fake: {
    label: 'Подделка голоса',
    category: 'story',
    blurb: 'Голосовой замок / рация. Voice-auth на двери или у цели ломает подделку.',
  },
  face_scrambler: {
    label: 'Размытие лица',
    category: 'story',
    blurb: 'Дешёвые камеры. Biometric-lock / корп-сканер рядом снимает эффект.',
  },
  scent_mask: {
    label: 'Глушение запаха',
    category: 'story',
    blurb: 'Собаки и нюх-дроны. Scent-flare / химический маркер срывает маску.',
  },
  pain_editor: {
    label: 'Редактор боли',
    category: 'story',
    blurb: 'Допрос пыткой сам по себе не ломает — нужен другой рычаг.',
  },
  memory_wipe_local: {
    label: 'Локальный wipe памяти',
    category: 'story',
    blurb: 'Раз за сцену: стереть ~30 сек памяти. Следы — у мастера.',
  },
  corp_badge_spoof: {
    label: 'Подделка бейджа',
    category: 'social',
    blurb: 'Guest/clerk КПП. Biometric-lock на посте ломает дешёвый spoof.',
  },
  lie_pulse: {
    label: 'Пульс лжи',
    category: 'story',
    blurb: 'Касание → намёк мастера. Pulse-shield на цели — «глухо / шум».',
  },
  corpse_id_scan: {
    label: 'Скан ID с тела',
    category: 'story',
    blurb: 'Чип/долги с трупа. Зашифрованные корп-чипы — отдельный ICE.',
  },
  ghost_handshake: {
    label: 'Ghost-handshake',
    category: 'net',
    blurb: 'Анонимный пакет. Faraday на зоне может оборвать handshake.',
  },
  black_market_ping: {
    label: 'Пинг чёрного рынка',
    category: 'social',
    blurb: 'Намёк «кто продаёт Х» в районе.',
  },
  fashion_signal: {
    label: 'Модный сигнал',
    category: 'social',
    blurb: 'Клубы пускают; трущобы метят «понт».',
  },
  silent_step: {
    label: 'Тихий шаг',
    category: 'story',
    blurb: 'Меньше шума протеза. Не отменяет камеры.',
  },
  crowd_read: {
    label: 'Чтение толпы',
    category: 'social',
    blurb: 'Тон толпы до броска влияния.',
  },
  polyglot_chip: {
    label: 'Полиглот-чип',
    category: 'social',
    blurb: 'Улица/корп-жаргон. Не поэзия.',
  },
  evidence_wire: {
    label: 'Диктофон-провод',
    category: 'story',
    blurb: 'Пишет разговор. Evidence-scrub рядом глушит запись.',
  },
  trauma_buffer: {
    label: 'Буфер травмы',
    category: 'story',
    blurb: '1× сессию отложить срыв — потом счёт.',
  },
  ad_drip: {
    label: 'Рекламный drip',
    category: 'drawback',
    blurb: 'Минус: HUD-реклама в стрессе.',
  },
  wetware_leak: {
    label: 'Утечка wetware',
    category: 'drawback',
    blurb: 'Минус: био-след для форензики.',
  },
  debt_beacon: {
    label: 'Маяк долга',
    category: 'drawback',
    blurb: 'Минус: коллекторы видят тебя в своих районах.',
  },
  smartlink_jam: {
    label: 'Глушилка смартлинка',
    category: 'counter',
    blurb: 'По тебе смартлинк атакующего не даёт +1 к атаке (бонус обнуляется).',
  },
  optic_flare: {
    label: 'Оптический flare',
    category: 'counter',
    blurb: '+1 AC против дальнобойных атак с смартлинком / кибер-оптики (вспышка/блик).',
  },
  thermal_baffle: {
    label: 'Тепловой экран',
    category: 'counter',
    blurb: 'Контрит тепловизор: ты не даёшь «бесплатный» тепловой контур (мастер снимает преимущество thermal).',
  },
  uv_cloak: {
    label: 'УФ-плащ / краска',
    category: 'counter',
    blurb: 'Твои УФ-метки и чернила не читаются обычным УФ-зрением без усиленного скана.',
  },
  mesh_faraday: {
    label: 'Faraday-подкладка',
    category: 'counter',
    blurb: 'Глушит RF/mesh-детект и ghost-handshake рядом с тобой (короткая зона).',
  },
  biometric_lock: {
    label: 'Biometric-lock',
    category: 'counter',
    blurb: 'Рядом с тобой / на КПП: face-scrambler и дешёвый badge-spoof не проходят.',
  },
  scent_flare: {
    label: 'Химмаркер / scent-flare',
    category: 'counter',
    blurb: 'Срывает scent-mask: след снова читается собаками и дронами.',
  },
  pulse_shield: {
    label: 'Pulse-shield',
    category: 'counter',
    blurb: 'Lie-pulse по тебе даёт «шум», не чистый намёк.',
  },
  voice_auth: {
    label: 'Voice-auth',
    category: 'counter',
    blurb: 'Голосовые замки / твой канал: подделка голоса не проходит без отдельного взлома.',
  },
  evidence_scrub: {
    label: 'Evidence-scrub',
    category: 'counter',
    blurb: 'Глушит скрытые диктофоны и evidence-wire в радиусе разговора.',
  },
  conceal_scan: {
    label: 'Сканер маскировки',
    category: 'counter',
    blurb: 'При обыске/Perception: бонус weapon_conceal у цели не действует против тебя.',
  },
};

/** Короткие подписи для UI (обратная совместимость). */
export const CYBER_EFFECT_LABELS: Record<CyberEffectId, string> = Object.fromEntries(
  (Object.keys(CYBER_EFFECT_META) as CyberEffectId[]).map((id) => [
    id,
    `${CYBER_EFFECT_META[id].label} — ${CYBER_EFFECT_META[id].blurb}`,
  ])
) as Record<CyberEffectId, string>;

export function isCyberEffectId(v: unknown): v is CyberEffectId {
  return typeof v === 'string' && v in CYBER_EFFECT_META;
}

function readItemEffects(item: { cyber?: { effects?: unknown } } | null | undefined): CyberEffectId[] {
  const raw = item?.cyber?.effects;
  if (!Array.isArray(raw)) return [];
  return raw.filter(isCyberEffectId);
}

export function collectCyberEffectsFromInventory(inventory: NriInventoryItem[]): CyberEffectId[] {
  const set = new Set<CyberEffectId>();
  for (const item of inventory) {
    if (item.kind !== 'cyberware') continue;
    readItemEffects(item).forEach((e) => set.add(e));
  }
  return [...set];
}

export function collectCyberEffectsFromAugmentations(augmentations: InstalledAugmentation[]): CyberEffectId[] {
  const set = new Set<CyberEffectId>();
  for (const aug of augmentations) {
    readItemEffects(aug).forEach((e) => set.add(e));
  }
  return [...set];
}

/** Активные эффекты только с установленных augs (инвентарь не даёт сюжетных крючков «в сумке»). */
export function collectPlayerCyberEffects(
  _inventory: NriInventoryItem[],
  augmentations: InstalledAugmentation[]
): CyberEffectId[] {
  return collectCyberEffectsFromAugmentations(augmentations);
}

export function hasCyberEffect(effects: CyberEffectId[], id: CyberEffectId): boolean {
  return effects.includes(id);
}

export function groupCyberEffects(effects: CyberEffectId[]): Record<CyberEffectCategory, CyberEffectId[]> {
  const out: Record<CyberEffectCategory, CyberEffectId[]> = {
    combat: [],
    sense: [],
    net: [],
    story: [],
    social: [],
    drawback: [],
    counter: [],
  };
  for (const id of effects) {
    out[CYBER_EFFECT_META[id].category].push(id);
  }
  return out;
}

/** Теги снаряги `cyber:<effectId>` → эффекты (только equipped). */
export function collectCyberEffectsFromEquippedGear(inventory: NriInventoryItem[]): CyberEffectId[] {
  const set = new Set<CyberEffectId>();
  for (const item of inventory) {
    if (!item.equipped) continue;
    const tags = item.tags;
    if (!Array.isArray(tags)) continue;
    for (const t of tags) {
      if (typeof t !== 'string' || !t.startsWith('cyber:')) continue;
      const id = t.slice('cyber:'.length);
      if (isCyberEffectId(id)) set.add(id);
    }
  }
  return [...set];
}

/** Установленные augs + экипированная снаряга с cyber:-тегами. */
export function collectActiveCyberEffects(
  inventory: NriInventoryItem[],
  augmentations: InstalledAugmentation[]
): CyberEffectId[] {
  return [
    ...new Set([
      ...collectCyberEffectsFromAugmentations(augmentations),
      ...collectCyberEffectsFromEquippedGear(inventory),
    ]),
  ];
}
