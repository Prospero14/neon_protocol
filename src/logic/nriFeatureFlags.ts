import { parseNriInviteFromHash } from './nriApi';

const NRI_GUEST_KEY = 'neon_nri_invite_guest';
const NRI_GUEST_CODE_KEY = 'neon_nri_invite_code';

export function readNriInviteFromLocation(): string | null {
  if (typeof window === 'undefined') return null;
  return parseNriInviteFromHash(window.location.hash);
}

/** Пользователь заходил по invite-ссылке (#nri/join/…). */
export function markNriInviteGuest(code: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(NRI_GUEST_KEY, '1');
    localStorage.setItem(NRI_GUEST_CODE_KEY, code.trim().toUpperCase());
  } catch {
    /* ignore */
  }
}

export function isNriInviteGuest(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(NRI_GUEST_KEY) === '1';
  } catch {
    return false;
  }
}

export function readNriGuestInviteCode(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(NRI_GUEST_CODE_KEY);
  } catch {
    return null;
  }
}

/**
 * На production (Amvera) Solo/Co-op закрыты для гостей по NRI-ссылке.
 * Локально в dev — открыты для всех.
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

/** Отметить гостя, если в URL есть invite. */
export function markNriInviteGuestFromLocation(): void {
  const code = readNriInviteFromLocation();
  if (code) markNriInviteGuest(code);
}
