/**
 * Фильтрация колоды: ванильный Java vs подключённые библиотеки.
 */

import type { CardLibTag, CardLanguage, CombatCard } from './combatCards';

export type { CardLibTag, CardLanguage };

export function getCardLanguage(card: CombatCard): CardLanguage {
  return card.language ?? 'java';
}

export function getCardLibs(card: CombatCard): CardLibTag[] {
  return card.libs ?? [];
}

export function cardMatchesJavaStack(
  card: CombatCard,
  opts: { 
    includeVanilla: boolean; 
    enabledLibs: Set<CardLibTag>; 
    enabledCats: Set<string>;
    selectedLanguage: 'java' | 'script' | null;
  }
): boolean {
  if (card.type === 'STATUS') return false;

  // Shell selector must only expose real script cards, not generic "language: none" cards.
  const isScript = card.id.startsWith('script_') || card.type === 'SCRIPT';
  const isJava = card.language === 'java';

  const libs = getCardLibs(card);
  const isVanilla = libs.length === 0;

  const isInfra = card.type === 'INFRASTRUCTURE' || card.type === 'HARD';
  const isSoft = card.type === 'SOFT';
  const isTest = card.type === 'REACTION' || card.type === 'DEFENSIVE';
  const isSyntax = card.type === 'SYNTAX' || card.type === 'FUNCTION' || card.type === 'NETWORK' || card.type === 'SCRIPT';
  const isScriptFamily = isSyntax || isInfra || isSoft || isTest;

  // --- ADDITIVE FILTERING (OR) ---
  const anyCatActive = opts.enabledCats.size > 0;

  // 1. Category-specific override: category chips have priority over language chips.
  //    Keep one explicit exception: Shell mode should never expose INFRA cards.
  if (anyCatActive) {
    if (opts.enabledCats.has('infra') && isInfra && opts.selectedLanguage !== 'script') return true;
    if (opts.enabledCats.has('soft') && isSoft) return true;
    if (opts.enabledCats.has('tests') && isTest) return true;
    if (opts.enabledCats.has('syntax') && isSyntax) {
      if (opts.selectedLanguage === 'java') return isJava;
      if (opts.selectedLanguage === 'script') return isScript;
      return true;
    }
    return false;
  }

  // 2. Language Filter Logic (when category chips are not active)
  if (opts.selectedLanguage === 'java' && !isJava) return false;
  if (opts.selectedLanguage === 'script' && !isScript) return false;

  // 3. If no categories enabled, show based on Language + Vanilla/Lib:
  // If it's a library card and its library is enabled, show it.
  if (libs.some(l => opts.enabledLibs.has(l))) return true;

  // If it's vanilla/base card, show if 'JAVA_CORE' is active (for Java) or if it's a Script card (for SH)
  if (isVanilla) {
    if (isJava && opts.includeVanilla && isSyntax) return true;
    if (isScript && isScriptFamily) return true;
  }

  return false;
}

export const LIB_TAG_LABELS: Record<CardLibTag, string> = {
  spring: 'Spring Boot',
  network: 'java.net / IO',
  collections: 'java.util collections',
  streams: 'Java Streams API',
  concurrency: 'Java Concurrency API',
  scripting: 'Shell / Scripting'
};
