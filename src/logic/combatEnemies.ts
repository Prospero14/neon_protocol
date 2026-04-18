/**
 * БИБЛИОТЕКА ОППОНЕНТОВ [V5.0 - SDLC / киберпанк]
 *
 * В лоре оппонентом может быть ИИ, чужой разработчик, корпоративный сисадмин, ICE, бот-сеть, «клиент»-синт
 * — одна механика: рост Threat, баги на шине, стресс, инъекции статусов (сопротивление поставке, не дуэль PR).
 * visualType: ICE | AI | DEVELOPER — подсказка для UI и текстов; имя/id карточки задаёт конкретную маску.
 */

export type BugProblemType =
  | 'FATIGUE'
  | 'TECH_DEBT'
  | 'SYNTAX_ERROR'
  | 'LOGIC_GAP'
  | 'MEMORY_LEAK'
  | 'BUSINESS_RISK';

export interface BugAction {
  id: string;
  name: string;
  description: string;
  /** Прогресс, который ИИ добавляет своему проекту за ход. */
  progressPoints: number;
  /** Количество багов, которые ИИ добавляет в систему за ход. */
  bugPoints: number;
  /** Прямой урон стабильности игрока (HP). */
  damage: number;
  /** Тип проблемы, которую ИИ создает (влияет на тип Reaction-карты для отбития). */
  problemType?: BugProblemType;
  /** Карта, которая спавнится на шине. */
  spawnId?: string;
  /** ID карты-статуса (STATUS), которая добавляется игроку (мусорная легаси-карта и т.д.) */
  injectStatusId?: string;
  /** Куда добавить карту-статус. По умолчанию 'discard', чтобы потом она пришла в руку. */
  injectDestination?: 'hand' | 'deck' | 'discard';
}

/**
 * Личность ICE: определяет поведение врага и требуемый counterplay.
 * Показывается игроку в TZ-модальнике перед боем.
 */
export type IcePersonality =
  | 'TRACER'   // Штрафует за >2 карт за ход (+стресс). Коунтер: играть медленно, react_trace_jam
  | 'AUDITOR'  // Требует REACTION первой на шине. Коунтер: react_spoof_id
  | 'PHANTOM'  // Раз в 2 хода сдвигает карту на шине. Коунтер: react_decoy_ping
  | 'SNIFFER'  // Считает STATUS-карты в руке → +стресс. Коунтер: react_log_mask, быстро сбрасывать STATUS
  | 'MIME';    // Копирует последнюю сыгранную карту в BUG_ERROR. Коунтер: react_null_packet

export interface BugEnemy {
  id: string;
  name: string;
  hp: number; 
  maxHp: number;
  /** Целевой прогресс ИИ для успешного релиза. */
  targetProgress: number;
  /** Тип визуализации врага. */
  visualType: 'ICE' | 'DEVELOPER' | 'AI';
  actions: BugAction[];
  /** Личность ICE — определяет активное поведение на шине. */
  personality?: IcePersonality;
  /** Подсказка игроку на counterplay. Показывается в TZ-модальнике. */
  personalityHint?: string;
}


