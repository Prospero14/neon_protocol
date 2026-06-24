/** Портрет НПС: imageUrl на записи или portraitUrl в sheet. */
export function resolveNpcPortraitUrl(source) {
    if (!source)
        return undefined;
    if (typeof source.imageUrl === 'string' && source.imageUrl.trim()) {
        return source.imageUrl.trim();
    }
    const sheet = source.sheet && typeof source.sheet === 'object'
        ? source.sheet
        : null;
    if (typeof sheet?.portraitUrl === 'string' && sheet.portraitUrl.trim()) {
        return sheet.portraitUrl.trim();
    }
    return undefined;
}
//# sourceMappingURL=npcPortrait.js.map