import { getCardById } from './combatCards';
import { getSpringCardById } from './springCards';

/** Имя карты для подсказок в бою (core + Spring). */
export function resolveCardDisplayName(cardId: string): string {
  return getCardById(cardId)?.name ?? getSpringCardById(cardId)?.name ?? cardId;
}