export const BUGS: BugEnemy[] = [
  {
    id: 'enemy_ice',
    name: 'CorpSec Black-ICE',
    hp: 80,
    maxHp: 80,
    targetProgress: 100,
    visualType: 'ICE',
    actions: [
      {
        id: 'ice_shock',
        name: 'Neural Shock',
        description: 'Прямая атака на систему. Наносит урон вашему Стрессу.',
        progressPoints: 10,
        bugPoints: 0,
        damage: 15,
        problemType: 'LOGIC_GAP'
      },
      {
        id: 'ice_lock',
        name: 'Port Lockout',
        description: 'Блокировка портов. Создает FATIGUE.',
        progressPoints: 20,
        bugPoints: 5,
        damage: 5,
        problemType: 'FATIGUE',
        injectStatusId: 'status_spaghetti',
        injectDestination: 'discard'
      }
    ]
  },
  {
    id: 'enemy_daemon',
    name: 'Scavenger Daemon',
    hp: 40,
    maxHp: 40,
    targetProgress: 50,
    visualType: 'AI',
    actions: [
      {
        id: 'daemon_trash',
        name: 'Garbage Dump',
        description: 'Закидывает бесполезный мусор вам в руку.',
        progressPoints: 5,
        bugPoints: 10,
        damage: 0,
        problemType: 'SYNTAX_ERROR',
        injectStatusId: 'status_deprecated',
        injectDestination: 'hand'
      },
      {
        id: 'daemon_loop',
        name: 'Infinite Loop',
        description: 'Отнимает ресурсы процессора без прямого урона.',
        progressPoints: 15,
        bugPoints: 15,
        damage: 0,
        problemType: 'MEMORY_LEAK'
      }
    ]
  },
  {
    id: 'enemy_sysadmin',
    name: 'Remote SysAdmin',
    hp: 9999, // Unkillable directly by damage
    maxHp: 9999,
    targetProgress: 999, // Unwinnable by progress for enemy
    visualType: 'DEVELOPER', // Represents the system
    actions: [
      {
        id: 'admin_scan',
        name: 'Active Ping Scan',
        description: 'Сканирует ваши активные порты. Наносит 10 Stress урона.',
        progressPoints: 0,
        bugPoints: 0,
        damage: 10 
      },
      {
        id: 'admin_alert',
        name: 'Intrusion Alert',
        description: 'Система зафиксировала аномалию. Загрязняет панель управления логами (добавляет статус-карту).',
        progressPoints: 0,
        bugPoints: 2,
        damage: 5,
        injectStatusId: 'status_spaghetti',
        injectDestination: 'hand'
      },
      {
        id: 'admin_trace',
        name: 'Route Trace',
        description: 'Попытка вычислить ваш IP. Повышает Threat системы на 15%.',
        progressPoints: 15,
        bugPoints: 0,
        damage: 0 
      }
    ]
  },
  {
    id: 'enemy_legacy',
    name: 'The Legacy Monolith (AI)',
    hp: 40,
    maxHp: 40,
    targetProgress: 60,
    visualType: 'AI',
    actions: [
      {
        id: 'leg_spaghetti',
        name: 'Spaghetti Injection',
        description: 'Легаси: Подкидывает карту Spaghetti Code вам в сброс.',
        progressPoints: 5,
        bugPoints: 5,
        damage: 2,
        injectStatusId: 'status_spaghetti',
        injectDestination: 'discard'
      },
      {
        id: 'leg_deprecate',
        name: 'Deprecate API',
        description: 'Устаревание: кидает Deprecated Dependency вам прямо в руку.',
        progressPoints: 10,
        bugPoints: 10,
        damage: 0,
        injectStatusId: 'status_deprecated',
        injectDestination: 'hand'
      }
    ]
  },
  {
    id: 'enemy_vague',
    name: 'The Vague Client (AI)',
    hp: 60,
    maxHp: 60,
    targetProgress: 80,
    visualType: 'ICE',
    actions: [
      {
        id: 'vag_change',
        name: 'Scope Creep',
        description: 'Изменение требований: Вызывает FATIGUE (усталость) у разработчика.',
        progressPoints: 15,
        bugPoints: 5,
        damage: 0,
        problemType: 'BUSINESS_RISK',
        injectStatusId: 'status_deprecated',
        injectDestination: 'discard'
      },
      {
        id: 'vag_blocker',
        name: 'Merge Conflict',
        description: 'Конфликт слияния: Блокирует фазу DESIGN.',
        progressPoints: 5,
        bugPoints: 15,
        damage: 5,
        problemType: 'LOGIC_GAP',
        spawnId: 'bug_card_glitch'
      },
      {
        id: 'vag_budget_cut',
        name: 'Budget Cut',
        description: 'Бизнес режет бюджет спринта: растёт дедлайн-давление и фоновые баги.',
        progressPoints: 18,
        bugPoints: 8,
        damage: 6,
        problemType: 'BUSINESS_RISK'
      }
    ]
  },
  {
    id: 'enemy_firewall',
    name: 'Corporate Great-Wall',
    hp: 120,
    maxHp: 120,
    targetProgress: 100,
    visualType: 'ICE',
    actions: [
      {
        id: 'fw_packet_inspect',
        name: 'Deep Packet Inspection',
        description: 'Тщательная проверка: Создает SYNTAX_ERROR в вашей колоде.',
        progressPoints: 10,
        bugPoints: 10,
        damage: 5,
        problemType: 'SYNTAX_ERROR',
        injectStatusId: 'status_spaghetti',
        injectDestination: 'discard'
      },
      {
        id: 'fw_reset',
        name: 'TCP_RESET',
        description: 'Сброс соединения: Спавнит блокирующую ошибку на шине.',
        progressPoints: 5,
        bugPoints: 0,
        damage: 0,
        spawnId: 'bug_card_ice'
      }
    ]
  },
  {
    id: 'enemy_traceback',
    name: 'Counter-Trace Daemon',
    hp: 50,
    maxHp: 50,
    targetProgress: 75,
    visualType: 'AI',
    actions: [
      {
        id: 'tr_ping_sweep',
        name: 'Ping Sweep',
        description: 'Сканирование: Вычисляет ваш IP. + прогресс ИИ.',
        progressPoints: 25,
        bugPoints: 5,
        damage: 0
      },
      {
        id: 'tr_traceback',
        name: 'Traceback Protocol',
        description: 'Обратная трассировка: Наносит урон за каждую карту, сыгранную вами в этот ход.',
        progressPoints: 5,
        bugPoints: 5,
        damage: 10
      }
    ]
  },
  {
    id: 'enemy_quota_overmind',
    name: 'Quota Overmind (FinOps Bot)',
    hp: 55,
    maxHp: 55,
    targetProgress: 85,
    visualType: 'AI',
    actions: [
      {
        id: 'quota_throttle',
        name: 'Sprint Throttle',
        description: 'Режет бюджет CPU/времени: TECH_DEBT на шине, давление на срок.',
        progressPoints: 18,
        bugPoints: 8,
        damage: 4,
        problemType: 'TECH_DEBT',
        spawnId: 'bug_card_glitch',
      },
      {
        id: 'quota_scope',
        name: 'Scope Inflation',
        description: 'Бизнес добавляет пункты в спринт без снятия старых — BUSINESS_RISK.',
        progressPoints: 12,
        bugPoints: 6,
        damage: 6,
        problemType: 'BUSINESS_RISK',
        injectStatusId: 'status_deprecated',
        injectDestination: 'hand',
      },
      {
        id: 'quota_audit',
        name: 'Audit Flash',
        description: 'Внезапный аудит артефактов: стресс + рост угрозы.',
        progressPoints: 14,
        bugPoints: 4,
        damage: 12,
        problemType: 'FATIGUE',
      },
    ],
  },
  {
    id: 'enemy_chaos_runner',
    name: 'Chaos Runner CI',
    hp: 48,
    maxHp: 48,
    targetProgress: 72,
    visualType: 'ICE',
    actions: [
      {
        id: 'chaos_flap',
        name: 'Flaky Gate',
        description: 'Плавающий тест блокирует пайплайн — SYNTAX_ERROR на шине.',
        progressPoints: 10,
        bugPoints: 12,
        damage: 3,
        problemType: 'SYNTAX_ERROR',
        spawnId: 'bug_card_glitch',
      },
      {
        id: 'chaos_shard',
        name: 'Shard Split-brain',
        description: 'Рассинхрон реплик: MEMORY_LEAK + инъекция статуса.',
        progressPoints: 16,
        bugPoints: 10,
        damage: 5,
        problemType: 'MEMORY_LEAK',
        injectStatusId: 'status_spaghetti',
        injectDestination: 'discard',
      },
      {
        id: 'chaos_retry',
        name: 'Retry Storm',
        description: 'Бесконечные ретраи грузят периметр и нервы.',
        progressPoints: 8,
        bugPoints: 14,
        damage: 8,
        problemType: 'LOGIC_GAP',
      },
    ],
  },
  {
    id: 'enemy_perimeter_wraith',
    name: 'Perimeter Wraith',
    hp: 65,
    maxHp: 65,
    targetProgress: 88,
    visualType: 'ICE',
    actions: [
      {
        id: 'wraith_probe',
        name: 'Shadow Probe',
        description: 'Скан снаружи: ищет дыры в прокси — давление на инфру.',
        progressPoints: 20,
        bugPoints: 6,
        damage: 7,
        problemType: 'LOGIC_GAP',
      },
      {
        id: 'wraith_dns',
        name: 'DNS Poison Echo',
        description: 'Подмена маршрутов: баги на шине + стресс.',
        progressPoints: 12,
        bugPoints: 10,
        damage: 9,
        problemType: 'SYNTAX_ERROR',
        spawnId: 'bug_card_ice',
      },
      {
        id: 'wraith_exfil',
        name: 'Policy Violation',
        description: 'Нарушение политики egress — BUSINESS_RISK и инъекция.',
        progressPoints: 14,
        bugPoints: 8,
        damage: 4,
        problemType: 'BUSINESS_RISK',
        injectStatusId: 'status_spaghetti',
        injectDestination: 'hand',
      },
    ],
  }
];

