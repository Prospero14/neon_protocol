import type { Trait } from './traits';

export function baseQuestBits(tier: number, difficulty: 'quick' | 'standard' | 'hard'): number {
  const tierBase = 22 + tier * 12;
  if (difficulty === 'quick') return tierBase;
  if (difficulty === 'hard') return tierBase + 45;
  return tierBase + 20;
}

export function applyBitModifiers(base: number, traits: Trait[], preClass: boolean): number {
  let result = base;
  if (traits.some((t) => t.id === 'hobby_retro_gaming')) result += Math.floor(base * 0.15);
  if (traits.some((t) => t.id === 'hobby_crypto')) result += 20;
  if (preClass) result = Math.floor(result * 0.9); // чуть мягче ранней экономики до класса
  return Math.max(5, result);
}
