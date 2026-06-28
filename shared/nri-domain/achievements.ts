/** Каталог ачивок NRI и id наркотиков для «Сторчался». */

export type NriClassId = 'daimyo' | 'doc' | 'merc' | 'hacker' | 'detective' | 'fixer';

export type NriAchievementId =
  | 'survived_1hp'
  | 'cybersportsman'
  | 'stoned_all_drugs'
  | 'ice_melted'
  | 'high_roller'
  | 'quiet_hour'
  | 'cartographer'
  | 'chrome_tox'
  | 'philanthropist'
  | 'vehicle_overload'
  | 'daimyo_iron_wall'
  | 'daimyo_warpath'
  | 'daimyo_blood_rage'
  | 'doc_stim_shot'
  | 'doc_full_mend'
  | 'doc_triage_master'
  | 'merc_armed'
  | 'merc_battle_kit'
  | 'merc_patrol'
  | 'hacker_breached'
  | 'hacker_decked'
  | 'hacker_clean_run'
  | 'detective_trail'
  | 'detective_undercover'
  | 'detective_tip_line'
  | 'fixer_smuggler'
  | 'fixer_paymaster'
  | 'fixer_contract';

export type NriAchievementDef = {
  id: NriAchievementId;
  title: string;
  blurb: string;
  icon: string;
  /** Только этот класс может получить ачивку. */
  classId?: NriClassId;
};

/** Все наркотики с эффектом в nri-consume-effects.json */
export const NRI_DRUG_CATALOG_IDS = [
  'drug_boost',
  'drug_synthcoke',
  'drug_bliss',
  'drug_shard',
  'drug_redline',
  'drug_dorph',
  'drug_braindance',
  'drug_nanohaze',
  'drug_blacklace',
  'drug_juice',
  'drug_crush',
  'drug_rapid_o',
  'drug_devils_fire',
  'drug_slash',
] as const;

const UNIVERSAL_ACHIEVEMENTS: NriAchievementDef[] = [
  {
    id: 'survived_1hp',
    title: 'На волоске',
    blurb: 'Выжил с 1 HP — грань между жизнью и flatline.',
    icon: '💔',
  },
  {
    id: 'cybersportsman',
    title: 'Киберспортсмен',
    blurb: 'Первое место в рейтинге ICE по каждой мини-игре стола.',
    icon: '🏆',
  },
  {
    id: 'stoned_all_drugs',
    title: 'Сторчался',
    blurb: 'Попробовал каждый наркотик из каталога стола.',
    icon: '💊',
  },
  {
    id: 'ice_melted',
    title: 'Плавился',
    blurb: 'Получил hardware ban после серии провалов ICE.',
    icon: '🔥',
  },
  {
    id: 'high_roller',
    title: 'Хай-роллер',
    blurb: 'Накопил ₩5000 на кошельке персонажа.',
    icon: '💰',
  },
  {
    id: 'quiet_hour',
    title: 'Тихий час',
    blurb: 'Оплатил антиспам — стол получил передышку от SPAM-бота.',
    icon: '🤫',
  },
  {
    id: 'cartographer',
    title: 'Картограф',
    blurb: 'Побывал минимум в 5 разных районах Neon City.',
    icon: '🗺️',
  },
  {
    id: 'chrome_tox',
    title: 'Хромированный',
    blurb: 'Blood Tox поднялся до 8+ — тело на пределе.',
    icon: '☣️',
  },
  {
    id: 'philanthropist',
    title: 'Филантроп',
    blurb: 'Перевёл ₩ другому игроку за столом.',
    icon: '🤝',
  },
  {
    id: 'vehicle_overload',
    title: 'Перегруз',
    blurb: 'Путешествовал на транспорте с перегрузом салона.',
    icon: '🚗',
  },
];

