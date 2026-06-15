/** Сервер: Wonlongs на листах игроков и НПС. */
export function readWonlongs(sheet) {
    if (!sheet || typeof sheet !== 'object')
        return 0;
    const w = sheet.wonlongs;
    if (typeof w !== 'number' || !Number.isFinite(w))
        return 0;
    return Math.max(0, Math.floor(w));
}
export function writeWonlongs(sheet, amount) {
    const next = Math.max(0, Math.floor(amount));
    if (sheet && typeof sheet === 'object') {
        return { ...sheet, wonlongs: next };
    }
    return { wonlongs: next };
}
export function antispamPrice(tableWonlongsSum) {
    return Math.max(1, Math.ceil((tableWonlongsSum * 2) / 4));
}
export function isSpamPaused(spamPausedUntil) {
    return !!spamPausedUntil && spamPausedUntil.getTime() > Date.now();
}
//# sourceMappingURL=nriWallet.js.map