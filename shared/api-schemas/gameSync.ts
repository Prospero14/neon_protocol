import { z } from 'zod';

/** Элемент колоды / инвентаря в sync — допускаем расширенные поля карточек. */
const inventoryEntrySchema = z.record(z.string(), z.unknown());

/**
 * Тело POST /neon_v1/game/sync.
 * Ядро пишется в колонки GameState; остальное уходит в clientSnapshot (passthrough).
 */
export const gameSyncPayloadSchema = z
  .object({
    stress: z.number().finite().optional(),
    maxStress: z.number().finite().optional(),
    bits: z.number().finite().optional(),
    xp: z.number().finite().optional(),
    level: z.number().finite().optional(),
    activeDeck: z.array(inventoryEntrySchema).optional(),
    inventory: z.array(inventoryEntrySchema).optional(),
    artifacts: z.array(z.unknown()).optional(),
    completedQuests: z.array(z.unknown()).optional(),
    /** Legacy: токен в теле (предпочтительно Authorization). */
    token: z.string().optional(),
  })
  .passthrough();

export type GameSyncPayload = z.infer<typeof gameSyncPayloadSchema>;
