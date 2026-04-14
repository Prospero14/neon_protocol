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

/**
 * Карта относится к «Java-стеку» конструктора: явный java, legacy без поля language,
 * либо нейтральные utility/infra с language: 'none' (но не shell/script-трек).
 */
function isJavaStackCard(card: CombatCard): boolean {
  const lang = card.language;
  if (lang === 'java' || lang === undefined) return true;
  if (lang !== 'none') return false;
  if (card.id.startsWith('script_') || card.type === 'SCRIPT') return false;
  if (card.tags.includes('script')) return false;
  return true;
}

/** Чипы INFRA / SOFT / COUNTER / CODE (без полного стек-фильтра ванили и библиотек). */
export function cardPassesCategoryChips(
  card: CombatCard,
  enabledCats: Set<string>,
  selectedLanguage: 'java' | 'script' | null
): boolean {
  if (enabledCats.size === 0) return true;
  if (card.type === 'STATUS') return false;

  const isScript = card.id.startsWith('script_') || card.type === 'SCRIPT';
  const isJava = isJavaStackCard(card);

  const isInfra = card.type === 'INFRASTRUCTURE' || card.type === 'HARD';
  const isSoft = card.type === 'SOFT';
  const isTest = card.type === 'REACTION' || card.type === 'DEFENSIVE';
  const isSyntax = card.type === 'SYNTAX' || card.type === 'FUNCTION' || card.type === 'NETWORK' || card.type === 'SCRIPT';

  if (enabledCats.has('infra') && isInfra) return true;
  if (enabledCats.has('soft') && isSoft) return true;
  if (enabledCats.has('tests') && isTest) return true;
  if (enabledCats.has('syntax') && isSyntax) {
    if (selectedLanguage === 'java') return isJava;
    if (selectedLanguage === 'script') return isScript;
    return true;
  }
  if (selectedLanguage === 'script' && isScript) return true;
  return false;
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
  const isJava = isJavaStackCard(card);

  const libs = getCardLibs(card);
  const isVanilla = libs.length === 0;

  const isInfra = card.type === 'INFRASTRUCTURE' || card.type === 'HARD';
  const isSoft = card.type === 'SOFT';
  const isTest = card.type === 'REACTION' || card.type === 'DEFENSIVE';
  const isSyntax = card.type === 'SYNTAX' || card.type === 'FUNCTION' || card.type === 'NETWORK' || card.type === 'SCRIPT';
  const isScriptFamily = isSyntax || isInfra || isSoft || isTest;

  // --- ADDITIVE FILTERING (OR) ---
  const anyCatActive = opts.enabledCats.size > 0;

  // Пока включена хотя бы одна категория: карта проходит, если совпадает с ЛЮБЫМ включённым чипом
  // (инфра, софт, контр) и/или с выбранным стеком (Shell показывает script-карты вместе с категориями).
  if (anyCatActive) {
    return cardPassesCategoryChips(card, opts.enabledCats, opts.selectedLanguage);
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
