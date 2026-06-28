/**
 * Токен после login() сразу пишется в localStorage, а React-state в дочерних
 * эффектах (syncGame, лобби) может ещё один кадр держать старый JWT — тогда
 * /game/sync шлёт истёкший Bearer и клиент получает 401.
 */
export function readNeonAuthToken(): string | null {
  try {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('neon_token');
  } catch {
    return null;
  }
}

/** Сброс JWT и сохранённого пользователя (без reload). */
export function clearNeonAuthStorage(): void {
  try {
    localStorage.removeItem('neon_token');
    localStorage.removeItem('neon_user');
  } catch {
    /* ignore */
  }
}
