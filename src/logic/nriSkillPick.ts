/** Выбор навыков класса Carbon 2185 из пула skillsPick. */

import { C2185_SKILLS, getC2185ClassTemplate } from './nriCarbon2185';
import type { NriClassId } from './nriClasses';

const SKILL_NAMES = new Set(C2185_SKILLS.map((s) => s.name));

export function normalizeSkillOption(raw: string): string {
  const t = raw.trim();
  if (t === 'Vehicles') return 'Vehicles (Land)';
  return t;
}

export function parseClassSkillPool(skillsPick: string): { pickCount: number; options: string[] } {
  const m = skillsPick.match(/^(\d+)\s+из\s+(.+)$/i);
  if (!m) return { pickCount: 2, options: [] };
  const pickCount = Math.max(1, parseInt(m[1]!, 10) || 2);
  const options = m[2]!
    .split(',')
    .map((s) => normalizeSkillOption(s))
    .filter((s) => SKILL_NAMES.has(s));
  return { pickCount, options };
}

export function classSkillPool(classId: NriClassId): { pickCount: number; options: string[] } {
  const tpl = getC2185ClassTemplate(classId);
  if (!tpl) return { pickCount: 2, options: [] };
  return parseClassSkillPool(tpl.skillsPick);
}

export function validateSkillPick(classId: NriClassId, picked: string[]): string | null {
  const { pickCount, options } = classSkillPool(classId);
  if (options.length === 0) return null;
  if (picked.length !== pickCount) {
    return `Выберите ровно ${pickCount} навыка(ов) из списка класса.`;
  }
  const optSet = new Set(options);
  for (const s of picked) {
    if (!optSet.has(s)) return `Навык «${s}» не входит в пул класса.`;
  }
  if (new Set(picked).size !== picked.length) return 'Навыки не должны повторяться.';
  return null;
}

export function defaultSkillsForClass(classId: NriClassId): string[] {
  const { pickCount, options } = classSkillPool(classId);
  return options.slice(0, pickCount);
}
