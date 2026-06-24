import { z } from 'zod';
export const nriCreateSessionSchema = z.object({
    title: z.string().trim().max(80).optional(),
});
/** POST join — тело может быть пустым. */
export const nriJoinSchema = z.object({}).passthrough();
export const nriPlayerSaveSchema = z.object({
    displayName: z.string().trim().min(1, 'Укажите имя персонажа.').max(40),
    classId: z.string().trim().max(64).optional(),
    presetId: z.string().trim().max(64).optional(),
    sheet: z.unknown().optional(),
    inventory: z.unknown().optional(),
});
export const nriPlayerPatchSchema = z.object({
    displayName: z.string().trim().min(1).max(40).optional(),
    sheet: z.record(z.string(), z.unknown()).optional(),
});
export const nriPlayerNotesSchema = z.object({
    notes: z.string().max(50000),
});
export const nriItemGrantSchema = z.object({
    catalogId: z.string().trim().min(1, 'Укажите catalogId.'),
    qty: z.number().int().positive().optional(),
    fromNpcId: z.string().trim().optional(),
});
export const nriIceResultSchema = z.object({
    won: z.boolean({ message: 'Укажите won: true|false.' }),
});
export const nriIceScoreSchema = z.object({
    gameId: z.string().trim().min(1).max(64).optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    score: z.number().finite().optional(),
    exfilPct: z.number().finite().optional(),
    tracePct: z.number().finite().optional(),
    won: z.boolean().optional(),
});
export const nriWonlongsTransferSchema = z
    .object({
    amount: z.number().finite().positive('Укажите сумму > 0.'),
    toPlayerUserId: z.string().trim().optional(),
    toNpcId: z.string().trim().optional(),
    memo: z.string().max(500).optional(),
})
    .refine((b) => !!(b.toPlayerUserId?.trim() || b.toNpcId?.trim()), {
    message: 'Укажите получателя (игрок или НПС).',
})
    .refine((b) => !(b.toPlayerUserId?.trim() && b.toNpcId?.trim()), {
    message: 'Только один получатель за раз.',
});
export const nriWonlongsGrantSchema = z.object({
    playerUserId: z.string().trim().min(1, 'Укажите playerUserId.'),
    amount: z.number().finite().positive('Укажите сумму > 0.'),
    fromNpcId: z.string().trim().optional(),
    memo: z.string().max(500).optional(),
});
export const nriPresetCreateSchema = z.object({
    label: z.string().trim().min(1, 'Укажите название пресета.').max(60),
    classId: z.string().trim().min(1, 'Выберите класс.').max(64),
    inventory: z.array(z.unknown()).optional(),
    sheet: z.unknown().optional(),
    portraitUrl: z.string().trim().max(2000).nullable().optional(),
    sortOrder: z.number().int().optional(),
    publishedToPlayers: z.boolean().optional(),
});
export const nriPresetPatchSchema = z.object({
    label: z.string().trim().min(1).max(60).optional(),
    classId: z.string().trim().min(1).max(64).optional(),
    inventory: z.array(z.unknown()).optional(),
    sheet: z.unknown().optional(),
    portraitUrl: z.string().trim().max(2000).nullable().optional(),
    sortOrder: z.number().int().optional(),
    publishedToPlayers: z.boolean().optional(),
});
//# sourceMappingURL=nri.js.map