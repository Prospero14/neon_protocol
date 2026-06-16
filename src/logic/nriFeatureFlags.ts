import { parseNriInviteFromHash } from './nriApi';
import { isPlatformAdminUsername } from './platformAdmin';

const NRI_GUEST_SESSION_KEY = 'neon_nri_invite_guest';
const NRI_GUEST_CODE_SESSION_KEY = 'neon_nri_invite_code';

export function readNriInviteFromLocation(): string | null {
  if (typeof window === 'undefined') return null;
  return parseNriInviteFromHash(window.location.hash);
}

/** Код invite в URL при первой загрузке страницы. */
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

export function readNriGuestInviteCode(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(NRI_GUEST_CODE_SESSION_KEY);
  } catch {
    return null;
  }
}

/**
 * Solo/Co-op на production закрыты для всех, кроме платформенных админов.
 * НРИ — доступно всем после авторизации.
 */
export function isSoloCoopRestrictedOnDeploy(): boolean {
  const flag = import.meta.env.VITE_SOLO_COOP_PUBLIC;
  if (flag === 'true') return false;
  if (flag === 'false') return true;
  return !import.meta.env.DEV;
}

export function isSoloCoopBlockedForUser(username: string | undefined | null): boolean {
  if (isPlatformAdminUsername(username)) return false;
  return isSoloCoopRestrictedOnDeploy();
}
