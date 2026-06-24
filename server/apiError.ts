import type { Response } from 'express';

/** Единый JSON для ошибок neon_v1: текст для человека + стабильный `code` для клиента/логов. */
export function sendApiError(res: Response, status: number, code: string, message: string) {
  res.status(status).json({ error: message, message, code });
}

export type ApiErrorSender = typeof sendApiError;
