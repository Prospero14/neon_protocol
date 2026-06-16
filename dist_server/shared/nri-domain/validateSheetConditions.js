import { getConditionDef } from './conditionDefs.js';
/** Проверяет `sheet.activeConditions` по канону `CONDITION_DEFS`. */
export function validateSheetActiveConditions(sheet) {
    if (!sheet || typeof sheet !== 'object')
        return { ok: true };
    const raw = sheet.activeConditions;
    if (raw === undefined)
        return { ok: true };
    if (!Array.isArray(raw)) {
        return {
            ok: false,
            code: 'INVALID_CONDITION_ID',
            invalidIds: [],
            message: 'activeConditions должен быть массивом.',
        };
    }
    const invalidIds = [];
    for (const entry of raw) {
        if (!entry || typeof entry !== 'object') {
            invalidIds.push('?');
            continue;
        }
        const id = entry.id;
        if (typeof id !== 'string' || !id.trim()) {
            invalidIds.push(String(id ?? '?'));
            continue;
        }
        if (!getConditionDef(id))
            invalidIds.push(id);
    }
    if (invalidIds.length === 0)
        return { ok: true };
    const unique = [...new Set(invalidIds)];
    return {
        ok: false,
        code: 'INVALID_CONDITION_ID',
        invalidIds: unique,
        message: `Неизвестные статусы: ${unique.join(', ')}`,
    };
}
//# sourceMappingURL=validateSheetConditions.js.map