export const NRI_CLASS_ACHIEVEMENTS: NriAchievementDef[] = [
  {
    id: 'daimyo_iron_wall',
    classId: 'daimyo',
    title: 'Железный фронт',
    blurb: 'Экипировал броню — стой на передовой как даймё.',
    icon: '🛡️',
  },
  {
    id: 'daimyo_warpath',
    classId: 'daimyo',
    title: 'Путь войны',
    blurb: 'Переместился с перегрузом транспорта — отряд не ждёт.',
    icon: '⚔️',
  },
  {
    id: 'daimyo_blood_rage',
    classId: 'daimyo',
    title: 'Кровавая ярость',
    blurb: 'HP упало до 25% и ты всё ещё на ногах — Fury работает.',
    icon: '🩸',
  },
  {
    id: 'doc_stim_shot',
    classId: 'doc',
    title: 'Укол стимулятора',
    blurb: 'Использовал медkit — полевая медицина в деле.',
    icon: '💉',
  },
  {
    id: 'doc_full_mend',
    classId: 'doc',
    title: 'Полное восстановление',
    blurb: 'Вылечился до максимума HP после ранения.',
    icon: '❤️‍🩹',
  },
  {
    id: 'doc_triage_master',
    classId: 'doc',
    title: 'Полевая triage',
    blurb: 'Использовал 3 мед-/расходных предмета за кампанию.',
    icon: '🏥',
  },
  {
    id: 'merc_armed',
    classId: 'merc',
    title: 'Вооружён и опасен',
    blurb: 'Экипировал оружие — наёмник всегда наготове.',
    icon: '🔫',
  },
  {
    id: 'merc_battle_kit',
    classId: 'merc',
    title: 'Боеукладка',
    blurb: 'Оружие и броня экипированы одновременно.',
    icon: '🎖️',
  },
  {
    id: 'merc_patrol',
    classId: 'merc',
    title: 'Патруль наёмника',
    blurb: 'Побывал в 3 районах с экипированным оружием.',
    icon: '👣',
  },
  {
    id: 'hacker_breached',
    classId: 'hacker',
    title: 'Взлом успешен',
    blurb: 'Победил в ICE-забеге — сеть открыта.',
    icon: '🖥️',
  },
  {
    id: 'hacker_decked',
    classId: 'hacker',
    title: 'Дека онлайн',
    blurb: 'Экипировал cyberdeck — netrunner в строю.',
    icon: '💾',
  },
  {
    id: 'hacker_clean_run',
    classId: 'hacker',
    title: 'Чистый прогон',
    blurb: 'Победа в ICE с trace ≤ 15% — призрак в сети.',
    icon: '👻',
  },
  {
    id: 'detective_trail',
    classId: 'detective',
    title: 'Следопыт',
    blurb: 'Побывал в 3 разных районах — карта улик растёт.',
    icon: '🔍',
  },
  {
    id: 'detective_undercover',
    classId: 'detective',
    title: 'Под прикрытием',
    blurb: 'Выбрал holo-тату для маскировки.',
    icon: '🎭',
  },
  {
    id: 'detective_tip_line',
    classId: 'detective',
    title: 'Линия информатора',
    blurb: 'Перевёл ₩ игроку с комментарием — оплата за инфу.',
    icon: '📞',
  },
  {
    id: 'fixer_smuggler',
    classId: 'fixer',
    title: 'Контрабандный рейс',
    blurb: 'Переместился с перегрузом — груз доставлен.',
    icon: '📦',
  },
  {
    id: 'fixer_paymaster',
    classId: 'fixer',
    title: 'Платёж по сделке',
    blurb: 'Перевёл ₩100+ другому игроку.',
    icon: '💸',
  },
  {
    id: 'fixer_contract',
    classId: 'fixer',
    title: 'Контракт закрыт',
    blurb: 'Получил ₩ от мастера через кошелёк НПС.',
    icon: '📋',
  },
];

export const NRI_ACHIEVEMENTS: NriAchievementDef[] = [...UNIVERSAL_ACHIEVEMENTS, ...NRI_CLASS_ACHIEVEMENTS];

export const NRI_ACHIEVEMENT_BY_ID = Object.fromEntries(
  NRI_ACHIEVEMENTS.map((a) => [a.id, a]),
) as Record<NriAchievementId, NriAchievementDef>;

export type NriAchievementProgress = {
  drugsUsed?: string[];
  zonesVisited?: string[];
  medConsumablesUsed?: string[];
  mercWeaponZones?: string[];
  equipWeapon?: boolean;
  equipArmor?: boolean;
};

export type NriAchievementState = {
  unlocked: NriAchievementId[];
  unlockedAt: Partial<Record<NriAchievementId, number>>;
  progress: NriAchievementProgress;
};

export type AchievementEvent =
  | { type: 'hp_updated'; hp: number; hpMax?: number }
  | { type: 'hp_healed_to_max' }
  | { type: 'hp_low_survived'; hp: number; hpMax: number }
  | { type: 'item_used'; catalogId: string; category?: string }
  | { type: 'item_equipped'; catalogId?: string; slot: string; category?: string; equipped: boolean }
  | { type: 'ice_hardware_ban' }
  | { type: 'ice_won'; won: boolean; tracePct?: number }
  | { type: 'wonlongs_balance'; amount: number }
  | { type: 'wonlongs_grant_from_npc' }
  | { type: 'antispam_paid' }
  | { type: 'zone_visited'; zoneKey: string; weaponEquipped?: boolean }
  | { type: 'blood_tox'; value: number }
  | { type: 'transfer_sent'; toPlayer?: boolean; amount?: number; hasMemo?: boolean }
  | { type: 'vehicle_overload_travel' }
  | { type: 'holo_tattoo_picked' }
  | { type: 'cybersportsman_check'; isLeaderAllGames: boolean };

export type ApplyAchievementOptions = {
  classId?: string;
  at?: number;
};

