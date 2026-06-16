import { parseNriInviteFromHash } from './nriApi';

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
  return readLandingNriInviteCode();
}

export function readNriGuestInviteCode(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(NRI_GUEST_CODE_SESSION_KEY);
  } catch {
    return null;
  }
}
