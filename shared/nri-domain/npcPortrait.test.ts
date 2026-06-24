import { describe, expect, it } from 'vitest';
import { resolveNpcPortraitUrl } from './npcPortrait.js';

describe('resolveNpcPortraitUrl — hostile / corrupt input', () => {
  it('returns undefined for null, undefined, empty source', () => {
    expect(resolveNpcPortraitUrl(null)).toBeUndefined();
    expect(resolveNpcPortraitUrl(undefined)).toBeUndefined();
    expect(resolveNpcPortraitUrl({})).toBeUndefined();
  });

  it('ignores whitespace-only imageUrl and portraitUrl', () => {
    expect(resolveNpcPortraitUrl({ imageUrl: '   ' })).toBeUndefined();
    expect(resolveNpcPortraitUrl({ sheet: { portraitUrl: '\t\n' } })).toBeUndefined();
  });

  it('prefers imageUrl over sheet portraitUrl', () => {
    expect(
      resolveNpcPortraitUrl({
        imageUrl: ' https://cdn/a.png ',
        sheet: { portraitUrl: 'https://cdn/b.png' },
      }),
    ).toBe('https://cdn/a.png');
  });

  it('ignores non-string portraitUrl in sheet without throwing', () => {
    expect(resolveNpcPortraitUrl({ sheet: { portraitUrl: 42 } })).toBeUndefined();
    expect(resolveNpcPortraitUrl({ sheet: { portraitUrl: null } })).toBeUndefined();
    expect(resolveNpcPortraitUrl({ sheet: null as unknown as undefined })).toBeUndefined();
  });

  it('does not throw when sheet is array or primitive', () => {
    expect(() => resolveNpcPortraitUrl({ sheet: [] })).not.toThrow();
    expect(() => resolveNpcPortraitUrl({ sheet: 'bad' })).not.toThrow();
    expect(resolveNpcPortraitUrl({ sheet: [] })).toBeUndefined();
  });

  it('ignores non-string imageUrl types', () => {
    expect(resolveNpcPortraitUrl({ imageUrl: 123 as unknown as string })).toBeUndefined();
    expect(resolveNpcPortraitUrl({ imageUrl: null })).toBeUndefined();
  });
});
