/** Единый JSON для ошибок neon_v1: текст для человека + стабильный `code` для клиента/логов. */
export function sendApiError(res, status, code, message) {
    res.status(status).json({ error: message, message, code });
}
//# sourceMappingURL=apiError.js.map