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
  if (role === 'developer') {
    return {
      threatDelta: Math.max(0, Math.ceil(threatDelta * 1.08)),
      bugDelta: Math.max(0, Math.floor(bugDelta * 0.94)),
      stressDelta: Math.max(0, Math.floor(stressDelta * 1.05)),
    };
  }
  if (role === 'qa') {
    return {
      threatDelta: Math.max(0, Math.floor(threatDelta * 1.04)),
      bugDelta: Math.max(0, Math.floor(bugDelta * 0.82)),
      stressDelta: Math.max(0, Math.floor(stressDelta * 0.96)),
    };
  }
  if (role === 'admin') {
    return {
      threatDelta: Math.max(0, Math.floor(threatDelta * 0.9)),
      bugDelta: Math.max(0, Math.floor(bugDelta * 0.9)),
      stressDelta: Math.max(0, Math.floor(stressDelta * 0.84)),
    };
  }
  if (role === 'pm') {
    return {
      threatDelta: Math.max(0, Math.floor(threatDelta * 0.95)),
      bugDelta,
      stressDelta: Math.max(0, Math.floor(stressDelta * 0.88)),
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
  if (role === 'pm') return Math.max(0, base - 1);
  if (role === 'admin') return Math.max(0, Math.floor(base * 0.85));
  return base;
}
