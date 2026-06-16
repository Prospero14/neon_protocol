/** Платформенные админы — полный доступ (Solo, Co-op, НРИ). */
export const PLATFORM_ADMIN_USERNAMES = ['admin', 'ProsperianSun'] as const;

export function isPlatformAdminUsername(username: string | undefined | null): boolean {
  if (!username) return false;
  return (PLATFORM_ADMIN_USERNAMES as readonly string[]).includes(username);
}
