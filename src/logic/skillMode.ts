/**
 * Режим сложности обучения: подсказки и пайплайны vs без прямых гайдов.
 */

export type SkillMode = 'script-kiddie' | 'junior' | 'mid' | 'senior';

export const SKILL_MODE_STORAGE_KEY = 'neon_skill_mode';

export const DEFAULT_SKILL_MODE: SkillMode = 'script-kiddie';

export function parseSkillMode(raw: string | null): SkillMode {
  if (raw === 'junior') return 'junior';
  if (raw === 'mid') return 'mid';
  if (raw === 'senior') return 'senior';
  return 'script-kiddie';
}
