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
  opts: { includeVanilla: boolean; enabledLibs: Set<CardLibTag>; enabledCats: Set<string> }
): boolean {
  if (card.type === 'STATUS') return false;
  if (getCardLanguage(card) !== 'java') return false;

  const libs = getCardLibs(card);
  const isVanilla = libs.length === 0;

  const isInfra = card.type === 'INFRASTRUCTURE';
  const isSoft = card.type === 'SOFT';
  const isTest = card.type === 'REACTION' || card.type === 'DEFENSIVE';
  const isSyntax = card.type === 'SYNTAX' || card.type === 'FUNCTION';

  // --- ADDITIVE FILTERING (OR) ---
  const anyCatActive = opts.enabledCats.size > 0;

  // 1. If it's a vanilla card and the 'JAVA_CORE' filter is on, show it by default
  // but only if it's a Language-specific card (Syntax/Function).
  // Meta-cards like Soft, Infra, Tests only show if specifically checked.
  if (isVanilla && opts.includeVanilla) {
    if (!anyCatActive) {
      if (isSyntax) return true;
      return false;
    }
    if (opts.enabledCats.has('syntax') && isSyntax) return true;
    if (opts.enabledCats.has('infra') && isInfra) return true;
    if (opts.enabledCats.has('soft') && isSoft) return true;
    if (opts.enabledCats.has('tests') && isTest) return true;
  }

  // 2. If it's a library card and its library is enabled, show it.
  if (libs.some(l => opts.enabledLibs.has(l))) return true;

  // 3. If there are no vanilla/lib matches yet, but specific category filters are on,
  // we might still want to show them (though libs usually handle their own categorization).
  if (opts.enabledCats.has('syntax') && isSyntax) return true;
  if (opts.enabledCats.has('infra') && isInfra) return true;
  if (opts.enabledCats.has('soft') && isSoft) return true;
  if (opts.enabledCats.has('tests') && isTest) return true;

  return false;
}

export const LIB_TAG_LABELS: Record<CardLibTag, string> = {
  spring: 'Spring Boot',
  network: 'java.net / IO',
  collections: 'java.util collections',
  streams: 'Java Streams API',
  concurrency: 'Java Concurrency API',
};
