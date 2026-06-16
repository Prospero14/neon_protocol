export function parseRequestBody(schema, body) {
    const result = schema.safeParse(body ?? {});
    if (result.success)
        return { ok: true, data: result.data };
    const message = result.error.issues
        .map((i) => (i.path.length ? `${i.path.join('.')}: ${i.message}` : i.message))
        .join('; ');
    return { ok: false, message: message || 'Некорректное тело запроса.' };
}
//# sourceMappingURL=parseBody.js.map