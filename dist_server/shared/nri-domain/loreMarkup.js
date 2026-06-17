/** Разметка лора в тексте сценария: [[Название]] и авто-подсветка известных сущностей. */
const EXPLICIT_RE = /\[\[([^\]]+)\]\]/g;
function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
/** Собрать уникальные названия для авто-подсветки (длинные первыми). */
export function loreHighlightTitles(entities) {
    const seen = new Set();
    const out = [];
    for (const e of entities) {
        const t = e.title.trim();
        if (!t || seen.has(t.toLowerCase()))
            continue;
        seen.add(t.toLowerCase());
        out.push(t);
    }
    return out.sort((a, b) => b.length - a.length);
}
function mergeMarks(marks) {
    if (marks.length === 0)
        return [];
    const sorted = [...marks].sort((a, b) => a.start - b.start || b.end - a.end);
    const out = [];
    for (const m of sorted) {
        const last = out[out.length - 1];
        if (!last || m.start >= last.end) {
            out.push({ ...m });
            continue;
        }
        if (m.end > last.end)
            last.end = m.end;
        if (m.explicit)
            last.explicit = true;
    }
    return out;
}
/** Разбить текст на сегменты с подсветкой. */
export function parseLoreMarkup(text, knownTitles) {
    if (!text || typeof text !== 'string')
        return [];
    try {
        const marks = [];
        let m;
        EXPLICIT_RE.lastIndex = 0;
        while ((m = EXPLICIT_RE.exec(text)) !== null) {
            const inner = m[1]?.trim();
            if (!inner)
                continue;
            marks.push({ start: m.index, end: m.index + m[0].length, explicit: true });
        }
        for (const title of knownTitles) {
            if (!title)
                continue;
            const re = new RegExp(escapeRegExp(title), 'gi');
            let hit;
            while ((hit = re.exec(text)) !== null) {
                marks.push({ start: hit.index, end: hit.index + hit[0].length, explicit: false });
            }
        }
        const merged = mergeMarks(marks);
        if (merged.length === 0)
            return [{ text, highlight: false, explicit: false }];
        const segments = [];
        let cursor = 0;
        for (const mark of merged) {
            if (mark.start > cursor) {
                segments.push({ text: text.slice(cursor, mark.start), highlight: false, explicit: false });
            }
            const chunk = text.slice(mark.start, mark.end);
            const inner = chunk.startsWith('[[') && chunk.endsWith(']]') ? chunk.slice(2, -2) : chunk;
            segments.push({ text: inner, highlight: true, explicit: mark.explicit });
            cursor = mark.end;
        }
        if (cursor < text.length) {
            segments.push({ text: text.slice(cursor), highlight: false, explicit: false });
        }
        return segments;
    }
    catch {
        return [{ text, highlight: false, explicit: false }];
    }
}
export const LORE_MARKUP_HINT = 'Подсветка в тексте: [[Название места или фракции]] — явная ссылка; без скобок подсвечиваются названия из лора после сохранения карточек.';
//# sourceMappingURL=loreMarkup.js.map