// --- НОВЫЕ ВРАГИ С ЛИЧНОСТЯМИ ICE ---
export const PERSONALITY_ENEMIES: BugEnemy[] = [
  {
    id: 'enemy_tracer_v2',
    name: 'Counter-Trace Mk.II',
    hp: 60,
    maxHp: 60,
    targetProgress: 80,
    visualType: 'ICE',
    personality: 'TRACER',
    personalityHint: 'TRACER: не играй больше 2 карт за ход — иначе сильный штраф по стрессу. Используй TRACE_JAM.',
    actions: [
      {
        id: 'tr2_sweep',
        name: 'Signature Sweep',
        description: 'Трассирует активные карты на шине. Отмечает разработчика.',
        progressPoints: 20,
        bugPoints: 5,
        damage: 0
      },
      {
        id: 'tr2_burst',
        name: 'Trace Burst',
        description: 'Быстрый прострел по активным слотам. Наносит урон стрессу.',
        progressPoints: 10,
        bugPoints: 0,
        damage: 12
      }
    ]
  },
  {
    id: 'enemy_auditor_ice',
    name: 'Corp Auditor-9',
    hp: 70,
    maxHp: 70,
    targetProgress: 100,
    visualType: 'ICE',
    personality: 'AUDITOR',
    personalityHint: 'AUDITOR: первая карта на шине должна быть REACTION, иначе прогресс заморожен. Используй SPOOF_ID.',
    actions: [
      {
        id: 'aud_block',
        name: 'Protocol Gate',
        description: 'Проверяет credentials первого слота. Если не REACTION — блокирует прогресс на ход.',
        progressPoints: 15,
        bugPoints: 5,
        damage: 5
      },
      {
        id: 'aud_inject',
        name: 'Compliance Error',
        description: 'Вбрасывает карту DEPRECATED в руку игрока.',
        progressPoints: 5,
        bugPoints: 10,
        damage: 0,
        injectStatusId: 'status_deprecated',
        injectDestination: 'hand'
      }
    ]
  },
  {
    id: 'enemy_phantom_signal',
    name: 'Ghost Signal [PHANTOM]',
    hp: 50,
    maxHp: 50,
    targetProgress: 70,
    visualType: 'AI',
    personality: 'PHANTOM',
    personalityHint: 'PHANTOM: каждые 2 хода сдвигает карту на шине. Используй DECOY_PING чтобы перенаправить.',
    actions: [
      {
        id: 'ph_shift',
        name: 'Phase Shift',
        description: 'Смещает одну карту в случайный слот на шине. Ломает цепочки.',
        progressPoints: 10,
        bugPoints: 5,
        damage: 5,
        spawnId: 'bug_card_glitch'
      },
      {
        id: 'ph_echo',
        name: 'Echo Pulse',
        description: 'Эхо-разряд. Добавляет стресс и замедляет прогресс.',
        progressPoints: 5,
        bugPoints: 0,
        damage: 8
      }
    ]
  },
  {
    id: 'enemy_sniffer',
    name: 'Package Sniffer-α',
    hp: 45,
    maxHp: 45,
    targetProgress: 60,
    visualType: 'AI',
    personality: 'SNIFFER',
    personalityHint: 'SNIFFER: видит STATUS-карты в твоей руке и карает за них. Сбрасывай мусор быстро или используй LOG_MASK.',
    actions: [
      {
        id: 'sn_analyze',
        name: 'Deep Analysis',
        description: 'Анализирует руку. Если находит STATUS-карты — наносит урон стрессу.',
        progressPoints: 10,
        bugPoints: 0,
        damage: 10
      },
      {
        id: 'sn_inject_spam',
        name: 'Spam Injection',
        description: 'Закидывает SPAGHETTI_CODE прямо в руку.',
        progressPoints: 5,
        bugPoints: 5,
        damage: 0,
        injectStatusId: 'status_spaghetti',
        injectDestination: 'hand'
      }
    ]
  }
];

