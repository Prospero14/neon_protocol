import type { z } from 'zod';

export function parseRequestBody<T>(
  schema: z.ZodType<T>,
  body: unknown,
): { ok: true; data: T } | { ok: false; message: string } {
  const result = schema.safeParse(body ?? {});
  if (result.success) return { ok: true, data: result.data };
  const message = result.error.issues
    .map((i) => (i.path.length ? `${i.path.join('.')}: ${i.message}` : i.message))
    .join('; ');
  return { ok: false, message: message || 'Некорректное тело запроса.' };
}
