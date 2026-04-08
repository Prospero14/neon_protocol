/**
 * Правила потока боя: инфра-дро → палитра кода → стабилизация (реакции/софт) → деплой.
 */

/** Всегда доступны в фазе кода (колода = класс + выбранные библиотеки). */
export const STATIC_CODE_CARD_TYPES = ['SYNTAX', 'FUNCTION', 'HARD', 'NETWORK', 'COLLECTIONS', 'SPRING'] as const;

export function isStaticCodeCardType(type: string): boolean {
  return (STATIC_CODE_CARD_TYPES as readonly string[]).includes(type);
}

export function isInfraDrawCard(card: { type: string }): boolean {
  return card.type === 'INFRASTRUCTURE';
}

const STABILIZATION_TYPES = ['DEFENSIVE', 'REACTION', 'SOFT', 'STATUS'] as const;

export function isStabilizationDrawCard(card: { type: string }): boolean {
  return (STABILIZATION_TYPES as readonly string[]).includes(card.type as (typeof STABILIZATION_TYPES)[number]);
}
