/**
 * Кооп: четыре роли — своя колода, общие статы (stress/threat/bugs/progress).
 * ИИ давит по-разному: разраб — ревью и темп кода; QA — дефекты; админ — периметр (смягчено);
 * PM — дедлайн и шум.
 */
import type { CoopRole } from './sessionMode';
import type { SessionMode } from './sessionMode';

export function isCoopCombat(
  sessionMode: SessionMode | undefined,
  role: CoopRole | null | undefined
): role is CoopRole {
  return sessionMode === 'coop' && role != null;
}

/** Стартовая строка в логе боя: чем оппонент «цепляет» эту роль. */
export function coopOppositionOpeningLine(role: CoopRole): string {
  switch (role) {
    case 'developer':
      return '[COOP] ОППОНЕНТ: режим CODE_REVIEW — приоритет: угроза роста THREAT при медленной поставке.';
    case 'qa':
      return '[COOP] ОППОНЕНТ: режим DEFECT_INJECTION — приоритет: баги и ICE на шине.';
    case 'admin':
      return '[COOP] ОППОНЕНТ: режим PERIMETER_PROBE — приоритет: стресс и обход прокси/фаервола.';
    case 'pm':
      return '[COOP] ОППОНЕНТ: режим SPRINT_PRESSURE — приоритет: дедлайн и фоновый шум команды.';
    default:
      return '[COOP] ОППОНЕНТ: AUDIT_GENERIC.';
  }
}

/**
 * Модификатор входящих ударов ИИ после расчёта хода аудитора.
 * Developer: чуть сильнее THREAT (ревью кода). QA: слабее баги. Admin: бывший DevOps+админ — танк по периметру. PM: мягче стресс.
 * Округление: threat чаще ceil (давление не «теряется»), bug/stress — floor (снятие дефектов не завышается).
 */
export function coopAdjustAiDeltas(
  role: CoopRole,
  threatDelta: number,
  bugDelta: number,
  stressDelta: number
): { threatDelta: number; bugDelta: number; stressDelta: number } {
  /** Общее усиление давления по стрессу в коопе (угроза должна ощущаться). */
  const stressK = 1.22;
  if (role === 'developer') {
    return {
      threatDelta: Math.max(0, Math.ceil(threatDelta * 1.08)),
      bugDelta: Math.max(0, Math.floor(bugDelta * 0.94)),
      stressDelta: Math.max(0, Math.floor(stressDelta * 1.08 * stressK)),
    };
  }
  if (role === 'qa') {
    return {
      threatDelta: Math.max(0, Math.floor(threatDelta * 1.04)),
      bugDelta: Math.max(0, Math.floor(bugDelta * 0.82)),
      stressDelta: Math.max(0, Math.floor(stressDelta * 0.98 * stressK)),
    };
  }
  if (role === 'admin') {
    return {
      threatDelta: Math.max(0, Math.floor(threatDelta * 0.9)),
      bugDelta: Math.max(0, Math.floor(bugDelta * 0.9)),
      stressDelta: Math.max(0, Math.floor(stressDelta * 0.88 * stressK)),
    };
  }
  if (role === 'pm') {
    return {
      threatDelta: Math.max(0, Math.floor(threatDelta * 0.95)),
      bugDelta,
      stressDelta: Math.max(0, Math.floor(stressDelta * 0.92 * stressK)),
    };
  }
  return { threatDelta, bugDelta, stressDelta };
}

/** Бонус к прогрессу от цепочек на шине (разработчик — логика/kata-цепочки). */
export function coopChainProgressBonus(role: CoopRole, base: number): number {
  if (role === 'developer') return Math.floor(base * 1.28);
  return base;
}

/** Мелкий бонус за выкладку «кода» (синтаксис / функции) на шину. */
export function coopLaneCodeProgressBump(role: CoopRole): number {
  return role === 'developer' ? 2 : 0;
}

/** Доп. снятие багов/угрозы при успешном outplay (QA — чистка дефектов). */
export function coopOutplayExtras(role: CoopRole, outplay: boolean): { bugExtra: number; threatExtra: number } {
  if (!outplay) return { bugExtra: 0, threatExtra: 0 };
  if (role === 'qa') return { bugExtra: 2, threatExtra: 3 };
  return { bugExtra: 0, threatExtra: 0 };
}

