/** Shared fetch helpers for NRI client API. */

export const NRI_NETWORK_ERROR =
  'Сервер недоступен. В корне проекта: npm run build && npm start (порт 8080).';

export async function nriParseJson(res: Response) {
  const t = await res.text();
  try {
    return JSON.parse(t);
  } catch {
    return { error: t };
  }
}

export function nriAuthHeaders(token: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

/** Человекочитаемая строка: `[CODE] сообщение` (оба поля из ответа API). */
export function formatNriApiError(data: Record<string, unknown>, fallback: string): string {
  const code = typeof data.code === 'string' ? data.code.trim() : '';
  const message =
    (typeof data.message === 'string' && data.message.trim()) ||
    (typeof data.error === 'string' && data.error.trim()) ||
    '';

  if (
    data.code === 'API_NOT_FOUND' ||
    /Cannot (GET|POST|PATCH|DELETE)|<!DOCTYPE html>/i.test(message)
  ) {
    return '[API_NOT_FOUND] API не найден — перезапустите сервер: npm run build && npm start (порт 8080).';
  }

  if (code && message) return `[${code}] ${message}`;
  if (message) return message;
  if (code) return `[${code}] ${fallback}`;
  return fallback;
}

export function parseNriApiError(data: Record<string, unknown>, fallback: string): string {
  return formatNriApiError(data, fallback);
}

const NRI_FETCH_TIMEOUT_MS = 20_000;
const NRI_PATCH_TIMEOUT_MS = 35_000;

export { NRI_FETCH_TIMEOUT_MS, NRI_PATCH_TIMEOUT_MS };

export type NriFetchResult = { res: Response; data: Record<string, unknown> };

/** fetch + JSON без unhandled rejection при недоступном API. */
export async function nriSafeFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
  opts?: { timeoutMs?: number }
): Promise<NriFetchResult | null> {
  const ctrl = new AbortController();
  const ms = opts?.timeoutMs ?? NRI_FETCH_TIMEOUT_MS;
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(input, { ...init, signal: ctrl.signal });
    const data = (await nriParseJson(res)) as Record<string, unknown>;
    return { res, data };
  } catch (err) {
    const aborted = err instanceof DOMException && err.name === 'AbortError';
    console.error('[nri] fetch failed:', input, err);
    if (aborted) {
      return null;
    }
    return null;
  } finally {
    clearTimeout(timer);
  }
}
