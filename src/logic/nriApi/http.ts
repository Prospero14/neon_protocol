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
