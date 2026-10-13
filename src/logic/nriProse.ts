/** Хелперы для читаемой генерации бэкстори / одежды. */

/** Одно законченное предложение: заглавная + конечная точка. */
export function asSentence(raw: string): string {
  let t = raw.trim().replace(/\s+/g, ' ');
  if (!t) return '';
  t = t.replace(/^[.,;:—\-\s]+/, '').replace(/[.!?…]+$/u, '');
  if (!t) return '';
  const first = t.charAt(0).toLocaleUpperCase('ru-RU');
  return `${first}${t.slice(1)}.`;
}

export function joinSentences(...parts: Array<string | null | undefined>): string {
  return parts
    .map((p) => (p == null ? '' : asSentence(p)))
    .filter(Boolean)
    .join(' ');
}

/** Случайный элемент; при пустом массиве — fallback. */
export function pickOne<T>(arr: readonly T[], fallback: T): T {
  if (!arr.length) return fallback;
  return arr[Math.floor(Math.random() * arr.length)]!;
}
