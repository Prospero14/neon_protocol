import { parseNriInviteFromHash } from './nriApi';

const NRI_GUEST_SESSION_KEY = 'neon_nri_invite_guest';
const NRI_GUEST_CODE_SESSION_KEY = 'neon_nri_invite_code';

export function readNriInviteFromLocation(): string | null {
  if (typeof window === 'undefined') return null;
  return parseNriInviteFromHash(window.location.hash);
}

/** Код invite в URL при первой загрузке страницы (до любых редиректов в приложении). */
export function readLandingNriInviteCode(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem('neon_nri_landing_invite');
    if (raw) return raw;
    const fromHash = parseNriInviteFromHash(window.location.hash);
    if (fromHash) {
      sessionStorage.setItem('neon_nri_landing_invite', fromHash);
      return fromHash;
    }
    return null;
  } catch {
    return parseNriInviteFromHash(window.location.hash);
  }
}

/**
 * Гость по invite-ссылке — только если открыл сайт с #nri/join/… в URL.
 * Создание стола мастером (hash выставляется уже в приложении) не помечает гостем.
 */
export function markNriInviteGuestFromLanding(): string | null {
  const code = readLandingNriInviteCode();
  if (!code || typeof window === 'undefined') return code;
  try {
    localStorage.removeItem('neon_nri_invite_guest');
    localStorage.removeItem('neon_nri_invite_code');
    sessionStorage.setItem(NRI_GUEST_SESSION_KEY, '1');
    sessionStorage.setItem(NRI_GUEST_CODE_SESSION_KEY, code);
  } catch {
    /* ignore */
  }
  return code;
}

export function isNriInviteGuest(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(NRI_GUEST_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

export function readNriGuestInviteCode(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(NRI_GUEST_CODE_SESSION_KEY);
  } catch {
    return null;
  }
}

/**
 * Solo/Co-op на production закрыты только для гостей по invite-ссылке.
 * НРИ (создание стола, вход, автоджойн) — всегда доступно всем после авторизации.
 */
export function isSoloCoopRestrictedOnDeploy(): boolean {
  const flag = import.meta.env.VITE_SOLO_COOP_PUBLIC;
  if (flag === 'true') return false;
  if (flag === 'false') return true;
  return !import.meta.env.DEV;
}

export function isSoloCoopBlockedForUser(): boolean {
  return isNriInviteGuest() && isSoloCoopRestrictedOnDeploy();
}
