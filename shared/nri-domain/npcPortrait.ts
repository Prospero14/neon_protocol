/** Портрет НПС: imageUrl на записи или portraitUrl в sheet. */

export type NpcPortraitSource = {
  imageUrl?: string | null;
  sheet?: unknown;
};

export function resolveNpcPortraitUrl(source: NpcPortraitSource | null | undefined): string | undefined {
  if (!source) return undefined;
  if (typeof source.imageUrl === 'string' && source.imageUrl.trim()) {
    return source.imageUrl.trim();
  }
  const sheet =
    source.sheet && typeof source.sheet === 'object'
      ? (source.sheet as { portraitUrl?: unknown })
      : null;
  if (typeof sheet?.portraitUrl === 'string' && sheet.portraitUrl.trim()) {
    return sheet.portraitUrl.trim();
  }
  return undefined;
}