export function emptyAchievementState(): NriAchievementState {
  return { unlocked: [], unlockedAt: {}, progress: {} };
}

export function parseAchievementState(raw: unknown): NriAchievementState {
  if (!raw || typeof raw !== 'object') return emptyAchievementState();
  const o = raw as Record<string, unknown>;
  const unlockedRaw = Array.isArray(o.unlocked) ? o.unlocked : [];
  const unlocked = unlockedRaw.filter(
    (id): id is NriAchievementId => typeof id === 'string' && id in NRI_ACHIEVEMENT_BY_ID,
  );
  const unlockedAt: Partial<Record<NriAchievementId, number>> = {};
  if (o.unlockedAt && typeof o.unlockedAt === 'object') {
    for (const [k, v] of Object.entries(o.unlockedAt as Record<string, unknown>)) {
      if (k in NRI_ACHIEVEMENT_BY_ID && typeof v === 'number' && Number.isFinite(v)) {
        unlockedAt[k as NriAchievementId] = v;
      }
    }
  }
  const progress: NriAchievementProgress = {};
  if (o.progress && typeof o.progress === 'object') {
    const p = o.progress as Record<string, unknown>;
    if (Array.isArray(p.drugsUsed)) {
      progress.drugsUsed = p.drugsUsed.filter((x): x is string => typeof x === 'string');
    }
    if (Array.isArray(p.zonesVisited)) {
      progress.zonesVisited = p.zonesVisited.filter((x): x is string => typeof x === 'string');
    }
    if (Array.isArray(p.medConsumablesUsed)) {
      progress.medConsumablesUsed = p.medConsumablesUsed.filter((x): x is string => typeof x === 'string');
    }
    if (Array.isArray(p.mercWeaponZones)) {
      progress.mercWeaponZones = p.mercWeaponZones.filter((x): x is string => typeof x === 'string');
    }
    if (typeof p.equipWeapon === 'boolean') progress.equipWeapon = p.equipWeapon;
    if (typeof p.equipArmor === 'boolean') progress.equipArmor = p.equipArmor;
  }
  return { unlocked, unlockedAt, progress };
}

function unlock(state: NriAchievementState, id: NriAchievementId, at = Date.now()): NriAchievementState {
  if (state.unlocked.includes(id)) return state;
  return {
    ...state,
    unlocked: [...state.unlocked, id],
    unlockedAt: { ...state.unlockedAt, [id]: at },
  };
}

function unlockIfClass(
  state: NriAchievementState,
  id: NriAchievementId,
  classId: string | undefined,
  at: number,
): NriAchievementState {
  const def = NRI_ACHIEVEMENT_BY_ID[id];
  if (def.classId && def.classId !== classId) return state;
  return unlock(state, id, at);
}

function pushUnique(list: string[] | undefined, value: string): string[] {
  const base = list ?? [];
  return base.includes(value) ? base : [...base, value];
}

function isMedConsumable(catalogId: string, category?: string): boolean {
  if (catalogId === 'g_medkit') return true;
  return category === 'consumable' || category === 'gear';
}

