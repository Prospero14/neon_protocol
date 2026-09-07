/**
 * API origin for Capacitor / cross-origin mobile shells.
 * Relative `/neon_v1/...` calls are rewritten when a base is set.
 */

const STORAGE_KEY = 'neon_protocol.api_base';

export function readApiBase(): string {
  try {
    const fromEnv = (import.meta.env.VITE_API_BASE as string | undefined)?.trim();
    if (fromEnv) return stripTrailingSlash(fromEnv);
    const stored = localStorage.getItem(STORAGE_KEY)?.trim();
    if (stored) return stripTrailingSlash(stored);
  } catch {
    /* SSR / private mode */
  }
  return '';
}

export function writeApiBase(url: string): void {
  const cleaned = stripTrailingSlash(url.trim());
  try {
    if (!cleaned) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, cleaned);
  } catch {
    /* ignore */
  }
}

export function resolveApiUrl(input: string): string {
  if (!input.startsWith('/')) return input;
  const base = readApiBase();
  if (!base) return input;
  return `${base}${input}`;
}

function stripTrailingSlash(s: string): string {
  return s.replace(/\/+$/, '');
}

let patched = false;

/** Rewrite relative `/neon_v1` (and same-origin absolute) fetches when API base is set. */
export function installApiFetchPatch(): void {
  if (patched || typeof window === 'undefined') return;
  patched = true;
  const nativeFetch = window.fetch.bind(window);

  window.fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    if (typeof input === 'string') {
      return nativeFetch(resolveApiUrl(input), init);
    }
    if (input instanceof URL) {
      const href = input.href;
      if (href.startsWith('/') || href.startsWith(window.location.origin + '/')) {
        const path = href.startsWith('/') ? href : href.slice(window.location.origin.length);
        return nativeFetch(resolveApiUrl(path), init);
      }
      return nativeFetch(input, init);
    }
    if (input instanceof Request) {
      const url = input.url;
      try {
        const u = new URL(url, window.location.origin);
        const isRelativeApi =
          u.origin === window.location.origin && u.pathname.startsWith('/neon_v1');
        if (isRelativeApi) {
          const rewritten = resolveApiUrl(u.pathname + u.search);
          return nativeFetch(new Request(rewritten, input), init);
        }
      } catch {
        /* fall through */
      }
    }
    return nativeFetch(input, init);
  };
}

export function isLikelyNativeShell(): boolean {
  try {
    const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
    if (cap?.isNativePlatform?.()) return true;
  } catch {
    /* ignore */
  }
  return /\bCapacitor\b/i.test(navigator.userAgent || '');
}
