/** Shared fetch helpers for NRI client API. */

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

export function parseNriApiError(data: Record<string, unknown>, fallback: string): string {
  const raw =
    (typeof data.message === 'string' && data.message) ||
    (typeof data.error === 'string' && data.error) ||
    '';
  if (
    data.code === 'API_NOT_FOUND' ||
    /Cannot (GET|POST|PATCH|DELETE)|<!DOCTYPE html>/i.test(raw)
  ) {
    return 'API не найден — перезапустите сервер: npm run build && npm start (порт 8080).';
  }
  if (raw) return raw;
  return fallback;
}
