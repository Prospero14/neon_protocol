import { describe, expect, it } from 'vitest';
import { loreHighlightTitles, parseLoreMarkup } from './loreMarkup';

describe('loreMarkup', () => {
  it('highlights explicit [[name]] and known titles', () => {
    const entities = [{ title: 'Блум' }, { title: 'Арасака' }];
    const segments = parseLoreMarkup('Идём в [[Блум]] мимо Арасака.', loreHighlightTitles(entities));
    const highlighted = segments.filter((s) => s.highlight).map((s) => s.text);
    expect(highlighted).toContain('Блум');
    expect(highlighted).toContain('Арасака');
  });

  it('returns plain text on corrupt input without throwing', () => {
    expect(parseLoreMarkup('', [])).toEqual([]);
    expect(parseLoreMarkup('plain text', [])).toEqual([
      { text: 'plain text', highlight: false, explicit: false },
    ]);
  });
});