/** Фоновый стресс в конце хода (PM — agile/буферы). */
export function coopBackgroundNoise(role: CoopRole, base: number): number {
  if (role === 'pm') return Math.max(0, base);
  if (role === 'admin') return Math.max(0, Math.floor(base * 0.92));
  return Math.max(0, Math.floor(base * 1.08));
}

/**
 * Синергия не-dev ролей при снятии ICE/бага: предыдущие карты в том же ходу усиливают эффект.
 * Подбирать колоду под пары (TRACE→SPOOF, REPRO→ROOT_CAUSE, PING→SSH и т.д.).
 */
export function coopBugClearSynergy(
  role: CoopRole,
  clearingCardId: string,
  playedEarlierThisTurn: readonly string[],
): { threatExtra: number; mitigationExtra: number; log: string | null } {
  const p = new Set(playedEarlierThisTurn);
  if (role === 'qa') {
    if (clearingCardId === 'react_spoof_id' && p.has('react_trace_jam')) {
      return {
        threatExtra: 12,
        mitigationExtra: 4,
        log: '[SYNERGY:QA] TRACE_JAM → SPOOF_ID: усиленное снятие ICE.',
      };
    }
    if (clearingCardId === 'react_root_cause' && p.has('react_bug_repro')) {
      return {
        threatExtra: 10,
        mitigationExtra: 6,
        log: '[SYNERGY:QA] BUG_REPRO → ROOT_CAUSE: расследование закрыто.',
      };
    }
    if (clearingCardId === 'react_firewall_patch' && p.has('react_log_mask')) {
      return {
        threatExtra: 8,
        mitigationExtra: 5,
        log: '[SYNERGY:QA] LOG_MASK → FIREWALL: периметр укреплён.',
      };
    }
    if (clearingCardId === 'react_unit_test' && p.has('react_integration_test')) {
      return {
        threatExtra: 5,
        mitigationExtra: 3,
        log: '[SYNERGY:QA] INTEGRATION → UNIT: пирамида тестов.',
      };
    }
    if (clearingCardId === 'react_contract_test' && p.has('react_mock_server')) {
      return {
        threatExtra: 5,
        mitigationExtra: 3,
        log: '[SYNERGY:QA] MOCK → CONTRACT: контракт зафиксирован.',
      };
    }
  }
  if (role === 'admin' && (clearingCardId === 'script_ssh' || clearingCardId === 'script_auth') && p.has('script_ping')) {
    return {
      threatExtra: 7,
      mitigationExtra: 4,
      log: '[SYNERGY:ADMIN] PING → SSH/AUTH: сетевой контур.',
    };
  }
  if (role === 'admin' && clearingCardId === 'script_grep' && p.has('script_ping')) {
    return {
      threatExtra: 4,
      mitigationExtra: 2,
      log: '[SYNERGY:ADMIN] PING → GREP: быстрый срез логов.',
    };
  }
  if (role === 'pm' && clearingCardId.startsWith('soft_') && p.has('soft_coffee')) {
    return {
      threatExtra: 8,
      mitigationExtra: 6,
      log: '[SYNERGY:PM] COFFEE → SOFT на ICE: командный буфер.',
    };
  }
  if (role === 'pm' && clearingCardId === 'soft_daily_sync' && p.has('soft_agile_ceremony')) {
    return {
      threatExtra: 5,
      mitigationExtra: 4,
      log: '[SYNERGY:PM] CEREMONY → DAILY: ритуал → синхронизация.',
    };
  }
  return { threatExtra: 0, mitigationExtra: 0, log: null };
}

/** PM: последовательность SOFT в фазе архитектуры (слоты soft). */
export function coopPmSoftSynergy(
  cardId: string,
  playedEarlierThisTurn: readonly string[],
): { threatCut: number; stressRelief: number; log: string | null } {
  const p = new Set(playedEarlierThisTurn);
  if (cardId === 'soft_focus' && p.has('soft_coffee')) {
    return { threatCut: 5, stressRelief: 4, log: '[SYNERGY:PM] COFFEE → FOCUS: двойной буфер.' };
  }
  if (cardId === 'soft_buffer_flush' && (p.has('soft_deadline_trance') || p.has('soft_signal_prediction'))) {
    return { threatCut: 6, stressRelief: 3, log: '[SYNERGY:PM] Прогноз/транс → BUFFER_FLUSH: срез давления.' };
  }
  return { threatCut: 0, stressRelief: 0, log: null };
}
