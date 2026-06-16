import type { Response } from 'express';
import { validateSheetActiveConditions } from '../../shared/nri-domain/validateSheetConditions.js';
import type { ApiErrorSender } from './auth.js';

/** @returns true если ответ уже отправлен (400) */
export function rejectIfInvalidSheetConditions(
  res: Response,
  sheet: unknown,
  sendApiError: ApiErrorSender,
): boolean {
  const result = validateSheetActiveConditions(sheet);
  if (result.ok) return false;
  sendApiError(res, 400, result.code, result.message);
  return true;
}
