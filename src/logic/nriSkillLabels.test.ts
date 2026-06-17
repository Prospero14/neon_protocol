import { describe, expect, it } from 'vitest';
import { skillLabelRu } from './nriSkillLabels';

describe('nriSkillLabels', () => {
  it('translates known skills', () => {
    expect(skillLabelRu('Bureaucracy')).toBe('Бюрократия');
    expect(skillLabelRu('Investigation')).toBe('Расследование');
    expect(skillLabelRu('Sense Motive')).toBe('Чтение мотивов');
    expect(skillLabelRu('Vehicles (Land)')).toBe('Транспорт (наземный)');
  });

  it('falls back to english id', () => {
    expect(skillLabelRu('Unknown Skill')).toBe('Unknown Skill');
  });
});
