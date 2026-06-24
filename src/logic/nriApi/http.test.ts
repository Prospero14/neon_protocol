import { describe, it, expect } from 'vitest';
import { formatNriApiError } from './http.js';

describe('formatNriApiError', () => {
  it('shows code and message together', () => {
    expect(
      formatNriApiError(
        { code: 'NRI_SCENARIO_TITLE_REQUIRED', message: 'Укажите название узла.' },
        'fallback'
      )
    ).toBe('[NRI_SCENARIO_TITLE_REQUIRED] Укажите название узла.');
  });

  it('reads legacy error field when message absent', () => {
    expect(
      formatNriApiError({ code: 'NRI_NOT_FOUND', error: 'Стол не найден.' }, 'fallback')
    ).toBe('[NRI_NOT_FOUND] Стол не найден.');
  });

  it('falls back when body empty', () => {
    expect(formatNriApiError({}, 'Не удалось сохранить')).toBe('Не удалось сохранить');
  });
});