/** Применить событие; вернуть новое состояние и только что разблокированные id. */
export function applyAchievementEvent(
  state: NriAchievementState,
  event: AchievementEvent,
  opts: ApplyAchievementOptions = {},
): { state: NriAchievementState; newlyUnlocked: NriAchievementId[] } {
  let next = state;
  const before = new Set(state.unlocked);
  const classId = opts.classId;
  const at = opts.at ?? Date.now();

  if (event.type === 'hp_updated') {
    if (event.hp === 1) next = unlock(next, 'survived_1hp', at);
  }

  if (event.type === 'hp_healed_to_max') {
    next = unlockIfClass(next, 'doc_full_mend', classId, at);
  }

  if (event.type === 'hp_low_survived') {
    if (event.hp > 0 && event.hpMax > 0 && event.hp / event.hpMax <= 0.25) {
      next = unlockIfClass(next, 'daimyo_blood_rage', classId, at);
    }
  }

  if (event.type === 'item_used') {
    const id = event.catalogId;
    if (id.startsWith('drug_') || event.category === 'drug') {
      const drugsUsed = pushUnique(next.progress.drugsUsed, id);
      next = {
        ...next,
        progress: { ...next.progress, drugsUsed },
      };
      const allUsed = NRI_DRUG_CATALOG_IDS.every((d) => drugsUsed.includes(d));
      if (allUsed) next = unlock(next, 'stoned_all_drugs', at);
    }
    if (id === 'g_medkit') {
      next = unlockIfClass(next, 'doc_stim_shot', classId, at);
    }
    if (isMedConsumable(id, event.category)) {
      const medConsumablesUsed = pushUnique(next.progress.medConsumablesUsed, id);
      next = {
        ...next,
        progress: { ...next.progress, medConsumablesUsed },
      };
      if (medConsumablesUsed.length >= 3) {
        next = unlockIfClass(next, 'doc_triage_master', classId, at);
      }
    }
  }

  if (event.type === 'item_equipped' && event.equipped) {
    const slot = event.slot;
    const catalogId = event.catalogId ?? '';
    if (slot === 'armor' || event.category === 'armor') {
      next = unlockIfClass(next, 'daimyo_iron_wall', classId, at);
      next = {
        ...next,
        progress: { ...next.progress, equipArmor: true },
      };
    }
    if (slot === 'weapon' || event.category === 'weapon') {
      next = unlockIfClass(next, 'merc_armed', classId, at);
      next = {
        ...next,
        progress: { ...next.progress, equipWeapon: true },
      };
    }
    if (catalogId === 'g_cyberdeck') {
      next = unlockIfClass(next, 'hacker_decked', classId, at);
    }
    if (next.progress.equipWeapon && next.progress.equipArmor) {
      next = unlockIfClass(next, 'merc_battle_kit', classId, at);
    }
  }

  if (event.type === 'item_equipped' && !event.equipped) {
    const slot = event.slot;
    if (slot === 'weapon') next = { ...next, progress: { ...next.progress, equipWeapon: false } };
    if (slot === 'armor') next = { ...next, progress: { ...next.progress, equipArmor: false } };
  }

  if (event.type === 'ice_hardware_ban') {
    next = unlock(next, 'ice_melted', at);
  }

  if (event.type === 'ice_won' && event.won) {
    next = unlockIfClass(next, 'hacker_breached', classId, at);
    if (typeof event.tracePct === 'number' && event.tracePct <= 15) {
      next = unlockIfClass(next, 'hacker_clean_run', classId, at);
    }
  }

  if (event.type === 'wonlongs_balance' && event.amount >= 5000) {
    next = unlock(next, 'high_roller', at);
  }

  if (event.type === 'wonlongs_grant_from_npc') {
    next = unlockIfClass(next, 'fixer_contract', classId, at);
  }

  if (event.type === 'antispam_paid') {
    next = unlock(next, 'quiet_hour', at);
  }

  if (event.type === 'zone_visited') {
    const zonesVisited = pushUnique(next.progress.zonesVisited, event.zoneKey);
    next = {
      ...next,
      progress: { ...next.progress, zonesVisited },
    };
    if (zonesVisited.length >= 5) next = unlock(next, 'cartographer', at);
    if (zonesVisited.length >= 3) next = unlockIfClass(next, 'detective_trail', classId, at);
    if (event.weaponEquipped) {
      const mercWeaponZones = pushUnique(next.progress.mercWeaponZones, event.zoneKey);
      next = {
        ...next,
        progress: { ...next.progress, mercWeaponZones },
      };
      if (mercWeaponZones.length >= 3) next = unlockIfClass(next, 'merc_patrol', classId, at);
    }
  }

  if (event.type === 'blood_tox' && event.value >= 8) {
    next = unlock(next, 'chrome_tox', at);
  }

  if (event.type === 'transfer_sent') {
    next = unlock(next, 'philanthropist', at);
    if (event.toPlayer && event.hasMemo) {
      next = unlockIfClass(next, 'detective_tip_line', classId, at);
    }
    if (event.toPlayer && typeof event.amount === 'number' && event.amount >= 100) {
      next = unlockIfClass(next, 'fixer_paymaster', classId, at);
    }
  }

  if (event.type === 'vehicle_overload_travel') {
    next = unlock(next, 'vehicle_overload', at);
    next = unlockIfClass(next, 'daimyo_warpath', classId, at);
    next = unlockIfClass(next, 'fixer_smuggler', classId, at);
  }

  if (event.type === 'holo_tattoo_picked') {
    next = unlockIfClass(next, 'detective_undercover', classId, at);
  }

  if (event.type === 'cybersportsman_check' && event.isLeaderAllGames) {
    next = unlock(next, 'cybersportsman', at);
  }

  const newlyUnlocked = next.unlocked.filter((id) => !before.has(id));
  return { state: next, newlyUnlocked };
}

export function achievementsForClass(classId: string | undefined): NriAchievementDef[] {
  return NRI_ACHIEVEMENTS.filter((a) => !a.classId || a.classId === classId);
}

export function dossierFromSheet(sheet: unknown): {
  characterName: string;
  backstory: string;
  career: string;
  clothing: string;
  age: string;
} {
  const o = sheet && typeof sheet === 'object' ? (sheet as Record<string, unknown>) : {};
  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
  return {
    characterName: str(o.characterName) || '—',
    backstory: str(o.backstory) || '—',
    career: str(o.career) || '—',
    clothing: str(o.clothing) || '—',
    age: o.age != null ? String(o.age) : '—',
  };
}
