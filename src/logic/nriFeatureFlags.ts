import { parseNriInviteFromHash } from './nriApi';

/** Публичный доступ к НРИ (по ссылке). На Amvera — false; локально в dev — true. */
export function isNriPublicEnabled(): boolean {
  const flag = import.meta.env.VITE_NRI_PUBLIC;
  if (flag === 'true') return true;
  if (flag === 'false') return false;
  return import.meta.env.DEV;
}

export function readNriInviteFromLocation(): string | null {
  if (typeof window === 'undefined') return null;
  return parseNriInviteFromHash(window.location.hash);
}

/** Пользователь открыл приложение по invite-ссылке (#nri/join/…). */
export function isNriInviteEntry(): boolean {
  return !!readNriInviteFromLocation();
}
