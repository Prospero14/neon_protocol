import { validateSheetActiveConditions } from '../../shared/nri-domain/validateSheetConditions.js';
/** @returns true если ответ уже отправлен (400) */
export function rejectIfInvalidSheetConditions(res, sheet, sendApiError) {
    const result = validateSheetActiveConditions(sheet);
    if (result.ok)
        return false;
    sendApiError(res, 400, result.code, result.message);
    return true;
}
//# sourceMappingURL=sheetConditionGate.js.map