export const ALL_ENEMIES: BugEnemy[] = [...BUGS, ...PERSONALITY_ENEMIES];

/** Равномерный выбор (тесты, старый код). В бою предпочтительнее pickNextBugAction. */
export const getRandomBugAction = (bug: BugEnemy): BugAction => {
  return bug.actions[Math.floor(Math.random() * bug.actions.length)];
};

export type AiRecentEntry = { id: string; problemType?: BugProblemType };
export type AiSelectionContext = {
  phase?: 'ARCHITECTURE' | 'DEVELOPMENT' | 'VERIFICATION' | 'DEPLOYMENT';
  bugPressure?: number;
  playerProgress?: number;
  /**
   * Плотность событий ИИ: >1 — чаще спавн ICE на шине и инъекции статусов (кооп / «шумный» бой).
   * 1 = поведение по умолчанию.
   */
  eventDensity?: number;
  /** Детерминированные тесты: источник U(0,1); по умолчанию Math.random. */
  random?: () => number;
};

/**
 * Выбор следующего действия ИИ: реже повторяет тот же id и тот же класс сбоя подряд,
 * чтобы колода с разными контрприёмами имела смысл, а «одна золотая карта» — нет.
 */
export function pickNextBugAction(bug: BugEnemy, recent: AiRecentEntry[], ctx?: AiSelectionContext): BugAction {
  const actions = bug.actions;
  if (actions.length === 0) throw new Error(`Enemy ${bug.id} has no actions`);
  if (actions.length === 1) return actions[0];

  const lastTwoIds = new Set(recent.slice(-2).map((r) => r.id));
  const last = recent.length ? recent[recent.length - 1] : undefined;
  const lastPt = last?.problemType;
  let streakSamePt = 0;
  if (lastPt !== undefined) {
    for (let i = recent.length - 1; i >= 0; i--) {
      if (recent[i].problemType === lastPt) streakSamePt++;
      else break;
    }
  }

  const k = Math.min(1.55, Math.max(1, ctx?.eventDensity ?? 1));
  const bp = ctx?.bugPressure ?? 0;

  const weights = actions.map((a) => {
    let w = 1;
    if (lastTwoIds.has(a.id)) w *= 0.38;
    if (lastPt !== undefined && a.problemType === lastPt) {
      w *= streakSamePt >= 2 ? 0.22 : 0.55;
    }
    if (ctx?.phase === 'DEVELOPMENT' && a.spawnId) w *= 1.25 * (0.92 + 0.08 * k);
    if (ctx?.phase === 'VERIFICATION' && a.injectStatusId) w *= 1.22 * k;
    if (ctx?.phase === 'VERIFICATION' && a.spawnId) w *= 1.16 * k;
    if (ctx?.phase === 'VERIFICATION' && bp <= 1 && (a.spawnId || a.injectStatusId)) {
      w *= 1 + 0.22 * Math.min(k, 1.45);
    }
    if (bp >= 3 && a.bugPoints > 0) w *= k >= 1.22 ? 0.78 : 0.72;
    if ((ctx?.playerProgress ?? 0) >= 85 && a.damage > 0) w *= 1.2;
    if (ctx?.phase === 'VERIFICATION' && a.damage >= 9) w *= 1.12;
    if (ctx?.phase === 'VERIFICATION' && (a.problemType === 'BUSINESS_RISK' || a.problemType === 'TECH_DEBT')) w *= 1.08;
    return Math.max(0.06, w);
  });

  const sum = weights.reduce((s, x) => s + x, 0);
  const rnd = ctx?.random ?? Math.random;
  let roll = rnd() * sum;
  for (let i = 0; i < actions.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return actions[i];
  }
  return actions[actions.length - 1];
}
